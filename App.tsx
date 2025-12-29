
import React, { useState, useEffect, useRef } from 'react';
import { useScrollObserver } from './hooks/useScrollObserver';
import { generateWebsiteCode, generateWebsitePlan } from './services/geminiService';
import { supabase, UserProfile, getUserProfile, updateUserCredits } from './services/supabaseClient';
import WebsitePreview from './components/WebsitePreview';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';
import Admin from './components/Admin';
import Chat from './components/Chat';
import NewLandingPage from './components/NewLandingPage';
import Modal from './components/Modal';
import LoadingAnimation from './components/LoadingAnimation';
import ErrorBoundary from './components/ErrorBoundary';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

// TYPES
type Page = 'landing' | 'auth' | 'dashboard' | 'generator' | 'pricing' | 'admin' | 'chat';
type ViewMode = 'chat' | 'preview';
type GeneratorMode = 'website' | 'ui';
type LeftPanelMode = 'chat' | 'code';
// Replaced gemma-3-12b with mimo-v2-flash
type ModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'mimo-v2-flash' | 'z-ai/glm-4.5-air' | 'devetral' | 'nvidia/nemotron-3-nano-30b-a3b:free';

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
             <NavItem
                icon={ChatIcon}
                label="Chat with Models"
                active={currentPage === 'chat'}
                onClick={() => handleNavigate('chat')}
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
             {['strusop6@gmail.com', 'riyyanbhai7@gmail.com'].includes(session?.user?.email) && (
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



// GENERATOR WORKSPACE
interface WebsiteRecord {
    id: string;
    user_id: string;
    name: string;
    prompt: string;
    code: string;
    created_at: string;
}
interface GeneratorContentProps {
  session: any;
  initialProject?: Partial<WebsiteRecord>; // Use a more comprehensive initial project object
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

    // Merge new data with current project state
    const dataToSave = { ...project, ...updatedProjectData };

    try {
        let savedRecord: WebsiteRecord;
        if (dataToSave.id) {
            const { data, error } = await supabase.from('websites').update({
                name: dataToSave.name,
                prompt: dataToSave.prompt?.slice(0, 200),
                code: dataToSave.code,
            }).eq('id', dataToSave.id).select().single();
            if (error) throw error;
            savedRecord = data;
        } else {
            const { data, error } = await supabase.from('websites').insert({
                user_id: session.user.id,
                name: dataToSave.name || 'Untitled Project',
                prompt: dataToSave.prompt?.slice(0, 200),
                code: dataToSave.code
            }).select().single();
            if (error) throw error;
            savedRecord = data;
        }

        setProject(savedRecord); // Update local state with the saved record
        if (onUpdateProject) onUpdateProject(savedRecord);

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
                                         'NVIDIA Nemotron 3'}
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
                                         <button type="button" onClick={() => { setSelectedModel('nvidia/nemotron-3-nano-30b-a3b:free'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> NVIDIA Nemotron 3 <span className="text-[10px] text-gray-400 ml-auto">Powerful</span></button>
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
                           <button title="Deploy to Vercel" onClick={() => setIsDeployModalOpen(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><UploadCloudIcon className="w-4 h-4"/></button>
                           <button title="Save Project" onClick={handleSave} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><SaveIcon className="w-4 h-4"/></button>
                           <button title="Copy Code" onClick={copyToClipboard} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><CopyIcon className="w-4 h-4"/></button>
                           <button title="Toggle Fullscreen" onClick={() => setIsFullscreen(!isFullscreen)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hidden lg:block"><ExpandIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                    <div className="flex-1 bg-white relative">
                        {project.code ? <WebsitePreview code={project.code} onFixError={handleAutoFix} /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">Waiting...</div>}
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
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
         loadUserProfile(session.user.id);
         setCurrentPage('dashboard'); // Default to dashboard on login
      }
    });

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await loadUserProfile(session.user.id);
        if (currentPage !== 'generator') { // Avoid disrupting active generation
            setCurrentPage('dashboard');
        }
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
      await updateUserCredits(session.user.id, newCredits);
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
      switch (currentPage) {
          case 'landing': 
              return <NewLandingPage onNavigate={setCurrentPage} session={session} onStartBuild={handleStartBuild} />;
          case 'auth':
              return <Auth />;
          case 'dashboard':
              return <ErrorBoundary><Dashboard onSelectProject={handleOpenProject} onCreateNew={() => { setCurrentProject(undefined); setCurrentPage('generator'); }} user={session?.user} confirmDelete={confirmDeleteProject} genMode={genMode} /></ErrorBoundary>;
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
              return <Admin currentUser={session?.user} onNavigate={setCurrentPage} showModal={showModal} />;
          case 'chat':
              return <Chat
                        userProfile={userProfile}
                        session={session}
                        showModal={(title, message, type) => showModal(title, message, type)}
                        onDeductCredit={handleDeductCredit}
                     />;
          default:
              return <NewLandingPage onNavigate={setCurrentPage} session={session} onStartBuild={handleStartBuild} />;
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
