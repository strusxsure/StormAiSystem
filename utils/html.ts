
export const createPreviewHtml = (jsxCode: string): string => {
    let processedCode = jsxCode;

    // 1. Remove Markdown artifacts (common cause of Unexpected token >)
    processedCode = processedCode.replace(/^>\s*/gm, '');

    const lucideMap = new Map<string, string>();
    // Default hooks to ensure they are available even if extraction fails
    const reactHooks = new Set<string>(['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'useReducer']);

    // 2. Extract Lucide Icons
    const lucideMatches = processedCode.matchAll(/import\s+{([\s\S]*?)}\s+from\s+['"]lucide-react['"]/g);
    for (const match of lucideMatches) {
        if (match[1]) {
            const parts = match[1].split(',').map(p => p.trim()).filter(Boolean);
            parts.forEach(part => {
                 if (!/^[a-zA-Z0-9_\s]+(\s+as\s+[a-zA-Z0-9_]+)?$/.test(part)) return;
                 if (part.includes(' as ')) {
                     const [original, alias] = part.split(' as ').map(s => s.trim());
                     lucideMap.set(alias, original);
                 } else {
                     lucideMap.set(part, part);
                 }
            });
        }
    }

    // 3. Extract React Hooks (Add specific ones if found, though defaults cover most)
    const reactMatches = processedCode.matchAll(/import\s+(?:React\s*,?\s*)?{([\s\S]*?)}\s+from\s+['"]react['"]/g);
    for (const match of reactMatches) {
        if (match[1]) {
             const parts = match[1].split(',').map(p => p.trim()).filter(Boolean);
             parts.forEach(part => {
                 if (/^[a-zA-Z0-9_]+$/.test(part)) {
                     reactHooks.add(part);
                 }
             });
        }
    }

    // 4. Strip ALL imports cleanly
    processedCode = processedCode.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    processedCode = processedCode.replace(/import\s+['"][^'"]+['"];?/g, '');
    processedCode = processedCode.replace(/^\s*}?\s*from\s+['"].*['"];?/gm, '');

    // 5. Handle Exports
    processedCode = processedCode.replace(/export\s+default\s+function\s*([a-zA-Z0-9_]*)/g, 'window.App = function $1');
    processedCode = processedCode.replace(/export\s+default\s+class\s*([a-zA-Z0-9_]*)/g, 'window.App = class $1');
    processedCode = processedCode.replace(/export\s+default\s+([a-zA-Z0-9_]+);?/g, 'window.App = $1;');
    processedCode = processedCode.replace(/export\s+(const|let|var|function|class|interface|type)/g, '$1');
    processedCode = processedCode.replace(/export\s*\{[\s\S]*?\};?/g, '');
    processedCode = processedCode.replace(/export\s+[\s\S]*?from\s+['"].*?['"];?/g, '');

    // 6. Remove Render calls
    processedCode = processedCode.replace(/ReactDOM\.render\s*\(.*?\);?/gs, '');
    processedCode = processedCode.replace(/createRoot\s*\(.*?\)\.render\s*\(.*?\);?/gs, '');

    // 7. Inject Polyfills
    const reactInjection = `const { ${[...reactHooks].join(', ')} } = React;`;

    const iconPolyfills = `
      const __Twitter = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-12.7 12.5S1.2 11.2 3 5.2c2.1 5.1 5.5 8.3 10.6 8.3-2.4-.3-4-2-4-5.6 1 0 2 .5 2 .5-3.2 0-4.3-5-3-6.4 0-.1.1 0 0 0 .5.3 1.1.5 1.6.5C5.4 1 1.7 4.2 4.6 9.4c-1.5-2.8-2.6-6-2.9-9.3.5.3 1 .6 1.7.7C.8 12.8 5.6 19.3 12 19.3c5.3 0 9.2-4.1 9.2-9.2 0-.2 0-.4 0-.6A6.5 6.5 0 0 0 22 4z" }));
      const __Facebook = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" }));
      const __Instagram = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5", ry: "5" }), React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }), React.createElement("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" }));
      const __Github = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" }));
      const __Linkedin = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }), React.createElement("rect", { x: "2", y: "9", width: "4", height: "12" }), React.createElement("circle", { cx: "4", cy: "4", r: "2" }));
      const __Youtube = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" }), React.createElement("polygon", { fill: "white", points: "9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" }));
    `;

    const lucideInjection = Array.from(lucideMap.entries()).map(([variableName, lucideProp]) => {
        const polyfillName = `__${lucideProp}`;
        if (['const', 'var', 'let', 'function', 'class'].includes(variableName)) return '';
        return `var ${variableName} = Lucide.${lucideProp} || (typeof ${polyfillName} !== 'undefined' ? ${polyfillName} : Lucide.HelpCircle);`;
    }).join('\n');

    const finalScript = `
      ${reactInjection}
      ${iconPolyfills}
      ${lucideInjection}

      // Mock User Data to prevent reference errors
      const user = {
        name: "John Doe",
        email: "john@example.com",
        avatar: "https://ui-avatars.com/api/?name=John+Doe",
        credits: 100
      };
      // Allow it to be accessed via window or directly
      window.user = user;

      // Sanitized code
      ${processedCode}

      if (typeof window.App === 'undefined' && typeof App !== 'undefined') { window.App = App; }
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>StormAI Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script>
          // Make Supabase createClient available globally
          if (window.supabase) {
            window.createClient = window.supabase.createClient;
          }
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              primary: "#f59e0b", // Orange from screenshot
              "primary-hover": "#d97706",
              "background-light": "#ffffff",
              "background-dark": "#0f172a", // Slate 900
              "surface-light": "#f8fafc", // Slate 50
              "surface-dark": "#1e293b", // Slate 800
              "text-light": "#0f172a", // Slate 900
              "text-dark": "#f8fafc", // Slate 50
              "subtext-light": "#475569", // Slate 600
              "subtext-dark": "#94a3b8", // Slate 400
            },
            fontFamily: {
              display: ["Inter", "sans-serif"],
              sans: ["Inter", "sans-serif"],
            },
            borderRadius: {
              DEFAULT: "0.5rem",
              xl: "1rem",
              "2xl": "1.5rem",
            },
            boxShadow: {
              'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
              'glow': '0 0 15px rgba(245, 158, 11, 0.3)',
            },
            animation: {
              'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
                    'fade-in': 'fade-in 0.5s ease-out forwards',
                    'wave': 'wave 1.2s ease-in-out infinite',
                  },
                  keyframes: {
                    'fade-in-up': {
                      '0%': { opacity: '0', transform: 'translateY(20px)' },
                      '100%': { opacity: '1', transform: 'translateY(0)' },
                    },
                    'fade-in': {
                      '0%': { opacity: '0' },
                      '100%': { opacity: '1' },
                    },
                    wave: {
                      '0%, 100%': { transform: 'scaleY(0.5)', opacity: '0.5' },
                      '50%': { transform: 'scaleY(1.5)', opacity: '1' },
                    }
                  }
              },
          },
      };
    </script>
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
              const msg = err.message || "";

              if (msg.includes('Unexpected token') || msg.includes('expected') || msg.includes('Unterminated')) {
                  hints = "<p class='mt-2 text-sm text-red-700'><b>Hint:</b> This is usually a syntax error. The AI might have generated invalid code.</p>";
              }
              if (msg.includes('App') && msg.includes('not found')) {
                  hints = "<p class='mt-2 text-sm text-red-700'><b>Hint:</b> The AI did not define 'const App' or export it correctly.</p>";
              }

              container.innerHTML = \`
                <div class="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-red-200">
                    <h2 class="text-2xl font-bold text-red-600 mb-2">Preview Error</h2>
                    <p class="text-gray-700 mb-4 font-mono text-xs">\${msg}</p>
                    \${hints}
                    <div class="mt-4">
                        <button onclick="window.parent.postMessage({type: 'FIX_CODE_ERROR', error: 'Fix syntax error: \${msg.replace(/['"\`]/g, "")}'}, '*')" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow transition-colors cursor-pointer">
                            Auto Fix Issue
                        </button>
                    </div>
                </div>
              \`;
          }

          window.onerror = function(msg, source, lineno, colno, error) {
             showError(error || new Error(msg));
          };

          // Intercept navigation to post messages
          window.addEventListener('click', (event) => {
            let target = event.target;
            while (target && target.tagName !== 'A') {
              target = target.parentElement;
            }
            if (target && target.tagName === 'A') {
              const href = target.getAttribute('href');
              if (href && href.startsWith('/')) {
                event.preventDefault();
                window.parent.postMessage({ type: 'NAVIGATE', path: href }, '*');
              }
            }
          });

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
                  throw new Error("Component 'App' not found. Ensure the code defines 'const App = ...' or 'export default function App...'");
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
