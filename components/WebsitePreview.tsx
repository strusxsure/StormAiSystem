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

  // --- POLYFILL DEFINITIONS ---
  const getIconPolyfills = () => `
    const Facebook = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" }));
    const Twitter = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-12.7 12.5S1.2 11.2 3 5.2c2.1 5.1 5.5 8.3 10.6 8.3-2.4-.3-4-2-4-5.6 1 0 2 .5 2 .5-3.2 0-4.3-5-3-6.4 0-.1.1 0 0 0 .5.3 1.1.5 1.6.5C5.4 1 1.7 4.2 4.6 9.4c-1.5-2.8-2.6-6-2.9-9.3.5.3 1 .6 1.7.7C.8 12.8 5.6 19.3 12 19.3c5.3 0 9.2-4.1 9.2-9.2 0-.2 0-.4 0-.6A6.5 6.5 0 0 0 22 4z" }));
    const Instagram = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5", ry: "5" }), React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }), React.createElement("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" }));
    const Github = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" }));
    const Linkedin = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }), React.createElement("rect", { x: "2", y: "9", width: "4", height: "12" }), React.createElement("circle", { cx: "4", cy: "4", r: "2" }));
    const Youtube = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" }), React.createElement("path", { d: "m10 15 5-3-5-3z" }));
    const Discord = (props) => React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("circle", { cx: "12", cy: "12", r: "2" }));
    
    // Lowercase fallbacks just in case
    const youtube = Youtube;
    const facebook = Facebook;
    const twitter = Twitter;
    const instagram = Instagram;
    const github = Github;
    const linkedin = Linkedin;
    const discord = Discord;
  `;

  // --- CODE SANITIZER ---
  const sanitizeCode = (rawCode: string): string => {
    let clean = rawCode;

    // 1. Remove ReactDOM/Root render calls
    clean = clean.replace(/ReactDOM\.render\s*\(.*?\);?/gs, '');
    clean = clean.replace(/createRoot\s*\(.*?\)\.render\s*\(.*?\);?/gs, '');
    clean = clean.replace(/const root\s*=\s*createRoot\(.*?\);/gs, '');
    clean = clean.replace(/root\.render\(.*?\);/gs, '');

    // 2. INTELLIGENT IMPORT FIXER
    // Detects imports from 'lucide-react', filters out bad brands, and injects polyfills for them.
    const invalidIcons = ['Twitter', 'Facebook', 'Instagram', 'Github', 'Linkedin', 'Discord', 'Youtube'];
    const lucideImportRegex = /import\s*{([^}]*?)}\s*from\s*['"]lucide-react['"];?/;
    
    const match = clean.match(lucideImportRegex);
    let polyfillsToInject = getIconPolyfills();

    if (match) {
        const fullImportLine = match[0];
        const importsContent = match[1];
        
        // Split imports, filter out bad ones
        const individualImports = importsContent.split(',').map(i => i.trim()).filter(Boolean);
        const validImports = individualImports.filter(i => {
             // Check against invalid list (case insensitive check)
             return !invalidIcons.some(bad => bad.toLowerCase() === i.toLowerCase());
        });

        // Reconstruct import line
        if (validImports.length > 0) {
            const newImportLine = `import { ${validImports.join(', ')} } from 'lucide-react';`;
            clean = clean.replace(fullImportLine, newImportLine);
        } else {
            // If all were invalid, remove the line entirely
            clean = clean.replace(fullImportLine, '');
        }
    }

    return `${polyfillsToInject}\n${clean}`;
  };

  const createPreviewHtml = (jsxCode: string): string => {
    const sanitizedCode = sanitizeCode(jsxCode);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>StormAI Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Import Map for ES Modules -->
        <script type="importmap">
        {
          "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "lucide-react": "https://esm.sh/lucide-react@0.344.0?bundle"
          }
        }
        </script>

        <!-- Crossorigin is crucial to get actual error details instead of 'Script error' -->
        <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"></script>
        
        <style>
            body { 
                margin: 0;
                padding: 0;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                background-color: #ffffff;
            }
            #root { width: 100%; height: 100%; }
            /* Custom Scrollbar */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            
            #error-container {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #fff1f2;
                color: #9f1239;
                padding: 20px;
                z-index: 9999;
                overflow: auto;
                font-family: monospace;
            }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <div id="error-container"></div>

        <script>
            // Global Error Handler
            window.onerror = function(message, source, lineno, colno, error) {
                const container = document.getElementById('error-container');
                container.style.display = 'block';
                const errorDetails = error ? (error.stack || error.message) : message;
                
                let helpfulTip = "";
                if (String(message).toLowerCase().includes('script error')) {
                    helpfulTip = "<p class='mt-4 text-gray-600 italic'>Hint: This often happens due to a syntax error in the code or an import failure.</p>";
                }
                if (String(errorDetails).includes('React is not defined')) {
                     helpfulTip = "<p class='mt-4 text-gray-600 italic'>The AI forgot to import React. Try regenerating the code.</p>";
                }
                if (String(message).includes('is not defined')) {
                     helpfulTip = "<p class='mt-4 text-gray-600 italic'><strong>Reference Error:</strong> The code tried to use a component or variable that wasn't defined.</p>";
                }

                const escapedError = String(errorDetails).replace(/[\`$]/g, '');

                container.innerHTML = \`
                    <div class="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-red-200">
                        <h2 class="text-2xl font-bold text-red-600 mb-2">Preview Error</h2>
                        <div class="bg-red-50 p-4 rounded-lg overflow-x-auto border border-red-100 mb-4">
                            <pre class="text-sm text-red-800 whitespace-pre-wrap">\${errorDetails}</pre>
                        </div>
                        \${helpfulTip}
                        
                        <div class="mt-6 pt-4 border-t border-red-100 flex items-center justify-between">
                            <p class="text-xs text-red-500">The AI can try to fix this automatically.</p>
                            <button 
                                onclick="window.parent.postMessage({type: 'FIX_CODE_ERROR', error: \`\${escapedError}\`}, '*')"
                                class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center transform hover:-translate-y-0.5"
                            >
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                Auto Fix with AI
                            </button>
                        </div>
                    </div>
                \`;
                console.error("Preview Error:", error);
            };
        </script>

        <script type="text/babel" data-type="module">
          import { createRoot } from 'react-dom/client';
          // We intentionally DO NOT import React here to avoid conflicts.
          
          // --- INJECTED AI CODE ---
          const rawCode = \`${sanitizedCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
          // ------------------------

          // Error Boundary
          class ErrorBoundary extends React.Component {
            constructor(props) {
              super(props);
              this.state = { hasError: false, error: null, errorInfo: null };
            }

            static getDerivedStateFromError(error) {
              return { hasError: true, error };
            }

            componentDidCatch(error, errorInfo) {
              this.setState({ errorInfo });
              console.error("React Component Error:", error, errorInfo);
            }

            render() {
              if (this.state.hasError) {
                return (
                  <div className="flex items-center justify-center min-h-screen bg-red-50 p-8">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-100">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-xl">⚠️</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Runtime Error</h2>
                        </div>
                        <p className="text-gray-600 mb-4">The website crashed while rendering.</p>
                        <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-xs font-mono mb-4">
                            {this.state.error && this.state.error.toString()}
                        </div>
                         
                         <div className="flex gap-4">
                             <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition">
                                Reload Preview
                            </button>
                            <button 
                                onClick={() => window.parent.postMessage({type: 'FIX_CODE_ERROR', error: this.state.error ? this.state.error.toString() : 'Runtime Error'}, '*')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center"
                            >
                                Auto Fix
                            </button>
                        </div>
                    </div>
                  </div>
                );
              }
              return this.props.children;
            }
          }

          // MOUNT LOGIC
          const container = document.getElementById('root');
          if (container) {
              const root = createRoot(container);
              
              try {
                  // Transform JSX to JS using Babel
                  const { code } = Babel.transform(rawCode, { presets: ['react'] });
                  
                  // Evaluate the transformed code
                  // This will define 'App' in the global scope if successful
                  eval(code);

                  if (typeof App === 'undefined') {
                       throw new Error("The AI generated code, but 'App' component is not defined.");
                  }

                  root.render(
                      <ErrorBoundary>
                          <App />
                      </ErrorBoundary>
                  );
              } catch (err) {
                  // Catch Syntax Errors (like truncated code)
                  console.error("Babel/Eval Error:", err);
                  
                  const container = document.getElementById('error-container');
                  container.style.display = 'block';
                  container.innerHTML = \`
                    <div class="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-red-200">
                        <h2 class="text-2xl font-bold text-red-600 mb-2">Code Error</h2>
                         <p class="text-gray-600 mb-4">The AI generated invalid or incomplete code.</p>
                        <div class="bg-red-50 p-4 rounded-lg overflow-x-auto border border-red-100 mb-4">
                            <pre class="text-sm text-red-800 whitespace-pre-wrap">\${err.message}</pre>
                        </div>
                        
                        <div class="mt-6 pt-4 border-t border-red-100 flex items-center justify-between">
                            <p class="text-xs text-red-500">Try fixing it automatically.</p>
                            <button 
                                onclick="window.parent.postMessage({type: 'FIX_CODE_ERROR', error: 'Fix syntax error: \${err.message.replace(/['"\`]/g, "")}'}, '*')"
                                class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center"
                            >
                                Auto Fix
                            </button>
                        </div>
                    </div>
                  \`;
              }
          }
        </script>
      </body>
      </html>
    `;
  };

  const htmlContent = createPreviewHtml(code);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200 relative group">
       {/* Refresh Overlay */}
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