import React from 'react';

interface WebsitePreviewProps {
  code: string;
}

const WebsitePreview: React.FC<WebsitePreviewProps> = ({ code }) => {
  const createPreviewHtml = (jsxCode: string): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>StormAI Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>
            body { 
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
                margin: 0;
                padding: 0;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                background-color: #ffffff;
            }
            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }
            /* Custom Scrollbar */
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: transparent; 
            }
            ::-webkit-scrollbar-thumb {
              background: #cbd5e1; 
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #94a3b8; 
            }
            /* Image defaults for stability and aesthetics */
            img {
                display: block;
                max-width: 100%;
                height: auto;
                background-color: #e2e8f0; /* Placeholder color while loading */
                transition: opacity 0.3s ease;
            }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          try {
            ${jsxCode}
            const container = document.getElementById('root');
            const root = ReactDOM.createRoot(container);
            root.render(<App />);
            
            // Fade in after render
            setTimeout(() => {
                document.body.style.opacity = 1;
            }, 100);
          } catch (error) {
            const root = document.getElementById('root');
            root.innerHTML = \`<div class="h-screen flex items-center justify-center bg-red-50 text-red-700 p-8 text-center font-sans"><div class="max-w-lg"><h2 class="text-2xl font-bold mb-4">Preview Error</h2><p class="mb-4">The AI generated code that contains a syntax error.</p><pre class="whitespace-pre-wrap bg-white p-4 rounded-lg border border-red-200 text-left text-xs overflow-auto max-h-64">\${error.message}</pre></div></div>\`;
            document.body.style.opacity = 1;
          }
        </script>
      </body>
      </html>
    `;
  };

  const htmlContent = createPreviewHtml(code);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200">
      <iframe
        srcDoc={htmlContent}
        title="Website Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default WebsitePreview;