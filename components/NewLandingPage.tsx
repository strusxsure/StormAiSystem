
import React, { useState } from 'react';

// Define the props interface for type safety
interface NewLandingPageProps {
  onNavigate: (page: 'auth' | 'dashboard' | 'pricing') => void;
  onStartBuild: (prompt: string) => void;
  session: any; // Using 'any' for session to match existing code
}

const NewLandingPage: React.FC<NewLandingPageProps> = ({ onNavigate, onStartBuild, session }) => {
  const [prompt, setPrompt] = useState('');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onStartBuild(prompt);
    }
  };

  const handleExamplePrompt = (example: string) => {
    setPrompt(example);
    onStartBuild(example);
  };

  // The 'Connect to GitHub' button will navigate to the auth page
  const handleGitHubConnect = () => {
    if (session) {
      // If the user is already logged in, maybe go to the dashboard?
      // For now, let's just log a message. In a real scenario, this would
      // initiate the GitHub OAuth flow.
      console.log("GitHub connection process would start here.");
      onNavigate('dashboard');
    } else {
      onNavigate('auth');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-white min-h-screen flex flex-col antialiased selection:bg-primary selection:text-white transition-colors duration-200">
      <div className="max-w-md mx-auto w-full flex-grow flex flex-col relative px-4 pb-8">
        <header className="flex items-center justify-between py-4 sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button className="p-2 text-text-secondary-light dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined !text-[20px]">dock_to_right</span>
            </button>
            <div className="text-accent dark:text-[#FBBF24]">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 15H6L13 1V9H18L11 23V15Z"></path>
              </svg>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-surface-light dark:bg-[#1E1E24] border border-border-light dark:border-border-dark px-3 py-1.5 rounded-full text-sm font-medium hover:bg-yellow-50 dark:hover:bg-[#2A2A30] transition-colors shadow-sm text-gray-700 dark:text-gray-200">
            <span>Gemini 2.5</span>
            <span className="material-symbols-outlined !text-[16px]">keyboard_arrow_down</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-secondary-light dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-[#2A2A30] rounded-lg transition-colors border border-transparent dark:border-border-dark bg-white/50 dark:bg-[#1E1E24]">
              <span className="material-symbols-outlined !text-[18px]">card_giftcard</span>
            </button>
            <button className="p-2 text-text-secondary-light dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-[#2A2A30] rounded-lg transition-colors border border-transparent dark:border-border-dark bg-white/50 dark:bg-[#1E1E24]">
              <span className="material-symbols-outlined !text-[18px]">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md shadow-yellow-200 dark:shadow-none">
              {session?.user?.email ? session.user.email[0].toUpperCase() : 'U'}
            </div>
          </div>
        </header>
        <main className="flex-grow flex flex-col pt-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">
              Meet StormAI: your autonomous coding agent.
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-base leading-relaxed">
              StormAI will research, code, test, and then submit changes for review. Focus on what you care about while StormAI works!
            </p>
          </div>
          <div className="bg-surface-light dark:bg-[#18181B] border border-border-light dark:border-[#27272A] rounded-3xl p-4 shadow-sm shadow-yellow-100/50 dark:shadow-none relative overflow-hidden">
            <form onSubmit={handlePromptSubmit} className="bg-gray-50 dark:bg-[#202024] border border-gray-100 dark:border-none rounded-2xl p-2 pl-4 flex items-center justify-between mb-6 h-14 shadow-inner dark:shadow-none">
              <input
                className="bg-transparent border-none text-gray-800 dark:text-gray-300 placeholder-gray-400 focus:ring-0 w-full text-[16px]"
                placeholder="Diagnose this bug ..."
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button type="submit" className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-lg shadow-yellow-200 dark:shadow-none">
                <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
              </button>
            </form>
            <div className="flex items-center justify-center mb-6">
              <svg aria-hidden="true" className="w-5 h-5 text-gray-900 dark:text-white mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path>
              </svg>
              <button onClick={handleGitHubConnect} className="bg-white dark:bg-[#252529] text-gray-900 dark:text-gray-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2E2E33] transition-colors border border-gray-200 dark:border-[#333338] shadow-sm">
                Connect to GitHub
              </button>
            </div>
            <div className="border-t border-gray-100 dark:border-[#27272A] w-full mb-5"></div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-text-secondary-light dark:text-gray-400 text-sm font-medium">
                <span className="material-symbols-outlined !text-[18px]">edit_note</span>
                <span>Try StormAI</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleExamplePrompt('Implement an LRU cache in JavaScript')} className="bg-yellow-50 dark:bg-[#222226] hover:bg-yellow-100 dark:hover:bg-[#2C2C30] text-gray-700 dark:text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-yellow-100 dark:border-[#2E2E33] transition-colors">
                  LRU cache
                </button>
                <button onClick={() => handleExamplePrompt('Build a simple load balancer with Node.js')} className="bg-yellow-50 dark:bg-[#222226] hover:bg-yellow-100 dark:hover:bg-[#2C2C30] text-gray-700 dark:text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-yellow-100 dark:border-[#2E2E33] transition-colors">
                  Load balancer
                </button>
                <button onClick={() => handleExamplePrompt('Create a basic cryptocurrency trading bot using Python')} className="bg-yellow-50 dark:bg-[#222226] hover:bg-yellow-100 dark:hover:bg-[#2C2C30] text-gray-700 dark:text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-yellow-100 dark:border-[#2E2E33] transition-colors">
                  Crypto bot
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8 px-2">
            <div className="flex items-center gap-3 text-text-secondary-light dark:text-gray-400 mb-4">
              <span className="material-symbols-outlined !text-[20px]">sync_alt</span>
              <span className="text-sm font-medium">Integrate</span>
              <div className="flex gap-2 ml-1">
                <button className="flex items-center gap-1.5 bg-surface-light dark:bg-[#1E1E24] px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-xs font-medium hover:bg-yellow-50 dark:hover:bg-[#2A2A30] transition-colors">
                  <span className="material-symbols-outlined !text-[14px]">webhook</span>
                  Render
                </button>
                <button className="flex items-center gap-1.5 bg-surface-light dark:bg-[#1E1E24] px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-xs font-medium hover:bg-yellow-50 dark:hover:bg-[#2A2A30] transition-colors">
                  <span className="material-symbols-outlined !text-[14px]">download</span>
                  CLI
                </button>
                <button className="flex items-center gap-1.5 bg-surface-light dark:bg-[#1E1E24] px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-xs font-medium hover:bg-yellow-50 dark:hover:bg-[#2A2A30] transition-colors">
                  <span className="material-symbols-outlined !text-[14px]">code</span>
                  API
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 px-2 text-center">
            <p className="text-sm text-text-secondary-light dark:text-gray-400 leading-relaxed max-w-[95%] mx-auto">
              StormAI is powerful and can execute on any inputs and repositories received. For best results, read the <a className="text-gray-900 dark:text-white underline decoration-yellow-400 underline-offset-2 hover:decoration-yellow-500" href="#">usage guide</a>.
            </p>
          </div>
        </main>
        <footer className="mt-auto pt-10 pb-4 text-center">
          <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-xs text-text-secondary-light dark:text-[#71717A]">
            <a className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors" href="#">Terms</a>
            <a className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors" href="#">Open source licenses</a>
            <a className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors" href="#">Use code with caution</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default NewLandingPage;
