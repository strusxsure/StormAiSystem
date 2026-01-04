import React, { useState } from 'react';
import {
    auth,
    googleProvider,
    signInWithPopup,
    createUserProfile
} from '../services/firebaseClient';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider
} from 'firebase/auth';

const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.22-11.303-7.583l-6.571 4.819A20 20 0 0 0 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C43.021 36.697 44 34.01 44 31c0-5.239-2.732-9.746-6.389-10.917z"></path></svg>
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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if a profile already exists, if not, create one
      // The onAuthStateChanged listener in App.tsx will handle the redirect.

    } catch (err: any) {
      setError(err.message || "Failed to connect with Google.");
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
            // The onAuthStateChange listener in App.tsx will handle the redirect.
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
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
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
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 border border-gray-200 dark:border-gray-700"
                >
                    <GoogleIcon className="w-5 h-5" />
                    <span>Sign in with Google</span>
                </button>
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button 
                        onClick={toggleMode}
                        className="font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition underline decoration-2 decoration-transparent hover:decoration-amber-600 underline-offset-2"
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
