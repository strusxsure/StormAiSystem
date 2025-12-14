import { GoogleGenAI } from "@google/genai";

// We lazy initialize this to prevent the app from crashing immediately on load
// if the environment variable is missing.
let ai: GoogleGenAI | null = null;

// OpenRouter Configuration
// Priority: 1. Environment Variable (Netlify), 2. Hardcoded Fallback
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
    // Remove <think>...</think> blocks including the tags and content
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
};

// --- OPENROUTER HANDLER ---
async function generateWithOpenRouter(
    modelName: string,
    systemInstruction: string,
    userPrompt: string
): Promise<string> {
    
    // Define a strategy for model selection
    let modelsToTry: string[] = [];

    if (modelName === 'devstral-2-2512') {
        // Fallback Strategy: Try a list of known free/reliable models
        modelsToTry = [
            'mistralai/mistral-7b-instruct:free',
            'google/gemini-2.0-flash-lite-preview-02-05:free',
            'meta-llama/llama-3-8b-instruct:free',
            'deepseek/deepseek-r1-distill-llama-70b:free', // Often good if available
            'openrouter/auto' // Last resort: let OpenRouter decide
        ];
    } else {
        modelsToTry = [modelName];
    }

    let lastError: any = null;

    for (const currentModel of modelsToTry) {
        try {
            console.log(`Attempting generation with OpenRouter model: ${currentModel}`);
            
            const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": SITE_URL,
                    "X-Title": SITE_NAME,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.6, 
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errorMessage = `OpenRouter Error (${currentModel}): ${response.status} - ${JSON.stringify(errData)}`;
                console.warn(errorMessage);
                
                // If 404 (Not Found) or 429 (Rate Limit) or 503 (Service Unavailable), try next model
                if ([404, 400, 429, 502, 503].includes(response.status)) {
                    lastError = new Error(errorMessage);
                    continue; // Try next model in list
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "";
            return cleanModelOutput(content);

        } catch (error: any) {
            console.error(`Failed with ${currentModel}:`, error);
            lastError = error;
            // Continue to next model in loop
        }
    }

    // If all models failed
    throw lastError || new Error("All OpenRouter model attempts failed.");
}

export const generateWebsitePlan = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<string> => {
    // If using OpenRouter model
    if (modelName === 'devstral-2-2512') {
         const systemInstruction = `
            You are a **Lead Technical Architect** and **Product Manager**.
            Your goal is to analyze the user's request for a website and create a concise, high-level implementation plan.
            
            **OUTPUT FORMAT:**
            Return a structured summary covering:
            1. Core Concept
            2. Design System (Tailwind classes, Typography, Vibe)
            3. Key Sections
            4. Interactive Elements
            
            Keep it professional, encouraging, and brief (under 200 words).
        `;
        return await generateWithOpenRouter(modelName, systemInstruction, userPrompt);
    }

    try {
        const client = getAiInstance();
        
        const systemInstruction = `
            You are a **Lead Technical Architect** and **Product Manager**.
            Your goal is to analyze the user's request for a website and create a concise, high-level implementation plan.
            
            **OUTPUT FORMAT:**
            Return a structured summary (plain text or markdown) covering:
            1.  **Core Concept:** A one-sentence summary of the site.
            2.  **Design System:** Color palette (Tailwind classes), Typography style, and Vibe (e.g., Minimalist, Corporate, Playful).
            3.  **Key Sections:** List the specific sections (e.g., Hero, Features, Testimonials).
            4.  **Interactive Elements:** What will be interactive (e.g., Mobile Menu, Hover effects).
            
            Keep it professional, encouraging, and brief (under 200 words).
        `;

        // Attempt generation with retry
        const response = await generateWithRetry(client, modelName, {
            contents: `USER REQUEST: "${userPrompt}"\n\nCreate a build plan.`,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        return response.text || "Could not generate a plan.";
    } catch (error: any) {
        // Fallback for plan generation as well
         if (modelName === 'gemini-3-pro-preview') {
            console.warn("Gemini 3.0 Pro failed for Plan. Fallback to Flash.");
            return generateWebsitePlan(userPrompt, 'gemini-2.5-flash');
        }
        console.error("Error generating plan:", error);
        throw new Error(error.message || "Failed to generate plan");
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
      You are a **World-Class UI/UX Designer** and **Senior React Engineer**.
      Your goal is to build (or update) a **complete, polished, and breathtaking landing page**.
      
      **CRITICAL OUTPUT RULES:**
      1.  **NO MARKDOWN:** Return *only* the raw code. Do NOT start with \`\`\`tsx.
      2.  **SINGLE COMPONENT:** Define the main component exactly as \`const App = () => { ... }\`.
      3.  **IMPORTS:** 
          - **MANDATORY:** \`import React, { useState, useEffect, useRef } from 'react';\`
          - \`import { ... } from 'lucide-react';\` 
          - **CRITICAL:** 'lucide-react' does **NOT** have brand icons like Discord, Facebook, Twitter, GitHub, Instagram, Linkedin. **DO NOT IMPORT THEM.** If you need a social logo, use a standard \`<svg>\` element with the path inside your JSX.
      4.  **STYLING:** Use Tailwind CSS classes for *everything*.
      5.  **IMAGES:** Use \`https://image.pollinations.ai/prompt/{keyword}?width=1280&height=720&nologo=true&model=flux\` for qualitative images.
      
      **DESIGN STANDARDS:**
      -   **Modern & Clean:** Use generous whitespace (py-20, px-6), rounded corners (rounded-2xl), and subtle shadows.
      -   **Glassmorphism:** Use \`bg-white/80 backdrop-blur-md\` for navbars and cards where appropriate.
      -   **Typography:** Use a clean hierarchy (h1 font-extrabold, text-gray-600 for body).
      -   **Interactive:** Add \`hover:scale-105\`, \`transition-all\`, and \`cursor-pointer\` to actionable elements.
    `;

    let finalPrompt = "";

    if (currentCode) {
      // REFINEMENT MODE
      systemInstruction += `
        **TASK: REFINEMENT**
        You are provided with existing React code.
        The user wants to modify it based on their prompt.
        
        **GUIDELINES:**
        1.  Keep the existing structure unless asked to change it.
        2.  Apply the requested changes precisely.
        3.  Ensure the code remains fully functional and high-quality.
        4.  **ICONS:** Verify all icons are imported from 'lucide-react'. **REMOVE** any imports for Discord, Facebook, Twitter, GitHub, Instagram (they do not exist in the library). Replace them with SVGs if needed.
        5.  Return the **FULL** updated code, including imports.
      `;

      finalPrompt = `
        EXISTING CODE:
        \`\`\`tsx
        ${currentCode}
        \`\`\`

        USER REQUEST: "${userPrompt}"
        
        Return the fully updated code now.
      `;
    } else {
      // CREATION MODE
      systemInstruction += `
        **TASK: NEW CREATION**
        Create a stunning landing page based on the prompt.

        **THEME LOGIC:**
        -   "Nature/Health/Corporate" -> Light Theme (White/Slate-50).
        -   "Tech/Gaming/Space" -> Dark Theme (Slate-950/Black).
      `;

      if (approvedPlan) {
          systemInstruction += `
            **APPROVED PLAN:**
            The user has approved the following architectural plan. You MUST follow this plan for the design, colors, and structure:
            
            ${approvedPlan}
          `;
      }
      finalPrompt = `USER PROMPT: "${userPrompt}"`;
    }

    // --- OPENROUTER PATH ---
    if (modelName === 'devstral-2-2512') {
        // OpenRouter doesn't support image attachments via this simple fetch easily without multipart
        // For simplicity, if imageBase64 is present, we append a note but don't send the image data to OpenRouter in this implementation
        // to avoid complexity. CodeStral/DeepSeek is text-focused anyway.
        if (imageBase64) {
            finalPrompt = `(User provided an image reference, but this model only supports text context. Proceed based on text description). ${finalPrompt}`;
        }
        
        const rawCode = await generateWithOpenRouter(modelName, systemInstruction, finalPrompt);
        return rawCode.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '');
    }

    // --- GEMINI PATH ---
  try {
    const client = getAiInstance();

    // Construct the contents array
    let contents: any[] = [];
    
    // If an image is provided, add it to the contents
    if (imageBase64) {
        // Remove data URL prefix if present for the API call
        const base64Data = imageBase64.split(',')[1] || imageBase64;
        
        contents.push({
            inlineData: {
                mimeType: "image/png", // Assuming PNG or JPEG, API is flexible usually but best to strip prefix
                data: base64Data
            }
        });
        
        finalPrompt = `(User attached an image reference). ${finalPrompt}`;
    }

    if (contents.length > 0) {
        contents.push({ text: finalPrompt });
    } else {
        contents = [{ text: finalPrompt }];
    }

    // --- EXECUTION WITH RETRY & FALLBACK ---
    try {
        const payload = { 
            contents: contents.length === 1 && typeof contents[0].text === 'string' ? contents[0].text : contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7, 
            }
        };

        const response = await generateWithRetry(client, modelName, payload);
        
        const text = response.text;
        if (!text) throw new Error("No code generated. The model response was empty.");
        
        return text.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '');

    } catch (error: any) {
        // FALLBACK LOGIC
        if (modelName === 'gemini-3-pro-preview') {
            try {
                const fallbackPayload = { 
                    contents: contents.length === 1 && typeof contents[0].text === 'string' ? contents[0].text : contents,
                    config: {
                        systemInstruction: systemInstruction,
                        temperature: 0.7, 
                    }
                };

                const fallbackResponse = await generateWithRetry(client, 'gemini-2.5-flash', fallbackPayload);
                const text = fallbackResponse.text;
                if (!text) throw new Error("Fallback response was empty.");
                
                return text.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '');
            } catch (fallbackError: any) {
                throw error;
            }
        }
        throw error;
    }

  } catch (error: any) {
    console.error("Error generating website code:", error);
    throw new Error(error.message || "Failed to generate code.");
  }
};

// NEW: Plugin Generator Logic
export interface PluginData {
    javaCode: string;
    pluginYml: string;
    className: string;
}

export const generatePluginCode = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<PluginData> => {
    const systemInstruction = `
        You are a **Senior Minecraft Plugin Developer** (Spigot/Paper API).
        Generate a working Java plugin based on the request.
        
        **OUTPUT FORMAT:**
        You must return a **JSON object** (no markdown formatting, just raw JSON) with the following structure:
        {
            "className": "NameOfPluginClass",
            "javaCode": "Full Java source code...",
            "pluginYml": "Full plugin.yml source code..."
        }
        
        **RULES:**
        1. Package name must be \`com.stormai\`.
        2. Extend \`JavaPlugin\`.
        3. Implement standard \`onEnable\`, \`onDisable\`.
        4. If the user asks for commands, implement \`CommandExecutor\`.
        5. \`pluginYml\` must include name, version, main, and any commands.
        6. Do NOT use markdown code blocks. Just valid JSON string.
    `;

    // --- OPENROUTER PATH ---
    if (modelName === 'devstral-2-2512') {
        const rawResponse = await generateWithOpenRouter(modelName, systemInstruction, `USER REQUEST: "${userPrompt}". Return strictly JSON.`);
        
        // Clean output
        let cleanResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanResponse) as PluginData;
        } catch (e) {
            console.error("JSON Parse Error:", e);
            throw new Error("AI returned invalid JSON format.");
        }
    }

    try {
        const client = getAiInstance();
        
        const response = await generateWithRetry(client, modelName, {
            contents: `USER REQUEST: "${userPrompt}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json", // Force JSON
                temperature: 0.5, // Lower temperature for code correctness
            }
        });

        const text = response.text;
        if (!text) throw new Error("No code generated.");
        
        // Parse JSON
        try {
            return JSON.parse(text) as PluginData;
        } catch (e) {
            throw new Error("AI returned invalid JSON format.");
        }

    } catch (error: any) {
        console.error("Error generating plugin:", error);
        throw new Error(error.message || "Failed to generate plugin.");
    }
};