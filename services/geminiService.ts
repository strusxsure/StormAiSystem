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

// --- OPENROUTER HANDLER ---
async function generateWithOpenRouter(
    modelName: string,
    systemInstruction: string,
    userPrompt: string
): Promise<string> {
    
    // Define a strategy for model selection
    let modelsToTry: string[] = [];

    if (modelName === 'glm-4-air-free') {
        modelsToTry = ['z-ai/glm-4.5-air:free'];
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
                    temperature: 0.5, 
                    max_tokens: 6000,
                    top_p: 0.9,
                    repetition_penalty: 1.1 
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errorMessage = `OpenRouter Error (${currentModel}): ${response.status} - ${JSON.stringify(errData)}`;
                console.warn(errorMessage);
                
                if ([404, 400, 429, 502, 503, 402].includes(response.status)) {
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
        }
    }

    throw lastError || new Error("All OpenRouter model attempts failed.");
}

export const generateWebsitePlan = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<string> => {
    // If using OpenRouter model
    if (modelName === 'glm-4-air-free') {
         const systemInstruction = `
            You are a **Lead Technical Architect**.
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
            You are a **Lead Technical Architect**.
            Your goal is to analyze the user's request for a website and create a concise, high-level implementation plan.
            
            **OUTPUT FORMAT:**
            Return a structured summary (plain text or markdown) covering:
            1.  **Core Concept:** A one-sentence summary of the site.
            2.  **Design System:** Color palette (Tailwind classes), Typography style, and Vibe (e.g., Minimalist, Corporate, Playful).
            3.  **Key Sections:** List the specific sections (e.g., Hero, Features, Testimonials).
            4.  **Interactive Elements:** What will be interactive (e.g., Mobile Menu, Hover effects).
            
            Keep it professional, encouraging, and brief (under 200 words).
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
      2.  **ONE COMPONENT:** Define the main component EXACTLY as \`const App = () => { ... }\`. Do NOT use \`export default function App()\`.
      3.  **EXPORT:** You MUST end the file with \`export default App;\`.
      4.  **NO RENDER:** Do **NOT** call \`ReactDOM.render\` or \`createRoot\`. The preview engine handles this.
      5.  **IMPORTS:** 
          - **MANDATORY:** \`import React, { useState, useEffect, useRef } from 'react';\`
          - \`import { ... } from 'lucide-react';\`
          - **FORBIDDEN LIBRARIES:** Do NOT use 'framer-motion', 'react-router-dom', or any external libraries other than 'lucide-react'. Use standard CSS/Tailwind for animations.
          - **FORBIDDEN ICONS:** Do NOT import 'Twitter', 'Facebook', 'Instagram', 'Github', 'Linkedin', 'Youtube' from lucide-react. They DO NOT exist. Define them as inline SVGs.
          - **NO LOCAL FILES:** Do not import './styles.css' or images.
      6.  **SYNTAX SAFETY (VERY IMPORTANT):** 
          - **USE DOUBLE QUOTES (") for ALL strings.** Do NOT use single quotes ('). Example: Use "It's time" instead of 'It's time'.
          - **NO ALIASES IN IMPORTS.** Example: \`import { Wifi as WifiIcon }\` is **FORBIDDEN**. Use \`import { Wifi }\`.
      7.  **IMAGES:** Use \`https://image.pollinations.ai/prompt/{keyword}?width=1280&height=720&nologo=true&model=flux\` for qualitative images.
      
      **DESIGN STANDARDS:**
      -   **Modern & Clean:** Use generous whitespace (py-20, px-6), rounded corners (rounded-2xl), and subtle shadows.
      -   **Glassmorphism:** Use \`bg-white/80 backdrop-blur-md\` for navbars and cards where appropriate.
      -   **Typography:** Use a clean hierarchy (h1 font-extrabold, text-gray-600 for body).
      -   **Interactive:** Add \`hover:scale-105\`, \`transition-all\`, and \`cursor-pointer\` to actionable elements.
    `;

    let finalPrompt = "";

    if (currentCode) {
      systemInstruction += `
        **TASK: REFINEMENT**
        You are provided with existing React code.
        The user wants to modify it based on their prompt.
        
        **GUIDELINES:**
        1.  Keep the existing structure unless asked to change it.
        2.  Apply the requested changes precisely.
        3.  Ensure the code remains fully functional and high-quality.
        4.  **CHECK IMPORTS:** Remove any import of brands (Twitter, Github, etc) from 'lucide-react'. Replace them with inline SVGs.
        5.  **REMOVE FORBIDDEN:** Remove any 'framer-motion' imports if present.
        6.  Return the **FULL** updated code.
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
      systemInstruction += `
        **TASK: NEW CREATION**
        Create a stunning landing page based on the prompt.
        
        **IMPORTANT:** You must provide the FULL code. Do not truncate the response. Ensure you close all brackets and tags.

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
    if (modelName === 'glm-4-air-free') {
        if (imageBase64) {
            finalPrompt = `(User provided an image reference, but this model only supports text context. Proceed based on text description). ${finalPrompt}`;
        }
        
        const rawCode = await generateWithOpenRouter(modelName, systemInstruction, finalPrompt);
        // Aggressive cleanup for models which sometimes chat too much
        let cleanCode = rawCode.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '');
        
        // Ensure strictly only imports and code, strip any text before imports
        const firstImportIndex = cleanCode.indexOf('import');
        if (firstImportIndex > 0) {
            cleanCode = cleanCode.substring(firstImportIndex);
        }
        
        return cleanModelOutput(cleanCode);
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
                mimeType: "image/png", 
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
            contents: contents, 
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7, 
            }
        };

        const response = await generateWithRetry(client, modelName, payload);
        
        const text = response.text;
        if (!text) throw new Error("No code generated. The model response was empty.");
        
        let cleanText = text.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '');
        return cleanModelOutput(cleanText);

    } catch (error: any) {
        // FALLBACK LOGIC
        if (modelName === 'gemini-3-pro-preview') {
            console.warn("Primary model failed (Quota or Error). Attempting fallback to Gemini Flash.");
            try {
                const fallbackPayload = { 
                    contents: contents,
                    config: {
                        systemInstruction: systemInstruction,
                        temperature: 0.7, 
                    }
                };

                const fallbackResponse = await generateWithRetry(client, 'gemini-2.5-flash', fallbackPayload);
                const text = fallbackResponse.text;
                if (!text) throw new Error("Fallback response was empty.");
                
                let cleanText = text.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '');
                return cleanModelOutput(cleanText);
            } catch (fallbackError: any) {
                if (fallbackError.toString().includes('429') || fallbackError.toString().includes('exhausted')) {
                    throw new Error("System Overload: Both Pro and Flash models are currently busy. Please try again in a minute.");
                }
                throw fallbackError;
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
    if (modelName === 'glm-4-air-free') {
        const rawResponse = await generateWithOpenRouter(modelName, systemInstruction, `USER REQUEST: "${userPrompt}". Return strictly JSON.`);
        
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
        console.error("Error generating plugin:", error);
        throw new Error(error.message || "Failed to generate plugin.");
    }
};