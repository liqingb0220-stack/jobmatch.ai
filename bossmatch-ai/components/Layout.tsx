import React, { useState, useRef } from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onShowHistory: () => void;
  onAvatarUpload: (url: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  onLoginClick, 
  onShowHistory,
  onAvatarUpload 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onAvatarUpload(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-transparent">
      <header className="sticky top-0 z-50 glass-panel border-b-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-extrabold text-xl">B</span>
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">
                BossMatch <span className="text-blue-600">AI</span>
              </h1>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] rounded font-black uppercase tracking-tighter">Trial</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-500 h-full">
            <a href="#" className="text-blue-600 h-full flex items-center border-b-2 border-blue-600 transition-colors px-1">智能匹配</a>
            <button 
              onClick={onShowHistory} 
              className="h-full flex items-center hover:text-blue-500 transition-colors border-b-2 border-transparent px-1"
            >
              历史记录
            </button>
            <a 
              href="mailto:liqingb0220@gmail.com" 
              className="h-full flex items-center hover:text-blue-500 transition-colors border-b-2 border-transparent px-1"
            >
              联系开发者
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 glass-panel px-3 py-1.5 rounded-full hover:bg-white transition-all border border-slate-200"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden border border-white flex-shrink-0">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" /> : null}
                  </div>
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{user.name}</span>
                </button>
                
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl shadow-xl z-20 overflow-hidden py-1 animate-fade-in border-0">
                      <button 
                        onClick={() => { fileInputRef.current?.click(); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        更换头像 (演示)
                      </button>
                      <button 
                        onClick={() => { onShowHistory(); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        本地历史记录
                      </button>
                      <a 
                        href="mailto:liqingb0220@gmail.com"
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        联系开发者
                      </a>
                      <hr className="my-1 border-slate-100" />
                      <button 
                        onClick={() => { onLogout(); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        退出登录
                      </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                登录 / 注册 (体验)
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="py-12 glass-panel mt-12 border-t-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex space-x-6 mb-4">
            <a href="mailto:liqingb0220@gmail.com" className="text-slate-400 hover:text-blue-500 transition-colors font-medium">联系开发者 / 反馈建议</a>
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest text-center">
            © 2026 BossMatch AI · 开发者: <span className="text-slate-600 font-bold">liqingb0220@gmail.com</span>
          </p>
          <p className="text-[10px] text-slate-300 mt-4 uppercase tracking-[0.2em]">
            Experiential Trial Version · No Persistent Cloud Storage
          </p>
        </div>
      </footer>
    </div>
  );
};
