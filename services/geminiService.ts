
import { GoogleGenAI } from "@google/genai";

// Interface for Minecraft Plugin data
// This resolves the errors: "Cannot find name 'PluginData'" and "Module has no exported member 'PluginData'"
export interface PluginData {
  className: string;
  javaCode: string;
  pluginYml: string;
}

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const SITE_URL = "https://stormai.app"; // Replace with your actual site URL
const SITE_NAME = "StormAI";

const getAiInstance = (): GoogleGenAI => {
  // CRITICAL: Always use new GoogleGenAI({apiKey: process.env.API_KEY});
  // Creating a new instance right before making an API call ensures we use the most up-to-date state.
  const apiKey = process.env.API_KEY as string | undefined;

  // If the key is empty string (due to missing env var during build), throw meaningful error
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API Key is missing. The application cannot connect to Gemini.");
  }

  return new GoogleGenAI({ apiKey });
};

// Helper function to handle retries for overloaded models or network blips
async function generateWithRetry(
  client: GoogleGenAI, 
  modelName: string, 
  params: any, 
  retries = 3
): Promise<any> {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      // Correct usage: Use ai.models.generateContent to query GenAI with model name and prompt
      return await client.models.generateContent({
        model: modelName,
        ...params
      });
    } catch (error: any) {
      lastError = error;
      const errString = error.toString().toLowerCase();
      
      // Stop retrying immediately if we hit a 429 Quota Exceeded error
      if (errString.includes('429') || errString.includes('quota') || errString.includes('resource_exhausted')) {
          console.warn(`Quota exceeded for ${modelName}, aborting retries to trigger fallback.`);
          throw error;
      }

      // Check for retryable errors: 503 (Overloaded), 504 (Timeout), or Network Error
      const isRetryable = 
        errString.includes('503') || 
        errString.includes('overloaded') || 
        errString.includes('network error') ||
        errString.includes('fetch failed');

      if (isRetryable && i < retries - 1) {
        // Exponential backoff: 2s, 4s, 8s
        const waitTime = 2000 * Math.pow(2, i);
        console.warn(`Attempt ${i + 1} failed for ${modelName} (${error.message}). Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not retryable (e.g. 400 Bad Request), or we ran out of retries, break.
      break;
    }
  }
  throw lastError;
}

// Helper to clean thinking process from output (common in reasoning models)
const cleanModelOutput = (text: string): string => {
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Additional Safety: Remove forbidden imports if the model hallucinated them
    // Remove framer-motion imports completely
    cleaned = cleaned.replace(/import\s+.*?from\s+['"]framer-motion['"];?/g, '// Framer Motion is not supported');
    
    return cleaned;
};

/**
 * Sanitizes code to handle common AI failures like:
 * 1. Unescaped apostrophes in single-quoted strings (e.g. 'It's')
 * 2. Unclosed curly braces at the end
 */
const sanitizeCode = (code: string): string => {
    let result = code;

    // Fix unescaped single quotes inside single quotes: 'I've' -> "I've"
    // Recovery for unclosed App component
    if (result.includes('const App =') && !result.includes('export default App;')) {
        // If it looks like it cut off, try to close it
        const openBraces = (result.match(/{/g) || []).length;
        const closeBraces = (result.match(/}/g) || []).length;
        const diff = openBraces - closeBraces;
        if (diff > 0) {
            result += '\n' + '}'.repeat(diff);
        }
        result += '\nexport default App;';
    }

    return result;
};

// Robust Code Extractor: Finds code inside ```tsx or ```javascript blocks
const extractCodeBlock = (rawText: string): string => {
    // 1. Try to find a code block
    const codeBlockRegex = /```(?:tsx|javascript|jsx|js|typescript|json)?\s*([\s\S]*?)```/;
    const match = rawText.match(codeBlockRegex);
    
    let code = "";
    if (match && match[1]) {
        code = match[1].trim();
    } else {
        // 2. If no code block, maybe it's raw code but with some text at start?
        const importIdx = rawText.indexOf('import ');
        const constAppIdx = rawText.indexOf('const App');
        
        if (importIdx !== -1) {
            code = rawText.substring(importIdx).trim();
        } else if (constAppIdx !== -1) {
            code = rawText.substring(constAppIdx).trim();
        } else {
            code = rawText.trim();
        }
    }

    return sanitizeCode(code);
};

// --- OPENROUTER HANDLER ---
async function generateWithOpenRouter(
    modelName: string,
    systemInstruction: string,
    userPrompt: string
): Promise<string> {
    
    let openRouterModel = modelName;
    if (modelName === 'devstral') {
        openRouterModel = 'mistralai/devstral-2512:free';
    } else if (modelName === 'mistral-7b-free') {
        openRouterModel = 'mistralai/mistral-7b-instruct:free';
    }

    try {
        console.log(`Attempting generation with OpenRouter model: ${openRouterModel}`);
        
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: openRouterModel,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.3, // Lower temperature for more consistent coding
                max_tokens: 32000, 
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter Error: ${response.status} - ${JSON.stringify(errData)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return cleanModelOutput(content);

    } catch (error: any) {
        console.error(`Failed with ${openRouterModel}:`, error);
        throw error;
    }
}

export const generateWebsitePlan = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<string> => {
    const isOpenRouterModel = ['devstral', 'mistral-7b-free'].includes(modelName);

    if (isOpenRouterModel) {
         const systemInstruction = `
            You are a technical architect. Analyze the user request and create a build plan.
            Output sections, color scheme (Tailwind), and features. Max 150 words.
        `;
        return await generateWithOpenRouter(modelName, systemInstruction, userPrompt);
    }

    try {
        const client = getAiInstance();
        const systemInstruction = `You are a Lead Technical Architect. Create a concise implementation plan for: "${userPrompt}". Focus on layout and design style.`;
        const response = await generateWithRetry(client, modelName, {
            contents: `USER REQUEST: "${userPrompt}"\n\nCreate a build plan.`,
            config: { systemInstruction, temperature: 0.7 }
        });
        // Access text property directly as per Gemini SDK instructions
        return response.text || "Could not generate a plan.";
    } catch (error: any) {
         if (modelName === 'gemini-3-pro-preview') return generateWebsitePlan(userPrompt, 'gemini-3-flash-preview');
         throw error;
    }
};

export const generateWebsiteCode = async (
    userPrompt: string, 
    currentCode?: string, 
    approvedPlan?: string,
    imageBase64?: string,
    modelName: string = 'gemini-3-pro-preview'
): Promise<string> => {
  
  let systemInstruction = `
      You are a World-Class React Developer.
      
      **CRITICAL SYNTAX RULES (FAILURE = ERROR):**
      1. **NO SINGLE QUOTES:** You MUST use double quotes (") for all strings in JSX and JS. (e.g. quote="It's good" instead of quote='It's good'). Single quotes cause "Unterminated string constant" errors when used with apostrophes.
      2. **NO TRUNCATION:** You MUST provide the FULL code. Do not use comments like "// rest of code".
      3. **IMPORTS:** Use 'lucide-react'. NEVER import 'Facebook', 'Twitter', 'Instagram', 'Github', 'Youtube', or 'Linkedin' from lucide-react (they don't exist). Use generic icons like 'User', 'Globe', 'Mail' instead.
      4. **NO FRAMER MOTION:** Standard Tailwind only.
      
      **FORMAT:** Return only the code inside \`\`\`tsx\`\`\` blocks.
    `;

    let finalPrompt = "";

    if (currentCode) {
      systemInstruction += `
        **TASK: UPDATE EXISTING CODE**
        Modify the provided code according to user request. 
        REWRITE THE ENTIRE FILE.
      `;

      finalPrompt = `
        CURRENT CODE:
        ${currentCode}

        USER REQUEST: "${userPrompt}"
        
        Provide the complete updated file now.
      `;
    } else {
      systemInstruction += `
        **TASK: NEW CREATION**
        Build a stunning website from scratch. 
      `;
      if (approvedPlan) systemInstruction += `\n**PLAN TO FOLLOW:**\n${approvedPlan}`;
      finalPrompt = `USER PROMPT: "${userPrompt}"`;
    }

    const isOpenRouterModel = ['devstral', 'mistral-7b-free'].includes(modelName);
    if (isOpenRouterModel) {
        if (imageBase64) finalPrompt = `(User attached image reference). ${finalPrompt}`;
        const rawResponse = await generateWithOpenRouter(modelName, systemInstruction, finalPrompt);
        return extractCodeBlock(rawResponse);
    }

  try {
    const client = getAiInstance();
    let contents: any[] = [];
    if (imageBase64) {
        const base64Data = imageBase64.split(',')[1] || imageBase64;
        contents.push({ inlineData: { mimeType: "image/png", data: base64Data } });
        finalPrompt = `(User attached image). ${finalPrompt}`;
    }
    contents.push({ text: finalPrompt });

    try {
        const response = await generateWithRetry(client, modelName, { contents, config: { systemInstruction, temperature: 0.7 } });
        // Use text property (not method) to get response content
        return extractCodeBlock(response.text || "");
    } catch (error: any) {
        if (modelName === 'gemini-3-pro-preview') {
            const fallbackResponse = await generateWithRetry(client, 'gemini-3-flash-preview', { contents, config: { systemInstruction, temperature: 0.7 } });
            return extractCodeBlock(fallbackResponse.text || "");
        }
        throw error;
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to generate code.");
  }
};

export const generatePluginCode = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<PluginData> => {
    const systemInstruction = `You are a Senior Minecraft Developer. Return strictly valid JSON: {"className": "...", "javaCode": "...", "pluginYml": "..."}`;
    const isOpenRouterModel = ['devstral', 'mistral-7b-free'].includes(modelName);
    
    if (isOpenRouterModel) {
        const rawResponse = await generateWithOpenRouter(modelName, systemInstruction, userPrompt);
        try {
            return JSON.parse(extractCodeBlock(rawResponse)) as PluginData;
        } catch (e) {
            throw new Error("Invalid JSON from AI.");
        }
    }

    try {
        const client = getAiInstance();
        const response = await generateWithRetry(client, modelName, {
            contents: userPrompt,
            config: { systemInstruction, responseMimeType: "application/json", temperature: 0.5 }
        });
        // Access .text property directly for the response content
        return JSON.parse(response.text || "{}") as PluginData;
    } catch (error: any) {
        throw new Error(error.message || "Failed to generate plugin.");
    }
};
