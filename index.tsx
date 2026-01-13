
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

// A dedicated component to show a user-friendly error for missing .env file.
const MissingEnvError: React.FC<{ missingVars: string[] }> = ({ missingVars }) => (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl mx-4">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Configuration Error</h1>
            <p className="text-lg mb-2">
                The application is missing necessary backend connection details.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                The following required environment variables are missing:
            </p>
            <div className="mb-6">
                {missingVars.map(varName => (
                    <code key={varName} className="block bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md px-3 py-1.5 font-mono text-sm mb-2">
                        {varName}
                    </code>
                ))}
            </div>
            <div className="text-left bg-gray-50 dark:bg-gray-700 p-4 rounded-lg font-mono text-sm">
                <p className="font-semibold mb-2">To fix this:</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Create a new file named <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded">.env</code> in the root of the project.</li>
                    <li>Open the <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded">.env.example</code> file.</li>
                    <li>Copy its contents into your new <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded">.env</code> file.</li>
                    <li>Replace the placeholder values with your actual Firebase project credentials.</li>
                    <li>Restart the development server.</li>
                </ol>
            </div>
            <p className="mt-6 text-xs text-gray-500">
                You can create a free Firebase project at <a href="https://firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">firebase.google.com</a>.
            </p>
        </div>
    </div>
);


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

if (missingEnvVars.length > 0) {
    root.render(<MissingEnvError missingVars={missingEnvVars} />);
} else {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
