
import React from 'react';
import { JobMatch } from '../types';

interface JobDetailsModalProps {
  job: JobMatch | null;
  onClose: () => void;
  onOptimize: (job: JobMatch) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onOptimize }) => {
  if (!job) return null;

  // Helper to get home page URL
  const getHomePageUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}/`;
    } catch (e) {
      return url;
    }
  };

  const homePageUrl = getHomePageUrl(job.url);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-start bg-gradient-to-br from-gray-50 to-white">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">{job.title}</h3>
            <p className="text-blue-600 font-bold text-lg mt-1">{job.company}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full font-medium">
                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {job.location}
              </span>
              <span className="flex items-center bg-orange-50 px-3 py-1 rounded-full font-bold text-orange-600 border border-orange-100">
                {job.salary}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <section>
            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <span className="w-1.5 h-6 bg-blue-600 mr-3 rounded-full"></span>
              JD 核心摘要
            </h4>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 leading-relaxed text-gray-700 whitespace-pre-wrap">
              {job.jdSummary}
            </div>
          </section>

          <section>
            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <span className="w-1.5 h-6 bg-teal-500 mr-3 rounded-full"></span>
              AI 推荐深度解析
            </h4>
            <div className="space-y-4">
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                <p className="text-blue-900 font-medium leading-relaxed italic">"{job.reason}"</p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-4">
          <button 
            onClick={() => onOptimize(job)}
            className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <span>针对此岗位优化简历</span>
          </button>
          <a 
            href={homePageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <span>前往平台首页搜索</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
};
