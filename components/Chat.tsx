
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../services/supabaseClient';
import { generateChatResponse } from '../services/geminiService'; // This function will be created in the next step

// Re-using types from App.tsx for consistency
type ModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'mimo-v2-flash' | 'z-ai/glm-4.5-air' | 'devetral' | 'nvidia/nemotron-3-nano-30b-a3b:free';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Re-using icons from App.tsx
const ZapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
);
const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
);
const LoadingAnimation: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse-fast"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse-medium"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse-slow"></div>
    </div>
);


interface ChatProps {
    userProfile: UserProfile | null;
    session: any;
    showModal: (title: string, message: string, type: 'info' | 'error' | 'success') => void;
    onDeductCredit: () => Promise<boolean>;
}

const Chat: React.FC<ChatProps> = ({ userProfile, session, showModal, onDeductCredit }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hello! How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ModelType>('mimo-v2-flash');
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (userProfile && userProfile.credits <= 0 && userProfile.tier === 'free') {
            showModal("Out of Credits", "You have 0 credits left. Upgrade to Pro for more generations.", "error");
            return;
        }

        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // This service function doesn't exist yet, we'll create it next.
            const response = await generateChatResponse(newMessages, selectedModel);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            await onDeductCredit();
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, something went wrong: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h1 className="text-xl font-bold">Chat with Models</h1>
                {/* Model Selector Dropdown */}
                 <div className="relative">
                     <button type="button" onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors">
                         <ZapIcon className="w-4 h-4 text-amber-500" />
                         <span>
                            {selectedModel === 'gemini-3-flash-preview' ? 'Gemini Flash 3.0' :
                             selectedModel === 'gemini-3-pro-preview' ? 'Gemini Pro 3.0' :
                             selectedModel === 'mimo-v2-flash' ? 'Mimo V2 Flash' :
                             selectedModel === 'z-ai/glm-4.5-air' ? 'GLM 4.5 Air' :
                             selectedModel === 'devetral' ? 'Devetral' :
                             'NVIDIA Nemotron 3'}
                         </span>
                         <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                     </button>
                     {isModelDropdownOpen && (
                         <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 z-50">
                             {/* Pro Models */}
                             <button
                                type="button"
                                onClick={() => { if (userProfile?.tier !== 'free') { setSelectedModel('gemini-3-pro-preview'); setIsModelDropdownOpen(false); } }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${userProfile?.tier === 'free' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                disabled={userProfile?.tier === 'free'}
                             > Gemini Pro 3.0 <span className="text-xs text-gray-400 ml-auto">Pro</span></button>
                             {/* Free Models */}
                             <button type="button" onClick={() => { setSelectedModel('mimo-v2-flash'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Mimo V2 Flash</button>
                             <button type="button" onClick={() => { setSelectedModel('nvidia/nemotron-3-nano-30b-a3b:free'); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">NVIDIA Nemotron 3</button>
                             {/* Add other models as needed */}
                         </div>
                     )}
                 </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                           <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm bg-gray-100 dark:bg-gray-800">
                           <LoadingAnimation />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <form onSubmit={handleSendMessage} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-amber-500 outline-none ring-0 resize-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 py-3 pl-4 pr-12 rounded-xl"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-lg hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-50">
                        <ArrowUpIcon className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
