import { GoogleGenAI } from "@google/genai";

// We lazy initialize this to prevent the app from crashing immediately on load
// if the environment variable is missing.
let ai: GoogleGenAI | null = null;

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

export const generateWebsitePlan = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<string> => {
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
  try {
    const client = getAiInstance();

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
        
        userPrompt = `(User attached an image reference). ${userPrompt}`;
    }

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

      // For refinement, we pass text structure. 
      const textContent = `
        EXISTING CODE:
        \`\`\`tsx
        ${currentCode}
        \`\`\`

        USER REQUEST: "${userPrompt}"
        
        Return the fully updated code now.
      `;
      
      if (contents.length > 0) {
          contents.push({ text: textContent });
      } else {
          contents = [{ text: textContent }];
      }

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

      const textContent = `USER PROMPT: "${userPrompt}"`;

      if (contents.length > 0) {
          contents.push({ text: textContent });
      } else {
          contents = [{ text: textContent }];
      }
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
        // FALLBACK LOGIC: If Gemini 3.0 Pro fails, try Gemini 2.5 Flash
        if (modelName === 'gemini-3-pro-preview') {
            console.warn("Gemini 3.0 Pro failed. Attempting fallback to Gemini 2.5 Flash.");
            
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
                // If fallback also fails, throw the ORIGINAL error (usually more relevant)
                console.error("Fallback failed:", fallbackError);
                throw error;
            }
        }
        
        // If not Pro model, or if we can't fallback, throw original error
        throw error;
    }

  } catch (error: any) {
    console.error("Error generating website code:", error);
    
    let message = "Failed to generate code.";
    
    // Handle specific error cases for better user feedback
    const errString = error.toString().toLowerCase();
    
    if (errString.includes("api key")) {
        message = "API Configuration Error: " + error.message;
    } else if (errString.includes("403")) {
        message = "Permission Error: Your API Key might be invalid, expired, or lacking quota.";
    } else if (errString.includes("503") || errString.includes("overloaded")) {
         message = "Service Busy: Google's AI models are currently overloaded. Please try again in a moment.";
    } else if (errString.includes("xhr") || errString.includes("rpc") || errString.includes("fetch") || errString.includes("network")) {
        message = "Network Error: Could not connect to Google Gemini. Please check your internet connection or firewall.";
    } else if (error.message) {
        message = error.message;
    }
    
    throw new Error(message);
  }
};