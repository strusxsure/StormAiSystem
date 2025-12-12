import React, { useState, useEffect, useRef } from 'react';
import { useScrollObserver } from './hooks/useScrollObserver';
import { generateWebsiteCode, generateWebsitePlan, generatePluginCode, PluginData } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import WebsitePreview from './components/WebsitePreview';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

// TYPES
type Page = 'landing' | 'auth' | 'dashboard' | 'generator';
type ViewMode = 'chat' | 'preview';
type GeneratorMode = 'website' | 'plugin';
type LeftPanelMode = 'chat' | 'code'; // NEW: For toggling views in left panel

type Message = {
  role: 'user' | 'assistant';
  content: string; 
  code?: string;
  isError?: boolean;
  isPlan?: boolean; 
  pluginData?: PluginData; 
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
const CubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);
const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
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
  genMode: GeneratorMode;
  setGenMode: (mode: GeneratorMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, session, onLogout, genMode, setGenMode }) => {
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
                    {/* MODE SWITCHER */}
                    <div className="bg-gray-100 rounded-full p-1 flex space-x-1">
                        <button 
                            onClick={() => setGenMode('website')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${genMode === 'website' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Website
                        </button>
                        <button 
                            onClick={() => setGenMode('plugin')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1 ${genMode === 'plugin' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <CubeIcon className="w-3 h-3 mr-1" />
                            Plugin
                        </button>
                    </div>

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
    </nav>
  );
};

// ... LandingPageContent remains unchanged ...
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
  initialProjectId?: string;
  onUpdateProject?: (code: string, prompt: string, id: string) => void;
  genMode: GeneratorMode;
}

const GeneratorContent: React.FC<GeneratorContentProps> = ({ session, initialPrompt = '', initialCode = '', initialProjectId, onUpdateProject, genMode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentCode, setCurrentCode] = useState<string>(initialCode);
  const [projectId, setProjectId] = useState<string | undefined>(initialProjectId);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>('chat'); // For Desktop Tab Switching
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Plugin Specific State
  const [pluginData, setPluginData] = useState<PluginData | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileLogs, setCompileLogs] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-3-pro-preview'>('gemini-2.5-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{prompt: string, plan: string} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     if (initialProjectId) {
         setProjectId(initialProjectId);
     }
  }, [initialProjectId]);

  useEffect(() => {
    // Logic for setting initial state based on props (loading a project vs new)
    if (initialCode && messages.length === 0) {
         setMessages([
            { role: 'user', content: initialPrompt || "Load project." },
            { role: 'assistant', content: 'Project loaded successfully.', code: initialCode }
         ]);
    } else if (messages.length === 0 && !initialCode) {
        setMessages([
            { role: 'assistant', content: genMode === 'plugin' ? "Hi! Describe your Minecraft Plugin and I'll code it." : "Hi! I'm your AI designer. Describe the website you want to build." }
        ]);
    }
  }, [initialCode, initialPrompt, genMode]);

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

  const saveToDatabase = async (code: string, prompt: string) => {
    try {
        if (projectId) {
            const { error } = await supabase.from('websites').update({
                code: code,
                prompt: prompt.slice(0, 200) 
            }).eq('id', projectId).select();

            if (error) throw error;
            if (onUpdateProject) onUpdateProject(code, prompt, projectId);

        } else {
            const { data, error } = await supabase.from('websites').insert({
                user_id: session.user.id,
                prompt: prompt.slice(0, 200),
                code: code
            }).select().single();
            
            if (error) throw error;
            if (data) {
                setProjectId(data.id);
                if (onUpdateProject) onUpdateProject(code, prompt, data.id);
            }
        }
    } catch(err: any) {
        console.warn("Auto-save failed", err);
    }
  };

  const compilePlugin = async () => {
      if (!pluginData) return;
      setIsCompiling(true);
      setCompileLogs(null);

      try {
        const VPS_URL = 'http://localhost:3000/compile'; // User must change this
        const response = await fetch(VPS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pluginData)
        });

        const result = await response.json();

        if (result.success && result.downloadUrl) {
            // Trigger download
            const a = document.createElement('a');
            a.href = result.downloadUrl;
            a.download = `${pluginData.className}.jar`;
            a.click();
            setMessages(prev => [...prev, { role: 'assistant', content: "Build Successful! Downloading JAR..." }]);
        } else {
            setCompileLogs(result.logs || "Unknown error occurred.");
            setMessages(prev => [...prev, { role: 'assistant', content: "Build Failed. Check the logs.", isError: true }]);
        }

      } catch (e: any) {
          setCompileLogs(`Connection Failed: ${e.message}. Is your VPS running?`);
          setMessages(prev => [...prev, { role: 'assistant', content: "Could not connect to compiler server.", isError: true }]);
      } finally {
          setIsCompiling(false);
      }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userPrompt = input;
    const imageData = selectedImage; 
    
    const userMsg: Message = { role: 'user', content: userPrompt };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      if (genMode === 'plugin') {
         // PLUGIN MODE
         const data = await generatePluginCode(userPrompt, selectedModel);
         setPluginData(data);
         setCurrentCode(data.javaCode); // Display Java code
         setMessages(prev => [...prev, {
             role: 'assistant',
             content: "I've generated the Java code for your plugin. You can now compile it.",
             code: data.javaCode,
             pluginData: data
         }]);
         if (window.innerWidth < 1024) setViewMode('preview');

      } else {
          // WEBSITE MODE
          if (isThinkingMode && !currentCode) {
              const plan = await generateWebsitePlan(userPrompt, selectedModel);
              setMessages(prev => [...prev, { role: 'assistant', content: plan, isPlan: true }]);
              setPendingPlan({ prompt: userPrompt, plan: plan }); 
          } else {
              const newCode = await generateWebsiteCode(userPrompt, currentCode, undefined, imageData || undefined, selectedModel);
              setCurrentCode(newCode);
              setMessages(prev => [...prev, { role: 'assistant', content: currentCode ? "Updated design." : "New website generated.", code: newCode }]);
              if (window.innerWidth < 1024) setViewMode('preview');
              await saveToDatabase(newCode, userPrompt);
          }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!pendingPlan) return;
    setIsLoading(true);
    const planContext = pendingPlan.plan;
    const originalPrompt = pendingPlan.prompt;
    setPendingPlan(null); 

    try {
        const newCode = await generateWebsiteCode(originalPrompt, undefined, planContext, undefined, selectedModel);
        setCurrentCode(newCode);
        setMessages(prev => [...prev, { role: 'assistant', content: "Plan approved! Website built.", code: newCode }]);
        if (window.innerWidth < 1024) setViewMode('preview');
        await saveToDatabase(newCode, originalPrompt);
    } catch (error: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Failed: ${error.message}`, isError: true }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAutoFix = async (errorMsg: string) => {
    const fixPrompt = `I encountered this error in the preview:\n\n${errorMsg}\n\nPlease fix the code immediately.`;
    setMessages(prev => [...prev, { role: 'user', content: `Auto-Fixing Error...` }]);
    setIsLoading(true);

    try {
        const newCode = await generateWebsiteCode(fixPrompt, currentCode, undefined, undefined, selectedModel);
        setCurrentCode(newCode);
        setMessages(prev => [...prev, { role: 'assistant', content: "Fixed syntax error.", code: newCode }]);
        await saveToDatabase(newCode, "Auto-Fix Error");
    } catch (error: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Fix failed: ${error.message}`, isError: true }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentCode || !session) return;
    setIsSaving(true);
    try {
        await saveToDatabase(currentCode, messages.length > 0 ? messages[messages.length-1].content : "Manual Save");
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
    <div className="h-screen bg-gray-50 flex flex-col pt-24 pb-0 overflow-hidden relative">
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

      <div className="flex-1 flex flex-col lg:flex-row h-full max-w-[2000px] mx-auto w-full relative min-h-0">
        
        {/* LEFT PANEL (SIDEBAR) */}
        <div className={`
            w-full lg:w-[420px] xl:w-[480px] flex flex-col flex-shrink-0 transition-all duration-500 h-full bg-white/80 backdrop-blur-xl border-r border-gray-200 lg:shadow-xl z-20
            ${viewMode === 'chat' ? 'opacity-100 translate-x-0' : 'hidden lg:flex opacity-0 lg:opacity-100 -translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}
        `}>
            {/* Sidebar Header with Tabs */}
            <div className="px-6 pt-6 pb-2 border-b border-gray-100 bg-white/50">
                 <div className="flex justify-between items-center mb-4">
                     {/* Model Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                            className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                            {selectedModel === 'gemini-2.5-flash' ? <ZapIcon className="w-3.5 h-3.5 text-amber-500" /> : <BrainIcon className="w-3.5 h-3.5 text-blue-500" />}
                            <span>{selectedModel === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Gemini 3.0 Pro'}</span>
                            <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                        </button>
                         {isModelDropdownOpen && (
                             <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 animate-fade-in">
                                 <button onClick={() => { setSelectedModel('gemini-2.5-flash'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded-lg flex items-center"><ZapIcon className="w-3 h-3 mr-2 text-amber-500"/>Flash</button>
                                 <button onClick={() => { setSelectedModel('gemini-3-pro-preview'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded-lg flex items-center"><BrainIcon className="w-3 h-3 mr-2 text-blue-500"/>Pro</button>
                             </div>
                         )}
                    </div>

                    {/* Desktop View Toggles */}
                    <div className="hidden lg:flex bg-gray-100 rounded-lg p-1">
                        <button 
                            onClick={() => setLeftPanelMode('chat')}
                            className={`p-1.5 rounded-md transition-all ${leftPanelMode === 'chat' ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Chat"
                        >
                            <ChatIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setLeftPanelMode('code')}
                            className={`p-1.5 rounded-md transition-all ${leftPanelMode === 'code' ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                            title="View Code"
                        >
                            <CodeIcon className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
            </div>

            {/* Main Content Area (Chat or Code) */}
            <div className="flex-1 overflow-y-auto relative scrollbar-hide">
                 {/* CODE VIEW MODE */}
                 {leftPanelMode === 'code' && (
                     <div className="absolute inset-0 bg-[#1e1e1e] text-blue-100 p-4 font-mono text-xs overflow-auto">
                         <pre>{currentCode || "// No code generated yet"}</pre>
                     </div>
                 )}

                 {/* CHAT VIEW MODE */}
                 <div className={`p-4 space-y-6 pb-32 min-h-full ${leftPanelMode === 'code' ? 'hidden' : 'block'}`}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center space-x-2 mb-1.5">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${msg.isError ? 'bg-red-500' : 'bg-gradient-to-tr from-amber-400 to-orange-500'}`}>
                                            <BoltIcon className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">StormAI</span>
                                    </div>
                                )}
                                
                                <div className={`p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                                    msg.role === 'user' 
                                    ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm shadow-md' 
                                    : msg.isError 
                                        ? 'bg-red-50 text-red-700 border border-red-100 rounded-2xl rounded-tl-sm'
                                        : msg.isPlan
                                            ? 'bg-purple-50 text-gray-800 border border-purple-100 rounded-2xl rounded-tl-sm border-l-4 border-l-purple-500'
                                            : 'bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-tl-sm shadow-sm'
                                }`}>
                                    {msg.content}
                                    
                                    {/* Compile Button for Plugin Mode */}
                                    {genMode === 'plugin' && msg.pluginData && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <button 
                                                onClick={compilePlugin}
                                                disabled={isCompiling}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center transition shadow-sm"
                                            >
                                                {isCompiling ? (
                                                    <span className="animate-pulse">Compiling on Server...</span>
                                                ) : (
                                                    <>
                                                        <CubeIcon className="w-3.5 h-3.5 mr-2" />
                                                        Compile .JAR
                                                    </>
                                                )}
                                            </button>
                                            {compileLogs && (
                                                <div className="mt-3 bg-black text-green-400 p-3 rounded-lg font-mono text-[10px] overflow-x-auto whitespace-pre">
                                                    {compileLogs}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {msg.isPlan && idx === messages.length - 1 && pendingPlan && !isLoading && (
                                    <div className="mt-2 flex space-x-2 animate-fade-in">
                                        <button onClick={handleApprovePlan} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-md transition">Approve</button>
                                        <button onClick={() => setPendingPlan(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-600 py-2 px-4 rounded-xl text-xs font-bold transition">Cancel</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-3">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                                <span className="text-xs font-medium text-gray-500">{isThinkingMode ? "Architecting..." : "Generating..."}</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                 </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/50 backdrop-blur-md border-t border-gray-200">
                 <form onSubmit={handleSubmit} className="relative shadow-lg rounded-3xl bg-white border border-gray-200 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder={genMode === 'plugin' ? "Describe your plugin command..." : "Describe your website..."}
                            className="w-full bg-transparent border-none focus:ring-0 outline-none ring-0 resize-none text-sm text-gray-800 placeholder-gray-400 py-3 pl-4 pr-12 max-h-32 rounded-3xl"
                            rows={1}
                            disabled={isLoading}
                        />
                         <div className="absolute right-2 bottom-1.5 flex items-center space-x-1">
                             <button
                                type="button"
                                onClick={() => setIsThinkingMode(!isThinkingMode)}
                                className={`p-2 rounded-full transition-all ${isThinkingMode ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-gray-600'}`}
                             >
                                <BrainIcon className="w-4 h-4" />
                             </button>
                             <button 
                                type="submit"
                                disabled={(!input.trim() && !selectedImage) || isLoading}
                                className="bg-gray-900 text-white p-2 rounded-full hover:bg-black transition-all disabled:opacity-50"
                            >
                                <ArrowUpIcon className="w-4 h-4" />
                            </button>
                         </div>
                 </form>
            </div>
        </div>

        {/* RIGHT PANEL: PREVIEW / IDE */}
        <div className={`
            flex-1 flex flex-col bg-gray-100 overflow-hidden relative transition-all duration-500
             ${viewMode === 'preview' ? 'opacity-100 translate-x-0 h-full' : 'hidden lg:flex opacity-0 lg:opacity-100 translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}
        `}>
            {/* Browser / Editor Frame */}
            <div className="flex-1 p-4 lg:p-8 flex flex-col h-full overflow-hidden">
                <div className="w-full h-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col ring-1 ring-black/5">
                    {/* Mac-style Window Header */}
                    <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4 justify-between shrink-0">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-400/80 border border-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400/80 border border-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400/80 border border-green-500/50"></div>
                        </div>
                        <div className="flex-1 flex justify-center px-4">
                            <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-[10px] text-gray-400 font-mono w-full max-w-xs text-center shadow-sm flex items-center justify-center">
                                <span className="mr-2 opacity-50">🔒</span>
                                {genMode === 'website' ? 'preview.local' : 'src/main/java/Plugin.java'}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={handleSave} className="text-gray-400 hover:text-gray-600"><SaveIcon className="w-4 h-4"/></button>
                           <button onClick={copyToClipboard} className="text-gray-400 hover:text-gray-600"><CopyIcon className="w-4 h-4"/></button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white relative">
                        {!currentCode ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-gray-100">
                                    {genMode === 'plugin' ? <CubeIcon className="w-8 h-8 text-blue-500" /> : <MagicWandIcon className="w-8 h-8 text-amber-500" />}
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 mb-1">
                                    {genMode === 'plugin' ? 'Plugin Workspace' : 'Canvas Ready'}
                                </h3>
                                <p className="text-xs text-gray-500">Waiting for your instructions...</p>
                            </div>
                        ) : (
                            <>
                                {genMode === 'website' ? (
                                    <WebsitePreview code={currentCode} onFixError={handleAutoFix} />
                                ) : (
                                    // Plugin Code View (Simple Editor)
                                    <div className="absolute inset-0 bg-[#282c34] text-gray-300 p-6 overflow-auto font-mono text-sm leading-relaxed">
                                        <pre>{currentCode}</pre>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

       {/* Fullscreen Modal (Website Only) */}
       {isFullscreen && currentCode && genMode === 'website' && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md p-0 flex items-center justify-center animate-fade-in">
           <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 z-[101] bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition text-white"
          >
            <MinimizeIcon className="h-6 w-6" />
          </button>
          <div className="w-full h-full">
             <WebsitePreview code={currentCode} onFixError={handleAutoFix} />
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
  const [genMode, setGenMode] = useState<GeneratorMode>('website'); // Lifted State
  const [activeProject, setActiveProject] = useState<{code: string, prompt: string, id?: string} | null>(null);

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
    setCurrentPage(page);
  };

  const handleSelectProject = (code: string, prompt: string, id: string) => {
    setActiveProject({ code, prompt, id });
    setCurrentPage('generator');
  };
  
  const handleCreateNew = () => {
    setActiveProject(null);
    setCurrentPage('generator');
  }

  const handleUpdateProject = (code: string, prompt: string, id: string) => {
     setActiveProject({ code, prompt, id });
  };

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen flex flex-col">
       <Navbar onNavigate={navigateTo} session={session} onLogout={handleLogout} genMode={genMode} setGenMode={setGenMode} />
       
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
                initialProjectId={activeProject?.id}
                onUpdateProject={handleUpdateProject}
                genMode={genMode}
             />
          )}
       </main>
    </div>
  );
};

export default App;