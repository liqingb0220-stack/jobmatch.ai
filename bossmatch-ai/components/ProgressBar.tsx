
import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  isLoading: boolean;
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ isLoading, label }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    if (isLoading) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          // Slowly slow down as we get closer to 100
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
          return prev + increment;
        });
      }, 200);
    } else {
      setProgress(100);
      const timeout = window.setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="w-full space-y-2 animate-fade-in">
      <div className="flex justify-between items-end">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-mono font-bold text-blue-600">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
