
import React, { useState, useEffect } from 'react';

// Re-defining BoltIcon here to avoid circular dependencies from App.tsx
const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);

const loadingTexts = [
  "Brewing up a storm...",
  "Consulting the AI architects...",
  "Weaving pixels into code...",
  "Generating digital magic...",
  "Assembling the components...",
  "Finalizing the masterpiece..."
];

const LoadingAnimation: React.FC = () => {
  const [currentText, setCurrentText] = useState(loadingTexts[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(prevText => {
        const currentIndex = loadingTexts.indexOf(prevText);
        const nextIndex = (currentIndex + 1) % loadingTexts.length;
        return loadingTexts[nextIndex];
      });
    }, 2000); // Change text every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
        <div className="absolute inset-1 rounded-full bg-primary/30 animate-pulse [animation-delay:0.2s]"></div>
        <BoltIcon className="w-16 h-16 text-primary relative z-10" />
        {/* Lightning Flash Effect */}
        <div className="absolute inset-0 rounded-full bg-white dark:bg-yellow-300 opacity-0 animate-ping z-20"></div>
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-all duration-300">
        {currentText}
      </p>
    </div>
  );
};

export default LoadingAnimation;
