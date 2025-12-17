import React, { useState, useEffect, useRef } from 'react';
import { useScrollObserver } from './hooks/useScrollObserver';
import { generateWebsiteCode, generateWebsitePlan, generatePluginCode, PluginData } from './services/geminiService';
import { supabase, UserProfile, getUserProfile, updateUserCredits } from './services/supabaseClient';
import WebsitePreview from './components/WebsitePreview';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';
import Admin from './components/Admin';
import Modal from './components/Modal';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

// TYPES
type Page = 'landing' | 'auth' | 'dashboard' | 'generator' | 'pricing' | 'admin';
type ViewMode = 'chat' | 'preview';
type GeneratorMode = 'website' | 'plugin';
type LeftPanelMode = 'chat' | 'code'; 

type Message = {
  role: 'user' | 'assistant';
  content: string; 
  code?: string;
  isError?: boolean;
  isPlan?: boolean; 
  pluginData?: PluginData; 
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
const CompassIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
);
const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
);
const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
);


// SIDEBAR COMPONENT
interface SidebarProps { 
  onNavigate: (page: Page) => void;
  session: any;
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
                    {session?.user?.email?.[0].toUpperCase() || 'U'}
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

             {/* Projects Section */}
             <div className="mt-6 px-3 mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Projects</span>
             </div>
             <div className="space-y-0.5">
                <NavItem 
                   icon={ChevronRightIcon} 
                   label="All projects" 
                   onClick={() => handleNavigate('dashboard')} 
                />
                <NavItem 
                   icon={StarIcon} 
                   label="Starred" 
                   onClick={() => handleNavigate('dashboard')} 
                />
                <NavItem 
                   icon={UsersIcon} 
                   label="Shared with me" 
                   onClick={() => handleNavigate('dashboard')} 
                />
             </div>

             {/* Resources Section */}
             <div className="mt-6 px-3 mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Resources</span>
             </div>
             <div className="space-y-0.5">
                <NavItem 
                   icon={CompassIcon} 
                   label="Discover" 
                   onClick={() => handleNavigate('generator')} 
                />
                <NavItem 
                   icon={CubeIcon} 
                   label="Templates" 
                   onClick={() => handleNavigate('generator')} 
                />
                <NavItem 
                   icon={BookIcon} 
                   label="Learn" 
                   onClick={() => handleNavigate('pricing')} 
                />
             </div>
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
                     onClick={() => setGenMode('plugin')} 
                     className={`flex-1 py-1.5 rounded-md transition-all ${genMode === 'plugin' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     Plugin
                   </button>
              </div>
           </div>

          {/* Footer Area */}
          <div className="p-4 bg-transparent shrink-0">
             <button onClick={() => handleNavigate('admin')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors mb-2">
                 <BoltIcon className="w-4 h-4" />
                 <span>Settings</span>
             </button>

             {session && (
                 <div className="flex items-center gap-3 px-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                     <img 
                        src={session.user.user_metadata.avatar_url || "https://ui-avatars.com/api/?name=User"} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" 
                     />
                     <div className="overflow-hidden flex-1">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {session.user.user_metadata.full_name || 'User'}
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

// NEW LANDING PAGE CONTENT (Redesigned with more details)
const LandingPageContent: React.FC<{ onNavigate: (page: Page) => void; session: any; onStartBuild: (prompt: string) => void }> = ({ onNavigate, session, onStartBuild }) => {
  const [prompt, setPrompt] = useState('');
  const featuresRef = useRef(null);
  const isFeaturesVisible = useScrollObserver(featuresRef);

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen font-sans">
      
      {/* Landing Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border-light/50 dark:border-border-dark/50 bg-background-light/80 dark:bg-background-dark/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <i className="fa-solid fa-bolt text-primary text-2xl"></i>
              <span className="font-bold text-xl tracking-tight">StormAi</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600 dark:text-gray-400">
              <button onClick={() => onNavigate('pricing')} className="hover:text-primary transition-colors">Pricing</button>
              <button className="hover:text-primary transition-colors">Features</button>
              <button className="hover:text-primary transition-colors">Community</button>
            </div>

            <div className="flex items-center space-x-4">
               <div className="hidden lg:flex items-center space-x-4 border-r border-border-light dark:border-border-dark pr-4 mr-1 text-gray-500 dark:text-gray-400">
                <a className="hover:text-primary transition-colors" href="#"><i className="fa-brands fa-discord text-lg"></i></a>
                <a className="hover:text-primary transition-colors" href="#"><i className="fa-brands fa-x-twitter text-lg"></i></a>
                <a className="hover:text-primary transition-colors" href="#"><i className="fa-brands fa-github text-lg"></i></a>
              </div>
              
              {!session ? (
                  <>
                    <button onClick={() => onNavigate('auth')} className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Sign in</button>
                    <button onClick={() => onNavigate('auth')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
                        Get started
                    </button>
                  </>
              ) : (
                  <button onClick={() => onNavigate('dashboard')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
                      Dashboard
                  </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-16 flex flex-col items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-200/20 dark:bg-yellow-900/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="mb-10 animate-fade-in-up">
            <button className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-surface-light dark:bg-surface-dark shadow-sm hover:border-primary/50 transition-all group cursor-default">
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">
                    Introducing Storm V2
                </span>
            </button>
        </div>

        <div className="text-center max-w-4xl px-4 mb-12 relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                What will you <span className="text-primary italic">build</span> today?
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Create stunning apps & websites by chatting with AI. Trusted by developers, designed for everyone.
            </p>
        </div>

        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 -z-10 opacity-60 dark:opacity-30 pointer-events-none">
            <div className="w-[120%] -ml-[10%] h-32 md:h-64 hero-gradient blur-3xl transform -rotate-3 rounded-[100%]"></div>
        </div>

        <div className="w-full max-w-3xl px-4 relative z-20">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl dark:shadow-none p-4 transition-all hover:border-primary/30 dark:hover:border-primary/30 group">
                <div className="relative min-h-[140px] flex flex-col justify-between">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-transparent border-none text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-0 resize-none p-2 outline-none" 
                        placeholder="Let's build a SaaS landing page for a coffee startup..." 
                        rows={3}
                    />
                    <div className="flex items-center justify-between mt-4">
                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary transition-colors">
                            <i className="fa-solid fa-plus text-lg"></i>
                        </button>
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <i className="fa-regular fa-lightbulb"></i>
                                Generate Plan
                            </button>
                            <button 
                                onClick={() => onStartBuild(prompt)}
                                disabled={!prompt.trim()}
                                className="bg-primary hover:bg-primary-dark text-white pl-4 pr-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Build now 
                                <i className="fa-solid fa-paper-plane text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-8 text-sm text-gray-500 dark:text-gray-400">
                <span>or import from</span>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light dark:border-border-dark hover:border-primary/50 hover:bg-surface-light dark:hover:bg-surface-dark transition-all bg-surface-light/50 dark:bg-surface-dark/50 backdrop-blur-sm">
                    <i className="fa-brands fa-figma"></i> Figma
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light dark:border-border-dark hover:border-primary/50 hover:bg-surface-light dark:hover:bg-surface-dark transition-all bg-surface-light/50 dark:bg-surface-dark/50 backdrop-blur-sm">
                    <i className="fa-brands fa-github"></i> GitHub
                </button>
            </div>
        </div>

        <div className="mt-24 text-center px-4 relative z-10">
            <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase mb-8">
                The #1 professional vibe coding tool trusted by
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2 text-xl font-bold text-gray-600 dark:text-gray-400">
                    <i className="fa-brands fa-stack-overflow text-2xl"></i> StackOver
                </div>
                <div className="flex items-center gap-2 text-xl font-bold text-gray-600 dark:text-gray-400">
                    <i className="fa-brands fa-stripe text-2xl"></i> Stripe
                </div>
                <div className="flex items-center gap-2 text-xl font-bold text-gray-600 dark:text-gray-400">
                    <i className="fa-brands fa-aws text-2xl"></i> Amazon
                </div>
                <div className="flex items-center gap-2 text-xl font-bold text-gray-600 dark:text-gray-400">
                    <i className="fa-brands fa-google text-2xl"></i> Google
                </div>
                <div className="flex items-center gap-2 text-xl font-bold text-gray-600 dark:text-gray-400">
                    <i className="fa-brands fa-microsoft text-2xl"></i> Microsoft
                </div>
            </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark" ref={featuresRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-16">
                 <h2 className={`text-3xl md:text-4xl font-bold mb-4 transition-all duration-700 ${isFeaturesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    Build better, faster.
                 </h2>
                 <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    StormAI isn't just a chatbot. It's a full-stack developer that understands design systems, modern frameworks, and deployment.
                 </p>
             </div>

             <div className="grid md:grid-cols-3 gap-8">
                {[
                    { title: "Gemini 3.0 Pro", desc: "Powered by Google's latest reasoning models for complex architecture.", icon: "fa-solid fa-brain" },
                    { title: "Live Preview", desc: "See your code run instantly in a secure, isolated sandbox environment.", icon: "fa-solid fa-desktop" },
                    { title: "Export Ready", desc: "Get production-ready React + Tailwind code you can copy and deploy.", icon: "fa-solid fa-code" }
                ].map((feature, idx) => (
                    <div key={idx} className={`p-8 rounded-2xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark hover:border-primary/50 transition-all duration-500 group ${isFeaturesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`} style={{ transitionDelay: `${idx * 150}ms` }}>
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                            <i className={`${feature.icon} text-xl`}></i>
                        </div>
                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
             </div>
          </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background-light dark:bg-background-dark">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                     <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Workflow</span>
                     <h2 className="text-3xl md:text-4xl font-bold mb-6">From idea to deployment in seconds.</h2>
                     <div className="space-y-8">
                        {[
                            { step: "01", title: "Describe It", text: "Tell StormAI what you want. Be as vague or detailed as you like." },
                            { step: "02", title: "Refine It", text: "Chat with the AI to tweak colors, layout, or add new sections." },
                            { step: "03", title: "Ship It", text: "Copy the code or deploy directly to your preferred host." }
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-4 group">
                                <span className="text-2xl font-bold text-gray-300 dark:text-gray-700 group-hover:text-primary transition-colors">{item.step}</span>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                    <p className="text-gray-500 dark:text-gray-400">{item.text}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                <div className="relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-2xl blur-2xl transform rotate-3"></div>
                     <div className="relative bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
                        <div className="h-8 bg-gray-100 dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 flex items-center px-4 space-x-2">
                             <div className="w-3 h-3 rounded-full bg-red-400"></div>
                             <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                             <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 p-6 flex items-center justify-center bg-gray-50 dark:bg-black/20">
                            <div className="text-center">
                                <i className="fa-solid fa-wand-magic-sparkles text-6xl text-primary mb-4 animate-bounce"></i>
                                <p className="font-mono text-sm text-gray-500">Generating magic...</p>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                  <i className="fa-solid fa-bolt text-primary text-xl"></i>
                  <span className="font-bold text-lg">StormAi</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                  © 2024 StormAI Inc. All rights reserved.
              </div>
              <div className="flex gap-6 text-gray-500 dark:text-gray-400">
                  <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                  <a href="#" className="hover:text-primary transition-colors">Terms</a>
                  <a href="#" className="hover:text-primary transition-colors">Twitter</a>
              </div>
          </div>
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
  userProfile: UserProfile | null;
  onDeductCredit: () => Promise<boolean>;
  onNavigate: (page: Page) => void;
  showModal: (title: string, message: string, type: any) => void;
  isSidebarOpen: boolean; // Passed to adjust layout if needed
}

const GeneratorContent: React.FC<GeneratorContentProps> = ({ session, initialPrompt = '', initialCode = '', initialProjectId, onUpdateProject, genMode, userProfile, onDeductCredit, onNavigate, showModal, isSidebarOpen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentCode, setCurrentCode] = useState<string>(initialCode);
  const [projectId, setProjectId] = useState<string | undefined>(initialProjectId);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>('chat');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pluginData, setPluginData] = useState<PluginData | null>(null);
  // UPDATED: Removed Gemma/Kat, added GLM
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-3-pro-preview' | 'glm-4-air-free'>('gemini-2.5-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{prompt: string, plan: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initialProjectId only if we don't have a local one yet
  useEffect(() => {
     if (initialProjectId && !projectId) {
         setProjectId(initialProjectId);
     }
  }, [initialProjectId]);

  useEffect(() => {
    if (initialCode && messages.length === 0) {
         setMessages([
            { role: 'user', content: initialPrompt || "Load project." },
            { role: 'assistant', content: 'Project loaded successfully.', code: initialCode }
         ]);
    } else if (messages.length === 0 && !initialCode && initialPrompt) {
        setMessages([
            { role: 'user', content: initialPrompt }
        ]);
        setTimeout(() => {
            handleSubmit(undefined, initialPrompt);
        }, 500);
    } else if (messages.length === 0 && !initialCode) {
        setMessages([
            { role: 'assistant', content: genMode === 'plugin' ? "Hi! Describe your Minecraft Plugin and I'll code it." : "Hi! I'm your AI designer. Describe the website you want to build." }
        ]);
    }
  }, [initialCode, initialPrompt, genMode]);

  useEffect(() => {
    if (leftPanelMode === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, leftPanelMode]);

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

  const handleSubmit = async (e?: React.FormEvent, overridePrompt?: string) => {
    e?.preventDefault();
    const promptToUse = overridePrompt || input;
    
    if ((!promptToUse.trim() && !selectedImage) || isLoading) return;

    if (userProfile && userProfile.credits <= 0 && userProfile.tier === 'free') {
        showModal("Out of Credits", "You have 0 credits left. Please upgrade to Pro to continue generating.", "error");
        return;
    }

    const userMsg: Message = { role: 'user', content: promptToUse };
    if (!overridePrompt) {
        setMessages(prev => [...prev, userMsg]);
    }
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    setLeftPanelMode('chat'); 

    try {
      if (genMode === 'plugin') {
         const data = await generatePluginCode(promptToUse, selectedModel);
         setPluginData(data);
         setCurrentCode(data.javaCode); 
         setMessages(prev => [...prev, {
             role: 'assistant',
             content: "I've generated the Java code for your plugin. You can now compile it.",
             code: data.javaCode,
             pluginData: data
         }]);
         if (window.innerWidth < 1024) setViewMode('preview');
         await onDeductCredit();
      } else {
          if (isThinkingMode && !currentCode) {
              const plan = await generateWebsitePlan(promptToUse, selectedModel);
              setMessages(prev => [...prev, { role: 'assistant', content: plan, isPlan: true }]);
              setPendingPlan({ prompt: promptToUse, plan: plan }); 
              await onDeductCredit();
          } else {
              const newCode = await generateWebsiteCode(promptToUse, currentCode, undefined, selectedImage || undefined, selectedModel);
              // CRITICAL FIX: Only update code if it's valid. Don't overwrite with empty string.
              if (newCode && newCode.trim().length > 0) {
                  setCurrentCode(newCode);
                  setMessages(prev => [...prev, { role: 'assistant', content: "Updated design.", code: newCode }]);
                  await saveToDatabase(newCode, promptToUse);
              } else {
                  setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't generate code this time. Please try again." }]);
              }
              
              if (window.innerWidth < 1024) setViewMode('preview');
              await onDeductCredit();
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
        if (newCode && newCode.trim().length > 0) {
            setCurrentCode(newCode);
            setMessages(prev => [...prev, { role: 'assistant', content: "Plan approved! Website built.", code: newCode }]);
            await saveToDatabase(newCode, originalPrompt);
        } else {
             setMessages(prev => [...prev, { role: 'assistant', content: "Failed to build from plan.", isError: true }]);
        }
        if (window.innerWidth < 1024) setViewMode('preview');
        await onDeductCredit();
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
    try {
        await saveToDatabase(currentCode, messages.length > 0 ? messages[messages.length-1].content : "Manual Save");
        showModal("Saved", "Project saved to dashboard.", "success");
    } catch (err: any) {
        showModal("Error", "Failed to save: " + err.message, "error");
    }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(currentCode);
      showModal("Copied", "Code copied to clipboard!", "success");
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-black flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-100/40 via-purple-100/20 to-transparent dark:from-amber-900/10 dark:via-purple-900/10"></div>
      
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
        {/* LEFT PANEL */}
        <div className={`w-full lg:w-[450px] xl:w-[500px] flex flex-col flex-shrink-0 transition-all duration-500 h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 lg:shadow-xl z-20 ${viewMode === 'chat' ? 'opacity-100 translate-x-0' : 'hidden lg:flex opacity-0 lg:opacity-100 -translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}`}>
            <div className="flex-1 overflow-hidden relative flex flex-col h-full">
                 {leftPanelMode === 'code' && (
                     <div className="absolute inset-0 bg-[#1e1e1e] overflow-hidden flex flex-col z-20">
                        <CodeMirror value={currentCode} height="100%" extensions={[javascript({ jsx: true })]} theme={vscodeDark} onChange={(value) => setCurrentCode(value)} className="text-sm h-full" />
                     </div>
                 )}
                 <div className={`p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar ${leftPanelMode === 'code' ? 'hidden' : 'block'}`}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                                <div className={`p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl rounded-tr-sm shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl rounded-tl-sm shadow-sm'}`}>
                                    {msg.content}
                                </div>
                                {msg.isPlan && idx === messages.length - 1 && pendingPlan && !isLoading && (
                                    <div className="mt-2 flex space-x-2 animate-fade-in">
                                        <button onClick={handleApprovePlan} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-md transition">Approve</button>
                                        <button onClick={() => setPendingPlan(null)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 py-2 px-4 rounded-xl text-xs font-bold transition">Cancel</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-xs text-gray-400 p-4">Processing...</div>}
                    <div ref={messagesEndRef} />
                 </div>
            </div>

            <div className={`p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 lg:relative fixed bottom-[4.5rem] lg:bottom-0 left-0 w-full z-40 lg:z-0 ${leftPanelMode === 'code' ? 'hidden' : 'block'}`}>
                 <form onSubmit={(e) => handleSubmit(e)} className="relative shadow-lg rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all group">
                        <textarea 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} 
                            placeholder="Describe your website..." 
                            className="w-full bg-transparent border-none focus:ring-0 outline-none ring-0 resize-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 py-4 pl-4 pr-12 max-h-48 rounded-3xl min-h-[60px]" 
                            rows={1} 
                            disabled={isLoading} 
                        />
                         
                         {/* Input Area Toolbar */}
                         <div className="flex items-center justify-between px-3 pb-3 pt-1">
                             <div className="relative">
                                 <button 
                                     type="button" 
                                     onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} 
                                     className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                                 >
                                     <ZapIcon className="w-3.5 h-3.5 text-amber-500" />
                                     <span>
                                         {selectedModel === 'gemini-2.5-flash' ? 'Flash' : 
                                          selectedModel === 'gemini-3-pro-preview' ? 'Pro 3.0' : 
                                          'GLM 4.5 Air'}
                                     </span>
                                     <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                 </button>
                                 
                                 {isModelDropdownOpen && (
                                     <div className="absolute bottom-full left-0 mb-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 z-50 animate-fade-in ring-1 ring-black/5">
                                         <button type="button" onClick={() => { setSelectedModel('gemini-2.5-flash'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2">
                                             <div className="w-2 h-2 rounded-full bg-amber-500"></div> Gemini Flash <span className="text-[10px] text-gray-400 ml-auto">Fast</span>
                                         </button>
                                         <button type="button" onClick={() => { setSelectedModel('gemini-3-pro-preview'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2">
                                             <div className="w-2 h-2 rounded-full bg-blue-500"></div> Gemini Pro 3.0 <span className="text-[10px] text-gray-400 ml-auto">Smart</span>
                                         </button>
                                         <button type="button" onClick={() => { setSelectedModel('glm-4-air-free'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2">
                                             <div className="w-2 h-2 rounded-full bg-teal-500"></div> GLM 4.5 Air <span className="text-[10px] text-gray-400 ml-auto">Free</span>
                                         </button>
                                     </div>
                                 )}
                             </div>

                             <div className="flex items-center space-x-2">
                                 <button type="button" onClick={() => setIsThinkingMode(!isThinkingMode)} className={`p-2 rounded-full transition-all ${isThinkingMode ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Enable Thinking Mode">
                                    <BrainIcon className="w-4 h-4" />
                                 </button>
                                 <button type="submit" disabled={(!input.trim() && !selectedImage) || isLoading} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-full hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-50 shadow-md">
                                    <ArrowUpIcon className="w-4 h-4" />
                                 </button>
                             </div>
                         </div>
                 </form>
            </div>
        </div>

        {/* RIGHT PANEL: PREVIEW */}
        <div className={`flex-1 flex flex-col bg-gray-100 dark:bg-black overflow-hidden relative transition-all duration-500 ${viewMode === 'preview' ? 'opacity-100 translate-x-0 h-full' : 'hidden lg:flex opacity-0 lg:opacity-100 translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}`}>
            <div className="flex-1 p-0 lg:p-6 flex flex-col h-full overflow-hidden pb-24 lg:pb-6">
                <div className="w-full h-full bg-white lg:rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col ring-1 ring-black/5">
                     <div className="h-12 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between shrink-0">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                        </div>
                        <div className="flex items-center space-x-3">
                           <button onClick={handleSave} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><SaveIcon className="w-4 h-4"/></button>
                           <button onClick={copyToClipboard} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><CopyIcon className="w-4 h-4"/></button>
                           <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hidden lg:block"><ExpandIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                    <div className="flex-1 bg-white relative">
                        {currentCode ? <WebsitePreview code={currentCode} onFixError={handleAutoFix} /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">Waiting...</div>}
                    </div>
                </div>
            </div>
        </div>
      </div>
      
       {/* Fullscreen Modal */}
       {isFullscreen && currentCode && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md p-0 flex items-center justify-center animate-fade-in">
           <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 z-[101] bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition text-white"><MinimizeIcon className="h-6 w-6" /></button>
          <div className="w-full h-full"><WebsitePreview code={currentCode} onFixError={handleAutoFix} /></div>
        </div>
      )}
    </div>
  );
};

// MAIN APP COMPONENT
const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [genMode, setGenMode] = useState<GeneratorMode>('website');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [generatorState, setGeneratorState] = useState<{
    code: string;
    prompt: string;
    projectId?: string;
  }>({ code: '', prompt: '' });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' as 'info' | 'error' | 'success' | 'confirm' });
  const [modalConfirmAction, setModalConfirmAction] = useState<(() => void) | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          fetchProfile(session.user.id);
          // If returning from Auth page, go to Dashboard
          if (currentPage === 'auth') setCurrentPage('dashboard');
      } else {
          setUserProfile(null);
          // Only redirect protected pages
          if (['dashboard', 'generator', 'admin'].includes(currentPage)) {
            setCurrentPage('landing');
          }
      }
    });

    return () => subscription.unsubscribe();
  }, [currentPage]);

  const fetchProfile = async (userId: string) => {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const showModal = (title: string, message: string, type: 'info' | 'error' | 'success' | 'confirm', onConfirm?: () => void) => {
      setModalContent({ title, message, type });
      setModalConfirmAction(() => onConfirm);
      setModalOpen(true);
  };

  const handleDeductCredit = async (): Promise<boolean> => {
      if (!userProfile) return false;
      if (userProfile.credits > 0) {
          const newCredits = userProfile.credits - 1;
          setUserProfile({ ...userProfile, credits: newCredits }); 
          await updateUserCredits(userProfile.id, newCredits);
          return true;
      }
      return false;
  };

  const handleSelectProject = (code: string, prompt: string, id: string) => {
      setGeneratorState({ code, prompt, projectId: id });
      setCurrentPage('generator');
  };

  const handleCreateNew = () => {
      setGeneratorState({ code: '', prompt: '', projectId: undefined });
      setCurrentPage('generator');
  };

  const handleUpdateProjectState = (code: string, prompt: string, id: string) => {
      setGeneratorState({ code, prompt, projectId: id });
  };

  const handleStartBuildFromLanding = (prompt: string) => {
      if (!session) {
         // Optionally handle guest logic or force auth here
      }
      setGeneratorState({ code: '', prompt: prompt, projectId: undefined });
      setCurrentPage('generator');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans text-gray-900 dark:text-gray-100 selection:bg-amber-100 selection:text-amber-900">
      
      {currentPage === 'landing' ? (
        <LandingPageContent 
            onNavigate={setCurrentPage} 
            session={session} 
            onStartBuild={handleStartBuildFromLanding}
        />
      ) : currentPage === 'auth' ? (
        <Auth />
      ) : (
        <div className="flex h-screen overflow-hidden relative">
            {/* Sidebar for App Pages */}
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
            
            {/* Global Panel Open Button (When Sidebar Closed) */}
            {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="absolute top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:scale-105"
                  title="Open Sidebar"
                >
                    <PanelLeftOpenIcon className="w-5 h-5" />
                </button>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto relative bg-background-light dark:bg-background-dark">
                {currentPage === 'dashboard' && (
                    <Dashboard 
                        user={session?.user}
                        onSelectProject={handleSelectProject} 
                        onCreateNew={handleCreateNew}
                        confirmDelete={(id, deleteFn) => {
                            showModal(
                                "Delete Project?", 
                                "Are you sure you want to delete this project? This action cannot be undone.", 
                                "confirm", 
                                async () => {
                                    try {
                                        await deleteFn(id);
                                        showModal("Deleted", "Project deleted successfully.", "success");
                                    } catch (e: any) {
                                        showModal("Error", e.message, "error");
                                    }
                                }
                            );
                        }}
                    />
                )}

                {currentPage === 'generator' && (
                    <GeneratorContent 
                        session={session}
                        initialCode={generatorState.code}
                        initialPrompt={generatorState.prompt}
                        initialProjectId={generatorState.projectId}
                        onUpdateProject={handleUpdateProjectState}
                        genMode={genMode}
                        userProfile={userProfile}
                        onDeductCredit={handleDeductCredit}
                        onNavigate={setCurrentPage}
                        showModal={(t, m, type) => showModal(t, m, type)}
                        isSidebarOpen={isSidebarOpen}
                    />
                )}

                {currentPage === 'pricing' && (
                    <Pricing 
                        onUpgrade={() => showModal("Upgrade", "Redirecting to payment provider...", "info")} 
                        currentTier={userProfile?.tier}
                        onNavigate={setCurrentPage}
                    />
                )}

                {currentPage === 'admin' && (
                    <Admin 
                        currentUser={session?.user} 
                        onNavigate={setCurrentPage}
                        showModal={(t, m, type) => showModal(t, m, type)}
                    />
                )}
            </main>
        </div>
      )}

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalContent.title} 
        message={modalContent.message} 
        type={modalContent.type}
        onConfirm={modalConfirmAction}
      />
    </div>
  );
};

export default App;