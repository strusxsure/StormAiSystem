import React, { useEffect, useState, useRef } from 'react';

interface WebsitePreviewProps {
  code: string;
  onFixError?: (error: string) => void;
}

const WebsitePreview: React.FC<WebsitePreviewProps> = ({ code, onFixError }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Force re-render of iframe when code changes deeply
  useEffect(() => {
    setIframeKey(prev => prev + 1);
  }, [code]);

  // Listen for Fix requests from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'FIX_CODE_ERROR') {
            if (onFixError) {
                onFixError(event.data.error);
            }
        }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onFixError]);

  const createPreviewHtml = (jsxCode: string): string => {
    
    // --- 1. IMPORT PARSER & TRANSFORMER ---
    let processedCode = jsxCode;
    
    const lucideMap = new Map<string, string>();
    const reactHooks = new Set<string>();

    // A. Handle Lucide Imports
    const lucideImportRegex = /import\s+{([\s\S]*?)}\s+from\s+['"]lucide-react['"];?/g;
    processedCode = processedCode.replace(lucideImportRegex, (match, content) => {
        const parts = content.split(',').map((p: string) => p.trim()).filter(Boolean);
        parts.forEach((part: string) => {
             if (part.includes(' as ')) {
                 const [original, alias] = part.split(' as ').map((s: string) => s.trim());
                 lucideMap.set(alias, original);
             } else {
                 lucideMap.set(part, part);
             }
        });
        return ''; 
    });

    // B. Handle React Imports
    const reactImportRegex = /import\s+(?:React\s*(?:,\s*)?)?{([\s\S]*?)}\s+from\s+['"]react['"];?/g;
    processedCode = processedCode.replace(reactImportRegex, (match, content) => {
        const parts = content.split(',').map((p: string) => p.trim()).filter(Boolean);
        parts.forEach((part: string) => reactHooks.add(part));
        return ''; 
    });
    processedCode = processedCode.replace(/import\s+React\s+from\s+['"]react['"];?/g, '');

    // C. AGGRESSIVE EXPORT STRIPPING
    // 1. Replace "export default function App" with "function App"
    processedCode = processedCode.replace(/export\s+default\s+function/g, 'function');
    // 2. Replace "export default class App" with "class App"
    processedCode = processedCode.replace(/export\s+default\s+class/g, 'class');
    // 3. Remove "export default App;" at the end
    processedCode = processedCode.replace(/export\s+default\s+\w+;?/g, '');
    // 4. Replace "export const" with "const"
    processedCode = processedCode.replace(/export\s+const/g, 'const');
    // 5. Replace "export function" with "function"
    processedCode = processedCode.replace(/export\s+function/g, 'function');
    // 6. Replace "export interface" with "interface" (though TypeScript usually handles this, eval might choke)
    processedCode = processedCode.replace(/export\s+interface/g, 'interface');
    // 7. Remove list exports like "export { App };"
    processedCode = processedCode.replace(/export\s*{[^}]*};?/g, '');

    // Remove Render calls if present
    processedCode = processedCode.replace(/ReactDOM\.render\s*\(.*?\);?/gs, '');
    processedCode = processedCode.replace(/createRoot\s*\(.*?\)\.render\s*\(.*?\);?/gs, '');
    
    // D. CATCH-ALL IMPORT STRIPPER
    processedCode = processedCode.replace(/import\s+.*?from\s+['"].*?['"];?/g, (match) => {
        return `// Stripped: ${match}`;
    });

    // E. Construct Injection Code
    const reactInjection = reactHooks.size > 0 
        ? `const { ${[...reactHooks].join(', ')} } = React;` 
        : '';

    // Polyfills renamed with prefix to avoid collision with 'const' declarations from Lucide mapping
    const iconPolyfills = `
      const __Twitter = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-12.7 12.5S1.2 11.2 3 5.2c2.1 5.1 5.5 8.3 10.6 8.3-2.4-.3-4-2-4-5.6 1 0 2 .5 2 .5-3.2 0-4.3-5-3-6.4 0-.1.1 0 0 0 .5.3 1.1.5 1.6.5C5.4 1 1.7 4.2 4.6 9.4c-1.5-2.8-2.6-6-2.9-9.3.5.3 1 .6 1.7.7C.8 12.8 5.6 19.3 12 19.3c5.3 0 9.2-4.1 9.2-9.2 0-.2 0-.4 0-.6A6.5 6.5 0 0 0 22 4z" }));
      const __Facebook = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" }));
      const __Instagram = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5", ry: "5" }), React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }), React.createElement("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" }));
      const __Github = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" }));
      const __Linkedin = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }), React.createElement("rect", { x: "2", y: "9", width: "4", height: "12" }), React.createElement("circle", { cx: "4", cy: "4", r: "2" }));
      const __Youtube = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" }), React.createElement("polygon", { fill: "white", points: "9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" }));
    `;

    // Map Lucide icons, and if the brand icon exists as a polyfill, use that if Lucide doesn't have it
    const lucideInjection = Array.from(lucideMap.entries()).map(([variableName, lucideProp]) => {
        const polyfillName = `__${lucideProp}`;
        // Note: Using 'var' to avoid "already declared" errors if the AI generates multiple imports 
        // or definitions of the same icon name.
        return `var ${variableName} = Lucide.${lucideProp} || (typeof ${polyfillName} !== 'undefined' ? ${polyfillName} : Lucide.HelpCircle);`;
    }).join('\n');

    const finalScript = `
      ${reactInjection}
      ${iconPolyfills}
      ${lucideInjection}
      ${processedCode}
      if (typeof App !== 'undefined') { window.App = App; }
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>StormAI Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script type="importmap">
        {
          "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "lucide-react": "https://esm.sh/lucide-react@0.344.0"
          }
        }
        </script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>
            body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #ffffff; }
            #root { width: 100%; height: 100%; }
            #error-container { display: none; padding: 20px; color: #dc2626; background: #fee2e2; height: 100vh; overflow: auto; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <div id="error-container"></div>

        <script type="module">
          import * as React from 'react';
          import { createRoot } from 'react-dom/client';
          import * as Lucide from 'lucide-react';

          window.React = React;
          window.Lucide = Lucide;
          window.createRoot = createRoot;

          const rawCode = \`${finalScript.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

          function showError(err) {
              const container = document.getElementById('error-container');
              container.style.display = 'block';
              
              let hints = "";
              if (err.message.includes('Unexpected token') || err.message.includes('expected') || err.message.includes('Unterminated')) {
                  hints = "<p class='mt-2 text-sm text-red-700'><b>Hint:</b> This is usually a syntax error like an unclosed string or tag. Auto Fix will try to rewrite it using Double Quotes.</p>";
              }

              container.innerHTML = \`
                <div class="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-red-200">
                    <h2 class="text-2xl font-bold text-red-600 mb-2">Preview Error</h2>
                    <p class="text-gray-700 mb-4 font-mono text-xs">\${err.message}</p>
                    \${hints}
                    <div class="mt-4">
                        <button onclick="window.parent.postMessage({type: 'FIX_CODE_ERROR', error: 'Fix syntax error: \${err.message.replace(/['"\`]/g, "")}'}, '*')" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow transition-colors cursor-pointer">
                            Auto Fix Issue
                        </button>
                    </div>
                </div>
              \`;
          }

          window.onerror = function(msg, source, lineno, colno, error) {
             showError(error || new Error(msg));
          };

          try {
              const { code } = Babel.transform(rawCode, { 
                  presets: ['react', 'typescript'],
                  filename: 'file.tsx'
              });
              eval(code);
              if (window.App) {
                  const root = createRoot(document.getElementById('root'));
                  root.render(React.createElement(window.App));
              } else {
                  throw new Error("Component 'App' not found. Ensure the AI defines 'const App = ...'");
              }
          } catch (err) {
              console.error("Preview Execution Error:", err);
              showError(err);
          }
        </script>
      </body>
      </html>
    `;
  };

  const htmlContent = createPreviewHtml(code);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200 relative group">
       <button 
         onClick={() => setIframeKey(k => k + 1)} 
         className="absolute top-2 right-2 z-50 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-gray-500 hover:text-blue-600"
         title="Reload Preview"
       >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
       </button>

      <iframe
        key={iframeKey}
        ref={iframeRef}
        srcDoc={htmlContent}
        title="Website Preview"
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

export default WebsitePreview;