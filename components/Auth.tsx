import React, { useState } from 'react';
import {
    auth,
    githubProvider,
    discordProvider,
    signInWithPopup,
    createUserProfile
} from '../services/firebaseClient';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';

const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
);

const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
    </svg>
);


const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
);

const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
);

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await signInWithPopup(auth, githubProvider);
      // The onAuthStateChanged listener in App.tsx will handle the redirect and profile creation.

    } catch (err: any) {
      setError(err.message || "Failed to connect with GitHub.");
      if (err.code === 'auth/popup-closed-by-user') {
          setError('Sign-in process was cancelled.');
      }
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await signInWithPopup(auth, discordProvider);
      // The onAuthStateChanged listener in App.tsx will handle the redirect and profile creation.

    } catch (err: any) {
      setError(err.message || "Failed to connect with Discord.");
      if (err.code === 'auth/popup-closed-by-user') {
          setError('Sign-in process was cancelled.');
      }
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError("Please provide both email and password.");
        return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
        if (isSignUp) {
            // Sign Up
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createUserProfile(userCredential.user);
            setMessage("Signup successful! You are now logged in.");

        } else {
            // Sign In
            await signInWithEmailAndPassword(auth, email, password);
            // The onAuthStateChanged listener in App.tsx will handle the redirect.
        }
    } catch (err: any) {
        console.error("Auth Error:", err);
        setError(err.message || "An unexpected authentication error occurred.");
    } finally {
        setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Blobs similar to Landing Page */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-200/20 dark:bg-yellow-900/10 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 -z-10 opacity-60 dark:opacity-30 pointer-events-none">
            <div className="w-[120%] -ml-[10%] h-32 md:h-64 hero-gradient blur-3xl transform -rotate-3 rounded-[100%]"></div>
      </div>

      <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark rounded-3xl shadow-2xl dark:shadow-none border border-border-light dark:border-border-dark overflow-hidden relative z-10 animate-fade-in-up">
        <div className="p-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-6 transform hover:scale-105 transition duration-300">
                    <BoltIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    {isSignUp ? 'Join StormAI to start building.' : 'Sign in to access your projects.'}
                </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-start animate-fade-in">
                 <span className="mr-2 text-lg">⚠️</span> 
                 <span className="mt-0.5">{error}</span>
              </div>
            )}
             {message && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl text-sm border border-green-100 dark:border-green-900/30 flex items-start animate-fade-in">
                 <span className="mr-2 text-lg">✅</span>
                 <span className="mt-0.5">{message}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-5 mb-8">
                <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 ml-1 tracking-wider">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-amber-500 text-gray-400">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400" 
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 ml-1 tracking-wider">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-amber-500 text-gray-400">
                            <LockClosedIcon className="h-5 w-5" />
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400" 
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-shine w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <div className="flex items-center space-x-2">
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing...</span>
                        </div>
                    ) : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
            </form>

            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-surface-light dark:bg-surface-dark text-gray-500 dark:text-gray-400 font-medium">Or continue with</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
                <button 
                  onClick={handleGitHubLogin}
                  disabled={loading}
                  className="btn-shine flex items-center justify-center space-x-2 bg-[#24292F] hover:bg-[#24292F]/90 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                    <GithubIcon className="w-5 h-5" />
                    <span>Sign in with GitHub</span>
                </button>
                <button
                  onClick={handleDiscordLogin}
                  disabled={loading}
                  className="btn-shine flex items-center justify-center space-x-2 bg-[#5865F2] hover:bg-[#5865F2]/90 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                    <DiscordIcon className="w-5 h-5" />
                    <span>Sign in with Discord</span>
                </button>
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button 
                        onClick={toggleMode}
                        className="btn-shine font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition underline decoration-2 decoration-transparent hover:decoration-amber-600 underline-offset-2"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
        <div className="bg-gray-50/80 dark:bg-gray-900/50 p-4 text-center border-t border-gray-100 dark:border-gray-700 backdrop-blur-sm">
            <p className="text-xs text-gray-400">By continuing, you agree to our Terms of Service & Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
