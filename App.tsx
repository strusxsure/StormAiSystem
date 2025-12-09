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
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

// Animated Section Wrapper
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useScrollObserver(ref, { threshold: 0.1 });
  
  const style = {
    transitionDelay: `${delay}ms`,
  };

  return (
    <div ref={ref} style={style} className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
};


// NAVBAR COMPONENT
interface NavbarProps { 
  onNavigate: (page: Page) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floating Pill Design logic
  const navContainerClass = `fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl transition-all duration-500 ease-in-out`;
  
  const navContentClass = `
    relative px-6 py-3 rounded-full border border-white/40 shadow-xl 
    backdrop-blur-xl bg-white/70 hover:bg-white/80 transition-all duration-300
    flex items-center justify-between ring-1 ring-black/5
  `;
  
  return (
    <nav className={navContainerClass}>
       <div className={navContentClass}>
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center group">
            <div className="bg-amber-500 p-1.5 rounded-full mr-2 group-hover:scale-110 transition-transform duration-300">
               <BoltIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">StormAI</span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <a href="#features" onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-amber-600 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-amber-50/50">Features</a>
            <a href="#how-it-works" onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-amber-600 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-amber-50/50">How it Works</a>
            <div className="h-4 w-px bg-gray-300 mx-2"></div>
            <button onClick={() => onNavigate('generator')} className="bg-gray-900 text-white text-sm font-semibold py-2 px-5 rounded-full hover:bg-black transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Start Building
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition">
              {isOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
       </div>

       {/* Mobile Menu Dropdown */}
       {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden animate-fade-in p-4 flex flex-col space-y-2 md:hidden">
           <a href="#features" onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="text-gray-700 hover:bg-amber-50 hover:text-amber-600 px-4 py-3 rounded-xl font-medium transition">Features</a>
           <a href="#how-it-works" onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="text-gray-700 hover:bg-amber-50 hover:text-amber-600 px-4 py-3 rounded-xl font-medium transition">How It Works</a>
           <button onClick={() => { onNavigate('generator'); setIsOpen(false); }} className="w-full mt-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-amber-600 transition shadow-md">
             Start Building
           </button>
        </div>
       )}
    </nav>
  );
};

// LANDING PAGE CONTENT
interface LandingPageContentProps { onNavigate: (page: Page) => void; }
const LandingPageContent: React.FC<LandingPageContentProps> = ({ onNavigate }) => {
  return (
    <div className="overflow-x-hidden bg-[#fafafa]">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 sm:pt-48 sm:pb-32 lg:pb-40 min-h-screen flex items-center">
          {/* Abstract Backgrounds */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-purple-200/40 blur-[100px] mix-blend-multiply animate-pulse"></div>
              <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-amber-200/40 blur-[100px] mix-blend-multiply animate-pulse delay-700"></div>
              <div className="absolute bottom-[0%] left-[30%] w-[600px] h-[600px] rounded-full bg-pink-200/40 blur-[100px] mix-blend-multiply animate-pulse delay-1000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
              <AnimatedSection>
                  <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-md border border-gray-200 rounded-full px-3 py-1 mb-8 shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">AI-Powered V2.0</span>
                  </div>
                  <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl mb-6">
                      Dream it. <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Prompt it.</span><br />
                      Launch it.
                  </h1>
                  <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl leading-relaxed">
                      Transform simple text descriptions into production-ready websites. 
                      No coding required. Just pure creativity powered by Gemini.
                  </p>
                  <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                      <button onClick={() => onNavigate('generator')} className="bg-gray-900 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-black transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center">
                          <SparklesIcon className="w-5 h-5 mr-2" />
                          Generate for Free
                      </button>
                      <a href="#how-it-works" className="bg-white text-gray-700 border border-gray-200 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md">
                          How it Works
                      </a>
                  </div>
              </AnimatedSection>
              
              <AnimatedSection delay={200} className="mt-20">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 relative group bg-gray-100">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition duration-500 z-10 pointer-events-none"></div>
                  {/* Replaced with a reliable Unsplash image to ensure it always loads */}
                  <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
                    alt="App Preview" 
                    className="w-full h-auto transform group-hover:scale-105 transition duration-700" 
                    loading="eager"
                  />
                </div>
              </AnimatedSection>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">Crafted for perfectionists</h2>
            <p className="mt-4 text-lg text-gray-500">Beauty meets function in every line of code generated.</p>
          </AnimatedSection>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BoltIcon, title: 'Instant Generation', desc: 'From prompt to pixel-perfect code in under 30 seconds.' },
              { icon: CodeIcon, title: 'Clean React Code', desc: 'Outputs standard, maintainable React & Tailwind CSS. No spaghetti code.' },
              { icon: PaletteIcon, title: 'Design System', desc: 'Automatically generates consistent color palettes and typography.' },
              { icon: DeviceMobileIcon, title: 'Responsive', desc: 'Mobile-first approach ensures your site looks great on any screen.' },
              { icon: SparklesIcon, title: 'Modern UI/UX', desc: 'Trained on award-winning designs to give you a premium look.' },
              { icon: ExpandIcon, title: 'Full Control', desc: 'Copy the code, edit it, deploy it. You own the output 100%.' },
            ].map((feature, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="group bg-gray-50 rounded-3xl p-8 hover:bg-white hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-300 border border-transparent hover:border-amber-100 h-full">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">From idea to reality</h2>
          </AnimatedSection>
          
          <div className="space-y-8">
            {[
              { num: '01', title: 'Prompt', desc: 'Describe your dream website in plain English. Be as vague or detailed as you like.' },
              { num: '02', title: 'Generate', desc: 'Our advanced Gemini model interprets your needs and writes the code in real-time.' },
              { num: '03', title: 'Launch', desc: 'Preview instantly. Copy the code into your project and ship it.' },
            ].map((step, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="flex items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-amber-200 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center font-black text-xl md:text-2xl mr-6">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                    <p className="mt-1 text-gray-500">{step.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
             <BoltIcon className="h-6 w-6 text-amber-500 mr-2" />
             <span className="font-bold text-gray-900 text-lg">StormAI</span>
          </div>
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} StormAI. Crafted with Gemini.</p>
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
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen bg-gray-50 pt-32">
      <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Input Area */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-32">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <SparklesIcon className="w-6 h-6 text-amber-500 mr-2" />
              Describe your dream site
            </h2>
            <textarea
              className="w-full h-64 p-5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none text-gray-700 leading-relaxed"
              placeholder="e.g. A minimalist portfolio for a photographer. Dark mode. Hero section with a full-width image, masonry grid gallery, and a clean contact form."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="mt-6 w-full bg-gray-900 text-white font-bold py-4 px-6 rounded-xl hover:bg-black transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generative Magic in Progress...</span>
                </>
              ) : (
                <span>Generate Website</span>
              )}
            </button>
            {error && <p className="mt-4 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm">{error}</p>}
          </div>

          {/* Preview Area */}
          <div className="w-full aspect-[9/16] lg:aspect-video relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white group">
             {generatedCode && !isLoading && (
              <div className="absolute top-4 right-4 z-10 flex space-x-2">
                 <button
                  onClick={handleCopy}
                  className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-amber-50 transition border border-gray-100 text-gray-700"
                  title="Copy Code"
                >
                  {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-amber-50 transition border border-gray-100 text-gray-700"
                  title="Fullscreen"
                >
                  <ExpandIcon className="h-5 w-5" />
                </button>
              </div>
            )}
            {isLoading && (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400 blur-xl opacity-20 animate-pulse rounded-full"></div>
                  <BoltIcon className="relative h-16 w-16 text-amber-500 animate-bounce" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">{loadingMessage}</h3>
                <p className="mt-2 text-gray-500">This usually takes about 10-20 seconds.</p>
              </div>
            )}
            {!isLoading && !generatedCode && (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                   <PaletteIcon className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ready to create?</h3>
                <p className="mt-2 text-gray-500 max-w-xs mx-auto">Enter your prompt on the left and watch the magic happen here.</p>
              </div>
            )}
            {generatedCode && <WebsitePreview code={generatedCode} />}
          </div>
        </div>
      </div>
      
      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center animate-fade-in">
           <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 z-[101] bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition text-white"
            aria-label="Exit fullscreen"
          >
            <MinimizeIcon className="h-6 w-6" />
          </button>
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
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
    <div className="font-sans text-gray-800 antialiased selection:bg-amber-100 selection:text-amber-900">
      {isTransitioning && (
         <div className="fixed inset-0 bg-white z-[999] flex items-center justify-center animate-fade-in">
            <div className="flex flex-col items-center">
                <BoltIcon className="h-12 w-12 text-amber-500 animate-bounce" />
            </div>
        </div>
      )}
      
      <Navbar onNavigate={handleNavigate} />
      <main key={page} className="animate-fade-in">
        {page === 'landing' && <LandingPageContent onNavigate={handleNavigate} />}
        {page === 'generator' && <GeneratorContent />}
      </main>
    </div>
  );
};

export default App;