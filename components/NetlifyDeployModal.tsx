
import React, { useState, useEffect } from 'react';
import { deployToNetlify } from '../services/netlifyService';
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
  projectId?: string;
  existingNetlifySiteId?: string | null;
  onSuccess: (deploymentDetails: { netlifySiteId: string, netlifyDeploymentUrl: string }) => void;
  netlifyAccessToken: string | null;
}

const NetlifyDeployModal: React.FC<NetlifyDeployModalProps> = ({
  isOpen,
  onClose,
  codeToDeploy,
  projectName,
  existingNetlifySiteId,
  onSuccess,
  netlifyAccessToken
}) => {
  const [currentProjectName, setCurrentProjectName] = useState(projectName.toLowerCase());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  useEffect(() => {
    setCurrentProjectName(projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100));
  }, [projectName, isOpen]);

  const handleDeploy = async () => {
    if (!netlifyAccessToken) {
      setError('Please connect to Netlify to deploy.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDeploymentUrl(null);

    try {
      const finalHtml = createPreviewHtml(codeToDeploy);
      const { siteId: newSiteId, deploymentUrl: newDeploymentUrl } = await deployToNetlify(
        finalHtml,
        netlifyAccessToken,
        currentProjectName,
        existingNetlifySiteId
      );

      setDeploymentUrl(newDeploymentUrl);
      onSuccess({
        netlifySiteId: newSiteId,
        netlifyDeploymentUrl: newDeploymentUrl,
      });

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const redirectUri = `${supabaseUrl}/functions/v1/netlify-oauth-callback`;

  const handleConnect = () => {
    const clientId = import.meta.env.VITE_NETLIFY_CLIENT_ID;
    if (!clientId || !supabaseUrl) {
      setError('Configuration Error: Environment variables VITE_NETLIFY_CLIENT_ID and VITE_SUPABASE_URL must be set.');
      return;
    }
    const oauthUrl = `https://app.netlify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
    window.location.href = oauthUrl;
  };

  const resetState = () => {
    if (!deploymentUrl) {
      setError(null);
    }
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
              ? 'This will redeploy your existing project with the latest changes.'
              : 'Connect to Netlify to deploy this project for the first time.'}
          </p>

          {deploymentUrl ? (
            <div className="text-center bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <h3 className="font-bold text-green-800 dark:text-green-300">Deployment Successful!</h3>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 mb-4">Your website is now live.</p>
                <a
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    {deploymentUrl}
                    <ExternalLinkIcon className="w-4 h-4" />
                </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 ml-1">Project Name</label>
                <input
                  id="projectName"
                  type="text"
                  value={currentProjectName}
                  onChange={(e) => setCurrentProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100))}
                  placeholder="my-awesome-project"
                  className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>
              {!netlifyAccessToken && (
                <button
                  onClick={handleConnect}
                  className="w-full px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center justify-center gap-2"
                >
                  Connect to Netlify
                </button>
                <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="font-bold uppercase tracking-wider mb-1">Required Redirect URI</p>
                  <p className="font-mono break-all">{redirectUri}</p>
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex justify-end items-center gap-3 rounded-b-2xl border-t border-gray-100 dark:border-gray-800">
          <button onClick={resetState} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition">
            {deploymentUrl ? 'Close' : 'Cancel'}
          </button>
          {!deploymentUrl && (
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
