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
    // We need to convert ES imports to variable destructuring because 'eval' doesn't support imports.
    // e.g. "import { Menu } from 'lucide-react'" -> "const { Menu } = Lucide;"
    
    let processedCode = jsxCode;
    const extractedLucideIcons: string[] = [];
    const extractedReactHooks: string[] = [];

    // A. Handle Lucide Imports
    const lucideImportRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"];?/g;
    processedCode = processedCode.replace(lucideImportRegex, (match, imports) => {
        // Extract icon names
        const icons = imports.split(',').map((i: string) => i.trim()).filter(Boolean);
        // Clean aliases (e.g. "Wifi as WifiIcon" -> just take "Wifi") - simplified for robustness
        const cleanedIcons = icons.map((i: string) => i.split(' as ')[0].trim());
        extractedLucideIcons.push(...cleanedIcons);
        return ''; // Remove the import line
    });

    // B. Handle React Imports
    // Matches: import React, { useState } from 'react'; OR import { useState } from 'react';
    const reactImportRegex = /import\s+(?:React\s*(?:,\s*)?)?{([^}]+)}\s+from\s+['"]react['"];?/g;
    processedCode = processedCode.replace(reactImportRegex, (match, imports) => {
        const hooks = imports.split(',').map((i: string) => i.trim()).filter(Boolean);
        extractedReactHooks.push(...hooks);
        return ''; // Remove the import line
    });
    // Remove simple "import React from 'react';" if it exists separately
    processedCode = processedCode.replace(/import\s+React\s+from\s+['"]react['"];?/g, '');

    // C. Remove Exports and Render calls
    // Handle "export default function App" -> "function App"
    processedCode = processedCode.replace(/export\s+default\s+function/g, 'function');
    // Handle "export default App" -> ""
    processedCode = processedCode.replace(/export\s+default\s+App;?/g, '');
    
    // Clean up ReactDOM render calls if the model included them
    processedCode = processedCode.replace(/ReactDOM\.render\s*\(.*?\);?/gs, '');
    processedCode = processedCode.replace(/createRoot\s*\(.*?\)\.render\s*\(.*?\);?/gs, '');
    
    // D. Polyfill Injection Construction
    const lucideDestructuring = extractedLucideIcons.length > 0 
        ? `const { ${[...new Set(extractedLucideIcons)].join(', ')} } = Lucide;` 
        : '';
        
    const reactDestructuring = extractedReactHooks.length > 0
        ? `const { ${[...new Set(extractedReactHooks)].join(', ')} } = React;`
        : '';

    // E. Assemble Final Script
    // We inject explicit brand icon polyfills just in case the model used them (legacy support)
    const iconPolyfills = `
      const Twitter = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-12.7 12.5S1.2 11.2 3 5.2c2.1 5.1 5.5 8.3 10.6 8.3-2.4-.3-4-2-4-5.6 1 0 2 .5 2 .5-3.2 0-4.3-5-3-6.4 0-.1.1 0 0 0 .5.3 1.1.5 1.6.5C5.4 1 1.7 4.2 4.6 9.4c-1.5-2.8-2.6-6-2.9-9.3.5.3 1 .6 1.7.7C.8 12.8 5.6 19.3 12 19.3c5.3 0 9.2-4.1 9.2-9.2 0-.2 0-.4 0-.6A6.5 6.5 0 0 0 22 4z" }));
      const Facebook = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" }));
      const Instagram = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5", ry: "5" }), React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }), React.createElement("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" }));
      const Github = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" }));
      const Linkedin = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }), React.createElement("rect", { x: "2", y: "9", width: "4", height: "12" }), React.createElement("circle", { cx: "4", cy: "4", r: "2" }));
    `;

    const finalScript = `
      ${reactDestructuring}
      ${lucideDestructuring}
      ${iconPolyfills}
      
      ${processedCode}

      // EXPOSE APP TO GLOBAL SCOPE
      // This is the critical fix. We manually attach the defined 'App' to window
      // so we can render it outside the eval scope.
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
        
        <!-- Import Map: Defines where modules come from -->
        <script type="importmap">
        {
          "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "lucide-react": "https://esm.sh/lucide-react@0.344.0"
          }
        }
        </script>

        <!-- Babel for in-browser JSX compilation -->
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

          // Expose dependencies to global scope for eval
          window.React = React;
          window.Lucide = Lucide;
          window.createRoot = createRoot;

          const rawCode = \`${finalScript.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

          // Error Display Logic
          function showError(err) {
              const container = document.getElementById('error-container');
              container.style.display = 'block';
              
              let hints = "";
              if (err.message.includes('Unexpected token') || err.message.includes('expected')) {
                  hints = "<p class='mt-2 text-sm text-red-700'><b>Hint:</b> This usually means the AI used a single quote inside a string without escaping it (e.g. 'It's'). Click <b>Auto Fix</b> to let the AI correct this syntax error.</p>";
              }
              if (err.message.includes("'App' not found")) {
                  hints = "<p class='mt-2 text-sm text-red-700'><b>Hint:</b> The AI failed to define 'const App'. Click Auto Fix.</p>";
              }

              container.innerHTML = \`
                <div class="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-red-200">
                    <h2 class="text-2xl font-bold text-red-600 mb-2">Preview Error</h2>
                    <p class="text-gray-700 mb-4">\${err.message}</p>
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
              // Compile JSX to JS
              const { code } = Babel.transform(rawCode, { presets: ['react'] });
              
              // Execute code
              // This relies on 'App' being defined in the rawCode (const App = ...)
              eval(code);

              // Mount
              if (window.App) {
                  const root = createRoot(document.getElementById('root'));
                  root.render(React.createElement(window.App));
              } else {
                  throw new Error("Component 'App' not found. Make sure the code defines 'const App = ...'");
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