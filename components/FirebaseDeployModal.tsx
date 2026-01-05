
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { WebsiteRecord } from '../services/firebaseClient';
import { functions } from '../services/firebaseClient';

// TYPES
type DeployStatus = 'idle' | 'connecting' | 'fetching' | 'deploying' | 'success' | 'error';
interface FirebaseProject {
    id: string;
    name: string;
}

// ICONS
const FirebaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.15 8.37l-1.01-6.1c-.05-.3-.29-.53-.59-.53h-3.41c-.29 0-.54.22-.59.52L11.52 8.4c.04.22.25.39.48.39h2.3c.23 0 .44-.17.48-.39l.23-1.42h.01c.11.83.45 2.16.65 2.7l.21.56c.11.28.38.46.68.46h1.06c.39 0 .7-.34.63-.73zM12.04 8.78h-1.5c-.3 0-.57-.22-.63-.52L8.27 2.74c-.05-.3-.29-.52-.59-.52H4.27c-.29 0-.54.22-.59.52L2.6 8.37c-.07.39.24.73.63.73h1.06c.3 0 .57-.18.68-.46l.32-.82c.2-.54.55-1.87.65-2.7h.01l.23 1.42c.04.22.25.39.48.39h2.3c.23 0 .43-.17.48-.39l1.02-6.07 1.05 6.09zM20.75 9.87h-4.3c-.39 0-.71.33-.63.72l2.12 9.71c.08.35.39.6.75.6h.47c.36 0 .67-.25.75-.6l2.12-9.71c.08-.39-.24-.72-.63-.72z"></path></svg>
);
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.3v2.84C4.01 20.48 7.72 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.3C1.47 8.88 1 10.4 1 12s.47 3.12 1.3 4.93l3.54-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.72 1 4.01 3.52 2.3 6.85l3.54 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"></path></svg>
);


interface FirebaseDeployModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Partial<WebsiteRecord>;
    showModal: (title: string, message: string, type: 'info' | 'error' | 'success') => void;
    onSuccess: (deploymentDetails: { deploymentUrl: string }) => void;
    session: any; // Firebase user session
    userProfile: any; // User profile from Firestore
}

const FirebaseDeployModal: React.FC<FirebaseDeployModalProps> = ({ isOpen, onClose, project, showModal, onSuccess, session, userProfile }) => {
    const [status, setStatus] = useState<DeployStatus>('idle');
    const [projects, setProjects] = useState<FirebaseProject[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [deploymentUrl, setDeploymentUrl] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            // Reset state every time the modal opens
            setStatus('idle');
            setProjects([]);
            setSelectedProject('');
            setError('');
            // Check if user has a refresh token. If so, fetch projects.
            if (userProfile?.firebase_refresh_token) {
                fetchProjects();
            }
        }
    }, [isOpen, userProfile]);

    const handleConnect = () => {
        setStatus('connecting');
        const authUrl = `https://us-central1-stormm.cloudfunctions.net/auth?userId=${session.uid}`;
        window.open(authUrl, '_blank');
        showModal("Redirecting", "Please complete the Firebase connection in the new tab. You may need to refresh the app after.", "info");
    };

    const fetchProjects = async () => {
        setStatus('fetching');
        setError('');
        try {
            const getProjects = functions.httpsCallable('getFirebaseProjects');
            const result = await getProjects();
            setProjects(result.data as FirebaseProject[]);
            setStatus('idle');
        } catch (err: any) {
            setError('Could not fetch projects. Please try reconnecting.');
            setStatus('error');
            console.error(err);
        }
    };

    const handleDeploy = async () => {
        if (!selectedProject || !project.code) {
            setError('Please select a project to deploy to.');
            return;
        }
        setStatus('deploying');
        setError('');
        try {
            const deploy = functions.httpsCallable('deployToFirebase');
            const result = await deploy({ projectId: selectedProject, htmlContent: project.code });
            const { deploymentUrl: newUrl } = result.data as { deploymentUrl: string };
            setDeploymentUrl(newUrl);
            onSuccess({ deploymentUrl: newUrl });
            setStatus('success');

        } catch (err: any) {
            setError(`Deployment failed: ${err.message}`);
            setStatus('error');
        }
    };

    const renderContent = () => {
        if (error) {
             return (
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={handleConnect} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
                        Reconnect Firebase
                    </button>
                </div>
            );
        }
        if (status === 'success') {
            return (
                <div className="text-center">
                    <h3 className="text-xl font-bold text-green-500 mb-2">Deployment Successful!</h3>
                    <p className="text-gray-500 mb-4">Your website is live.</p>
                    <a href={deploymentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                         {deploymentUrl}
                    </a>
                </div>
            );
        }

        if (projects.length > 0) {
            return (
                <>
                    <p className="text-sm text-gray-600 mb-4">Select a Firebase project to deploy your website to.</p>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg mb-4 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="" disabled>-- Select a Project --</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                        ))}
                    </select>
                    <button
                        onClick={handleDeploy}
                        disabled={status === 'deploying' || !selectedProject}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                         {status === 'deploying' ? 'Deploying...' : 'Deploy to Firebase'}
                    </button>
                </>
            );
        }

        return (
            <div className="text-center">
                 <p className="text-sm text-gray-600 mb-6">Allow StormAi to deploy websites to your personal Firebase account.</p>
                 <button onClick={handleConnect} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors">
                     <GoogleIcon className="w-5 h-5"/>
                     Connect with Google
                 </button>
            </div>
        );
    };


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Deploy to Firebase"
            type="info"
        >
           <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <FirebaseIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                 <h3 className="font-bold text-gray-900">{project.name || 'New Project'}</h3>
                 <p className="text-xs text-gray-500">Deploy this project to your own Firebase Hosting.</p>
              </div>
           </div>

           {renderContent()}

           <p className="text-center text-xs text-gray-400 mt-6">
               By connecting, you allow StormAi to manage your Firebase Hosting projects. This does not grant access to other Google services.
           </p>
        </Modal>
    );
};

export default FirebaseDeployModal;
