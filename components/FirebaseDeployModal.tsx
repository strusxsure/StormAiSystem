
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
// We will create the firebaseService later
import { deployToFirebase } from '../services/firebaseService';

interface FirebaseDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeToDeploy: string;
  projectName: string;
  existingFirebaseProjectId?: string | null;
  onSuccess: (deploymentDetails: { firebaseProjectId: string, firebaseDeploymentUrl: string, firebaseApiToken: string }) => void;
  existingFirebaseApiToken?: string | null;
}

const FirebaseDeployModal: React.FC<FirebaseDeployModalProps> = ({
  isOpen,
  onClose,
  codeToDeploy,
  projectName,
  existingFirebaseProjectId,
  onSuccess,
  existingFirebaseApiToken,
}) => {
  const [projectId, setProjectId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectId(existingFirebaseProjectId || '');
      setApiToken(existingFirebaseApiToken || '');
      setError(null);
      setDeploymentUrl(null);
      setIsDeploying(false);
    }
  }, [isOpen, existingFirebaseProjectId, existingFirebaseApiToken]);

  const handleDeploy = async () => {
    if (!apiToken.trim() || !projectId.trim()) {
      setError('Firebase Project ID and Access Token are required.');
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeploymentUrl(null);

    try {
      const result = await deployToFirebase(codeToDeploy, apiToken, projectId);

      setDeploymentUrl(result.deploymentUrl);
      onSuccess({
        firebaseProjectId: projectId,
        firebaseDeploymentUrl: result.deploymentUrl,
        firebaseApiToken: apiToken,
      });
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsDeploying(false);
    }
  };

  const isExistingProject = !!existingFirebaseProjectId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExistingProject ? "Redeploy to Firebase" : "Deploy to Firebase"}
      className="max-w-xl"
    >
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <p className="text-sm">
          {isExistingProject
            ? 'This project is linked to a Firebase project. Any new saves will automatically redeploy.'
            : 'Deploy your generated website to Firebase Hosting to share it with the world.'}
        </p>

        {!isExistingProject && (
           <>
            <div className="space-y-2">
              <label htmlFor="firebase-project-id" className="text-sm font-medium">
                Firebase Project ID
              </label>
              <input
                id="firebase-project-id"
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g., my-awesome-project"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="firebase-api-token" className="text-sm font-medium">
                Firebase CI Access Token
              </label>
              <input
                id="firebase-api-token"
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Enter your Firebase access token"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                You can generate a new token by running{' '}
                <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded">firebase login:ci</code> in your terminal. {' '}
                <a href="https://firebase.google.com/docs/cli#login_and_test_with_a_service_account" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Learn more.
                </a>
              </p>
            </div>
           </>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {deploymentUrl && (
          <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">
            <p>
              <strong>Success!</strong> Your site is live at:{' '}
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
            disabled={isDeploying || (isExistingProject && !apiToken)}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying...
              </>
            ) : (isExistingProject ? 'Redeploy' : 'Deploy')}
          </button>
        )}
      </div>
    </Modal>
  );
};

export default FirebaseDeployModal;
