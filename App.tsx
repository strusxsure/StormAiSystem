
import React, { useState, useEffect, useRef } from 'react';
import { useScrollObserver } from './hooks/useScrollObserver';
import { generateWebsiteCode, generateWebsitePlan } from './services/geminiService';
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
type GeneratorMode = 'website' | 'ui';
type LeftPanelMode = 'chat' | 'code';
// Replaced gemma-3-12b with mimo-v2-flash
type ModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'mimo-v2-flash';

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
const MessageSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6v-2.29a3.35 3.35 0 0 0 1-2.3V10a6 6 0 0 0-12 0v3.41a3.35 3.35 0 0 0 1 2.3z"></path><line x1="12" y1="22" x2="12" y2="18"></line><path d="M8 10V8a4 4 0 0 1 8 0v2"></path></svg>
);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.667 0-.424-.16-.83-.437-1.139-.277-.308-.68-.496-1.123-.496H12c-2.21 0-4-1.79-4-4s1.79-4 4-4h.54c.48 0 .937.212 1.25.572.312.358.5.82.5 1.313 0 .92-.748 1.667-1.667 1.667h-1.666"/></svg>
);
const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
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
             {session?.user?.email === 'strusop6@gmail.com' && (
                <button onClick={() => handleNavigate('admin')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors mb-2">
                    <BoltIcon className="w-4 h-4" />
                    <span>Settings</span>
                </button>
             )}

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

// NEW LANDING PAGE CONTENT
const LandingPageContent: React.FC<{ onNavigate: (page: Page) => void; session: any; onStartBuild: (prompt: string) => void }> = ({ onNavigate, session, onStartBuild }) => {
  const [prompt, setPrompt] = useState('');
  const featuresRef = useRef(null);
  const isFeaturesVisible = useScrollObserver(featuresRef);

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen font-sans">
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border-light/50 dark:border-border-dark/50 bg-background-light/80 dark:bg-background-dark/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <BoltIcon className="text-primary text-2xl h-6 w-6" />
              <span className="font-bold text-xl tracking-tight">StormAi</span>
            </div>
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600 dark:text-gray-400">
              <button onClick={() => onNavigate('pricing')} className="hover:text-primary transition-colors">Pricing</button>
              <button className="hover:text-primary transition-colors">Features</button>
              <button className="hover:text-primary transition-colors">Community</button>
            </div>
            <div className="flex items-center space-x-4">
               <div className="hidden lg:flex items-center space-x-4 border-r border-border-light dark:border-border-dark pr-4 mr-1 text-gray-500 dark:text-gray-400">
                <a className="hover:text-primary transition-colors" href="#"><MessageSquareIcon className="w-5 h-5" /></a>
                <a className="hover:text-primary transition-colors" href="#"><TwitterIcon className="w-5 h-5" /></a>
              </div>
              {!session ? (
                  <>
                    <button onClick={() => onNavigate('auth')} className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Sign in</button>
                    <button onClick={() => onNavigate('auth')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">Get started</button>
                  </>
              ) : (
                  <button onClick={() => onNavigate('dashboard')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">Dashboard</button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="relative pt-32 pb-16 flex flex-col items-center justify-center overflow-hidden">
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
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">Introducing Storm V2</span>
            </button>
        </div>
        <div className="text-center max-w-4xl px-4 mb-12 relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">What will you <span className="text-primary italic">build</span> today?</h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Create stunning apps & websites by chatting with AI. Trusted by developers, designed for everyone.</p>
        </div>
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 -z-10 opacity-60 dark:opacity-30 pointer-events-none">
            <div className="w-[120%] -ml-[10%] h-32 md:h-64 hero-gradient blur-3xl transform -rotate-3 rounded-[100%]"></div>
        </div>
        <div className="w-full max-w-3xl px-4 relative z-20">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl dark:shadow-none p-4 transition-all hover:border-primary/30 dark:hover:border-primary/30 group">
                <div className="relative min-h-[140px] flex flex-col justify-between">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-transparent border-none text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-0 resize-none p-2 outline-none" placeholder="Let's build a SaaS landing page for a coffee startup..." rows={3}/>
                    <div className="flex items-center justify-between mt-4">
                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary transition-colors"><PlusIcon className="w-5 h-5" /></button>
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><LightbulbIcon className="w-4 h-4" />Generate Plan</button>
                            <button onClick={() => onStartBuild(prompt)} disabled={!prompt.trim()} className="bg-primary hover:bg-primary-dark text-white pl-4 pr-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">Build now <SendIcon className="w-3 h-3" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">Everything you need to build your vision</h2>
                <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-400">Powered by AI, designed for you.</p>
            </div>
            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                        <BoltIcon className="w-6 h-6" />
                    </div>
                    <div className="mt-5">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">AI-Powered Generation</h3>
                        <p className="mt-2 text-base text-gray-600 dark:text-gray-400">Describe your website and let our AI bring it to life in seconds.</p>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                        <PaletteIcon className="w-6 h-6" />
                    </div>
                    <div className="mt-5">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Live Previews</h3>
                        <p className="mt-2 text-base text-gray-600 dark:text-gray-400">See your website as it's being built and make changes on the fly.</p>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                        <CodeIcon className="w-6 h-6" />
                    </div>
                    <div className="mt-5">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Export Code</h3>
                        <p className="mt-2 text-base text-gray-600 dark:text-gray-400">Download the full source code of your website at any time.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};


// GENERATOR WORKSPACE
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
  isSidebarOpen: boolean;
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
  
  // UPDATED: Only allowed models
  const [selectedModel, setSelectedModel] = useState<ModelType>('mimo-v2-flash');
  
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{prompt: string, plan: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        setMessages([{ role: 'user', content: initialPrompt }]);
        setTimeout(() => handleSubmit(undefined, initialPrompt), 500);
    } else if (messages.length === 0 && !initialCode) {
        setMessages([{ role: 'assistant', content: genMode === 'ui' ? "Hi! I'm your AI UI designer. Describe the component you need." : "Hi! I'm your AI designer. Describe the website you want to build." }]);
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
            await supabase.from('websites').update({ code: code, prompt: prompt.slice(0, 200) }).eq('id', projectId);
            if (onUpdateProject) onUpdateProject(code, prompt, projectId);
        } else {
            const { data } = await supabase.from('websites').insert({ user_id: session.user.id, prompt: prompt.slice(0, 200), code: code }).select().single();
            if (data) {
                setProjectId(data.id);
                if (onUpdateProject) onUpdateProject(code, prompt, data.id);
            }
        }
    } catch(err) { console.warn("Auto-save failed", err); }
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
          if (isThinkingMode && !currentCode && genMode !== 'ui') {
              const plan = await generateWebsitePlan(promptToUse, selectedModel);
              setMessages(prev => [...prev, { role: 'assistant', content: plan, isPlan: true }]);
              setPendingPlan({ prompt: promptToUse, plan: plan }); 
              await onDeductCredit();
          } else {
              const { code: newCode, reasoning } = await generateWebsiteCode(promptToUse, currentCode, undefined, selectedImage || undefined, selectedModel, genMode);
              if (newCode && newCode.trim().length > 0) {
                  setCurrentCode(newCode);
                  setMessages(prev => [...prev, { 
                      role: 'assistant', 
                      content: "Generated design.", 
                      code: newCode, 
                      reasoning: reasoning 
                  }]);
                  await saveToDatabase(newCode, promptToUse);
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
            setCurrentCode(newCode);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Built from plan.", 
                code: newCode,
                reasoning: reasoning
            }]);
            await saveToDatabase(newCode, originalPrompt);
        }
        if (window.innerWidth < 1024) setViewMode('preview');
        await onDeductCredit();
    } catch (error: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Failed: ${error.message}`, isError: true }]);
    } finally { setIsLoading(false); }
  };

  const handleAutoFix = async (errorMsg: string) => {
    // FORCE UI UPDATE: Switch to chat mode so user sees the "Auto-Fixing..." message and result
    setViewMode('chat');
    setLeftPanelMode('chat');
    
    const fixPrompt = `Fix syntax error: ${errorMsg}`;
    setMessages(prev => [...prev, { role: 'user', content: `Auto-Fixing Error: ${errorMsg.slice(0, 50)}...` }]);
    setIsLoading(true);
    try {
        const { code: newCode, reasoning } = await generateWebsiteCode(fixPrompt, currentCode, undefined, undefined, selectedModel, genMode);
        setCurrentCode(newCode);
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Fixed error.", 
            code: newCode,
            reasoning: reasoning 
        }]);
        await saveToDatabase(newCode, "Auto-Fix");
    } catch (error: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Fix failed: ${error.message}`, isError: true }]);
    } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!currentCode || !session) return;
    try {
        await saveToDatabase(currentCode, "Manual Save");
        showModal("Saved", "Project saved.", "success");
    } catch (err: any) { showModal("Error", "Save failed.", "error"); }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(currentCode);
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
                        <CodeMirror value={currentCode} height="100%" extensions={[javascript({ jsx: true })]} theme={vscodeDark} onChange={(value) => setCurrentCode(value)} className="text-sm h-full" />
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
                    {isLoading && <div className="text-xs text-gray-400 p-4">Processing...</div>}
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
                                     <span>{selectedModel === 'gemini-3-flash-preview' ? 'Flash 3.0' : selectedModel === 'gemini-3-pro-preview' ? 'Pro 3.0' : 'Mimo V2 Flash'}</span>
                                     <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                                 </button>
                                 {isModelDropdownOpen && (
                                     <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 z-50 animate-fade-in ring-1 ring-black/5">
                                         <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Official (Google)</div>
                                         <button type="button" onClick={() => { setSelectedModel('gemini-3-flash-preview'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Gemini Flash 3.0 <span className="text-[10px] text-gray-400 ml-auto">Fast</span></button>
                                         <button type="button" onClick={() => { setSelectedModel('gemini-3-pro-preview'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Gemini Pro 3.0 <span className="text-[10px] text-gray-400 ml-auto">Smart</span></button>

                                         <div className="mt-1 px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 dark:border-gray-700 pt-2">Experimental (OpenRouter)</div>
                                         <button type="button" onClick={() => { setSelectedModel('mimo-v2-flash'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Mimo V2 Flash <span className="text-[10px] text-gray-400 ml-auto">Coding</span></button>
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
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14m6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                 </label>
                                 <button type="submit" disabled={(!input.trim() && !selectedImage) || isLoading} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-full hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-50 shadow-md"><ArrowUpIcon className="w-4 h-4" /></button>
                             </div>
                         </div>
                 </form>
            </div>
        </div>
        <div className={`flex-1 flex flex-col bg-gray-100 dark:bg-black overflow-hidden relative transition-all duration-500 ${viewMode === 'preview' ? 'opacity-100 translate-x-0 h-full' : 'hidden lg:flex opacity-0 lg:opacity-100 translate-x-full lg:translate-x-0 absolute lg:relative inset-0'}`}>
            <div className="flex-1 p-0 lg:p-6 flex flex-col h-full overflow-hidden pb-24 lg:pb-6">
                <div className="w-full h-full bg-white lg:rounded-xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden flex flex-col ring-1 ring-black/5">
                     <div className="h-12 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between shrink-0">
                        <div className="flex space-x-2"><div className="w-3 h-3 rounded-full bg-red-400/80"></div><div className="w-3 h-3 rounded-full bg-yellow-400/80"></div><div className="w-3 h-3 rounded-full bg-green-400/80"></div></div>
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
      {isFullscreen && currentCode && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md p-0 flex items-center justify-center animate-fade-in">
           <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 z-[101] bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition text-white"><MinimizeIcon className="h-6 w-6" /></button>
          <div className="w-full h-full"><WebsitePreview code={currentCode} onFixError={handleAutoFix} /></div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [genMode, setGenMode] = useState<GeneratorMode>('website');
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Generator State
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [generatorCode, setGeneratorCode] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);

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
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
         loadUserProfile(session.user.id);
         setCurrentPage('dashboard'); // Default to dashboard on login
      }
    });

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          loadUserProfile(session.user.id);
      } else {
          setUserProfile(null);
          setCurrentPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setSession(null);
      setCurrentPage('landing');
      setGeneratorCode('');
      setGeneratorPrompt('');
      setCurrentProjectId(undefined);
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
      await updateUserCredits(session.user.id, newCredits);
      return true;
  };

  const handleStartBuild = (prompt: string) => {
      if (!session) {
          setCurrentPage('auth');
          return;
      }
      setGeneratorPrompt(prompt);
      setGeneratorCode('');
      setCurrentProjectId(undefined);
      setCurrentPage('generator');
  };

  const handleOpenProject = (code: string, prompt: string, id: string) => {
      setGeneratorCode(code);
      setGeneratorPrompt(prompt);
      setCurrentProjectId(id);
      setCurrentPage('generator');
  };
  
  const handleUpdateProject = (code: string, prompt: string, id: string) => {
      setGeneratorCode(code);
      setGeneratorPrompt(prompt);
      setCurrentProjectId(id);
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
      switch (currentPage) {
          case 'landing': 
              return <LandingPageContent onNavigate={setCurrentPage} session={session} onStartBuild={handleStartBuild} />;
          case 'auth':
              return <Auth />;
          case 'dashboard':
              return <Dashboard onSelectProject={handleOpenProject} onCreateNew={() => { setGeneratorCode(''); setGeneratorPrompt(''); setCurrentProjectId(undefined); setCurrentPage('generator'); }} user={session?.user} confirmDelete={confirmDeleteProject} />;
          case 'generator':
              return <GeneratorContent 
                        session={session}
                        initialPrompt={generatorPrompt}
                        initialCode={generatorCode}
                        initialProjectId={currentProjectId}
                        onUpdateProject={handleUpdateProject}
                        genMode={genMode}
                        userProfile={userProfile}
                        onDeductCredit={handleDeductCredit}
                        onNavigate={setCurrentPage}
                        showModal={showModal}
                        isSidebarOpen={isSidebarOpen}
                     />;
          case 'pricing':
              return <Pricing onUpgrade={() => showModal("Info", "Payment integration coming soon.", "info")} currentTier={userProfile?.tier} onNavigate={setCurrentPage} />;
          case 'admin':
              return <Admin currentUser={session?.user} onNavigate={setCurrentPage} showModal={showModal} />;
          default:
              return <LandingPageContent onNavigate={setCurrentPage} session={session} onStartBuild={handleStartBuild} />;
      }
  };

  const showSidebar = currentPage !== 'landing' && currentPage !== 'auth';

  return (
      <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
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
        
        <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ${showSidebar && !isSidebarOpen ? 'w-full' : ''}`}>
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
