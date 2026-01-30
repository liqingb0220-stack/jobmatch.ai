
import React from 'react';

export interface StepItem {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
  subText?: string;
}

interface ProcessStepsProps {
  steps: StepItem[];
}

export const ProcessSteps: React.FC<ProcessStepsProps> = ({ steps }) => {
  return (
    <div className="space-y-4 py-4">
      {steps.map((step) => (
        <div key={step.id} className="flex items-start group">
          <div className="flex flex-col items-center mr-4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              step.status === 'completed' ? 'bg-green-100 text-green-600' : 
              step.status === 'loading' ? 'bg-blue-100 text-blue-600 animate-pulse' : 
              'bg-gray-100 text-gray-400'
            }`}>
              {step.status === 'completed' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              ) : step.status === 'loading' ? (
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
              ) : (
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
              )}
            </div>
            <div className={`w-0.5 flex-grow mt-1 rounded-full ${step.status === 'completed' ? 'bg-green-200' : 'bg-gray-100'}`} style={{minHeight: '12px'}}></div>
          </div>
          <div className="pb-4">
            <p className={`text-sm font-bold transition-colors ${
              step.status === 'completed' ? 'text-gray-900' : 
              step.status === 'loading' ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {step.status === 'completed' ? '✔ ' : step.status === 'loading' ? '🔍 ' : ''}
              {step.label}
            </p>
            {step.subText && (
              <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed group-hover:text-gray-700 transition-colors">
                {step.subText}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
