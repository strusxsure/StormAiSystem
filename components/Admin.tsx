import React, { useState, useEffect } from 'react';
// import { UserProfile } from '../services/firebaseClient'; // Import from Firebase

interface AdminProps {
  currentUser: any;
  onNavigate: (page: any) => void;
  showModal: (title: string, msg: string, type: any) => void;
}

const Admin: React.FC<AdminProps> = ({ currentUser, onNavigate, showModal }) => {
  const [users, setUsers] = useState<any[]>([]); // Using any for now
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Temporarily disabled until Firebase admin logic is implemented
    setLoading(false);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // TODO: Implement user fetching with Firebase Admin SDK on a secure backend
    showModal("Info", "User management with Firebase requires a backend with Admin SDK. This feature is temporarily disabled.", "info");
    setLoading(false);
  };

  const handleUpdateCredits = async (userId: string, currentCredits: number) => {
     // TODO: Implement credit update with Firebase Admin SDK
     showModal("Info", "Credit management requires a backend with Admin SDK.", "info");
  };

  return (
    <div className="min-h-full bg-gray-50 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
         <div className="flex justify-between items-center mb-8">
             <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
             <button onClick={() => onNavigate('dashboard')} className="text-gray-500 hover:text-gray-900 font-medium">Exit Admin</button>
         </div>

         <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b border-gray-100">
                         <tr>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User ID</th>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tier</th>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Credits</th>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {loading ? (
                             <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                         ) : users.length === 0 ? (
                             <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">User management requires server-side implementation.</td></tr>
                         ) : (
                            // This part is now disabled
                            <></>
                         )}
                     </tbody>
                 </table>
             </div>
         </div>
         <p className="mt-4 text-xs text-gray-400 text-center">
             Note: Admin functionality to manage users requires a secure backend with the Firebase Admin SDK.
         </p>
      </div>
    </div>
  );
};

export default Admin;
