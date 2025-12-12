import React, { useState, useEffect, useRef } from 'react';
import { useScrollObserver } from './hooks/useScrollObserver';
import { generateWebsiteCode, generateWebsitePlan } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import WebsitePreview from './components/WebsitePreview';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

// TYPES
type Page = 'landing' | 'auth' | 'dashboard' | 'generator';
type ViewMode = 'chat' | 'preview';

type Message = {
  role: 'user' | 'assistant';
  content: string; 
  code?: string;
  isError?: boolean;
  isPlan?: boolean; 
};

// ICONS
const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
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
const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
);
const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
);
const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);
const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
);
const ZapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
);
const DesktopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
);
const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
);
const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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
  const navContainerClass = `fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl transition-all duration-500 ease-in-out`;
  const navContentClass = `
    relative px-4 sm:px-6 py-3 rounded-full border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)]
    backdrop-blur-xl bg-white/60 hover:bg-white/70 transition-all duration-300
    flex items-center justify-between ring-1 ring-white/50
  `;
  
  return (
    <nav className={navContainerClass}>
       <div className={navContentClass}>
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center group">
            <div className="bg-gradient-to-tr from-amber-400 to-orange-600 p-2 rounded-full mr-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
               <BoltIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-800 tracking-tight">StormAI</span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {!session ? (
                 <>
                    <a href="#features" onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-full hover:bg-white/50 transition">Features</a>
                    <button onClick={() => onNavigate('auth')} className="ml-2 bg-gray-900 text-white text-sm font-bold py-2.5 px-6 rounded-full hover:bg-black transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5">
                        Sign In
                    </button>
                 </>
            ) : (
                <div className="flex items-center space-x-4">
                    <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-full hover:bg-white/50 transition">Dashboard</button>
                    <button onClick={() => onNavigate('generator')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold py-2.5 px-6 rounded-full hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300">
                        Workspace
                    </button>
                     <div className="relative group">
                        <button className="p-0.5 rounded-full border-2 border-white shadow-sm ml-2 overflow-hidden hover:border-amber-200 transition">
                            <img src={session.user.user_metadata.avatar_url || "https://ui-avatars.com/api/?name=User"} alt="User" className="w-9 h-9 rounded-full" />
                        </button>
                        <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden hidden group-hover:block animate-fade-in origin-top-right">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                <p className="text-sm font-bold text-gray-900 truncate">{session.user.user_metadata.full_name || "User"}</p>
                                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                            </div>
                            <div className="p-2">
                                <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center transition font-medium">
                                    <LogoutIcon className="w-4 h-4 mr-2" />
                                    Sign Out
                                </button>
                            </div>
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
        <div className="absolute top-full left-0 w-full mt-4 bg-white/95 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl overflow-hidden animate-fade-in p-2 flex flex-col space-y-1 md:hidden ring-1 ring-black/5">
           <a href="#features" onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="text-gray-700 hover:bg-amber-50 hover:text-amber-600 px-5 py-3 rounded-2xl font-medium transition">Features</a>
           {session && <a href="#" onClick={() => { onNavigate('dashboard'); setIsOpen(false); }} className="text-gray-700 hover:bg-amber-50 hover:text-amber-600 px-5 py-3 rounded-2xl font-medium transition">Dashboard</a>}
           
           {!session ? (
             <div className="p-2">
                 <button onClick={() => { onNavigate('auth'); setIsOpen(false); }} className="w-full bg-gray-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-black transition shadow-md">
                    Sign In
                 </button>
             </div>
           ) : (
             <div className="p-2 space-y-2">
                <button onClick={() => { onNavigate('generator'); setIsOpen(false); }} className="w-full bg-amber-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-amber-600 transition shadow-md">
                    Open Workspace
                </button>
                <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full bg-red-50 text-red-600 font-bold py-3.5 px-4 rounded-xl hover:bg-red-100 transition">
                    Sign Out
                </button>
             </div>
           )}
        </div>
       )}
    </nav>
  );
};

// LANDING PAGE CONTENT
interface LandingPageContentProps {
    onNavigate: (page: Page) => void;
}

const LandingPageContent: React.FC<LandingPageContentProps> = ({ onNavigate }) => {
  return (
    <div className="overflow-x-hidden bg-[#fafafa]">
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 sm:pt-48 sm:pb-32 lg:pb-40 min-h-screen flex items-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-purple-200/40 blur-[100px] mix-blend-multiply animate-pulse"></div>
              <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-amber-200/40 blur-[100px] mix-blend-multiply animate-pulse delay-700"></div>
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
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" alt="App Preview" className="w-full h-auto transform group-hover:scale-105 transition duration-700" loading="eager" />
                </div>
              </AnimatedSection>
          </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedSection>
                  <div className="text-center mb-16">
                      <h2 className="text-base font-semibold text-amber-600 tracking-wide uppercase">Features</h2>
                      <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">Everything you need to build faster</p>
                  </div>
              </AnimatedSection>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {[
                      { icon: MagicWandIcon, title: "Instant Generation", desc: "From text to deployed code in seconds. No boilerplate, just results." },
                      { icon: RobotIcon, title: "Powered by Gemini", desc: "Leveraging Google's most capable AI model for cutting-edge code quality." },
                      { icon: ZapIcon, title: "Iterative Refinement", desc: "Don't like the color? Just tell the AI to change it. It remembers context." }
                  ].map((feature, idx) => (
                      <AnimatedSection key={idx} delay={idx * 100} className="relative p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full blur-2xl opacity-50"></div>
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-amber-500 relative z-10">
                              <feature.icon className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                          <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                      </AnimatedSection>
                  ))}
              </div>
          </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                   <AnimatedSection>
                       <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-6">Designed for speed.<br/><span className="text-amber-500">Built for creators.</span></h2>
                       <p className="text-gray-400 text-lg mb-8">Stop wrestling with CSS grid. Just describe your vision, and let StormAI handle the implementation details while you focus on the big picture.</p>
                       <ul className="space-y-4">
                           {['Natural Language Prompts', 'Real-time Preview', 'One-click Export'].map((item, i) => (
                               <li key={i} className="flex items-center space-x-3">
                                   <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                       <CheckIcon className="w-4 h-4" />
                                   </div>
                                   <span className="font-medium">{item}</span>
                               </li>
                           ))}
                       </ul>
                   </AnimatedSection>
                   <AnimatedSection delay={200} className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl transform rotate-3 blur-sm opacity-30"></div>
                        <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
                             <div className="flex items-center space-x-2 mb-4 border-b border-gray-700 pb-4">
                                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                 <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                             </div>
                             <div className="font-mono text-sm text-green-400 space-y-2">
                                 <p><span className="text-purple-400">const</span> <span className="text-blue-400">App</span> = () ={'>'} {'{'}</p>
                                 <p className="pl-4"><span className="text-purple-400">return</span> (</p>
                                 <p className="pl-8 text-gray-300">{'<'}<span className="text-amber-500">div</span> className="hero"{'>'}</p>
                                 <p className="pl-12 text-white">Hello World</p>
                                 <p className="pl-8 text-gray-300">{'</'}<span className="text-amber-500">div</span>{'>'}</p>
                                 <p className="pl-4">);</p>
                                 <p>{'}'}</p>
                             </div>
                        </div>
                   </AnimatedSection>
               </div>
           </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-12 text-center">
         <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} StormAI. Crafted with Gemini.</p>
      </footer>
    </div>
  );
};


// NEW GENERATOR WORKSPACE (REDESIGNED)
interface GeneratorContentProps { 
  session: any; 
  initialPrompt?: string; 
  initialCode?: string;
}

const GeneratorContent: React.FC<GeneratorContentProps> = ({ session, initialPrompt = '', initialCode = '' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentCode, setCurrentCode] = useState<string>(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat'); // Default to chat on mobile
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Model State - Default to 2.5 Flash as requested
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-3-pro-preview'>('gemini-2.5-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Thinking Mode State
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  const [pendingPlan, setPendingPlan] = useState<{prompt: string, plan: string} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Logic for setting initial state based on props (loading a project vs new)
    if (initialCode && messages.length === 0) {
         // Project loaded
         setMessages([
            { role: 'user', content: initialPrompt || "Load project." },
            { role: 'assistant', content: 'Project loaded successfully.', code: initialCode }
         ]);
    } else if (messages.length === 0 && !initialCode) {
        // New project
        setMessages([
            { role: 'assistant', content: "Hi! I'm your AI designer. Describe the website you want to build, and I'll generate it for you." }
        ]);
    }
  }, [initialCode, initialPrompt]); // Removed 'messages' from dependency to avoid loop

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userPrompt = input;
    const imageData = selectedImage; // capture current state
    
    const userMsg: Message = { role: 'user', content: userPrompt };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null); // Clear image after sending
    setIsLoading(true);

    try {
      if (isThinkingMode && !currentCode) {
          // STEP 1: THINKING MODE - Generate Plan
          const plan = await generateWebsitePlan(userPrompt, selectedModel);
          setMessages(prev => [...prev, {
              role: 'assistant',
              content: plan,
              isPlan: true
          }]);
          setPendingPlan({ prompt: userPrompt, plan: plan }); 
      } else {
          // STEP 2: NORMAL MODE - Single Model (with internal fallback)
          const newCode = await generateWebsiteCode(userPrompt, currentCode, undefined, imageData || undefined, selectedModel);
          setCurrentCode(newCode);
          setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: currentCode ? "I've updated the design based on your feedback." : "Here is your new website design.",
              code: newCode 
          }]);
          if (window.innerWidth < 1024) setViewMode('preview');

          // Auto-save logic
          try {
              const { data, error } = await supabase.from('websites').insert({
                 user_id: session.user.id,
                 prompt: userPrompt.slice(0, 200),
                 code: newCode
              }).select();
          } catch(err) {
              console.warn("Auto-save failed", err);
          }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I encountered an issue. \n\nDebug Info: ${error.message}`,
          isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!pendingPlan) return;
    
    setIsLoading(true);
    // Remove the plan prompt from the queue to clear UI state, but keep the history
    const planContext = pendingPlan.plan;
    const originalPrompt = pendingPlan.prompt;
    setPendingPlan(null); // Clear pending state

    try {
        const newCode = await generateWebsiteCode(originalPrompt, undefined, planContext, undefined, selectedModel);
        setCurrentCode(newCode);
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: "Plan approved! I have built the website based on the architecture.",
            code: newCode
        }]);
        if (window.innerWidth < 1024) setViewMode('preview');
        
        // Auto-save logic
        try {
             await supabase.from('websites').insert({
                 user_id: session.user.id,
                 prompt: originalPrompt.slice(0, 200),
                 code: newCode
              });
        } catch(err) { console.warn("Auto-save failed", err); }

    } catch (error: any) {
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Failed to build from plan. \n\n${error.message}`,
            isError: true
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentCode || !session) return;
    setIsSaving(true);
    try {
        const { error } = await supabase.from('websites').insert({
            user_id: session.user.id,
            prompt: messages.map(m => m.role === 'user' ? m.content : '').filter(Boolean).join(' | ').slice(0, 200),
            code: currentCode
        });
        if (error) throw error;
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
        alert("Failed to save: " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(currentCode);
      alert("Code copied!");
  };

  return (
    <div className="h-screen bg-white/50 flex flex-col pt-24 pb-20 lg:pb-6 px-4 sm:px-6 lg:px-8 gap-6 overflow-hidden relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-100/40 via-purple-100/20 to-transparent"></div>
      
      {/* Mobile/Tablet View Toggle */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-full p-1.5 flex items-center space-x-1 ring-1 ring-black/5">
        <button 
            onClick={() => setViewMode('chat')} 
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center space-x-2 ${
                viewMode === 'chat' ? 'bg-gray-900 text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
            <ChatIcon className="w-4 h-4" />
            <span>Chat</span>
        </button>
        <button 
            onClick={() => setViewMode('preview')} 
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center space-x-2 ${
                viewMode === 'preview' ? 'bg-amber-500 text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
            <DesktopIcon className="w-4 h-4" />
            <span>Preview</span>
        </button>
      </div>

      {/* Added min-h-0 to ensure flex children don't overflow parent height unintentionally */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 h-full max-w-[1920px] mx-auto w-full relative min-h-0">
        
        {/* LEFT PANEL: Chat Interface */}
        <div className={`
            w-full lg:w-[400px] xl:w-[450px] flex flex-col flex-shrink-0 gap-4 transition-all duration-500 h-full
            ${viewMode === 'chat' ? 'opacity-100 translate-x-0' : 'hidden lg:flex opacity-0 lg:opacity-100 -translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}
        `}>
            {/* Header / Model Info */}
            <div className="flex items-center justify-between px-1">
                 <div className="relative">
                    <button
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center space-x-2 bg-white/50 hover:bg-white/80 border border-gray-100 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm group"
                    >
                        {selectedModel === 'gemini-2.5-flash' ? (
                            <>
                                <ZapIcon className="w-3.5 h-3.5 text-amber-500" />
                                <span>Gemini 2.5 Flash</span>
                            </>
                        ) : (
                             <>
                                <BrainIcon className="w-3.5 h-3.5 text-blue-500" />
                                <span>Gemini 3.0 Pro</span>
                            </>
                        )}
                        <ChevronDownIcon className={`w-3 h-3 text-gray-400 transition-transform duration-300 group-hover:text-gray-600 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModelDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-2 z-20 animate-fade-in ring-1 ring-gray-900/5">
                                <div className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider flex items-center">
                                    <SparklesIcon className="w-3 h-3 mr-1.5 text-amber-400" />
                                    Select Model
                                </div>
                                
                                <button
                                    onClick={() => { setSelectedModel('gemini-2.5-flash'); setIsModelDropdownOpen(false); }}
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all text-left group ${selectedModel === 'gemini-2.5-flash' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50 text-gray-700'}`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${selectedModel === 'gemini-2.5-flash' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                                        <ZapIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">Gemini 2.5 Flash</p>
                                        <p className="text-[10px] opacity-70">Fast & Efficient</p>
                                    </div>
                                    {selectedModel === 'gemini-2.5-flash' && <CheckIcon className="w-4 h-4 text-amber-500" />}
                                </button>

                                <button
                                    onClick={() => { setSelectedModel('gemini-3-pro-preview'); setIsModelDropdownOpen(false); }}
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all text-left group ${selectedModel === 'gemini-3-pro-preview' ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-700'}`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${selectedModel === 'gemini-3-pro-preview' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                                        <BrainIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">Gemini 3.0 Pro</p>
                                        <p className="text-[10px] opacity-70">Deep Reasoning</p>
                                    </div>
                                    {selectedModel === 'gemini-3-pro-preview' && <CheckIcon className="w-4 h-4 text-blue-500" />}
                                </button>
                            </div>
                        </>
                    )}
                 </div>
            </div>

             {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-2">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[90%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center space-x-2 mb-1">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${msg.isError ? 'bg-red-500' : 'bg-gradient-to-tr from-amber-400 to-orange-500'}`}>
                                        <BoltIcon className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">StormAI</span>
                                </div>
                            )}
                            
                            {/* Message Bubble */}
                            <div className={`p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                                msg.role === 'user' 
                                ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm' 
                                : msg.isError 
                                    ? 'bg-red-50 text-red-700 border border-red-100 rounded-2xl rounded-tl-sm'
                                    : msg.isPlan
                                        ? 'bg-purple-50 text-gray-800 border border-purple-100 rounded-2xl rounded-tl-sm border-l-4 border-l-purple-500'
                                        : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm'
                            }`}>
                                {msg.isPlan && (
                                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-purple-100 text-purple-700 font-bold text-xs uppercase tracking-wider">
                                        <BrainIcon className="w-4 h-4" />
                                        <span>Thinking Mode Plan</span>
                                    </div>
                                )}
                                {msg.content}
                            </div>

                            {/* Approval Action for Plan */}
                            {msg.isPlan && idx === messages.length - 1 && pendingPlan && !isLoading && (
                                <div className="mt-2 flex space-x-2 animate-fade-in">
                                    <button 
                                        onClick={handleApprovePlan}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                        <span>Approve & Build</span>
                                    </button>
                                    <button 
                                        onClick={() => setPendingPlan(null)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-600 py-2 px-4 rounded-xl text-xs font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                         </div>
                    </div>
                ))}
                
                {/* GEMINI VIBE CODE SKELETON LOADING ANIMATION */}
                {isLoading && (
                     <div className="flex justify-start animate-fade-in">
                        <div className="max-w-[90%] w-full">
                             <div className="flex items-center space-x-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center">
                                    <BoltIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-bold text-gray-500">StormAI</span>
                             </div>
                             
                             <div className="bg-white border border-gray-100 p-5 rounded-2xl rounded-tl-sm shadow-sm relative overflow-hidden min-h-[120px] flex flex-col justify-center group">
                                {/* Shimmer Overlay - Giving it that Gemini 'Light' feel */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-amber-50/20"></div>

                                <div className="space-y-3 relative z-10 opacity-80">
                                    {/* Code Skeleton Lines mimicking code structure */}
                                    <div className="flex items-center space-x-2">
                                        <div className="h-2 w-12 bg-blue-200 rounded-md"></div>
                                        <div className="h-2 w-20 bg-purple-200 rounded-md"></div>
                                        <div className="h-2 w-8 bg-gray-200 rounded-md"></div>
                                    </div>
                                    <div className="ml-4 h-2 w-48 bg-gray-200 rounded-md"></div>
                                    <div className="ml-8 h-2 w-32 bg-gray-200 rounded-md"></div>
                                    <div className="ml-8 h-2 w-24 bg-gray-200 rounded-md"></div>
                                    <div className="ml-4 h-2 w-16 bg-gray-200 rounded-md"></div>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <div className="h-2 w-10 bg-gray-200 rounded-md"></div>
                                        <div className="h-2 w-24 bg-amber-200 rounded-md"></div>
                                    </div>
                                </div>

                                <div className="absolute bottom-3 right-4 flex items-center space-x-2 text-xs font-bold animate-pulse">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                        {isThinkingMode ? "Architecting..." : "Generating Code..."}
                                    </span>
                                    <SparklesIcon className="w-3.5 h-3.5 text-purple-500" />
                                </div>
                             </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Clean & Modern */}
            <div className="mt-auto">
                 <form onSubmit={handleSubmit} className="relative group">
                    <div className={`relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border flex items-end p-2 transition-all duration-300 focus-within:shadow-[0_8px_30px_rgba(251,191,36,0.15)] ${selectedImage ? 'border-amber-400/50 pb-16' : 'border-gray-100'}`}>
                        
                        {/* Thinking Toggle */}
                        <div className="pb-2 pl-2 flex flex-col space-y-2">
                             <button
                                type="button"
                                onClick={() => { setIsThinkingMode(!isThinkingMode); }}
                                className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${isThinkingMode ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-500 ring-offset-1' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                title={isThinkingMode ? "Thinking Mode Active" : "Enable Thinking Mode"}
                             >
                                <BrainIcon className="w-5 h-5" />
                             </button>
                        </div>

                         {/* Image Upload Button */}
                        <div className="pb-2 pl-1">
                             <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${selectedImage ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                title="Upload Reference Image"
                             >
                                <ImageIcon className="w-5 h-5" />
                             </button>
                             <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageSelect}
                             />
                        </div>

                        {/* Text Area */}
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder={isThinkingMode ? "Describe what you want to plan..." : (currentCode ? "Make the header larger..." : "Describe your website...")}
                            className="w-full bg-transparent border-none focus:ring-0 outline-none ring-0 resize-none text-sm text-gray-800 placeholder-gray-400 py-3 pl-3 max-h-32"
                            rows={1}
                            style={{ minHeight: '44px' }}
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={(!input.trim() && !selectedImage) || isLoading}
                            className="bg-gray-900 text-white p-3 rounded-2xl hover:bg-black transition-all duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed m-1 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <ArrowUpIcon className="w-4 h-4" />
                        </button>

                        {/* Selected Image Preview (Inside Input Box) */}
                        {selectedImage && (
                            <div className="absolute left-4 bottom-4 w-12 h-12 rounded-lg border border-gray-200 overflow-hidden shadow-sm group-hover:scale-105 transition">
                                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </form>
                <div className="flex justify-between items-center mt-2 px-2">
                    <p className="text-[10px] text-gray-400 font-medium">AI generated code may contain errors.</p>
                    <div className="flex items-center space-x-2">
                        {isThinkingMode && (
                            <span className="text-[10px] font-bold text-purple-600 flex items-center animate-pulse">
                                <BrainIcon className="w-3 h-3 mr-1" />
                                Thinking Mode ON
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: Preview Window */}
        <div className={`
            flex-1 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden relative ring-1 ring-gray-900/5 transition-all duration-500
             ${viewMode === 'preview' ? 'opacity-100 translate-x-0 h-full' : 'hidden lg:flex opacity-0 lg:opacity-100 translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}
        `}>
            {/* Toolbar */}
            <div className="h-12 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm flex items-center justify-between px-4 flex-shrink-0">
                 <div className="flex items-center space-x-2 opacity-60">
                    <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                    </div>
                 </div>
                 <div className="flex-1 text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-white border border-gray-200 text-[10px] text-gray-400 font-mono shadow-sm">
                        preview.local
                    </div>
                 </div>
                 <div className="flex items-center space-x-1">
                    {currentCode && (
                        <>
                             <button onClick={handleSave} disabled={isSaving || saveSuccess} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Save Project">
                                {saveSuccess ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                             </button>
                             <button onClick={copyToClipboard} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Copy Code">
                                <CopyIcon className="w-4 h-4" />
                             </button>
                             <button onClick={() => setIsFullscreen(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Fullscreen">
                                <ExpandIcon className="w-4 h-4" />
                             </button>
                        </>
                    )}
                 </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 bg-white relative">
                {!currentCode ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-gray-200 border border-gray-50">
                            <MagicWandIcon className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create</h3>
                        <p className="max-w-xs text-center text-sm text-gray-500">Enter a prompt on the left to generate your first website preview.</p>
                    </div>
                ) : (
                    <WebsitePreview code={currentCode} />
                )}
            </div>
        </div>
      </div>

       {/* Fullscreen Modal */}
       {isFullscreen && currentCode && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md p-0 flex items-center justify-center animate-fade-in">
           <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 z-[101] bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition text-white"
          >
            <MinimizeIcon className="h-6 w-6" />
          </button>
          <div className="w-full h-full">
             <WebsitePreview code={currentCode} />
          </div>
        </div>
      )}
    </div>
  );
};

// MAIN APP COMPONENT
const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [activeProject, setActiveProject] = useState<{code: string, prompt: string} | null>(null);

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      // Handle redirects based on initial session state
      if (session) {
         // Logged in: redirect to dashboard if on public pages
         setCurrentPage(curr => (curr === 'landing' || curr === 'auth') ? 'dashboard' : curr);
      } else {
         // Not logged in: redirect to landing if on protected pages
         // IMPORTANT: Do NOT redirect if on 'auth', allow user to sign in
         setCurrentPage(curr => (curr === 'dashboard' || curr === 'generator') ? 'landing' : curr);
      }
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (session) {
         // User signed in
         setCurrentPage(curr => (curr === 'landing' || curr === 'auth') ? 'dashboard' : curr);
      } else {
         // User signed out
         // IMPORTANT: Only redirect if currently on a protected page. 
         // If they are on 'auth' (e.g. failing login) or 'landing', stay there.
         setCurrentPage(curr => (curr === 'dashboard' || curr === 'generator') ? 'landing' : curr);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentPage('landing');
  };

  const navigateTo = (page: Page) => {
    if ((page === 'dashboard' || page === 'generator') && !session) {
        setCurrentPage('auth');
        return;
    }
    
    if (page === 'generator') {
        // Only clear active project if we are explicitly clicking "Workspace" from menu,
        // not if we are navigating via "Create New" or "Select Project"
        // Note: The menu usually calls this with 'generator'.
        
        // However, if we are ALREADY on generator, we might want to stay there.
        if (currentPage !== 'generator') {
            // We are entering generator. 
            // If activeProject is set (from dashboard), we keep it. 
            // If we came from nav menu, we might want to clear it?
            // For now, let's assume nav menu means "current workspace state" or "new"
            // Let's NOT clear it here, relying on handleCreateNew to clear it explicitly.
        }
    }
    
    setCurrentPage(page);
  };

  const handleSelectProject = (code: string, prompt: string) => {
    setActiveProject({ code, prompt });
    setCurrentPage('generator');
  };
  
  const handleCreateNew = () => {
    setActiveProject(null);
    setCurrentPage('generator');
  }

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen flex flex-col">
       <Navbar onNavigate={navigateTo} session={session} onLogout={handleLogout} />
       
       <main className="flex-grow">
          {currentPage === 'landing' && <LandingPageContent onNavigate={navigateTo} />}
          
          {currentPage === 'auth' && !session && <Auth />}
          
          {currentPage === 'dashboard' && session && (
             <Dashboard 
                onSelectProject={handleSelectProject} 
                onCreateNew={handleCreateNew} 
                user={session.user}
             />
          )}
          
          {currentPage === 'generator' && session && (
             <GeneratorContent 
                session={session} 
                initialCode={activeProject?.code} 
                initialPrompt={activeProject?.prompt} 
             />
          )}
       </main>
    </div>
  );
};

export default App;