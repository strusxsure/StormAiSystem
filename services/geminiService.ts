import { GoogleGenAI } from "@google/genai";

// Interface for Minecraft Plugin data
export interface PluginData {
  className: string;
  javaCode: string;
  pluginYml: string;
}

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const SITE_URL = "https://stormai.app"; 
const SITE_NAME = "StormAI";

const getAiInstance = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY as string | undefined;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API Key is missing. The application cannot connect to Gemini.");
  }
  return new GoogleGenAI({ apiKey });
};

async function generateWithRetry(
  client: GoogleGenAI, 
  modelName: string, 
  params: any, 
  retries = 3
): Promise<any> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await client.models.generateContent({
        model: modelName,
        ...params
      });
    } catch (error: any) {
      lastError = error;
      const errString = error.toString().toLowerCase();
      if (errString.includes('429') || errString.includes('quota') || errString.includes('resource_exhausted')) {
          console.warn(`Quota exceeded for ${modelName}, aborting retries to trigger fallback.`);
          throw error;
      }
      const isRetryable = errString.includes('503') || errString.includes('overloaded') || errString.includes('network error') || errString.includes('fetch failed');
      if (isRetryable && i < retries - 1) {
        const waitTime = 2000 * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

const cleanModelOutput = (text: string): string => {
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    cleaned = cleaned.replace(/import\s+.*?from\s+['"]framer-motion['"];?/g, '// Framer Motion is not supported');
    return cleaned;
};

const sanitizeCode = (code: string): string => {
    let result = code;
    
    // Fix unescaped single quotes inside single quotes: 'I've' -> "I've"
    // (This matches the previous fix request, we keep it generally, but handled via prompt mostly)

    // Remove obviously bad imports that might confuse the previewer
    // e.g. import { User = Lucide.useState } ...
    result = result.replace(/import\s+{.*=.*}\s+from.*/g, '// Invalid Import Removed');
    
    // Basic recovery for unclosed App component
    if (result.includes('const App =') && !result.includes('export default App;')) {
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

const extractCodeBlock = (rawText: string): string => {
    const codeBlockRegex = /```(?:tsx|javascript|jsx|js|typescript|json)?\s*([\s\S]*?)```/;
    const match = rawText.match(codeBlockRegex);
    let code = "";
    if (match && match[1]) {
        code = match[1].trim();
    } else {
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
                temperature: 0.3, 
                max_tokens: 8000, // Reduced from 32000 to prevent context limit errors
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
      
      **CRITICAL SYNTAX RULES (VIOLATION = CRASH):**
      1. **DOUBLE QUOTES ONLY:** You MUST use double quotes (") for all strings in JSX and Javascript. (e.g. quote="It's good" instead of quote='It's good'). NEVER use single quotes for strings that might contain apostrophes.
      2. **NO TRUNCATION:** You MUST provide the FULL code. Do not use shortcuts or comments like "// rest of code".
      3. **IMPORTS:** Use 'lucide-react'. NEVER import 'Facebook', 'Twitter', 'Instagram', 'Github', 'Youtube', or 'Linkedin' from lucide-react. Use generic icons (User, Globe, Mail) or SVG if needed.
      4. **NO FRAMER MOTION:** Standard Tailwind only.
      
      **FORMAT:** Return only the code inside \`\`\`tsx\`\`\` blocks.
    `;

    let finalPrompt = "";

    if (currentCode) {
      systemInstruction += `
        **TASK: UPDATE EXISTING CODE**
        Modify the provided code according to user request. 
        REWRITE THE ENTIRE FILE from imports to export.
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
        return JSON.parse(response.text || "{}") as PluginData;
    } catch (error: any) {
        throw new Error(error.message || "Failed to generate plugin.");
    }
};