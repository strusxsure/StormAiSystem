import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'error' | 'success' | 'confirm';
  onConfirm?: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type = 'info', onConfirm }) => {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative z-10 overflow-hidden transform transition-all scale-100 border border-white/50">
        
        {/* Header Color Bar */}
        <div className={`h-2 w-full ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 
            type === 'confirm' ? 'bg-amber-500' : 'bg-blue-500'
        }`}></div>

        <div className="p-8 text-center">
            {/* Icon */}
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${
                type === 'error' ? 'bg-red-100 text-red-600' : 
                type === 'success' ? 'bg-green-100 text-green-600' : 
                type === 'confirm' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
            }`}>
                {type === 'error' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                {type === 'success' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                {type === 'info' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                {type === 'confirm' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {message}
            </p>

            <div className={`grid ${isConfirm ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}>
                {isConfirm && (
                    <button 
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    onClick={() => {
                        if (onConfirm) onConfirm();
                        onClose();
                    }}
                    className={`w-full py-3 px-4 text-white rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-0.5 ${
                        type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 
                        type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 
                        type === 'confirm' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-gray-900 hover:bg-black shadow-gray-500/30'
                    }`}
                >
                    {isConfirm ? 'Confirm' : 'Okay'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;