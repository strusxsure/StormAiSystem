
import React, { useState } from 'react';
import Modal from './Modal';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (url: string, anonKey: string) => void;
}

const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');

  const handleConnect = () => {
    if (url && anonKey) {
      onConnect(url, anonKey);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect to Supabase"
      message="Enter your Supabase project details to connect your account."
      type="info"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="supabase-url" className="block text-sm font-medium text-gray-700">
            Project URL
          </label>
          <input
            type="text"
            id="supabase-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="https://<your-project-id>.supabase.co"
          />
        </div>
        <div>
          <label htmlFor="supabase-anon-key" className="block text-sm font-medium text-gray-700">
            Anon Key
          </label>
          <input
            type="text"
            id="supabase-anon-key"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="your-anon-key"
          />
        </div>
        <button
          onClick={handleConnect}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition"
        >
          Connect
        </button>
      </div>
    </Modal>
  );
};

export default SupabaseConnectionModal;
