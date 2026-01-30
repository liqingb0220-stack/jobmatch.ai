
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  history: HistoryItem[];
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onRestore }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-[2.5rem] flex flex-col max-h-[85vh] border-0 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">体验版档案库</h3>
            <p className="text-sm text-slate-400 font-medium mt-1">回顾之前的智能匹配建议（本地暂存）</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Warning Section */}
        <div className="px-8 py-4 bg-blue-50/50 border-b border-blue-100/50">
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest text-center">
            ⚠ 当前版本暂不支持跨设备同步，分析记录仅在当前浏览器有效。
          </p>
        </div>

        <div className="flex-grow overflow-y-auto p-8 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="text-slate-400 font-medium">暂无已保存的分析记录</p>
              <p className="text-[10px] text-slate-300 mt-2">该功能将在后续版本开放云端同步</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onRestore(item)}
                className="group p-6 rounded-3xl bg-white/40 border border-white hover:bg-white/80 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">本地存档</span>
                    <span className="text-xs text-slate-400 font-medium">{new Date(item.timestamp).toLocaleString('zh-CN')}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                    {item.profile.expectations.length > 30 ? item.profile.expectations.substring(0, 30) + '...' : item.profile.expectations}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.analysis.summary}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-blue-600">{item.jobs.length} 个岗位</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">匹配结果</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
