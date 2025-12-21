import { GoogleGenAI } from "@google/genai";

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
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

const sanitizeCode = (code: string): string => {
    let result = code;
    
    // 1. Remove Markdown artifacts
    result = result.replace(/^>\s*/gm, '');

    // 2. Aggressively remove ALL imports to prevent conflicts
    result = result.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    result = result.replace(/import\s+['"][^'"]+['"];?/g, '');
    
    // 3. Clean up residual "from" lines
    result = result.replace(/^\s*\}?\s*from\s+['"][^'"]+['"];?/gm, '');

    // 4. Ensure "export default App" exists
    if (!result.includes('export default')) {
        if (result.includes('function App') || result.includes('const App')) {
            result += '\nexport default App;';
        }
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
        // Fallback extraction
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
): Promise<{ text: string }> {
    
    // Map internal names to OpenRouter IDs
    let openRouterModel = modelName;
    if (modelName === 'mimo-v2-flash') {
        openRouterModel = 'xiaomi/mimo-v2-flash:free';
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
        
        const body: any = {
            model: openRouterModel,
            messages: messages,
            temperature: 0.7, 
            top_p: 0.9
        };

        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter Error (${openRouterModel}): ${response.status} - ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;
        const content = message?.content || "";
        
        if (!content) {
            throw new Error("Received empty response from AI provider.");
        }

        return { text: content };

    } catch (error: any) {
        console.error(`Failed with OpenRouter ${openRouterModel}:`, error);
        throw error;
    }
}

export const generateWebsitePlan = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<string> => {
    const systemInstruction = `You are a technical architect. Create a build plan with sections, color scheme (Tailwind), and features. Max 150 words.`;

    if (modelName === 'mimo-v2-flash') {
        const result = await generateWithOpenRouter(modelName, systemInstruction, userPrompt);
        return result.text;
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
): Promise<{ code: string, reasoning?: string }> => {
  
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

    let rawResponse = "";
    // Gemma models generally do not support hidden reasoning/thinking chains in this API context.
    const reasoning = undefined; 

    // Handle OpenRouter Models
    if (modelName === 'mimo-v2-flash') {
        const result = await generateWithOpenRouter(modelName, systemInstruction, finalPrompt, imageBase64);
        rawResponse = result.text;
    } else {
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
                rawResponse = response.text || "";
            } catch (error: any) {
                // Fallback for Pro preview to Flash if it fails
                if (modelName === 'gemini-3-pro-preview') {
                    console.warn("Gemini Pro failed, falling back to Flash");
                    const fallbackResponse = await generateWithRetry(client, 'gemini-3-flash-preview', { contents, config: { systemInstruction, temperature: 0.7 } });
                    rawResponse = fallbackResponse.text || "";
                } else {
                    throw error;
                }
            }
        } catch (error: any) {
            throw new Error(error.message || "Failed to generate code.");
        }
    }

    const code = extractCodeBlock(rawResponse);

    return { code, reasoning };
};