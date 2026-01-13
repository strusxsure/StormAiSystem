
import React, { useState, useEffect, useRef } from 'react';
import { useScrollObserver } from './hooks/useScrollObserver';
import { generateWebsiteCode, generateWebsitePlan } from './services/geminiService';
import { auth, UserProfile, getUserProfile, updateUserCredits, createUserProfile, saveWebsite, WebsiteRecord, updateUserProfile } from './services/firebaseClient';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { createPreviewHtml } from './utils/html';
import { deployToNetlify } from './services/netlify';
import WebsitePreview from './components/WebsitePreview';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';
import Admin from './components/Admin';
import Modal from './components/Modal';
import NetlifyDeployModal from './components/NetlifyDeployModal';
import LoadingAnimation from './components/LoadingAnimation';
import ErrorBoundary from './components/ErrorBoundary';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

// TYPES
type Page = 'landing' | 'auth' | 'dashboard' | 'generator' | 'pricing' | 'admin';
type ViewMode = 'chat' | 'preview';
type GeneratorMode = 'website' | 'ui';
type LeftPanelMode = 'chat' | 'code';
type ModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'mimo-v2-flash' | 'z-ai/glm-4.5-air' | 'devetral';

type Message = {
  role: 'user' | 'assistant';
  content: string; 
  code?: string;
  reasoning?: string;
  isError?: boolean;
  isPlan?: boolean; 
};

// ICONS
const PanelLeftCloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
);
const PanelLeftOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19l7-7-7-7"></path></svg>
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
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
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
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
);
const CubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
);
const HouseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
);
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);
const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);
const UploadCloudIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V12a4 4 0 01-4 4h-5m-4-4h12"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12v9m-4-4l4 4 4-4"></path></svg>
);

// Thinking Accordion Component (Optional now, as Gemma usually doesn't output reasoning)
const ThinkingAccordion: React.FC<{ content: string }> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!content) return null;

  return (
    <div className="mb-3 rounded-xl border border-blue-200 dark:border-blue-900/30 overflow-hidden shadow-sm">
       <button 
         onClick={() => setIsOpen(!isOpen)} 
         className="w-full bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 text-xs font-semibold text-left flex items-center justify-between text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
       >
          <div className="flex items-center gap-2">
             <BrainIcon className="w-3.5 h-3.5" />
             <span>Thinking Process</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider opacity-70">{isOpen ? 'Hide' : 'Show'}</span>
       </button>
       {isOpen && (
         <div className="p-4 bg-white dark:bg-gray-900/50 text-xs text-gray-600 dark:text-gray-300 font-mono whitespace-pre-wrap border-t border-blue-100 dark:border-blue-900/20 leading-relaxed">
            {content}
         </div>
       )}
    </div>
  );
};

// SIDEBAR COMPONENT
interface SidebarProps { 
  onNavigate: (page: Page) => void;
  session: User | null;
  onLogout: () => void;
  genMode: GeneratorMode;
  setGenMode: (mode: GeneratorMode) => void;
  userProfile: UserProfile | null;
  currentPage: Page;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, session, onLogout, genMode, setGenMode, userProfile, currentPage, isOpen, onToggle }) => {
  const handleNavigate = (page: Page) => {
      onNavigate(page);
  };

  const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
      <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            active 
            ? 'bg-white shadow-sm text-gray-900' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
         <Icon className={`w-4 h-4 ${active ? 'text-gray-900' : 'text-gray-500'}`} />
         {label}
      </button>
  );

  return (
    <>
      {/* Sidebar Container */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 bg-[#FBFBFB] dark:bg-[#09090b] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col h-full
        ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-r-0'}
      `}>
          {/* Header & Toggle */}
          <div className="p-4 flex items-center justify-between shrink-0">
             <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer border border-gray-200/50 dark:border-gray-700 shadow-sm">
                <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {session?.email?.[0].toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                    {userProfile?.full_name || "My Workspace"}
                </span>
                <ChevronDownIcon className="w-3 h-3 ml-auto text-gray-400" />
             </div>
             {/* Close Button Inside Sidebar */}
             <button onClick={onToggle} className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                <PanelLeftCloseIcon className="w-5 h-5" />
             </button>
          </div>

          {/* Main Navigation */}
          <div className="px-2 space-y-0.5 overflow-y-auto flex-1 custom-scrollbar">
             <NavItem 
                icon={HouseIcon} 
                label="Home" 
                active={currentPage === 'dashboard'} 
                onClick={() => handleNavigate('dashboard')} 
             />
             <NavItem 
                icon={SearchIcon} 
                label="Search" 
                active={currentPage === 'generator'} 
                onClick={() => handleNavigate('generator')} 
             />
          </div>
          
           {/* Generator Mode Switcher */}
           <div className="mt-auto px-4 pt-2 shrink-0">
              <div className="p-1 bg-gray-200/50 dark:bg-gray-800 rounded-lg flex text-[10px] font-bold">
                   <button 
                     onClick={() => setGenMode('website')} 
                     className={`flex-1 py-1.5 rounded-md transition-all ${genMode === 'website' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     Website
                   </button>
                   <button 
                     onClick={() => setGenMode('ui')} 
                     className={`flex-1 py-1.5 rounded-md transition-all ${genMode === 'ui' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     UI Component
                   </button>
              </div>
           </div>

          {/* Footer Area */}
          <div className="p-4 bg-transparent shrink-0">
             {session?.email && ['strusop6@gmail.com', 'riyyanbhai7@gmail.com'].includes(session.email) && (
                <button onClick={() => handleNavigate('admin')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors mb-2">
                    <BoltIcon className="w-4 h-4" />
                    <span>Settings</span>
                </button>
             )}

             {session && (
                 <div className="flex items-center gap-3 px-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                     <img 
                        src={session.photoURL || `https://ui-avatars.com/api/?name=${session.displayName || session.email}`}
                        alt="Profile" 
                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" 
                     />
                     <div className="overflow-hidden flex-1">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {session.displayName || 'User'}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-500 capitalize flex items-center gap-1">
                             <span className={`w-1.5 h-1.5 rounded-full ${userProfile?.credits === 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                             {userProfile?.credits} Credits
                          </p>
                     </div>
                     <button 
                        onClick={onLogout} 
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition"
                        title="Sign Out"
                     >
                         <LogoutIcon className="w-4 h-4" />
                     </button>
                 </div>
             )}
          </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-[1px]"
            onClick={onToggle}
          ></div>
      )}
    </>
  );
};

// NEW LANDING PAGE CONTENT
const LandingPageContent: React.FC<{ onNavigate: (page: Page) => void; session: User | null; onStartBuild: (prompt: string) => void }> = ({ onNavigate, session, onStartBuild }) => {
  const [prompt, setPrompt] = useState('');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onStartBuild(prompt);
    }
  };

  console.log('Rendering LandingPageContent');

  return (
    <div className="font-sans bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-200">
      <nav className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <span className="material-icons-round text-primary text-3xl">bolt</span>
                <span className="font-bold text-xl tracking-tight">StormAi</span>
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => onNavigate('pricing')} className="text-sm font-medium text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-primary transition-colors">Pricing</button>
              <a className="text-sm font-medium text-text-light dark:text-text-dark" href="#features">Features</a>
              <a className="text-sm font-medium text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-primary transition-colors" href="#">Community</a>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-primary">
                <span className="material-icons-round text-xl">chat_bubble_outline</span>
              </button>
              <button className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-primary">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path></svg>
              </button>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
              {session ? (
                  <button onClick={() => onNavigate('dashboard')} className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary/20">Dashboard</button>
              ) : (
                <>
                  <button onClick={() => onNavigate('auth')} className="text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors">Sign in</button>
                  <button onClick={() => onNavigate('auth')} className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary/20">Get started</button>
                </>
              )}
            </div>
            <div className="md:hidden flex items-center">
              <button className="text-text-light dark:text-text-dark">
                <span className="material-icons-round">menu</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <header className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wide">Explore The Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-light dark:text-text-dark mb-6">
            From idea to reality in <br className="hidden md:block" />
            <span className="text-primary italic">seconds.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-subtext-light dark:text-subtext-dark leading-relaxed">
            StormAi isn't just a builder; it's your intelligent partner. Describe your vision, and watch as our AI architects scalable, beautiful applications tailored to your needs.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <button onClick={() => onStartBuild('')} className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 rounded-lg transition-all shadow-glow hover:translate-y-[-2px]">
              Start Building Free
            </button>
            <a className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-text-light dark:text-text-dark font-medium px-8 py-3 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800" href="#how-it-works">
              See Examples
            </a>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -z-10 w-[1000px] h-[600px] bg-gradient-to-tr from-orange-100/50 via-pink-50/30 to-blue-50/30 dark:from-orange-900/10 dark:via-purple-900/10 dark:to-slate-900/10 blur-3xl rounded-full opacity-70"></div>
      </header>
      <section className="py-20 bg-surface-light dark:bg-surface-dark" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-subtext-light dark:text-subtext-dark text-lg max-w-2xl mx-auto">Three simple steps to launch your next big project.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent z-0"></div>
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-background-dark border border-gray-100 dark:border-gray-700 shadow-soft flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-icons-round text-primary text-4xl">chat</span>
              </div>
              <h3 className="text-xl font-bold mb-3">1. Describe It</h3>
              <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
                Simply chat with StormAi. "I need a landing page for a coffee shop with a menu section." No technical jargon required.
              </p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-background-dark border border-gray-100 dark:border-gray-700 shadow-soft flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-icons-round text-primary text-4xl">auto_fix_high</span>
              </div>
              <h3 className="text-xl font-bold mb-3">2. Refine It</h3>
              <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
                Review the generated preview. Ask for changes instantly. "Make the header darker" or "Add a contact form."
              </p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-background-dark border border-gray-100 dark:border-gray-700 shadow-soft flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-icons-round text-primary text-4xl">rocket_launch</span>
              </div>
              <h3 className="text-xl font-bold mb-3">3. Deploy It</h3>
              <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
                One click to publish to the web. Get a custom domain, hosting, and analytics built-in automatically.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="py-24 bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for developers,<br />designed for everyone.</h2>
              <p className="text-subtext-light dark:text-subtext-dark text-lg">Powerful features under the hood, wrapped in an interface anyone can master.</p>
            </div>
            <a className="text-primary font-medium hover:text-primary-hover flex items-center gap-1 group" href="#">
              View full feature list
              <span className="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <span className="material-icons-round">code</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Clean Code Export</h3>
              <p className="text-subtext-light dark:text-subtext-dark">
                Don't get locked in. Export semantic, clean React, Vue, or HTML/CSS code whenever you want to take over.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                <span className="material-icons-round">palette</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Design Systems</h3>
              <p className="text-subtext-light dark:text-subtext-dark">
                Our AI ensures consistency. Change a color once, and watch it propagate intelligently across your entire app.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
                <span className="material-icons-round">speed</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Fast Performance</h3>
              <p className="text-subtext-light dark:text-subtext-dark">
                Sites built with StormAi achieve 99+ Lighthouse scores out of the box. Optimized images, lazy loading, and edge caching.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
                <span className="material-icons-round">devices</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Fully Responsive</h3>
              <p className="text-subtext-light dark:text-subtext-dark">
                Designs automatically adapt to mobile, tablet, and desktop. No more fiddling with media queries manually.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-6">
                <span className="material-icons-round">integration_instructions</span>
              </div>
              <h3 className="text-xl font-bold mb-3">One-Click Integrations</h3>
              <p className="text-subtext-light dark:text-subtext-dark">
                Connect Stripe, Mailchimp, Google Analytics, and 50+ other tools just by asking StormAi to "add a newsletter signup".
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-6">
                <span className="material-icons-round">security</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Enterprise Security</h3>
              <p className="text-subtext-light dark:text-subtext-dark">
                SSL certificates, DDoS protection, and automated backups are standard. Your data and your users are safe.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 bg-surface-light dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What can you build?</h2>
            <p className="text-subtext-light dark:text-subtext-dark text-lg">From portfolios to SaaS dashboards, the possibilities are endless.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                <img alt="SaaS Dashboard Interface" className="w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBt9NycTIeget3E97LmM-ozYoxDKi0LNjlUYAI9bgfXDEHyQ9K_ZmYbcnyeYt8iY-aj5OJCjbed9DiU9C-t7C1Ju-C9JvDtgwHkuT39MPrc_ZHQTn1jp0K3BcplF5Vtmn75xTwqkgQKmyC_ViwCEthpyFrKS9Ui4BQtODMhpMqjyjc89KhAPuewv4ojyfjeGTjGieAREZ3l3Ton08aAh2h93ppe0UPBHmaeZVKql5KgKOQ0on7_L71nrdf8tDgb_Wy2aS52rdBp_fs" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white font-medium">View Case Study</span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase rounded">SaaS</span>
                  <span className="text-subtext-light dark:text-subtext-dark text-sm">Built in 15 mins</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Analytics Dashboard</h3>
                <p className="text-subtext-light dark:text-subtext-dark mb-4">
                  A complete admin panel with charts, user management tables, and dark mode toggle.
                </p>
                <div className="flex items-center text-primary font-medium text-sm">
                  Try prompt: "Create a dark-themed analytics dashboard for a crypto app"
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                <img alt="E-commerce Store Interface" className="w-full h-full object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkzZ-GwIoOIAWZmaeZ_zfb5_kwX-FTRMYdFLVOLH_v9Ue_WxqW4Jp255Nke0_dhXoJu_Mv_7KY8rLW-pKmdnA6BpCAXhf7fqQ3rz6yCXKshnsJju9iYPQl0ReoF4TKX9b9kZopMcKm8SvlSH6XKwdSHjhysP0EgzgFcDx0o9BE7psgjY09mUs_dk7-b1Gxw0kN8Yd0GufJXyI86i-JNCUzKYbVtqVnVaMNkB6ZtvTCNQODOxkchfIvfBWkreB89P5RhzONJ1Ca8PQ" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white font-medium">View Case Study</span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase rounded">E-commerce</span>
                  <span className="text-subtext-light dark:text-subtext-dark text-sm">Built in 25 mins</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Artisan Coffee Shop</h3>
                <p className="text-subtext-light dark:text-subtext-dark mb-4">
                  Product listing page with filtering, shopping cart functionality, and checkout flow integration.
                </p>
                <div className="flex items-center text-primary font-medium text-sm">
                  Try prompt: "Build a minimalist store for selling coffee beans"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 bg-background-light dark:bg-background-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 dark:bg-surface-dark rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to build your masterpiece?</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
                Join 50,000+ creators building the future with StormAi. No credit card required to start.
              </p>
              <form onSubmit={handlePromptSubmit} className="max-w-md mx-auto relative flex flex-col sm:flex-row gap-3">
                <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="flex-1 w-full rounded-lg border-0 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary backdrop-blur-sm px-4 py-3" placeholder="Describe your dream app..." type="text" />
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-primary/25">
                  Generate Now
                </button>
              </form>
              <p className="mt-4 text-xs text-gray-400">
                Try: "A landing page for a dog walking service"
              </p>
            </div>
          </div>
        </div>
      </section>
      <footer className="bg-surface-light dark:bg-surface-dark pt-16 pb-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <a className="flex items-center gap-2 mb-4" href="#">
                <span className="material-icons-round text-primary text-2xl">bolt</span>
                <span className="font-bold text-xl tracking-tight">StormAi</span>
              </a>
              <p className="text-subtext-light dark:text-subtext-dark text-sm max-w-xs mb-6">
                Empowering everyone to create stunning software through the power of artificial intelligence.
              </p>
              <div className="flex gap-4">
                <a className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-subtext-light dark:text-subtext-dark hover:bg-primary hover:text-white transition-colors" href="#">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path></svg>
                </a>
                <a className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-subtext-light dark:text-subtext-dark hover:bg-primary hover:text-white transition-colors" href="#">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-subtext-light dark:text-subtext-dark">
                <li><a className="hover:text-primary transition-colors" href="#">Features</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Integrations</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Pricing</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Changelog</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-subtext-light dark:text-subtext-dark">
                <li><a className="hover:text-primary transition-colors" href="#">About</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Customers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-subtext-light dark:text-subtext-dark">
                <li><a className="hover:text-primary transition-colors" href="#">Community</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Help Center</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Partners</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-subtext-light dark:text-subtext-dark">
                <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Terms</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-subtext-light dark:text-subtext-dark mb-4 md:mb-0">
              © 2024 StormAi Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs font-medium text-subtext-light dark:text-subtext-dark">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// GENERATOR WORKSPACE
interface GeneratorContentProps {
  session: User | null;
  initialProject?: Partial<WebsiteRecord>;
  onUpdateProject?: (project: WebsiteRecord) => void;
  genMode: GeneratorMode;
  userProfile: UserProfile | null;
  onDeductCredit: () => Promise<boolean>;
  onNavigate: (page: Page) => void;
  showModal: (title: string, message: string, type: any) => void;
  isSidebarOpen: boolean;
}

const GeneratorContent: React.FC<GeneratorContentProps> = ({ session, initialProject = {}, onUpdateProject, genMode, userProfile, onDeductCredit, onNavigate, showModal, isSidebarOpen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Consolidate project state into a single object
  const [project, setProject] = useState<Partial<WebsiteRecord>>({
      code: '',
      prompt: '',
      ...initialProject
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>('chat');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('/');
  
  // UPDATED: Only allowed models
  const [selectedModel, setSelectedModel] = useState<ModelType>('mimo-v2-flash');
  
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{prompt: string, plan: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync with initialProject prop changes
    setProject(prev => ({ ...prev, ...initialProject }));
  }, [initialProject]);

  useEffect(() => {
      const { code, prompt } = project;
      if (code && messages.length === 0) {
          setMessages([
              { role: 'user', content: prompt || "Load project." },
              { role: 'assistant', content: 'Project loaded successfully.', code: code }
          ]);
      } else if (messages.length === 0 && !code && prompt) {
          setMessages([{ role: 'user', content: prompt }]);
          setTimeout(() => handleSubmit(undefined, prompt), 500);
      } else if (messages.length === 0 && !code) {
          setMessages([{ role: 'assistant', content: genMode === 'ui' ? "Hi! I'm your AI UI designer. Describe the component you need." : "Hi! I'm your AI designer. Describe the website you want to build." }]);
      }
  }, [project.id]); // Rerun only when the project ID changes

  useEffect(() => {
    if (leftPanelMode === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, leftPanelMode]);

  const saveToDatabase = async (updatedProjectData: Partial<WebsiteRecord>) => {
    if (!session) return;

    try {
        const dataToSave = { ...project, ...updatedProjectData };
        const savedRecord = await saveWebsite(session.uid, dataToSave);

        setProject(savedRecord);
        if (onUpdateProject) onUpdateProject(savedRecord);

        if (savedRecord.netlify_site_id && savedRecord.netlify_api_token && updatedProjectData.code) {
            console.log("Change detected, triggering auto-deployment...");
            const finalHtml = createPreviewHtml(savedRecord.code!);
            await deployToNetlify(finalHtml, savedRecord.netlify_api_token, savedRecord.name!, savedRecord.netlify_site_id);
            console.log("Auto-deployment successful!");
        }
        return savedRecord;
    } catch(err) {
        console.error("Save failed:", err);
        showModal("Error", "Save failed. Please check the console for details.", "error");
        return null;
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overridePrompt?: string) => {
    e?.preventDefault();
    const promptToUse = overridePrompt || input;
    if ((!promptToUse.trim() && !selectedImage) || isLoading) return;
    if (userProfile && userProfile.credits <= 0 && userProfile.tier === 'free') {
        showModal("Out of Credits", "You have 0 credits left. Upgrade to Pro for more generations.", "error");
        return;
    }
    if (!overridePrompt) setMessages(prev => [...prev, { role: 'user', content: promptToUse }]);
    setInput(''); setSelectedImage(null); setIsLoading(true); setLeftPanelMode('chat'); 
    try {
          if (isThinkingMode && !project.code && genMode !== 'ui') {
              const plan = await generateWebsitePlan(promptToUse, selectedModel);
              setMessages(prev => [...prev, { role: 'assistant', content: plan, isPlan: true }]);
              setPendingPlan({ prompt: promptToUse, plan: plan }); 
              await onDeductCredit();
          } else {
              const { code: newCode, reasoning } = await generateWebsiteCode(promptToUse, project.code || '', undefined, selectedImage || undefined, selectedModel, genMode);
              if (newCode && newCode.trim().length > 0) {
                  setMessages(prev => [...prev, { 
                      role: 'assistant', 
                      content: "Generated design.", 
                      code: newCode, 
                      reasoning: reasoning 
                  }]);
                  await saveToDatabase({ code: newCode, prompt: promptToUse, name: project.name || promptToUse.slice(0, 30) });
              } else {
                  setMessages(prev => [...prev, { role: 'assistant', content: "Generation failed. Please try again." }]);
              }
              if (window.innerWidth < 1024) setViewMode('preview');
              await onDeductCredit();
          }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}`, isError: true }]);
    } finally { setIsLoading(false); }
  };

  const handleApprovePlan = async () => {
    if (!pendingPlan) return;
    setIsLoading(true);
    const { plan: planContext, prompt: originalPrompt } = pendingPlan;
    setPendingPlan(null); 
    try {
        const { code: newCode, reasoning } = await generateWebsiteCode(originalPrompt, undefined, planContext, undefined, selectedModel, genMode);
        if (newCode && newCode.trim().length > 0) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Built from plan.", 
                code: newCode,
                reasoning: reasoning
            }]);
            await saveToDatabase({ code: newCode, prompt: originalPrompt, name: project.name || originalPrompt.slice(0, 30) });
        }
        if (window.innerWidth < 1024) setViewMode('preview');
        await onDeductCredit();
    } catch (error: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Failed: ${error.message}`, isError: true }]);
    } finally { setIsLoading(false); }
  };

  const handleDeploymentSuccess = async (deploymentDetails: { netlifySiteId: string, netlifyDeploymentUrl: string, netlifyApiToken: string }) => {
      await saveToDatabase({
          netlify_site_id: deploymentDetails.netlifySiteId,
          netlify_deployment_url: deploymentDetails.netlifyDeploymentUrl,
          netlify_api_token: deploymentDetails.netlifyApiToken
      });
      showModal("Success!", "Your project is deployed and linked. Future saves will automatically redeploy.", "success");
  };

  const handleAutoFix = async (errorMsg: string) => {
    // FORCE UI UPDATE: Switch to chat mode so user sees the "Auto-Fixing..." message and result
    setViewMode('chat');
    setLeftPanelMode('chat');
    
    const fixPrompt = `Fix syntax error: ${errorMsg}`;
    setMessages(prev => [...prev, { role: 'user', content: `Auto-Fixing Error: ${errorMsg.slice(0, 50)}...` }]);
    setIsLoading(true);
    try {
        const { code: newCode, reasoning } = await generateWebsiteCode(fixPrompt, project.code || '', undefined, undefined, selectedModel, genMode);
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Fixed error.", 
            code: newCode,
            reasoning: reasoning 
        }]);
        await saveToDatabase({ code: newCode, prompt: "Auto-Fix" });
    } catch (error: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Fix failed: ${error.message}`, isError: true }]);
    } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!project.code || !session) return;
    try {
        await saveToDatabase({ code: project.code, prompt: "Manual Save" });
        showModal("Saved", "Project saved.", "success");
    } catch (err: any) { showModal("Error", "Save failed.", "error"); }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(project.code || '');
      showModal("Copied", "Code copied!", "success");
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-black flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-100/40 via-purple-100/20 to-transparent dark:from-amber-900/10 dark:via-purple-900/10"></div>
      
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-full p-1.5 flex items-center space-x-1 ring-1 ring-black/5">
        <button onClick={() => setViewMode('chat')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center space-x-2 ${viewMode === 'chat' ? 'bg-gray-900 text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'}`}><ChatIcon className="w-4 h-4" /><span>Chat</span></button>
        <button onClick={() => setViewMode('preview')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center space-x-2 ${viewMode === 'preview' ? 'bg-amber-500 text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'}`}><DesktopIcon className="w-4 h-4" /><span>Preview</span></button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row h-full max-w-[2000px] mx-auto w-full relative min-h-0">
        <div className={`w-full lg:w-[450px] xl:w-[500px] flex flex-col flex-shrink-0 transition-all duration-500 h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 lg:shadow-xl z-20 ${viewMode === 'chat' ? 'opacity-100 translate-x-0' : 'hidden lg:flex opacity-0 lg:opacity-100 -translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}`}>
            <div className="flex-1 overflow-hidden relative flex flex-col h-full min-h-0">
                 {leftPanelMode === 'code' && (
                     <div className="absolute inset-0 bg-[#1e1e1e] overflow-hidden flex flex-col z-20">
                        <CodeMirror value={project.code || ''} height="100%" extensions={[javascript({ jsx: true })]} theme={vscodeDark} onChange={(value) => setProject(p => ({...p, code: value}))} className="text-sm h-full" />
                     </div>
                 )}
                 <div className={`p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-32 lg:pb-4 ${leftPanelMode === 'code' ? 'hidden' : 'block'}`}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                                {msg.reasoning && <ThinkingAccordion content={msg.reasoning} />}
                                <div className={`p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl rounded-tr-sm shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl rounded-tl-sm shadow-sm'}`}>{msg.content}</div>
                                {msg.isPlan && idx === messages.length - 1 && pendingPlan && !isLoading && (
                                    <div className="mt-2 flex space-x-2 animate-fade-in">
                                        <button onClick={handleApprovePlan} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-md transition">Approve</button>
                                        <button onClick={() => setPendingPlan(null)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 py-2 px-4 rounded-xl text-xs font-bold transition">Cancel</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && <LoadingAnimation />}
                    <div ref={messagesEndRef} />
                 </div>
            </div>
            <div className={`p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 lg:relative fixed bottom-[4.5rem] lg:bottom-0 left-0 w-full z-40 lg:z-0 ${leftPanelMode === 'code' ? 'hidden' : 'block'}`}>
                 <form onSubmit={(e) => handleSubmit(e)} className="relative shadow-lg rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all group">
                        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} placeholder={genMode === 'ui' ? "Describe your component (e.g., A glassmorphism card)..." : "Describe your website..."} className="w-full bg-transparent border-none focus:ring-0 outline-none ring-0 resize-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 py-4 pl-4 pr-12 max-h-48 rounded-3xl min-h-[60px]" rows={1} disabled={isLoading}/>
                         <div className="flex items-center justify-between px-3 pb-3 pt-1">
                             <div className="relative">
                                 <button type="button" onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">
                                     <ZapIcon className="w-3.5 h-3.5 text-amber-500" />
                                     <span>
                                        {selectedModel === 'gemini-3-flash-preview' ? 'Gemini Flash 3.0' :
                                         selectedModel === 'gemini-3-pro-preview' ? 'Gemini Pro 3.0' :
                                         selectedModel === 'mimo-v2-flash' ? 'Mimo V2 Flash' :
                                         selectedModel === 'z-ai/glm-4.5-air' ? 'GLM 4.5 Air' :
                                         selectedModel === 'devetral' ? 'Devetral' :
                                         'Qwen Coder'}
                                     </span>
                                     <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                 </button>
                                 {isModelDropdownOpen && (
                                     <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 z-50 animate-fade-in ring-1 ring-black/5">
                                         <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Official (Google)</div>
                                         <button
                                            type="button"
                                            onClick={() => { if (userProfile?.tier !== 'free') { setSelectedModel('gemini-3-flash-preview'); setIsModelDropdownOpen(false); } }}
                                            className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 ${userProfile?.tier === 'free' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            disabled={userProfile?.tier === 'free'}
                                         >
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div> Gemini Flash 3.0
                                            <span className="text-[10px] text-gray-400 ml-auto">{userProfile?.tier === 'free' ? 'Pro' : 'Fast'}</span>
                                         </button>
                                         <button
                                            type="button"
                                            onClick={() => { if (userProfile?.tier !== 'free') { setSelectedModel('gemini-3-pro-preview'); setIsModelDropdownOpen(false); } }}
                                            className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 ${userProfile?.tier === 'free' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            disabled={userProfile?.tier === 'free'}
                                         >
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Gemini Pro 3.0
                                            <span className="text-[10px] text-gray-400 ml-auto">{userProfile?.tier === 'free' ? 'Pro' : 'Smart'}</span>
                                         </button>

                                         <div className="mt-1 px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-gray-700 pt-2">Free</div>
                                         <button type="button" onClick={() => { setSelectedModel('mimo-v2-flash'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Mimo V2 Flash <span className="text-[10px] text-gray-400 ml-auto">Coding</span></button>
                                         <button type="button" onClick={() => { setSelectedModel('z-ai/glm-4.5-air'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500"></div> GLM 4.5 Air <span className="text-[10px] text-gray-400 ml-auto">Coding</span></button>
                                         <button type="button" onClick={() => { setSelectedModel('devetral'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Devetral <span className="text-[10px] text-gray-400 ml-auto">New</span></button>
                                     </div>
                                 )}
                             </div>
                             <div className="flex items-center space-x-2">
                                 {/* Removed Thinking Mode toggle as Olmo does it automatically and Gemini doesn't support it here */}
                                 <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={(e) => {
                                     if (e.target.files && e.target.files[0]) {
                                         const reader = new FileReader();
                                         reader.onload = (event) => {
                                             setSelectedImage(event.target?.result as string);
                                         };
                                         reader.readAsDataURL(e.target.files[0]);
                                     }
                                 }} />
                                 <label htmlFor="image-upload" className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                     <ImageIcon className="w-5 h-5" />
                                 </label>
                                 <button type="submit" disabled={(!input.trim() && !selectedImage) || isLoading} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-full hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-50 shadow-md"><ArrowUpIcon className="w-4 h-4" /></button>
                             </div>
                         </div>
                 </form>
                 {selectedImage && (
                    <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-2">
                           <img src={selectedImage} alt="Preview" className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-gray-600 shadow-sm" />
                           <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Image ready</span>
                        </div>
                        <button
                           onClick={() => setSelectedImage(null)}
                           className="text-gray-400 hover:text-red-500 p-1.5 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition"
                        >
                           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        </button>
                    </div>
                 )}
            </div>
        </div>
        <div className={`flex-1 flex flex-col bg-gray-100 dark:bg-black overflow-hidden relative transition-all duration-500 ${viewMode === 'preview' ? 'opacity-100 translate-x-0 h-full' : 'hidden lg:flex opacity-0 lg:opacity-100 translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}`}>
            <div className="flex-1 p-0 lg:p-6 flex flex-col h-full overflow-hidden pb-24 lg:pb-6">
                <div className="w-full h-full bg-white lg:rounded-xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden flex flex-col ring-1 ring-black/5">
                     <div className="h-12 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between shrink-0">
                        <div className="flex space-x-2"><div className="w-3 h-3 rounded-full bg-red-400/80"></div><div className="w-3 h-3 rounded-full bg-yellow-400/80"></div><div className="w-3 h-3 rounded-full bg-green-400/80"></div></div>
                        <div className="flex items-center space-x-3">
                           <button title="Deploy to Netlify" onClick={() => setIsDeployModalOpen(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><UploadCloudIcon className="w-4 h-4"/></button>
                           <button title="Save Project" onClick={handleSave} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><SaveIcon className="w-4 h-4"/></button>
                           <button title="Copy Code" onClick={copyToClipboard} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><CopyIcon className="w-4 h-4"/></button>
                           <button title="Toggle Fullscreen" onClick={() => setIsFullscreen(!isFullscreen)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hidden lg:block"><ExpandIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                    <div className="flex-1 bg-white relative">
                        {project.code ? <WebsitePreview code={project.code} onFixError={handleAutoFix} currentPage={currentPage} onNavigate={setCurrentPage} /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">Waiting...</div>}
                    </div>
                </div>
            </div>
        </div>
      </div>
      {isFullscreen && project.code && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md p-0 flex items-center justify-center animate-fade-in">
           <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 z-[101] bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition text-white"><MinimizeIcon className="h-6 w-6" /></button>
          <div className="w-full h-full"><WebsitePreview code={project.code} onFixError={handleAutoFix} /></div>
        </div>
      )}
       <NetlifyDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        codeToDeploy={project.code || ''}
        projectName={project.name || `stormai-${project.id?.slice(0, 8) || 'project'}`.toLowerCase()}
        existingNetlifySiteId={project.netlify_site_id}
        onSuccess={handleDeploymentSuccess}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [genMode, setGenMode] = useState<GeneratorMode>('website');
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // All project data is now managed in this one state object
  const [currentProject, setCurrentProject] = useState<Partial<WebsiteRecord> | undefined>(undefined);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      type: 'info' | 'error' | 'success' | 'confirm';
      onConfirm?: () => void;
  }>({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setSession(user);
        await loadUserProfile(user);
        setCurrentPage('dashboard');
      } else {
        setSession(null);
        setUserProfile(null);
        setCurrentPage('landing');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (user: User) => {
    let profile = await getUserProfile(user.uid);
    if (!profile) {
        profile = await createUserProfile(user);
    }

    // Check for credit renewal
    if (profile && profile.tier === 'free') {
        const now = new Date();
        const lastReset = profile.last_credit_reset?.toDate();
        const oneDay = 24 * 60 * 60 * 1000;

        if (!lastReset || (now.getTime() - lastReset.getTime()) > oneDay) {
            console.log("Renewing credits for free user...");
            profile.credits = 10;
            await updateUserProfile(user.uid, { credits: 10, last_credit_reset: serverTimestamp() });
        }
    }

    setUserProfile(profile);
  };

  const handleLogout = async () => {
      await signOut(auth);
      setCurrentPage('landing');
      setCurrentProject(undefined);
  };

  const showModal = (title: string, message: string, type: 'info' | 'error' | 'success' | 'confirm' = 'info', onConfirm?: () => void) => {
      setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
      setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeductCredit = async (): Promise<boolean> => {
      if (!session || !userProfile) return false;
      if (userProfile.tier === 'free' && userProfile.credits <= 0) {
          showModal("Out of Credits", "Please upgrade to Pro to continue generating.", "error");
          return false;
      }
      
      const newCredits = userProfile.credits - 1;
      setUserProfile({ ...userProfile, credits: newCredits });
      await updateUserCredits(session.uid, newCredits);
      return true;
  };

  const handleStartBuild = (prompt: string) => {
      if (!session) {
          setCurrentPage('auth');
          return;
      }
      setCurrentProject({ prompt });
      setCurrentPage('generator');
  };

  const handleOpenProject = (project: WebsiteRecord) => {
      setCurrentProject(project);
      setCurrentPage('generator');
  };
  
  const handleUpdateProject = (project: WebsiteRecord) => {
      setCurrentProject(project);
  };

  const confirmDeleteProject = (id: string, deleteCallback: (id: string) => Promise<void>) => {
      showModal("Delete Project?", "Are you sure you want to delete this project?", "confirm", async () => {
          try {
              await deleteCallback(id);
              showModal("Success", "Project deleted.", "success");
          } catch(err: any) {
              showModal("Error", err.message, "error");
          }
      });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><LoadingAnimation /></div>;
    }
      switch (currentPage) {
          case 'landing': 
              return <LandingPageContent onNavigate={setCurrentPage} session={session} onStartBuild={handleStartBuild} />;
          case 'auth':
              return <Auth />;
          case 'dashboard':
              return <ErrorBoundary><Dashboard onSelectProject={handleOpenProject} onCreateNew={() => { setCurrentProject(undefined); setCurrentPage('generator'); }} user={session} confirmDelete={confirmDeleteProject} genMode={genMode} /></ErrorBoundary>;
          case 'generator':
              return <ErrorBoundary><GeneratorContent
                        session={session}
                        initialProject={currentProject}
                        onUpdateProject={handleUpdateProject}
                        genMode={genMode}
                        userProfile={userProfile}
                        onDeductCredit={handleDeductCredit}
                        onNavigate={setCurrentPage}
                        showModal={showModal}
                        isSidebarOpen={isSidebarOpen}
                     /></ErrorBoundary>;
          case 'pricing':
              return <Pricing onUpgrade={() => showModal("Info", "Payment integration coming soon.", "info")} currentTier={userProfile?.tier} onNavigate={setCurrentPage} />;
          case 'admin':
              return <Admin currentUser={session} onNavigate={setCurrentPage} showModal={showModal} />;
          default:
              return <LandingPageContent onNavigate={setCurrentPage} session={session} onStartBuild={handleStartBuild} />;
      }
  };

  const showSidebar = currentPage !== 'landing' && currentPage !== 'auth';

  return (
      <div className="flex h-screen w-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
        {showSidebar && (
            <Sidebar 
                onNavigate={setCurrentPage} 
                session={session} 
                onLogout={handleLogout} 
                genMode={genMode} 
                setGenMode={setGenMode} 
                userProfile={userProfile}
                currentPage={currentPage}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
        )}
        
        <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${showSidebar && !isSidebarOpen ? 'w-full' : ''} overflow-y-auto`}>
             {showSidebar && !isSidebarOpen && (
                 <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                     <PanelLeftOpenIcon className="w-5 h-5" />
                 </button>
             )}
             
             {renderContent()}
        </div>

        <Modal 
            isOpen={modalConfig.isOpen} 
            onClose={closeModal} 
            title={modalConfig.title} 
            message={modalConfig.message} 
            type={modalConfig.type}
            onConfirm={modalConfig.onConfirm}
        />
    </div>
  );
};

export default App;
