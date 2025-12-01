import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScrollObserver } from './hooks/useScrollObserver';
import { generateWebsiteCode } from './services/geminiService';
import WebsitePreview from './components/WebsitePreview';

// TYPES
type Page = 'landing' | 'generator';

// ICONS (defined as standalone components)
const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);
const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
);
const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
);
const DeviceMobileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
);
const ExpandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4"></path></svg>
);
const MinimizeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4v4H4m12-4v4h4M8 20v-4H4m12 4v-4h4"></path></svg>
);
const CloudUploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
);


// Animated Section Wrapper
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useScrollObserver(ref, { threshold: 0.1 });
  return (
    <div ref={ref} className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}>
      {children}
    </div>
  );
};

// DEPLOY MODAL COMPONENT
interface DeployModalProps { onClose: () => void; }
const DeployModal: React.FC<DeployModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition">
          <XIcon className="w-6 h-6 text-gray-500" />
        </button>
        
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-amber-100 rounded-full">
            <CloudUploadIcon className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">How to Deploy</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Since you have synced this project to GitHub, deploying to production is free and easy.
          <br /><span className="font-semibold text-red-500">Important:</span> You must set your API Key in your hosting provider's settings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Vercel Option */}
          <div className="border border-gray-200 rounded-xl p-5 hover:border-amber-400 transition cursor-pointer group">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Vercel</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
              <li>Log in to Vercel.</li>
              <li>Click "Add New..." {'>'} "Project".</li>
              <li>Import your GitHub repository.</li>
              <li className="font-semibold text-amber-700 bg-amber-50 p-1 rounded">
                Add Environment Variable:<br/>
                Key: <code className="text-xs font-mono">API_KEY</code><br/>
                Value: (Your Gemini API Key)
              </li>
              <li>Click Deploy.</li>
            </ol>
            <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="mt-4 block w-full text-center bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition">
              Deploy to Vercel
            </a>
          </div>

          {/* Netlify Option */}
          <div className="border border-gray-200 rounded-xl p-5 hover:border-amber-400 transition cursor-pointer group">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Netlify</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
              <li>Log in to Netlify.</li>
              <li>Click "Add new site" {'>'} "Import an existing project".</li>
              <li>Select GitHub and your repo.</li>
              <li className="font-semibold text-amber-700 bg-amber-50 p-1 rounded">
                Add Environment Variable:<br/>
                Key: <code className="text-xs font-mono">API_KEY</code><br/>
                Value: (Your Gemini API Key)
              </li>
              <li>Click Deploy.</li>
            </ol>
             <a href="https://app.netlify.com/start" target="_blank" rel="noopener noreferrer" className="mt-4 block w-full text-center bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition">
              Deploy to Netlify
            </a>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 text-center">
          <p><strong>Note on API Keys:</strong> For personal use, the <strong>Free Tier</strong> key is sufficient. For high-traffic production apps, consider the <strong>Paid Tier</strong> to avoid rate limits.</p>
        </div>
      </div>
    </div>
  );
};


// NAVBAR COMPONENT
interface NavbarProps { 
  onNavigate: (page: Page) => void;
  onOpenDeploy: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenDeploy }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navClass = "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl transition-all duration-300";
  
  return (
    <nav className={navClass}>
       <div className="bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center">
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex-shrink-0 text-2xl font-bold text-gray-800 flex items-center">
                  <BoltIcon className="h-8 w-8 text-amber-500 mr-2" />
                  StormAI
                </a>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a href="#features" onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                  <a href="#how-it-works" onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium">How It Works</a>
                  <button onClick={onOpenDeploy} className="text-gray-600 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                    <CloudUploadIcon className="w-4 h-4 mr-1" /> Deploy
                  </button>
                  <button onClick={() => onNavigate('generator')} className="ml-4 bg-amber-400 text-white font-bold py-2 px-4 rounded-full hover:bg-amber-500 transition duration-300 shadow-md">
                    Get Started
                  </button>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="bg-amber-100 inline-flex items-center justify-center p-2 rounded-md text-amber-500 hover:text-amber-600 hover:bg-amber-200 focus:outline-none">
                  <span className="sr-only">Open main menu</span>
                  {isOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
          {isOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-md pb-3 space-y-1 sm:px-3 rounded-b-2xl">
              <a href="#features" onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="text-gray-600 hover:text-amber-600 block px-3 py-2 rounded-md text-base font-medium">Features</a>
              <a href="#how-it-works" onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="text-gray-600 hover:text-amber-600 block px-3 py-2 rounded-md text-base font-medium">How It Works</a>
              <button onClick={() => { onOpenDeploy(); setIsOpen(false); }} className="text-gray-600 hover:text-amber-600 w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center">
                 <CloudUploadIcon className="w-4 h-4 mr-2" /> Deploy
              </button>
              <button onClick={() => { onNavigate('generator'); setIsOpen(false); }} className="w-full text-left bg-amber-400 text-white font-bold mt-2 py-2 px-3 rounded-md hover:bg-amber-500 transition duration-300">
                Get Started
              </button>
            </div>
          )}
       </div>
    </nav>
  );
};

// LANDING PAGE CONTENT
interface LandingPageContentProps { onNavigate: (page: Page) => void; }
const LandingPageContent: React.FC<LandingPageContentProps> = ({ onNavigate }) => {
  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-12 sm:pt-40 sm:pb-16 lg:pt-48 lg:pb-24 min-h-screen flex items-center bg-white">
          <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 -mr-48 -mt-24 w-[1000px] h-[1000px] rounded-full bg-amber-100/50 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-48 -mb-24 w-[800px] h-[800px] rounded-full bg-yellow-100/50 blur-3xl"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <AnimatedSection>
                  <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
                      <span className="block">Generate Modern Websites</span>
                      <span className="block text-amber-500">with a Single Prompt</span>
                  </h1>
                  <p className="mt-6 max-w-lg mx-auto text-lg text-gray-600 sm:max-w-xl md:text-xl lg:text-2xl">
                      StormAI leverages Gemini to transform your ideas into fully functional, production-ready React and Tailwind code.
                  </p>
                  <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                      <button onClick={() => onNavigate('generator')} className="w-full sm:w-auto bg-amber-500 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-amber-600 transition duration-300 shadow-lg transform hover:scale-105">
                          Start Generating Now
                      </button>
                  </div>
              </AnimatedSection>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-amber-50 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Why Choose StormAI?</h2>
            <p className="mt-4 text-lg text-gray-600">The fastest way to go from concept to code.</p>
          </AnimatedSection>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BoltIcon, title: 'AI-Powered Generation', desc: 'Harness the power of Google\'s Gemini to generate high-quality code in seconds.' },
              { icon: CodeIcon, title: 'React + Tailwind', desc: 'Get modern, efficient, and beautiful code using the most popular frontend technologies.' },
              { icon: PaletteIcon, title: 'Aesthetically Pleasing', desc: 'Our AI is trained to produce visually stunning designs that you can be proud of.' },
              { icon: DeviceMobileIcon, title: 'Fully Responsive', desc: 'All generated websites are mobile-first and look great on any device, from phones to desktops.' },
            ].map((feature, i) => (
              <AnimatedSection key={i}>
                <div className="bg-white p-8 rounded-2xl shadow-lg h-full transition duration-300 hover:shadow-xl hover:-translate-y-1">
                  <feature.icon className="h-10 w-10 text-amber-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Simple, Fast, Effective</h2>
            <p className="mt-4 text-lg text-gray-600">Three easy steps to your new website.</p>
          </AnimatedSection>
          <div className="mt-16 space-y-12">
            {[
              { num: '01', title: 'Describe Your Vision', desc: 'Write a simple text prompt describing the website you want to build. Be as descriptive as you like!' },
              { num: '02', title: 'Let AI Do the Work', desc: 'Our powerful AI, powered by Gemini, analyzes your prompt and generates the complete React and Tailwind code.' },
              { num: '03', title: 'Preview & Use', desc: 'Instantly see a live preview of your generated website. Copy the code and use it in your projects.' },
            ].map((step, i) => (
              <AnimatedSection key={i}>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="text-6xl font-black text-amber-200">{step.num}</div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-gray-600">{step.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">&copy; {new Date().getFullYear()} StormAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};


// GENERATOR PAGE CONTENT
const GeneratorContent: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode('');
    try {
      const code = await generateWebsiteCode(prompt);
      setGeneratedCode(code);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadingMessages = [
    "Warming up the AI...",
    "Analyzing your prompt...",
    "Crafting the perfect layout...",
    "Styling with Tailwind CSS...",
    "Assembling React components...",
    "Almost there...",
  ];
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      let i = 0;
      interval = window.setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  return (
    <div className="min-h-screen bg-amber-50 pt-32">
      <div className="container mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Input Area */}
          <div className="bg-white p-6 rounded-2xl shadow-lg sticky top-28">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Describe Your Website</h2>
            <textarea
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              placeholder="e.g., A modern landing page for a SaaS company that sells productivity software. It should have a hero section with a signup button, a features section with three columns, and a simple footer."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="mt-4 w-full bg-amber-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-600 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate Website</span>
              )}
            </button>
            {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          </div>

          {/* Preview Area */}
          <div className="w-full aspect-[9/16] lg:aspect-video relative">
             {generatedCode && !isLoading && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute -top-4 -right-4 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-amber-100 transition"
                aria-label="Enter fullscreen"
              >
                <ExpandIcon className="h-6 w-6 text-amber-500" />
              </button>
            )}
            {isLoading && (
              <div className="w-full h-full bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 text-center border-4 border-gray-200">
                <BoltIcon className="h-16 w-16 text-amber-400 animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-gray-700">{loadingMessage}</p>
                <p className="mt-2 text-gray-500">Please wait while our AI builds your website.</p>
              </div>
            )}
            {!isLoading && !generatedCode && (
              <div className="w-full h-full bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 text-center border-4 border-dashed border-gray-300">
                <PaletteIcon className="h-16 w-16 text-gray-400" />
                <p className="mt-4 text-xl font-semibold text-gray-700">Your website preview will appear here</p>
                <p className="mt-2 text-gray-500">Enter a prompt and click "Generate Website" to start.</p>
              </div>
            )}
            {generatedCode && <WebsitePreview code={generatedCode} />}
          </div>
        </div>
      </div>
      
      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center animate-fade-in">
           <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-[101] bg-white p-2 rounded-full shadow-lg hover:bg-amber-100 transition"
            aria-label="Exit fullscreen"
          >
            <MinimizeIcon className="h-6 w-6 text-amber-500" />
          </button>
          <div className="w-full h-full">
             <WebsitePreview code={generatedCode} />
          </div>
        </div>
      )}
    </div>
  );
};


// MAIN APP COMPONENT
const App: React.FC = () => {
  const [page, setPage] = useState<Page>('landing');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const handleNavigate = (newPage: Page) => {
    if (page === newPage) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
        setPage(newPage);
        window.scrollTo(0, 0);
        setIsTransitioning(false);
    }, 400);
  };

  return (
    <div className="font-sans text-gray-800 antialiased">
      {isTransitioning && (
         <div className="fixed inset-0 bg-amber-50 z-[999] flex items-center justify-center animate-fade-in">
            <div className="flex items-center text-2xl font-bold text-gray-800 animate-pulse">
                <BoltIcon className="h-8 w-8 text-amber-500 mr-2" />
                StormAI
            </div>
        </div>
      )}
      
      {showDeployModal && <DeployModal onClose={() => setShowDeployModal(false)} />}
      
      <Navbar onNavigate={handleNavigate} onOpenDeploy={() => setShowDeployModal(true)} />
      <main key={page} className="animate-fade-in">
        {page === 'landing' && <LandingPageContent onNavigate={handleNavigate} />}
        {page === 'generator' && <GeneratorContent />}
      </main>
    </div>
  );
};

export default App;