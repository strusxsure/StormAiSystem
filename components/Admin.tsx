import React, { useState, useEffect } from 'react';
import { supabase, UserProfile, getAllProfiles, updateUserCredits } from '../services/supabaseClient';

interface AdminProps {
  currentUser: any;
  onNavigate: (page: any) => void;
  showModal: (title: string, msg: string, type: any) => void;
}

const Admin: React.FC<AdminProps> = ({ currentUser, onNavigate, showModal }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // 1. Fetch Profiles from DB
    const profiles = await getAllProfiles();
    
    // 2. Fetch Emails (In a real app, this usually requires a secure server function due to RLS on auth.users)
    // For this demo, we'll try to rely on what we have or mock the emails if we can't get them.
    // If you have a 'profiles' table that stores email, this is easy.
    setUsers(profiles);
    setLoading(false);
  };

  const handleUpdateCredits = async (userId: string, currentCredits: number) => {
     const amountStr = prompt("Enter new credit amount:", currentCredits.toString());
     if (!amountStr) return;
     const amount = parseInt(amountStr);
     if (isNaN(amount)) return;

     const success = await updateUserCredits(userId, amount);
     if (success) {
         setUsers(users.map(u => u.id === userId ? { ...u, credits: amount } : u));
         showModal("Success", "Credits updated successfully.", "success");
     } else {
         showModal("Error", "Failed to update credits. Check DB permissions.", "error");
     }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
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
                             <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading users...</td></tr>
                         ) : users.length === 0 ? (
                             <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No profiles found in database.</td></tr>
                         ) : (
                             users.map(user => (
                                 <tr key={user.id} className="hover:bg-gray-50 transition">
                                     <td className="px-6 py-4 text-sm text-gray-600 font-mono">{user.id}</td>
                                     <td className="px-6 py-4 text-sm">
                                         <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.tier === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                             {user.tier}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 text-sm font-bold text-gray-900">{user.credits}</td>
                                     <td className="px-6 py-4 text-sm">
                                         <button 
                                            onClick={() => handleUpdateCredits(user.id, user.credits)}
                                            className="text-blue-600 hover:text-blue-800 font-medium mr-4"
                                         >
                                             Edit Credits
                                         </button>
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
         </div>
         <p className="mt-4 text-xs text-gray-400 text-center">
             Note: Ensure you have a 'profiles' table in Supabase with RLS policies allowing your account to read/write.
         </p>
      </div>
    </div>
  );
};

export default Admin;
