
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { UserProfile, JobMatch, AnalysisResult, User, HistoryItem } from './types';
import { analyzeProfile, searchAndMatchJobs } from './services/geminiService';
import { AnalysisView } from './components/AnalysisView';
import { JobCard } from './components/JobCard';
import { OptimizationModal } from './components/OptimizationModal';
import { JobDetailsModal } from './components/JobDetailsModal';
import { ProcessSteps, StepItem } from './components/ProcessSteps';
import { AuthModal } from './components/AuthModal';
import { HistoryModal } from './components/HistoryModal';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({ resumeText: '', expectations: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [step, setStep] = useState<'input' | 'results'>('input');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [seenJobKeys, setSeenJobKeys] = useState<string[]>([]);
  const [matchSteps, setMatchSteps] = useState<StepItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobMatch | null>(null);
  const [selectedJobForOptimize, setSelectedJobForOptimize] = useState<JobMatch | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('bossmatch_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedHistory = localStorage.getItem('bossmatch_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // 映射产品化的错误提示
  const getFriendlyErrorMessage = (err: any): string => {
    const msg = err?.message || String(err);
    console.error("[App] Mapping error:", msg);
    
    if (msg.includes("API_KEY_MISSING") || msg.includes("An API Key must be set")) {
      return "AI 服务授权配置有误。建议：请确保您的 API Key (VITE_GEMINI_API_KEY) 已正确设置并生效，或尝试刷新页面。";
    }
    if (msg.includes("429") || msg.includes("quota")) {
      return "AI 引擎目前请求过于频繁。建议：请稍等 60 秒后再次尝试，或精简简历内容以降低处理负担。";
    }
    if (msg.includes("AI_RESPONSE_PARSE_FAILED") || msg.includes("JSON")) {
      return "AI 生成的数据格式出现了轻微偏差。建议：这通常是瞬时波动，请点击“重试”或“换一批”按钮即可。";
    }
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      return "网络连接不稳定，AI 无法完成数据传输。建议：检查您的互联网连接，或者更换更稳定的网络节点后重试。";
    }
    if (msg.includes("blocked") || msg.includes("safety")) {
      return "内容未能通过 AI 安全审核。建议：请修改简历或职业期望中的敏感词汇或特殊符号。";
    }
    return "AI 系统由于输入过载或请求超时暂时停止了响应。建议：尝试减少简历的字数（建议 2000 字以内），然后重试。";
  };

  const handleLogin = (provider: 'google' | 'apple') => {
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: provider === 'google' ? 'Google 体验用户' : 'Apple 体验用户',
      email: `${provider}_user@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`
    };
    setUser(mockUser);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bossmatch_user');
  };

  const handleSaveAnalysis = () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!analysis || jobs.length === 0) return;
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      profile: { ...profile },
      analysis: { ...analysis },
      jobs: [...jobs]
    };
    setHistory(prev => [newItem, ...prev]);
    localStorage.setItem('bossmatch_history', JSON.stringify([newItem, ...history]));
    alert('分析已保存至本地');
  };

  const handleRestoreHistory = (item: HistoryItem) => {
    setProfile(item.profile);
    setAnalysis(item.analysis);
    setJobs(item.jobs);
    setSeenJobKeys(item.jobs.map(j => `${j.company}-${j.title}`));
    setStep('results');
    setShowHistoryModal(false);
  };

  const extractTextFromPdf = async (file: File) => {
    setIsParsingPdf(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      setProfile(prev => ({ ...prev, resumeText: fullText }));
      setFileName(file.name);
    } catch (err) {
      setError('无法读取 PDF 简历，请确保文件未加密。');
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleStartSearch = async () => {
    if (!profile.resumeText || !profile.expectations) {
      setError('请输入简历和期待以开启匹配。');
      return;
    }
    setLoading(true);
    setError(null);
    setMatchSteps([
      { id: '1', label: 'AI 简历建模', status: 'loading', subText: '正在识别职业肖像...' },
      { id: '2', label: '全网岗位对标', status: 'pending' },
      { id: '3', label: '深度语义筛选', status: 'pending' }
    ]);

    try {
      const analysisData = await analyzeProfile(profile);
      setAnalysis(analysisData);
      setMatchSteps(prev => prev.map(s => s.id === '1' ? {...s, status: 'completed', subText: `✔ 已识别核心竞争力`} : s.id === '2' ? {...s, status: 'loading', subText: '正在检索 10 个高度匹配的实时岗位...'} : s));
      
      const matchedJobs = await searchAndMatchJobs(profile, analysisData);
      setMatchSteps(prev => prev.map(s => s.id === '2' ? {...s, status: 'completed', subText: `✔ 已锁定 10 个优质在招职位`} : s.id === '3' ? {...s, status: 'loading', subText: '🔍 正在进行精细化对标分析...'} : s));
      
      await new Promise(r => setTimeout(r, 600));
      setJobs(matchedJobs);
      setSeenJobKeys(matchedJobs.map(j => `${j.company}-${j.title}`));
      setStep('results');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!analysis) return;
    setRefreshing(true);
    setError(null);
    try {
      const newJobs = await searchAndMatchJobs(profile, analysis, seenJobKeys);
      if (newJobs.length > 0) {
        setJobs(newJobs);
        setSeenJobKeys(prev => [...prev, ...newJobs.map(j => `${j.company}-${j.title}`)]);
      } else {
        setError('暂未搜到更多匹配岗位。');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setAnalysis(null);
    setJobs([]);
    setSeenJobKeys([]);
    setFileName(null);
    setError(null);
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onLoginClick={() => setShowAuthModal(true)} 
      onShowHistory={() => user ? setShowHistoryModal(true) : setShowAuthModal(true)}
      onAvatarUpload={(url) => user && setUser({ ...user, avatar: url })}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {step === 'input' ? (
          <div className="max-w-3xl mx-auto space-y-12 animate-fade-in">
            <div className="text-center space-y-6">
              <h2 className="text-4xl sm:text-6xl font-extrabold text-slate-800 tracking-tight leading-tight">
                遇见你的 <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">下一份梦想</span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                上传简历开启 AI 智能筛选，精准锁定全网匹配机会。
              </p>
            </div>

            <div className="glass-panel rounded-[2rem] p-8 sm:p-12 space-y-10">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">1. 导入简历 (PDF)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`group relative border-2 border-dashed rounded-3xl p-10 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                    fileName ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300 hover:bg-white/50'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && extractTextFromPdf(e.target.files[0])} accept=".pdf" className="hidden" />
                  {isParsingPdf ? (
                    <div className="flex flex-col items-center animate-pulse text-blue-600">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-xs font-bold">正在读取简历...</span>
                    </div>
                  ) : fileName ? (
                    <div className="text-center">
                      <p className="text-blue-700 font-bold text-lg">{fileName}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">点击更换文件</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-slate-600 font-bold text-lg">点击上传 PDF 简历</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">AI 将自动识别您的优势</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">2. 职业期待</label>
                <textarea 
                  className="w-full h-40 p-6 bg-white/40 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 font-medium leading-relaxed resize-none shadow-inner" 
                  placeholder="例如：北京 AI 产品经理，20k 以上，不加班..." 
                  value={profile.expectations} 
                  onChange={(e) => setProfile({ ...profile, expectations: e.target.value })} 
                />
              </div>

              {loading && <div className="px-4 py-6 bg-slate-50/30 rounded-[2rem] border border-white/50"><ProcessSteps steps={matchSteps} /></div>}

              {error && (
                <div className="bg-red-50/80 text-red-600 p-6 rounded-2xl text-sm font-semibold border border-red-100 animate-fade-in flex flex-col items-center text-center">
                  <div className="flex items-center mb-1 text-red-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <span>智能引擎暂时中断</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">{error}</p>
                  <button onClick={handleStartSearch} className="mt-4 text-blue-600 underline font-bold uppercase tracking-widest text-[10px]">重新尝试</button>
                </div>
              )}

              <button 
                onClick={handleStartSearch} 
                disabled={loading || isParsingPdf} 
                className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2rem] font-extrabold text-xl shadow-xl hover:shadow-2xl hover:translate-y-[-4px] transition-all disabled:opacity-70"
              >
                {loading ? "检索中..." : "立即开启智能筛选"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <button onClick={handleReset} className="text-blue-600 flex items-center text-xs font-extrabold uppercase tracking-widest hover:-translate-x-1 transition-transform mb-4">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  重新配置档案
                </button>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">精选 10 个匹配机会</h2>
                <p className="text-slate-500 mt-2 font-medium">AI 已基于公开检索定位以下优质岗位</p>
              </div>
              <button onClick={handleRefresh} disabled={refreshing} className="glass-panel text-blue-600 border border-slate-200 px-8 py-3.5 rounded-full text-sm font-bold hover:bg-white transition-all flex items-center shadow-sm disabled:opacity-50">
                <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {refreshing ? '正在刷新...' : '换一批'}
              </button>
            </div>

            {analysis && <div className="glass-panel rounded-[2rem] overflow-hidden"><AnalysisView analysis={analysis} /></div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobs.map((job, idx) => (
                <div key={idx} className="glass-panel rounded-[2rem] hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col h-full overflow-hidden">
                  <JobCard job={job} onOptimize={() => setSelectedJobForOptimize(job)} onViewDetails={() => setSelectedJobForDetails(job)} />
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center pt-10 space-y-8">
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">{error}</div>}
              
              <button onClick={handleSaveAnalysis} className="glass-panel px-12 py-5 rounded-[2rem] text-blue-600 font-extrabold flex items-center space-x-3 hover:bg-blue-600 hover:text-white transition-all shadow-xl group">
                <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                <span>保存分析报告</span>
              </button>

              <div className="max-w-2xl w-full text-center py-8 border-t border-slate-200/50">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em] leading-relaxed">
                  免责声明：匹配结果由 AI 模型基于公开招聘信息生成，仅供择业参考。本平台不对岗位的实时真实性及录用结果负责，请以官方招聘平台及企业最终确认信息为准。
                </p>
              </div>
            </div>

            <JobDetailsModal job={selectedJobForDetails} onClose={() => setSelectedJobForDetails(null)} onOptimize={(j) => { setSelectedJobForDetails(null); setSelectedJobForOptimize(j); }} />
            <OptimizationModal job={selectedJobForOptimize} resumeText={profile.resumeText} onClose={() => setSelectedJobForOptimize(null)} />
          </div>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />}
      {showHistoryModal && <HistoryModal history={history} onClose={() => setShowHistoryModal(false)} onRestore={handleRestoreHistory} />}
    </Layout>
  );
};

export default App;

