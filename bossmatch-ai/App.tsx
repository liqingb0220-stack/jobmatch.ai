
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
  // Persistence & Auth States
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Core Flow States
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

  // Load persistent data
  useEffect(() => {
    const savedUser = localStorage.getItem('bossmatch_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedHistory = localStorage.getItem('bossmatch_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save persistent data
  useEffect(() => {
    if (user) localStorage.setItem('bossmatch_user', JSON.stringify(user));
    else localStorage.removeItem('bossmatch_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bossmatch_history', JSON.stringify(history));
  }, [history]);

  // User-friendly error mapping
  const getFriendlyErrorMessage = (err: any): string => {
    const message = err?.message || "";
    if (message.includes("AUTH_ERROR") || message.includes("403")) {
      return "AI 服务授权失败。请检查 API Key 配置或刷新页面重试。";
    }
    if (message.includes("429")) {
      return "AI 忙碌中（请求过于频繁）。请稍等 1 分钟后再试，或者减少简历描述的长度。";
    }
    if (message.includes("PARSE_ERROR")) {
      return "匹配结果解析失败。这通常是由于网络波动导致的，请尝试重试。";
    }
    if (message.includes("fetch") || message.includes("network")) {
      return "网络连接异常。请检查您的互联网连接或尝试更换网络环境。";
    }
    if (message.includes("safety") || message.includes("blocked")) {
      return "内容未能通过 AI 安全审核。请调整简历或期望描述，避免包含敏感信息。";
    }
    return "AI 暂时无法响应，请稍后重试。您可以尝试精简简历内容以提高成功率。";
  };

  const handleLogin = (provider: 'google' | 'apple') => {
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: provider === 'google' ? 'Google 体验用户' : 'Apple 体验用户',
      email: `${provider}_user@example.com`,
      avatar: provider === 'google' 
        ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=google' 
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=apple'
    };
    setUser(mockUser);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bossmatch_user');
  };

  const handleSaveAnalysis = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!analysis || jobs.length === 0) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      profile: { ...profile },
      analysis: { ...analysis },
      jobs: [...jobs]
    };
    setHistory(prev => [newItem, ...prev]);
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
      console.error('PDF 解析失败:', err);
      setError('PDF 解析失败，请检查文件格式');
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleStartSearch = async () => {
    console.log("[App] handleStartSearch triggered");
    
    if (!profile.resumeText || !profile.expectations) {
      setError('请输入简历内容与期望以开始匹配');
      return;
    }

    setLoading(true);
    setError(null);
    setMatchSteps([
      { id: '1', label: '分析个人履历', status: 'loading', subText: '正在提取核心技能与优势...' },
      { id: '2', label: '全网检索在招岗位', status: 'pending' },
      { id: '3', label: '深度语义匹配', status: 'pending' }
    ]);

    try {
      console.log("[App] Phase 1: analyzeProfile starting...");
      const analysisData = await analyzeProfile(profile);
      setAnalysis(analysisData);
      
      setMatchSteps(prev => prev.map(s => s.id === '1' ? {...s, status: 'completed', subText: `✔ 已识别核心技能`} : s.id === '2' ? {...s, status: 'loading', subText: '正在检索全网 10 个最优在招岗位...'} : s));
      
      console.log("[App] Phase 2: searchAndMatchJobs starting...");
      const matchedJobs = await searchAndMatchJobs(profile, analysisData);
      
      setMatchSteps(prev => prev.map(s => s.id === '2' ? {...s, status: 'completed', subText: `✔ 已锁定 10 个实时在招职位`} : s.id === '3' ? {...s, status: 'loading', subText: '🔍 正在进行深度契合度对标...'} : s));
      
      await new Promise(r => setTimeout(r, 800));
      setMatchSteps(prev => prev.map(s => s.id === '3' ? {...s, status: 'completed', subText: '✔ 匹配分析完成'} : s));
      
      setJobs(matchedJobs);
      setSeenJobKeys(matchedJobs.map(j => `${j.company}-${j.title}`));
      setStep('results');
    } catch (err: any) {
      console.error("[App] handleStartSearch error:", err);
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
        setError('暂无更多符合条件的岗位，您可以尝试修改期望条件');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error("[App] Refresh failed:", err);
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
    setProfile({ resumeText: '', expectations: '' });
    setError(null);
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onLoginClick={() => setShowAuthModal(true)} 
      onShowHistory={() => { if(!user) setShowAuthModal(true); else setShowHistoryModal(true); }}
      onAvatarUpload={(url) => user && setUser({ ...user, avatar: url })}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {step === 'input' ? (
          <div className="max-w-3xl mx-auto space-y-12 animate-fade-in">
            <div className="text-center space-y-6">
              <h2 className="text-4xl sm:text-6xl font-extrabold text-slate-800 tracking-tight leading-tight">
                遇见你的 <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">下一份梦想</span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                上传简历开启 AI 智能筛选。我们将深入分析你的职业优势，
                并在全网检索最匹配的优质机会。
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
                  <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) extractTextFromPdf(f); }} accept=".pdf" className="hidden" />
                  {isParsingPdf ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-sm text-slate-500 font-semibold tracking-wide">正在解析履历详情...</span>
                    </div>
                  ) : fileName ? (
                    <div className="text-center animate-fade-in">
                      <p className="text-blue-700 font-bold text-lg">{fileName}</p>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-black">点击重新上传</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-slate-600 font-bold text-lg">点击上传 PDF 简历</p>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-black">AI 将自动识别您的核心经历</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">2. 职业期待</label>
                <textarea 
                  className="w-full h-40 p-6 bg-white/40 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 font-medium leading-relaxed resize-none shadow-inner placeholder:text-slate-300" 
                  placeholder="例如：北京 AI 产品经理，薪资 40k+..." 
                  value={profile.expectations} 
                  onChange={(e) => setProfile({ ...profile, expectations: e.target.value })} 
                />
              </div>

              {loading && (
                <div className="px-4 py-6 bg-slate-50/30 rounded-[2rem] border border-white/50">
                  <ProcessSteps steps={matchSteps} />
                </div>
              )}

              {error && (
                <div className="bg-red-50/80 text-red-600 p-6 rounded-2xl text-sm font-semibold border border-red-100 animate-fade-in flex flex-col items-center justify-center shadow-sm">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>服务暂不可用</span>
                  </div>
                  <p className="text-center text-slate-600 font-medium px-4">{error}</p>
                </div>
              )}

              <button 
                onClick={handleStartSearch} 
                disabled={loading || isParsingPdf} 
                className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2rem] font-extrabold text-xl shadow-xl hover:shadow-2xl hover:translate-y-[-4px] transition-all disabled:opacity-70 flex items-center justify-center tracking-tight"
              >
                {loading ? "正在智能检索中..." : "立即开启智能筛选"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <button 
                  onClick={handleReset} 
                  className="text-blue-600 flex items-center text-xs font-extrabold uppercase tracking-widest hover:translate-x-[-4px] transition-transform mb-4"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  重新配置档案
                </button>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">为您精选的 10 个匹配机会</h2>
                <p className="text-slate-500 mt-2 font-medium">AI 已为您分析全网实时动态，并锁定以下优质岗位</p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleRefresh} 
                  disabled={refreshing} 
                  className="glass-panel text-blue-600 border border-slate-200 px-8 py-3.5 rounded-full text-sm font-bold hover:bg-white transition-all flex items-center shadow-sm disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  {refreshing ? '正在刷新...' : '换一批'}
                </button>
              </div>
            </div>

            {analysis && (
              <div className="glass-panel rounded-[2rem] border-0 overflow-hidden">
                <AnalysisView analysis={analysis} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobs.map((job, index) => (
                <div key={index} className="glass-panel rounded-[2rem] border-0 hover:shadow-2xl hover:translate-y-[-8px] transition-all overflow-hidden flex flex-col h-full">
                  <JobCard job={job} onOptimize={() => setSelectedJobForOptimize(job)} onViewDetails={() => setSelectedJobForDetails(job)} />
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center pt-10 space-y-6">
              {error && (
                 <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 animate-bounce">
                   {error}
                 </div>
              )}
              
              <button 
                onClick={handleSaveAnalysis}
                className="glass-panel px-12 py-5 rounded-[2rem] text-blue-600 font-extrabold flex items-center space-x-3 hover:bg-blue-600 hover:text-white hover:-translate-y-2 transition-all shadow-xl group"
              >
                <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                <span>保存此次分析结果</span>
              </button>

              <div className="max-w-2xl w-full text-center space-y-2 pt-8 border-t border-slate-200/50">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-6">
                  * 本平台匹配结果由 AI 深度模型基于公开招聘数据生成，仅供职业选择参考，不代表招聘方实时或真实的录用承诺。具体岗位详情及开放状态请以原招聘平台及企业官方信息为准。
                </p>
              </div>
            </div>

            <JobDetailsModal 
              job={selectedJobForDetails} 
              onClose={() => setSelectedJobForDetails(null)} 
              onOptimize={(j) => { setSelectedJobForDetails(null); setSelectedJobForOptimize(j); }} 
            />
            
            <OptimizationModal 
              job={selectedJobForOptimize} 
              resumeText={profile.resumeText} 
              onClose={() => setSelectedJobForOptimize(null)} 
            />
          </div>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />}
      {showHistoryModal && <HistoryModal history={history} onClose={() => setShowHistoryModal(false)} onRestore={handleRestoreHistory} />}
    </Layout>
  );
};

export default App;
