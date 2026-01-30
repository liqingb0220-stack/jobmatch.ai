
import React from 'react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (provider: 'google' | 'apple') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-sm rounded-[2.5rem] p-10 flex flex-col items-center border-0 shadow-2xl">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <span className="text-white font-black text-3xl">B</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight text-center">开启 AI 职场之旅</h3>
        <p className="text-slate-400 text-xs font-medium mt-2 mb-8 text-center px-4 leading-relaxed">
          当前版本为<span className="text-blue-600 font-bold">体验版</span>，登录仅用于开启本地缓存同步体验。刷新页面后记录可能失效，不支持云端持久化存储。
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={() => onLogin('google')}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-200 py-3.5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-5 h-5" alt="Google" />
            <span className="text-sm font-bold text-slate-600">使用 Google 体验账号</span>
          </button>
          
          <button 
            onClick={() => onLogin('apple')}
            className="w-full flex items-center justify-center space-x-3 bg-slate-900 py-3.5 rounded-2xl hover:bg-black transition-all shadow-sm group"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-50.1-20.7-79.3-20.1-38.3.6-73.4 21.8-93.1 55.4-40 68.3-10.2 170.8 28.4 227.1 18.9 27.5 42.1 58.3 71.9 57.3 28.8-1 39.7-18.5 74.5-18.5 34.3 0 44.2 18.5 74.5 17.6 30.5-1 51.5-27.8 70.2-55.4 21.6-31.2 30.4-61.5 30.6-63.1-.6-.2-59-22.6-59.5-82.7zM280.4 87.3C303.4 58.8 301.9 27.3 301.9 27.3s-28.5 1.5-57 30c-26.6 26.6-23 57.5-23 57.5s28.1 4 58.5-27.5z"/></svg>
            <span className="text-sm font-bold text-white">使用 Apple 体验账号</span>
          </button>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
        >
          暂不登录
        </button>
      </div>
    </div>
  );
};
