import { GoogleGenAI } from "@google/genai";

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Mistral Official Configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

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
          console.warn(`Quota exceeded for ${modelName}, aborting retries.`);
          throw new Error(`Quota exceeded for ${modelName}. Please try a free model or upgrade keys.`);
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
    // Remove <think> blocks common in DeepSeek models
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    // Remove markdown code fences if present around the block, but keep the content
    // We handle extraction in extractCodeBlock, but this cleans up loose ends
    cleaned = cleaned.replace(/import\s+.*?from\s+['"]framer-motion['"];?/g, '// Framer Motion is not supported');
    return cleaned;
};

const sanitizeCode = (code: string): string => {
    let result = code;
    
    // Remove obviously bad imports that might confuse the previewer
    result = result.replace(/import\s+{.*=.*}\s+from.*/g, '// Invalid Import Removed');
    
    // Aggressive cleanup of residual import trash that regex might miss
    result = result.replace(/^\s*}?\s*from\s+['"].*['"];?/gm, '// Fixed broken import');

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

// --- OPENROUTER HANDLER ---
async function generateWithOpenRouter(
    modelName: string,
    systemInstruction: string,
    userPrompt: string,
    imageBase64?: string
): Promise<string> {
    
    // Map internal names to OpenRouter IDs
    let openRouterModel = modelName;
    if (modelName === 'devstral') {
        openRouterModel = 'mistralai/mistral-7b-instruct:free';
    } else if (modelName === 'gemini-2.0-flash-exp') {
        openRouterModel = 'google/gemini-2.0-flash-exp:free';
    } else if (modelName === 'deepseek-r1') {
        // Fallback list if specific version fails, but user asked for this one
        openRouterModel = 'deepseek/deepseek-r1:free'; 
    }

    try {
        console.log(`Attempting generation with OpenRouter model: ${openRouterModel}`);

        const messages: any[] = [
             { role: "system", content: systemInstruction }
        ];

        if (imageBase64) {
             messages.push({
                role: "user",
                content: [
                    { type: "text", text: userPrompt },
                    { type: "image_url", image_url: { url: imageBase64 } }
                ]
             });
        } else {
             messages.push({ role: "user", content: userPrompt });
        }
        
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
                messages: messages,
                temperature: 0.2, 
                max_tokens: 8000,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            // Provide clear error to user
            throw new Error(`OpenRouter Error (${openRouterModel}): ${response.status} - ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        
        if (!content) {
            throw new Error("Received empty response from AI provider.");
        }

        return cleanModelOutput(content);

    } catch (error: any) {
        console.error(`Failed with OpenRouter ${openRouterModel}:`, error);
        throw error;
    }
}

// --- OFFICIAL MISTRAL API HANDLER ---
async function generateWithMistral(
    modelName: string,
    systemInstruction: string,
    userPrompt: string
): Promise<string> {
    
    let officialModel = modelName;
    if (modelName === 'mistral-small-latest') officialModel = 'mistral-small-latest';
    if (modelName === 'codestral-latest') officialModel = 'codestral-latest';

    try {
        const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MISTRAL_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                model: officialModel,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.2, 
                max_tokens: 8000, 
                top_p: 1
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Mistral API Error: ${response.status} - ${errData.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return cleanModelOutput(content);

    } catch (error: any) {
        console.error(`Failed with Mistral ${officialModel}:`, error);
        throw error;
    }
}

export const generateWebsitePlan = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<string> => {
    const systemInstruction = `You are a technical architect. Create a build plan with sections, color scheme (Tailwind), and features. Max 150 words.`;

    if (['devstral', 'gemini-2.0-flash-exp', 'deepseek-r1'].includes(modelName)) {
        return await generateWithOpenRouter(modelName, systemInstruction, userPrompt);
    }

    if (['codestral-latest', 'mistral-small-latest'].includes(modelName)) {
        return await generateWithMistral(modelName, systemInstruction, userPrompt);
    }

    try {
        const client = getAiInstance();
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
    modelName: string = 'gemini-3-pro-preview',
    mode: 'website' | 'ui' = 'website'
): Promise<string> => {
  
  let taskInstruction = "";
  if (mode === 'ui') {
      taskInstruction = `
        **TASK: CREATE UI COMPONENT**
        Create a single, beautiful, modern React component based on the user's request.
        - Center the component on the screen using 'min-h-screen flex items-center justify-center bg-gray-100'.
        - Use modern Tailwind classes (shadow-xl, rounded-2xl, backdrop-blur, etc.).
        - Do NOT build a whole website with Navbar/Footer unless specifically asked.
        - Focus on aesthetics and micro-interactions.
      `;
  } else {
      taskInstruction = `
        **TASK: CREATE FULL WEBSITE**
        Build a stunning, complete website section or page.
        - Use a modern layout.
        - Ensure responsive design (mobile-first).
      `;
  }

  let systemInstruction = `
      You are a World-Class React Developer.
      
      ${taskInstruction}

      **CRITICAL SYNTAX RULES (VIOLATION = CRASH):**
      1. **DOUBLE QUOTES ONLY:** You MUST use double quotes (") for all strings in JSX and Javascript.
      2. **NO TRUNCATION:** You MUST provide the FULL code. Do not use shortcuts or comments like "// rest of code".
      3. **IMPORTS:** Use 'lucide-react'. NEVER import specific icons from lucide-react (e.g. import { User } ...). Instead import * as Lucide from 'lucide-react' OR assume Lucide icons are available globally if using the specific 'lucide-react' package instructions provided in environment. 
      **BETTER YET:** Just use \`import { User, Mail } from "lucide-react"\`.
      4. **NO FRAMER MOTION:** Standard Tailwind only.
      
      **FORMAT:** Return only the code inside \`\`\`tsx\`\`\` blocks.
    `;

    let finalPrompt = "";

    if (currentCode) {
      systemInstruction += `
        **TASK: UPDATE/FIX CODE**
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
      if (approvedPlan) systemInstruction += `\n**PLAN TO FOLLOW:**\n${approvedPlan}`;
      finalPrompt = `USER PROMPT: "${userPrompt}"`;
    }

    // Handle OpenRouter Models
    if (['devstral', 'gemini-2.0-flash-exp', 'deepseek-r1'].includes(modelName)) {
        const rawResponse = await generateWithOpenRouter(modelName, systemInstruction, finalPrompt, imageBase64);
        return extractCodeBlock(rawResponse);
    }

    // Handle Official Mistral
    if (['codestral-latest', 'mistral-small-latest'].includes(modelName)) {
        if (imageBase64) finalPrompt = `(User attached image reference). ${finalPrompt}`;
        const rawResponse = await generateWithMistral(modelName, systemInstruction, finalPrompt);
        return extractCodeBlock(rawResponse);
    }

    // Official Google Gemini
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
        // Fallback for Pro preview to Flash if it fails
        if (modelName === 'gemini-3-pro-preview') {
            console.warn("Gemini Pro failed, falling back to Flash");
            const fallbackResponse = await generateWithRetry(client, 'gemini-3-flash-preview', { contents, config: { systemInstruction, temperature: 0.7 } });
            return extractCodeBlock(fallbackResponse.text || "");
        }
        throw error;
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to generate code.");
  }
};