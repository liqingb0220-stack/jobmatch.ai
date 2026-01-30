
import React from 'react';
import { JobMatch } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface JobCardProps {
  job: JobMatch;
  onOptimize: (job: JobMatch) => void;
  onViewDetails: (job: JobMatch) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onOptimize, onViewDetails }) => {
  const data = [
    { name: 'Match', value: job.matchScore },
    { name: 'Gap', value: 100 - job.matchScore },
  ];
  const COLORS = ['#2563eb', 'rgba(0,0,0,0.05)'];

  return (
    <div className="p-6 flex flex-col h-full bg-transparent">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 cursor-pointer pr-4" onClick={() => onViewDetails(job)}>
          <h4 className="font-bold text-slate-800 text-xl leading-snug hover:text-blue-600 transition-colors">{job.title}</h4>
          <p className="text-blue-600 font-bold text-sm mt-1">{job.company}</p>
          <div className="flex items-center space-x-3 mt-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            <span className="flex items-center">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {job.location}
            </span>
            <span className="text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
              {job.salary}
            </span>
          </div>
        </div>
        
        <div className="w-16 h-16 relative flex-shrink-0 bg-white/40 rounded-2xl p-1 shadow-sm border border-white">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={18}
                outerRadius={25}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-slate-700">{job.matchScore}</span>
            <span className="text-[7px] text-slate-400 uppercase font-black">Score</span>
          </div>
        </div>
      </div>

      <div className="flex-grow mb-8 cursor-pointer" onClick={() => onViewDetails(job)}>
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium">
          <span className="font-bold text-slate-700">推荐分析：</span>{job.reason}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <button 
          onClick={() => onOptimize(job)}
          className="flex items-center justify-center py-3.5 bg-blue-50/50 text-blue-600 rounded-2xl text-xs font-bold hover:bg-blue-100/50 transition-all border border-blue-100/30"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          简历重构
        </button>
        <button 
          onClick={() => onViewDetails(job)}
          className="flex items-center justify-center py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
        >
          岗位详情
        </button>
      </div>
    </div>
  );
};
