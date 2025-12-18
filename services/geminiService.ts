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
    
    // Remove generic markdown code block fences if present
    // This regex captures content inside ```tsx ... ``` or ```javascript ... ```
    // It's handled in extractCodeBlock usually, but we clean specific artifacts here.
    return cleaned;
};

const sanitizeCode = (code: string): string => {
    let result = code;
    
    // 1. Remove Markdown artifacts that might have leaked (e.g. "> import...")
    result = result.replace(/^>\s*/gm, '');

    // 2. Aggressively remove ALL imports. 
    // We polyfill React, Lucide, etc. in the preview, so imports in the code just cause syntax errors if the browser doesn't have the map.
    // Match "import ... from ...;" across multiple lines
    result = result.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    // Match "import '...';" (side effects)
    result = result.replace(/import\s+['"][^'"]+['"];?/g, '');
    
    // 3. Clean up residual "from" lines if regex failed on complex multiline imports
    // Matches lines starting with "from '...'" or "} from '...'"
    result = result.replace(/^\s*\}?\s*from\s+['"][^'"]+['"];?/gm, '');

    // 4. Ensure "export default App" exists
    if (!result.includes('export default')) {
        // If there's a component named App, export it
        if (result.includes('function App') || result.includes('const App')) {
            result += '\nexport default App;';
        }
    }

    return result;
};

const extractCodeBlock = (rawText: string): string => {
    // Try to find markdown code blocks
    const codeBlockRegex = /```(?:tsx|javascript|jsx|js|typescript|json)?\s*([\s\S]*?)```/;
    const match = rawText.match(codeBlockRegex);
    let code = "";
    if (match && match[1]) {
        code = match[1].trim();
    } else {
        // Fallback: heuristic extraction
        const importIdx = rawText.indexOf('import ');
        const constAppIdx = rawText.indexOf('const App');
        const functionAppIdx = rawText.indexOf('function App');
        
        if (importIdx !== -1) {
            code = rawText.substring(importIdx).trim();
        } else if (constAppIdx !== -1) {
            code = rawText.substring(constAppIdx).trim();
        } else if (functionAppIdx !== -1) {
            code = rawText.substring(functionAppIdx).trim();
        } else {
            // Last resort: assume the whole text is code if it looks like it
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
        - Center the component on the screen using 'min-h-screen flex items-center justify-center bg-gray-100 p-4'.
        - Use modern Tailwind classes (shadow-xl, rounded-2xl, backdrop-blur, ring-1 ring-black/5, etc.).
        - Do NOT build a whole website with Navbar/Footer unless specifically asked.
        - Focus on aesthetics, gradients, and micro-interactions.
        - EXPORT DEFAULT the main component.
      `;
  } else {
      taskInstruction = `
        **TASK: CREATE FULL WEBSITE**
        Build a stunning, complete website section or page.
        - Use a modern layout.
        - Ensure responsive design (mobile-first).
        - EXPORT DEFAULT the main App component.
      `;
  }

  let systemInstruction = `
      You are a World-Class React Developer.
      
      ${taskInstruction}

      **CRITICAL SYNTAX RULES:**
      1. **DOUBLE QUOTES ONLY:** You MUST use double quotes (") for all strings in JSX.
      2. **NO TRUNCATION:** You MUST provide the FULL code. No "// ... rest of code".
      3. **IMPORTS:** 
         - Import React hooks like: \`import React, { useState, useEffect } from 'react';\`
         - Import Lucide icons like: \`import { User, Mail, ArrowRight } from 'lucide-react';\`
         - DO NOT import 'framer-motion'.
      4. **NO MARKDOWN COMMENTS IN CODE:** Do not put \`> \` or other markdown artifacts at the start of lines.
      
      **FORMAT:** Return only the code inside \`\`\`tsx\`\`\` blocks.
    `;

    let finalPrompt = "";

    if (currentCode) {
      systemInstruction += `
        **TASK: UPDATE/FIX CODE**
        Modify the provided code according to user request. 
        REWRITE THE ENTIRE FILE from imports to export.
        Ensure syntax is perfect (matched brackets, commas).
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