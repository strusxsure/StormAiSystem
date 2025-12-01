
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
                transition: opacity 0.5s;
            }
        </style>
      </head>
      <body class="bg-gray-100">
        <div id="root"></div>
        <script type="text/babel">
          try {
            ${jsxCode}
            const container = document.getElementById('root');
            const root = ReactDOM.createRoot(container);
            root.render(<App />);
            document.body.style.opacity = 1;
          } catch (error) {
            const root = document.getElementById('root');
            root.innerHTML = \`<div class="h-screen flex items-center justify-center bg-red-100 text-red-700 p-4"><pre class="whitespace-pre-wrap"><strong>Error:</strong> \${error.message}</pre></div>\`;
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
