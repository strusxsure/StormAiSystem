import React, { useEffect, useState } from 'react';
import { supabase, WebsiteProject } from '../services/supabaseClient';
import WebsitePreview from './WebsitePreview';

const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
);

interface DashboardProps {
  onSelectProject: (code: string, prompt: string, id: string) => void;
  onCreateNew: () => void;
  user: any; // User object passed from App
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject, onCreateNew, user }) => {
  const [projects, setProjects] = useState<WebsiteProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
        fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      // We no longer show the table missing error explicitly to the user to keep UI clean
      setError(err.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Explicitly check ownership for safety

      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Your Dashboard</h1>
            <p className="text-gray-500 text-lg">Manage your AI-generated masterpieces.</p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={onCreateNew}
                className="bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center"
            >
                <BoltIcon className="mr-2" />
                Create New Website
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3].map(i => (
               <div key={i} className="h-64 bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between">
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-32 bg-gray-100 rounded-xl"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="text-center text-xs text-gray-400 font-medium animate-pulse mt-4">
                        Loading your creative space...
                    </div>
               </div>
             ))}
          </div>
        ) : error ? (
           <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
             <p className="text-red-500 mb-2">{error}</p>
             <button onClick={fetchProjects} className="text-amber-600 underline font-semibold">Try Again</button>
           </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
             <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <BoltIcon className="w-10 h-10 text-amber-500" />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-2">No projects yet</h3>
             <p className="text-gray-500 mb-8 max-w-md">You haven't generated any websites yet. Start your journey by creating your first AI website.</p>
             <button onClick={onCreateNew} className="text-amber-600 font-semibold hover:text-amber-700">Start Building &rarr;</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => onSelectProject(project.code, project.prompt, project.id)}
                className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full hover:-translate-y-1 relative"
              >
                {/* Live Thumbnail Preview */}
                <div className="h-48 bg-gray-100 relative overflow-hidden group-hover:bg-gray-50 transition border-b border-gray-50">
                    <div className="absolute inset-0 pointer-events-none transform origin-top-left scale-[0.25] w-[400%] h-[400%] bg-white">
                        <WebsitePreview code={project.code} />
                    </div>
                    {/* Interaction Shield (prevents clicking iframe contents) */}
                    <div className="absolute inset-0 bg-transparent z-10"></div>
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/5 z-20">
                        <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center text-sm transform scale-105">
                            <EyeIcon className="w-4 h-4 mr-2"/>
                            View Project
                        </span>
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 capitalize">{project.prompt.split(' ').slice(0, 5).join(' ') || "Untitled Project"}...</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{project.prompt}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-auto">
                    <span className="text-xs text-gray-400 font-medium">
                        {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <button 
                        onClick={(e) => deleteProject(project.id, e)}
                        className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full z-30 relative"
                        title="Delete Project"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;