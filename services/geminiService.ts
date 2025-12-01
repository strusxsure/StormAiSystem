
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateWebsiteCode = async (userPrompt: string): Promise<string> => {
  const fullPrompt = `
    You are a world-class senior frontend engineer specializing in React and Tailwind CSS. Your task is to generate the complete code for a single-file React component named 'App.js' based on the user's prompt.

    **CRITICAL CONSTRAINTS:**
    1.  Use React 18+ with **plain JavaScript (NOT TypeScript)** and functional components with hooks.
    2.  Use JSX syntax.
    3.  Use Tailwind CSS for ALL styling. Do not use inline styles or separate CSS files.
    4.  The entire website MUST be contained within a single component definition: \`const App = () => { ... };\`
    5.  Assume React, ReactDOM, and Tailwind CSS are available via CDN. Do NOT include \`import React from 'react'\`.
    6.  The code must be complete, functional, and aesthetically pleasing with a modern design.
    7.  Your entire response MUST be ONLY the raw JSX code for the component. Do NOT wrap it in markdown backticks (\`\`\`) or any other explanatory text.

    **User Prompt:**
    "${userPrompt}"

    **Generated Code for App.js:**
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating website code:", error);
    throw new Error("Failed to generate code. Please check the prompt or your API key.");
  }
};
