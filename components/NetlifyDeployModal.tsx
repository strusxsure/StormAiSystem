
import React, { useState, useEffect } from 'react';
import { deployToNetlify } from '../services/api';
import { createPreviewHtml } from '../utils/html';

const UploadCloudIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V12a4 4 0 01-4 4h-5m-4-4h12"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12v9m-4-4l4 4 4-4"></path></svg>
);

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
);

interface NetlifyDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeToDeploy: string;
  projectName: string;
  existingNetlifySiteId?: string | null;
  existingNetlifyUrl?: string | null;
  onSuccess: (deploymentDetails: { netlifyDeploymentUrl: string, netlifySiteId: string }) => void;
}

const NetlifyDeployModal: React.FC<NetlifyDeployModalProps> = ({
  isOpen,
  onClose,
  codeToDeploy,
  existingNetlifySiteId,
  existingNetlifyUrl,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // This state now tracks the result of a NEW deployment action
  const [newDeploymentUrl, setNewDeploymentUrl] = useState<string | null>(null);

  // Determine which URL to display: the new one if it exists, otherwise the existing one.
  const displayUrl = newDeploymentUrl || existingNetlifyUrl;

  useEffect(() => {
    // Reset state when the modal opens
    if (isOpen) {
        setIsLoading(false);
        setError(null);
        setNewDeploymentUrl(null);
    }
  }, [isOpen]);

  const handleDeploy = async () => {
    setIsLoading(true);
    setError(null);
    setDeploymentUrl(null);

    try {
      const finalHtml = createPreviewHtml(codeToDeploy);
      const { url, siteId } = await deployToNetlify(finalHtml, existingNetlifySiteId);
      setDeploymentUrl(url);
      onSuccess({ netlifyDeploymentUrl: url, netlifySiteId: siteId });
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md border border-border-light dark:border-border-dark">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Deploy to Netlify</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {existingNetlifySiteId
              ? 'This project is live. Any changes you save will be automatically redeployed.'
              : 'Your website will be deployed to a unique URL on Netlify.'}
          </p>

          {displayUrl ? (
            <div className="text-center bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
              <h3 className="font-bold text-green-800 dark:text-green-300">{newDeploymentUrl ? 'Deployment Successful!' : 'Your Site is Live!'}</h3>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 mb-4">
                {newDeploymentUrl ? 'Your website is now live.' : 'Changes will be deployed automatically when you save.'}
              </p>
              <a
                href={displayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {displayUrl}
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>
          ) : (
             <div className="text-center p-6 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click the button below to deploy your project.
                 </p>
             </div>
          )}
           {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex justify-end items-center gap-3 rounded-b-2xl border-t border-gray-100 dark:border-gray-800">
          <button onClick={resetState} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition">
            {displayUrl ? 'Close' : 'Cancel'}
          </button>
          {!displayUrl && (
            <button
              onClick={handleDeploy}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition flex items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                 <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Deploying...</span>
                 </>
              ) : (
                <>
                    <UploadCloudIcon className="w-4 h-4" />
                    <span>Deploy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetlifyDeployModal;
