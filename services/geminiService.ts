import { GoogleGenAI } from "@google/genai";

// We lazy initialize this to prevent the app from crashing immediately on load
// if the environment variable is missing or if 'process' is undefined in the browser.
let ai: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI => {
  if (ai) return ai;

  // Safely access process.env.API_KEY. 
  // The vite.config.ts define plugin will replace 'process.env.API_KEY' with the actual string.
  // We check for 'process' existence just in case to avoid ReferenceError in non-build environments.
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;

  if (!apiKey) {
    throw new Error("API Key is missing. Please add 'API_KEY' to your Vercel Environment Variables.");
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const generateWebsiteCode = async (userPrompt: string): Promise<string> => {
  const fullPrompt = `
    You are an expert Senior Frontend Engineer and World-Class UI/UX Designer. 
    Your mission is to generate a **breathtaking, modern, and fully responsive website** based on the user's request.

    **USER PROMPT:** "${userPrompt}"

    **STRICT DESIGN & TECHNICAL GUIDELINES:**

    1.  **Visual Excellence:**
        -   **Design Style:** Create a polished, "Awwwards"-winning aesthetic. Use sophisticated gradients, deep shadows (\`shadow-2xl\`), and rounded corners (\`rounded-2xl\` or \`rounded-3xl\`).
        -   **Glassmorphism:** Use \`backdrop-blur-md\` and \`bg-white/10\` (or similar) for modern overlays, sticky navbars, and cards.
        -   **Typography:** Use standard sans-serif fonts with impeccable spacing (tracking-tight, leading-relaxed).
        -   **Whitespace:** generous padding and margins are crucial for a luxury feel.

    2.  **Dynamic Images (MANDATORY):**
        -   You **MUST** include high-quality, relevant images.
        -   **Source:** Use \`https://image.pollinations.ai/prompt/{description}?nologo=true\`
        -   **Usage:** Replace \`{description}\` with a **URL-encoded** keyword string describing the image needed (e.g., \`minimalist%20workspace\`, \`futuristic%20city\`, \`delicious%20coffee\`).
        -   **Placement:** Use these for Hero backgrounds (using \`style={{ backgroundImage: ... }}\` or \`img\` tags), Feature cards, and Grid layouts.

    3.  **Animations & Interactivity:**
        -   **CSS Animations:** Include a \`<style>\` tag inside the component to define keyframes (e.g., \`@keyframes fade-in-up { ... }\`).
        -   **Application:** Apply these animations to the Hero text, Feature cards, and Buttons (e.g., \`animate-[fade-in-up_1s_ease-out]\`).
        -   **Hover States:** Ensure all buttons and cards have beautiful hover effects (e.g., \`hover:scale-105\`, \`hover:shadow-amber-500/50\`, \`transition-all duration-300\`).

    4.  **Icons:**
        -   Use **Inline SVGs** for all icons.
        -   Do **NOT** assume external libraries like \`lucide-react\` are available. You must write the \`<svg>\` code directly.
        -   Style icons with Tailwind text colors and sizes.

    5.  **Component Structure:**
        -   **Single File:** Everything must be in one file.
        -   **Name:** The component MUST be named \`App\`.
        -   **Tech Stack:** React 18 (Hooks allowed: \`useState\`, \`useEffect\`) + Tailwind CSS.
        -   **No Imports:** Do not import CSS files or external packages.

    **OUTPUT FORMAT:**
    -   Return **ONLY** the raw functional component code.
    -   Start immediately with \`const App = () => { ...\`.
    -   Do **NOT** wrap in markdown blocks (\`\`\`).
    -   Do **NOT** include "Here is the code" or any text.
  `;

  try {
    // Get the instance here, ensuring we catch config errors only when the user performs an action
    const client = getAiInstance();
    
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash', // Updated to latest flash model for speed and quality
        contents: fullPrompt,
    });
    
    const text = response.text;
    if (!text) {
        throw new Error("No code generated. The model response was empty.");
    }
    return text;

  } catch (error: any) {
    console.error("Error generating website code:", error);
    
    // enhance the error message for the UI
    let message = "Failed to generate code.";
    if (error.message.includes("API Key")) {
        message = "Configuration Error: API Key is missing. Please check the Deploy Guide.";
    } else if (error.message.includes("403")) {
        message = "Permission Error: Your API Key might be invalid or has no quota.";
    } else {
        message = error.message;
    }
    
    throw new Error(message);
  }
};
