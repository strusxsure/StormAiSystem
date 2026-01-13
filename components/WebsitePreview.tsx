
import React, { useEffect, useState, useRef } from 'react';
import { createPreviewHtml } from '../utils/html';

interface WebsitePreviewProps {
  code: string;
  onFixError?: (error: string) => void;
  currentPage: string;
  onNavigate: (path: string) => void;
}

const ReloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
);
const MaximizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
);
const MinimizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
);

const WebsitePreview: React.FC<WebsitePreviewProps> = ({ code, onFixError, currentPage, onNavigate }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    setIframeKey(prev => prev + 1);
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (!event.data) return;
        if (event.data.type === 'FIX_CODE_ERROR' && onFixError) {
            onFixError(event.data.error);
        }
        if (event.data.type === 'NAVIGATE') {
            onNavigate(event.data.path);
        }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onFixError, onNavigate]);

  const htmlContent = createPreviewHtml(code);

  return (
    <div ref={containerRef} className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden relative group">
      <iframe
        key={iframeKey}
        ref={iframeRef}
        srcDoc={htmlContent}
        title="Website Preview"
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

export default WebsitePreview;
