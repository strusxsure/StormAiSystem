import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScrollObserver } from './hooks/useScrollObserver';
import { generateWebsiteCode } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import WebsitePreview from './components/WebsitePreview';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

// TYPES
type Page = 'landing' | 'auth' | 'dashboard' | 'generator';

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
const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
);
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
);
const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
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
  session: any;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, session, onLogout }) => {
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
            {session && (
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }} className="text-gray-600 hover:text-amber-600 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-amber-50/50">Dashboard</a>
            )}
            <div className="h-4 w-px bg-gray-300 mx-2"></div>
            
            {!session ? (
                 <button onClick={() => onNavigate('auth')} className="bg-gray-900 text-white text-sm font-semibold py-2 px-5 rounded-full hover:bg-black transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Sign In
                </button>
            ) : (
                <div className="flex items-center space-x-2">
                    <button onClick={() => onNavigate('generator')} className="bg-amber-500 text-white text-sm font-semibold py-2 px-5 rounded-full hover:bg-amber-600 transition-all duration-300 shadow-md">
                        Create
                    </button>
                     <div className="relative group">
                        <button className="p-1 rounded-full border border-gray-200 ml-2">
                            <img src={session.user.user_metadata.avatar_url || "https://ui-avatars.com/api/?name=User"} alt="User" className="w-8 h-8 rounded-full" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block animate-fade-in">
                            <div className="px-4 py-3 border-b border-gray-50">
                                <p className="text-sm font-bold text-gray-900 truncate">{session.user.user_metadata.full_name || "User"}</p>
                                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                            </div>
                            <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                <LogoutIcon className="w-4 h-4 mr-2" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
           {session && <a href="#" onClick={() => { onNavigate('dashboard'); setIsOpen(false); }} className="text-gray-700 hover:bg-amber-50 hover:text-amber-600 px-4 py-3 rounded-xl font-medium transition">Dashboard</a>}
           
           {!session ? (
             <button onClick={() => { onNavigate('auth'); setIsOpen(false); }} className="w-full mt-2 bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-black transition shadow-md">
                Sign In
             </button>
           ) : (
             <>
                <button onClick={() => { onNavigate('generator'); setIsOpen(false); }} className="w-full mt-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-amber-600 transition shadow-md">
                    New Project
                </button>
                <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full mt-2 bg-red-50 text-red-600 font-bold py-3 px-4 rounded-xl hover:bg-red-100 transition">
                    Sign Out
                </button>
             </>
           )}
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
                      <button onClick={() => onNavigate('auth')} className="bg-gray-900 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-black transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center">
                          <SparklesIcon className="w-5 h-5 mr-2" />
                          Start Building Free
                      </button>
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
interface GeneratorContentProps { 
  session: any; 
  initialPrompt?: string; 
  initialCode?: string;
}

const GeneratorContent: React.FC<GeneratorContentProps> = ({ session, initialPrompt = '', initialCode = '' }) => {
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [generatedCode, setGeneratedCode] = useState<string>(initialCode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if props change (e.g., loading from dashboard)
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialCode) setGeneratedCode(initialCode);
  }, [initialPrompt, initialCode]);

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

  const handleSave = async () => {
    if (!generatedCode || !session) return;
    setIsSaving(true);
    try {
        const { error } = await supabase.from('websites').insert({
            user_id: session.user.id,
            prompt: prompt,
            code: generatedCode
        });
        if (error) throw error;
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
        alert("Failed to save project: " + err.message);
    } finally {
        setIsSaving(false);
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
                <span>{generatedCode ? "Regenerate" : "Generate Website"}</span>
              )}
            </button>
            {error && <p className="mt-4 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm">{error}</p>}
          </div>

          {/* Preview Area */}
          <div className="w-full aspect-[9/16] lg:aspect-video relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white group">
             {generatedCode && !isLoading && (
              <div className="absolute top-4 right-4 z-10 flex space-x-2">
                 <button
                  onClick={handleSave}
                  disabled={isSaving || saveSuccess}
                  className={`backdrop-blur-sm p-2 rounded-full shadow-lg transition border border-gray-100 flex items-center space-x-2 px-3 ${saveSuccess ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white/90 text-gray-700 hover:bg-amber-50'}`}
                  title="Save to Dashboard"
                >
                  {saveSuccess ? (
                      <>
                         <CheckIcon className="h-5 w-5" />
                         <span className="text-xs font-bold">Saved!</span>
                      </>
                  ) : (
                      <>
                        <SaveIcon className="h-5 w-5" />
                        {isSaving && <span className="text-xs">Saving...</span>}
                      </>
                  )}
                </button>
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
  const [session, setSession] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  // State for loading a project from dashboard
  const [loadedCode, setLoadedCode] = useState('');
  const [loadedPrompt, setLoadedPrompt] = useState('');

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Reactive Redirection
  // When session becomes active (e.g. after login/signup), and user is on 'auth' page,
  // redirect them to dashboard.
  useEffect(() => {
    if (session && page === 'auth') {
      // Small delay to ensure state settles, though typically not strictly necessary with React 18
      setPage('dashboard');
    }
  }, [session, page]);

  const handleNavigate = (newPage: Page) => {
    if (page === newPage) return;
    
    // Auth Guard
    if ((newPage === 'dashboard' || newPage === 'generator') && !session) {
        setPage('auth');
        return;
    }
    
    // Clear loaded state if navigating away from generator manually
    // Unless we are loading a specific project
    if (newPage !== 'generator') {
        setLoadedCode('');
        setLoadedPrompt('');
    }

    setIsTransitioning(true);
    setTimeout(() => {
        setPage(newPage);
        window.scrollTo(0, 0);
        setIsTransitioning(false);
    }, 400);
  };
  
  const handleLoadProject = (code: string, prompt: string) => {
      setLoadedCode(code);
      setLoadedPrompt(prompt);
      handleNavigate('generator');
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setPage('landing');
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
      
      <Navbar onNavigate={handleNavigate} session={session} onLogout={handleLogout} />
      <main key={page} className="animate-fade-in">
        {page === 'landing' && <LandingPageContent onNavigate={handleNavigate} />}
        {page === 'auth' && <Auth />}
        {page === 'dashboard' && <Dashboard onSelectProject={handleLoadProject} onCreateNew={() => handleNavigate('generator')} />}
        {page === 'generator' && <GeneratorContent session={session} initialPrompt={loadedPrompt} initialCode={loadedCode} />}
      </main>
    </div>
  );
};

export default App;