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
                
                // If it's the vague Script error, try to explain
                let helpfulTip = "";
                if (String(message).toLowerCase().includes('script error')) {
                    helpfulTip = "<p class='mt-4 text-gray-600 italic'>Hint: This often happens due to a syntax error in the code or an import failure.</p>";
                }
                if (String(errorDetails).includes('React is not defined')) {
                     helpfulTip = "<p class='mt-4 text-gray-600 italic'>The AI forgot to import React. Try regenerating the code.</p>";
                }
                if (String(message).includes('does not provide an export named')) {
                     helpfulTip = "<p class='mt-4 text-gray-600 italic'><strong>Icon Error:</strong> The AI tried to import a brand icon (like Discord, GitHub, Twitter) from 'lucide-react', but that library doesn't support them.</p>";
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
          // We intentionally DO NOT import React here to avoid "Identifier 'React' has already been declared" conflicts.
          // The AI code is expected to import React.

          // INJECTED AI CODE BELOW
          ${jsxCode}

          // Error Boundary (Defined after AI code so React is available from AI's import)
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
                        <p className="text-gray-600 mb-4">The website crashed while rendering. This usually means a variable was undefined or a component failed.</p>
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
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                Auto Fix with AI
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
              
              // Check if App is defined
              if (typeof App === 'undefined') {
                   throw new Error("The AI generated code, but forgot to define the 'App' component as a variable.");
              }

              root.render(
                  <ErrorBoundary>
                      <App />
                  </ErrorBoundary>
              );
          }
        </script>
      </body>
      </html>
    `;
  };

  const htmlContent = createPreviewHtml(code);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200 relative group">
       {/* Refresh Overlay for stuck states */}
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