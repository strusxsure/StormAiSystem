import { GoogleGenAI } from "@google/genai";

// We lazy initialize this to prevent the app from crashing immediately on load
// if the environment variable is missing.
let ai: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI => {
  if (ai) return ai;

  // In Vite + Netlify, we use the `define` plugin in vite.config.ts to replace 
  // 'process.env.API_KEY' with the actual string literal of the key at build time.
  const apiKey = process.env.API_KEY as string | undefined;

  if (!apiKey) {
    throw new Error("API Key is missing. Please add 'API_KEY' to your Netlify Site Configuration > Environment variables, and trigger a new deployment.");
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const generateWebsiteCode = async (userPrompt: string): Promise<string> => {
  // Enhanced System Prompt for "Awwwards" level quality
  const fullPrompt = `
    You are a **World-Class UI/UX Designer** and **Senior React Engineer**.
    Your goal is to build a **complete, polished, and breathtaking landing page**.

    **USER PROMPT:** "${userPrompt}"

    ---------------------------------------------------
    **1. THEME & VISUAL DIRECTION (CRITICAL)**
    -   **Analyze the Vibe:** 
        -   If the prompt is about "Nature", "Health", "Corporate", "Portfolio", or "Minimalist", use a **LIGHT THEME** (White/Gray-50 backgrounds, Slate-900 text).
        -   If the prompt is about "Gaming", "Cyberpunk", "Night", or "Space", use a **DARK THEME** (Slate-950 backgrounds, White text).
        -   **Default to LIGHT THEME** if unsure. Do not force dark mode.
    -   **Color Palette:** select a primary accent color (e.g., Indigo-600, Emerald-500, Amber-500) and use it sparingly for buttons and highlights.

    **2. LAYOUT & SPACING (LUXURY FEEL)**
    -   **Full Width:** The root container must be \`min-h-screen w-full\`.
    -   **Breathing Room:** Use HUGE vertical padding. Sections should have \`py-20\`, \`py-24\`, or even \`py-32\`. Never create cramped layouts.
    -   **Hero Section:** Must be tall (\`min-h-[80vh]\` or \`min-h-screen\`) with a strong headline (\`text-6xl\` or \`text-7xl\`) and a clear Call to Action.

    **3. DYNAMIC HIGH-RES IMAGES**
    -   **Source:** \`https://image.pollinations.ai/prompt/{keyword}?width=1280&height=720&nologo=true&model=flux\`
    -   **Keyword:** Replace \`{keyword}\` with a distinct, visual English word (e.g. "office", "mountain", "coffee", "robot").
    -   **Styling:** 
        -   Images must be high-quality and large. 
        -   Use \`w-full h-[400px] object-cover rounded-3xl\` for feature images.
        -   Use \`absolute inset-0 w-full h-full object-cover\` for Hero backgrounds (with a black/white overlay for text readability).

    **4. MODERN COMPONENTS**
    -   **Navbar:** Fixed or sticky top glassmorphism navbar (\`backdrop-blur-md bg-white/70\`).
    -   **Bento Grids:** Use CSS Grid for feature sections (\`grid-cols-1 md:grid-cols-3 gap-8\`).
    -   **Cards:** Use subtle borders (\`border border-gray-100\`) and soft shadows (\`shadow-xl shadow-gray-200/50\`).

    **5. TECHNICAL RULES**
    -   **Single File:** Return ONE functional \`App\` component.
    -   **Icons:** Use inline SVGs (Lucide style). \`stroke-width="1.5"\`.
    -   **Animation:** Add \`animate-fade-in-up\` (define keyframes in a <style> tag) to main elements.

    **OUTPUT FORMAT:**
    -   Return **ONLY** the raw React Functional Component code.
    -   Start strictly with: \`const App = () => { ...\`
    -   NO Markdown blocks. NO Explanations.
  `;

  try {
    const client = getAiInstance();
    
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: fullPrompt,
        config: {
          temperature: 0.65, // Balanced for creativity and structural integrity
        }
    });
    
    const text = response.text;
    if (!text) {
        throw new Error("No code generated. The model response was empty.");
    }
    
    // Clean up any potential markdown fences
    const cleanText = text.replace(/```tsx/g, '').replace(/```javascript/g, '').replace(/```/g, '');
    
    return cleanText;

  } catch (error: any) {
    console.error("Error generating website code:", error);
    
    let message = "Failed to generate code.";
    if (error.message.includes("API Key")) {
        message = error.message;
    } else if (error.message.includes("403")) {
        message = "Permission Error: Your API Key might be invalid or has no quota.";
    } else {
        message = error.message;
    }
    
    throw new Error(message);
  }
};