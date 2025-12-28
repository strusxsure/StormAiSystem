
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
// We will create the githubService later
import { deployToGithub } from '../services/githubService';

interface GithubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeToDeploy: string;
  onSuccess: (deploymentDetails: { repoName: string }) => void;
  existingRepoName?: string | null;
  session: any; // Supabase session object
}

const GithubDeployModal: React.FC<GithubDeployModalProps> = ({
  isOpen,
  onClose,
  codeToDeploy,
  onSuccess,
  existingRepoName,
  session,
}) => {
  const [repoName, setRepoName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRepoName(existingRepoName || '');
      setError(null);
      setDeploymentUrl(null);
      setIsDeploying(false);
    }
  }, [isOpen, existingRepoName]);

  const handleDeploy = async () => {
    if (!repoName.trim()) {
      setError('GitHub repository name is required.');
      return;
    }
     if (!session?.provider_token) {
      setError('Not authenticated with GitHub or token is missing. Please reconnect.');
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeploymentUrl(null);

    try {
      await deployToGithub(codeToDeploy, repoName, session.provider_token);

      const ghPagesUrl = `https://${repoName.split('/')[0]}.github.io/${repoName.split('/')[1]}`;
      setDeploymentUrl(ghPagesUrl);
      onSuccess({ repoName });

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsDeploying(false);
    }
  };

  const isExistingProject = !!existingRepoName;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExistingProject ? "Redeploy to GitHub" : "Deploy to GitHub"}
      className="max-w-xl"
    >
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <p className="text-sm">
          {isExistingProject
            ? 'This project is linked to a GitHub repository. Any new saves will automatically redeploy.'
            : 'Push your generated website to a GitHub repository. You can then connect a hosting service like Netlify or Vercel to auto-deploy from there.'}
        </p>

        <div className="space-y-2">
          <label htmlFor="github-repo-name" className="text-sm font-medium">
            GitHub Repository Name
          </label>
          <input
            id="github-repo-name"
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="e.g., your-username/your-repo-name"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isExistingProject}
          />
           <p className="text-xs text-gray-500">
              The repository must already exist. The app will commit the `index.html` file to the main branch.
            </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {deploymentUrl && (
          <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">
            <p>
              <strong>Success!</strong> Your code has been pushed to GitHub.
            </p>
             <p className="text-xs mt-1">
              To make it a live website, enable GitHub Pages in your repository settings or connect it to a hosting provider. A common URL structure is:{' '}
              <a href={deploymentUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                {deploymentUrl}
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end items-center gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {deploymentUrl ? 'Close' : 'Cancel'}
        </button>
        {!deploymentUrl && (
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="px-6 py-2 text-sm font-bold text-white bg-gray-800 rounded-lg hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying...
              </>
            ) : (isExistingProject ? 'Redeploy' : 'Deploy to GitHub')}
          </button>
        )}
      </div>
    </Modal>
  );
};

export default GithubDeployModal;
