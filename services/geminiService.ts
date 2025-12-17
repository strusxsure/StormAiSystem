import { GoogleGenAI } from "@google/genai";

// We lazy initialize this to prevent the app from crashing immediately on load
// if the environment variable is missing.
let ai: GoogleGenAI | null = null;

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const SITE_URL = "https://stormai.app"; // Replace with your actual site URL
const SITE_NAME = "StormAI";

const getAiInstance = (): GoogleGenAI => {
  if (ai) return ai;

  // In Vite + Netlify, we use the `define` plugin in vite.config.ts to replace 
  // 'process.env.API_KEY' with the actual string literal of the key at build time.
  const apiKey = process.env.API_KEY as string | undefined;

  // If the key is empty string (due to missing env var during build), throw meaningful error
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API Key is missing. The application cannot connect to Gemini.");
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
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

// Robust Code Extractor: Finds code inside ```tsx or ```javascript blocks
// This is critical for models that often chat before/after code.
const extractCodeBlock = (rawText: string): string => {
    // 1. Try to find a code block
    const codeBlockRegex = /```(?:tsx|javascript|jsx|js|typescript|json)?\s*([\s\S]*?)```/;
    const match = rawText.match(codeBlockRegex);
    
    if (match && match[1]) {
        // Return only the content inside the code block
        return match[1].trim();
    }

    // 2. If no code block, maybe it's raw code but with some text at start?
    // Look for first import or const App
    const importIdx = rawText.indexOf('import ');
    const constAppIdx = rawText.indexOf('const App');
    
    if (importIdx !== -1) {
        return rawText.substring(importIdx).trim();
    } else if (constAppIdx !== -1) {
        return rawText.substring(constAppIdx).trim();
    }

    // 3. Fallback: Return raw text and hope for the best
    return rawText.trim();
};

// --- OPENROUTER HANDLER ---
async function generateWithOpenRouter(
    modelName: string,
    systemInstruction: string,
    userPrompt: string
): Promise<string> {
    
    // Map internal selection to OpenRouter model IDs
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
                temperature: 0.4, 
                max_tokens: 16000, 
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
    // Check if using OpenRouter model
    const isOpenRouterModel = ['devstral', 'mistral-7b-free'].includes(modelName);

    if (isOpenRouterModel) {
         const systemInstruction = `
            You are a **Lead Technical Architect**.
            Your goal is to analyze the user's request for a website and create a concise, high-level implementation plan.
            
            **OUTPUT FORMAT:**
            Return a structured summary covering:
            1. Core Concept
            2. Design System (Tailwind classes, Vibe)
            3. Key Sections
            
            Keep it professional and under 200 words.
        `;
        return await generateWithOpenRouter(modelName, systemInstruction, userPrompt);
    }

    try {
        const client = getAiInstance();
        
        const systemInstruction = `
            You are a **Lead Technical Architect**.
            Your goal is to analyze the user's request for a website and create a concise, high-level implementation plan.
            
            **OUTPUT FORMAT:**
            Return a structured summary (plain text or markdown) covering:
            1.  **Core Concept:** A one-sentence summary of the site.
            2.  **Design System:** Color palette (Tailwind classes), Typography style.
            3.  **Key Sections:** List the specific sections.
            
            Keep it professional and brief.
        `;

        const response = await generateWithRetry(client, modelName, {
            contents: `USER REQUEST: "${userPrompt}"\n\nCreate a build plan.`,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        return response.text || "Could not generate a plan.";
    } catch (error: any) {
         if (modelName === 'gemini-3-pro-preview') {
            return generateWebsitePlan(userPrompt, 'gemini-2.5-flash');
        }
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
      You are a **Senior React Engineer**. Build a complete, functional landing page.
      
      **CRITICAL OUTPUT RULES:**
      1.  **ONLY CODE:** Return *strictly* the code inside \`\`\`tsx\`\`\` blocks. No conversational text.
      2.  **COMPONENT:** Main component must be \`const App = () => { ... }\`.
      3.  **EXPORT:** End with \`export default App;\`.
      4.  **IMPORTS:** 
          - \`import React, { useState, useEffect, useRef } from 'react';\`
          - \`import { ... } from 'lucide-react';\`
          - **NO** 'framer-motion'. Use Tailwind for animations.
      5.  **SYNTAX:** ALWAYS use DOUBLE QUOTES (") for all strings. Escape any single quotes.
      6.  **IMAGES:** Use \`https://image.pollinations.ai/prompt/{keyword}?width=1280&height=720&nologo=true&model=flux\`
    `;

    let finalPrompt = "";

    if (currentCode) {
      systemInstruction += `
        **TASK: REFINEMENT**
        Modify the existing code based on user prompt.
        
        **RULES:**
        1.  **NO TRUNCATION:** Return the **FULL** file. Do not use "// ... rest of code".
        2.  Rewrite everything from imports to export.
      `;

      finalPrompt = `
        EXISTING CODE:
        ${currentCode}

        USER REQUEST: "${userPrompt}"
        
        Return the fully updated code now inside a tsx code block.
      `;
    } else {
      systemInstruction += `
        **TASK: NEW CREATION**
        Create a stunning landing page. Provide the FULL code.
      `;

      if (approvedPlan) {
          systemInstruction += `\n**PLAN:**\n${approvedPlan}`;
      }
      finalPrompt = `USER PROMPT: "${userPrompt}"`;
    }

    // --- OPENROUTER PATH ---
    const isOpenRouterModel = ['devstral', 'mistral-7b-free'].includes(modelName);
    if (isOpenRouterModel) {
        if (imageBase64) {
            finalPrompt = `(User attached image reference). ${finalPrompt}`;
        }
        
        const rawResponse = await generateWithOpenRouter(modelName, systemInstruction, finalPrompt);
        let cleanCode = extractCodeBlock(rawResponse);

        // Recovery for common Mistral/Devstral truncation issues
        if (cleanCode.includes('const App =') && !cleanCode.includes('export default App;')) {
            cleanCode += "\n};\nexport default App;";
        }
        
        return cleanModelOutput(cleanCode);
    }

    // --- GEMINI PATH ---
  try {
    const client = getAiInstance();
    let contents: any[] = [];
    
    if (imageBase64) {
        const base64Data = imageBase64.split(',')[1] || imageBase64;
        contents.push({ inlineData: { mimeType: "image/png", data: base64Data } });
        finalPrompt = `(User attached an image reference). ${finalPrompt}`;
    }

    contents.push({ text: finalPrompt });

    try {
        const payload = { 
            contents: contents, 
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7, 
            }
        };

        const response = await generateWithRetry(client, modelName, payload);
        const text = response.text;
        if (!text) throw new Error("Empty response from AI.");
        
        return cleanModelOutput(extractCodeBlock(text));

    } catch (error: any) {
        if (modelName === 'gemini-3-pro-preview') {
            console.warn("Pro failed. Trying Flash.");
            const fallbackResponse = await generateWithRetry(client, 'gemini-2.5-flash', { contents, config: { systemInstruction, temperature: 0.7 } });
            return cleanModelOutput(extractCodeBlock(fallbackResponse.text));
        }
        throw error;
    }

  } catch (error: any) {
    console.error("Error generating code:", error);
    throw new Error(error.message || "Failed to generate code.");
  }
};

// Plugin Generator Logic
export interface PluginData {
    javaCode: string;
    pluginYml: string;
    className: string;
}

export const generatePluginCode = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<PluginData> => {
    const systemInstruction = `
        You are a **Senior Minecraft Plugin Developer**.
        Return a strictly valid JSON object:
        {
            "className": "NameOfPluginClass",
            "javaCode": "Full Java code...",
            "pluginYml": "Full plugin.yml..."
        }
    `;

    const isOpenRouterModel = ['devstral', 'mistral-7b-free'].includes(modelName);
    if (isOpenRouterModel) {
        const rawResponse = await generateWithOpenRouter(modelName, systemInstruction, `USER REQUEST: "${userPrompt}". Return strictly JSON.`);
        let cleanResponse = extractCodeBlock(rawResponse);
        try {
            return JSON.parse(cleanResponse) as PluginData;
        } catch (e) {
            throw new Error("AI returned invalid JSON format.");
        }
    }

    try {
        const client = getAiInstance();
        const response = await generateWithRetry(client, modelName, {
            contents: `USER REQUEST: "${userPrompt}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json", 
                temperature: 0.5, 
            }
        });

        const text = response.text;
        if (!text) throw new Error("No code generated.");
        try {
            return JSON.parse(text) as PluginData;
        } catch (e) {
            throw new Error("AI returned invalid JSON format.");
        }
    } catch (error: any) {
        throw new Error(error.message || "Failed to generate plugin.");
    }
};