
import React from 'react';
import { AnalysisResult } from '../types';

interface AnalysisViewProps {
  analysis: AnalysisResult;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => {
  return (
    <div className="p-8 sm:p-10 space-y-10 animate-fade-in bg-white/40">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 space-y-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">AI 肖像深度分析</h3>
          </div>
          <p className="text-slate-700 text-lg font-semibold leading-relaxed">
            {analysis.summary}
          </p>
        </div>
        
        <div className="w-full md:w-80 bg-white/60 rounded-3xl p-6 border border-white shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">核心标签</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 bg-blue-50/80 text-blue-600 rounded-xl text-xs font-bold border border-blue-100/50">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
            核心竞争优势
          </h4>
          <ul className="space-y-4">
            {analysis.strengths.map((str, i) => (
              <li key={i} className="flex items-start text-sm text-slate-600 leading-relaxed font-medium">
                <span className="text-blue-500 mr-3 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </span>
                {str}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></span>
            匹配岗位关键词
          </h4>
          <div className="flex flex-wrap gap-3">
            {analysis.suggestedRoles.map((role, i) => (
              <span key={i} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold border border-slate-200/50">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
