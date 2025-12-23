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
  user: any; 
  confirmDelete: (id: string, callback: (id: string) => Promise<void>) => void; // Using Modal
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject, onCreateNew, user, confirmDelete }) => {
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
      // We show a friendlier error message if it's likely a missing table issue
      if (err.message?.includes('relation "websites" does not exist')) {
           setError("Database not set up. Please create a 'websites' table in Supabase.");
      } else {
           setError(err.message || "Failed to load projects.");
      }
    } finally {
      setLoading(false);
    }
  };

  // The actual delete logic to be called by the Modal
  const performDelete = async (project_id: string) => {
    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('project_id', project_id)
        .eq('user_id', user.id); 

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.project_id !== project_id));
    } catch (err: any) {
      console.error("Delete error details:", err);
      throw new Error(err.message || "Could not delete project from database.");
    }
  };

  const handleDeleteRequest = (project_id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      // Open the stylish modal instead of window.confirm
      confirmDelete(project_id, performDelete);
  };

  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark pt-10 pb-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative font-sans">
      {/* Shared Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-200/20 dark:bg-yellow-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-2">Your Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Manage your AI-generated masterpieces.</p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={onCreateNew}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 flex items-center"
            >
                <BoltIcon className="mr-2" />
                Create New Website
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3].map(i => (
               <div key={i} className="h-64 bg-surface-light dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark p-6 flex flex-col justify-between">
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                    <div className="text-center text-xs text-gray-400 font-medium animate-pulse mt-4">
                        Loading your creative space...
                    </div>
               </div>
             ))}
          </div>
        ) : error ? (
           <div className="text-center py-20 bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-border-light dark:border-border-dark">
             <p className="text-red-500 mb-2 font-medium">{error}</p>
             <button onClick={fetchProjects} className="text-primary underline font-semibold">Try Again</button>
           </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-32 bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-border-light dark:border-border-dark flex flex-col items-center">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <BoltIcon className="w-10 h-10 text-primary" />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No projects yet</h3>
             <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">You haven't generated any websites yet. Start your journey by creating your first AI website.</p>
             <button onClick={onCreateNew} className="text-primary font-semibold hover:text-amber-600 dark:hover:text-amber-400">Start Building &rarr;</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div 
                key={project.project_id}
                onClick={() => onSelectProject(project.code, project.prompt, project.project_id)}
                className="group bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm hover:shadow-2xl dark:shadow-none transition-all duration-300 border border-border-light dark:border-border-dark overflow-hidden cursor-pointer flex flex-col h-full hover:-translate-y-1 relative hover:border-primary/50 dark:hover:border-primary/50"
              >
                {/* Live Thumbnail Preview */}
                <div className="h-48 bg-gray-100 dark:bg-gray-900 relative overflow-hidden group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition border-b border-border-light dark:border-border-dark">
                    <div className="absolute inset-0 pointer-events-none transform origin-top-left scale-[0.25] w-[400%] h-[400%] bg-white dark:bg-gray-900">
                        <WebsitePreview code={project.code} />
                    </div>
                    {/* Interaction Shield */}
                    <div className="absolute inset-0 bg-transparent z-10"></div>
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/10 dark:bg-black/30 z-20 backdrop-blur-[1px]">
                        <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center text-sm transform scale-105 border border-gray-200 dark:border-gray-700">
                            <EyeIcon className="w-4 h-4 mr-2"/>
                            View Project
                        </span>
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 capitalize">{project.prompt.split(' ').slice(0, 5).join(' ') || "Untitled Project"}...</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">{project.prompt}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-border-light dark:border-border-dark mt-auto">
                    <span className="text-xs text-gray-400 font-medium">
                        {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <button 
                        onClick={(e) => handleDeleteRequest(project.project_id, e)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full z-30 relative"
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