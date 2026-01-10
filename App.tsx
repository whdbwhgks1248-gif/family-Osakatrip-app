console.log(
  "[ENV CHECK]",
  "MODE=", import.meta.env.MODE,
  "URL=", import.meta.env.VITE_SUPABASE_URL,
  "HAS_KEY=", Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
);


import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ShieldCheck, Calculator, ShoppingBag, MessageSquare, Menu, X, ChevronRight, CheckCircle2, Lock, LogOut, KeyRound, RefreshCcw, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ScheduleView from './components/ScheduleView.tsx';
import RulesView from './components/RulesView.tsx';
import SettlementView from './components/SettlementView.tsx';
import SouvenirView from './components/SouvenirView.tsx';
import AIChatView from './components/AIChatView.tsx';
import { Expense, Souvenir } from './types.ts';
import { SCHEDULE_DATA } from './constants.tsx';

// 1. Supabase Initialization using Environment Variables
/* Fix: Using process.env instead of import.meta.env to resolve TypeScript 'Property env does not exist on type ImportMeta' error */
const supabaseUrl = process.env.VITE_SUPABASE_URL;
/* Fix: Using process.env instead of import.meta.env to resolve TypeScript 'Property env does not exist on type ImportMeta' error */
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Log initialization status for debugging (Safe for production)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.");
}

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

type TabType = 'schedule' | 'rules' | 'settlement' | 'souvenir' | 'ai';

const App: React.FC = () => {
  const [familyId, setFamilyId] = useState<string | null>(() => {
    const saved = localStorage.getItem('family_id');
    return saved ? saved.toUpperCase() : null;
  });
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tempCode, setTempCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);

  const generateFamilyId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // 2. Resilient Data Fetching with maybeSingle()
  const fetchFamilyData = useCallback(async (id: string) => {
    if (!supabase) return;
    
    setIsLoading(true);
    const cleanId = id.trim().toUpperCase();
    
    try {
      const { data, error } = await supabase
        .from('family_state')
        .select('*')
        .eq('family_id', cleanId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExpenses(data.expenses || []);
        setSouvenirs(data.souvenirs || []);
      } else {
        // Initial setup for new code
        const localExpenses = localStorage.getItem(`trip_expenses_${cleanId}`) || localStorage.getItem('trip_expenses');
        const localSouvenirs = localStorage.getItem(`trip_souvenirs_${cleanId}`) || localStorage.getItem('trip_souvenirs');
        
        const initialExpenses = localExpenses ? JSON.parse(localExpenses) : [];
        const initialSouvenirs = localSouvenirs ? JSON.parse(localSouvenirs) : [];

        setExpenses(initialExpenses);
        setSouvenirs(initialSouvenirs);

        // Create the row immediately
        await supabase.from('family_state').upsert({
          family_id: cleanId,
          expenses: initialExpenses,
          souvenirs: initialSouvenirs
        });
      }
    } catch (e) {
      console.error("데이터 로드 중 오류 발생:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToSupabase = useCallback(async (id: string, newExpenses: Expense[], newSouvenirs: Souvenir[]) => {
    if (!id || !supabase) return;
    setIsSaving(true);
    const cleanId = id.trim().toUpperCase();
    try {
      const { error } = await supabase.from('family_state').upsert({
        family_id: cleanId,
        expenses: newExpenses,
        souvenirs: newSouvenirs
      });
      if (error) throw error;
    } catch (e) {
      console.error("데이터 저장 실패:", e);
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (familyId) {
      fetchFamilyData(familyId);
    }
  }, [familyId, fetchFamilyData]);

  useEffect(() => {
    if (!familyId || isLoading || isResetting) return;
    const timeout = setTimeout(() => {
      saveToSupabase(familyId, expenses, souvenirs);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [expenses, souvenirs, familyId, saveToSupabase, isLoading, isResetting]);

  const handleSetFamilyId = (code: string) => {
    let cleanCode = code.trim().toUpperCase();
    if (!cleanCode) cleanCode = generateFamilyId();
    localStorage.setItem('family_id', cleanCode);
    setFamilyId(cleanCode);
    setTempCode('');
    setActiveTab('schedule');
  };

  const handleResetFamilyId = () => {
    setIsResetting(true);
    setIsMenuOpen(false);
    setShowResetConfirm(false);
    
    setTimeout(() => {
      localStorage.removeItem('family_id');
      localStorage.removeItem('trip_expenses');
      localStorage.removeItem('trip_souvenirs');
      
      setFamilyId(null);
      setExpenses([]);
      setSouvenirs([]);
      setTempCode('');
      setActiveTab('schedule');
      setIsResetting(false);
    }, 600);
  };

  const tabs = [
    { id: 'schedule', label: '일정', icon: Calendar },
    { id: 'rules', label: '규칙', icon: ShieldCheck },
    { id: 'settlement', label: '정산', icon: Calculator },
    { id: 'souvenir', label: '기념품', icon: ShoppingBag },
    { id: 'ai', label: '가이드', icon: MessageSquare },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-40 gap-4 animate-in fade-in duration-500">
          <Loader2 size={40} className="text-[#1675F2] animate-spin" />
          <p className="text-sm font-black text-[#566873]/40 uppercase tracking-widest">데이터 동기화 중...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'schedule': return <ScheduleView />;
      case 'rules': return <RulesView />;
      case 'settlement': return <SettlementView expenses={expenses} setExpenses={setExpenses} />;
      case 'souvenir': return <SouvenirView souvenirs={souvenirs} setSouvenirs={setSouvenirs} />;
      case 'ai': return <AIChatView />;
      default: return <ScheduleView />;
    }
  };

  // 3. Error UI for Missing Supabase Config
  if (!supabase) {
    return (
      <div className="fixed inset-0 bg-[#F8F9FD] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-red-100 max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
            <WifiOff size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#566873]">서버 연결 오류</h2>
            <p className="text-sm font-bold text-[#566873]/60 leading-relaxed">
              데이터베이스 설정이 누락되었습니다.<br/>
              관리자에게 문의하거나 Vercel 환경 변수를 확인해주세요.
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl text-[10px] text-red-400 font-mono text-left break-all">
            Missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY
          </div>
        </div>
      </div>
    );
  }

  if (isResetting) {
    return (
      <div className="fixed inset-0 bg-[#1675F2] flex flex-col items-center justify-center z-[2000] text-white gap-4">
        <Loader2 size={48} className="animate-spin text-[#F2E96D]" />
        <p className="text-lg font-black tracking-tighter uppercase">연결 해제 및 초기화 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col max-w-[500px] mx-auto relative font-sans text-[#566873]">
      {!familyId && (
        <div className="fixed inset-0 z-[1000] bg-[#1675F2] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-[360px] rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#F2E96D] text-[#1675F2] rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-[#F2E96D]/20">
                <KeyRound size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-[#1675F2] tracking-tighter">가족 코드 시작하기</h2>
              <p className="text-sm font-bold text-[#566873]/60 leading-relaxed">우리 가족만의 코드를 입력하세요.<br/>코드가 없다면 자동으로 생성됩니다.</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                value={tempCode}
                onChange={(e) => setTempCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetFamilyId(tempCode)}
                placeholder="예: OSAKA2026"
                className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-5 text-center text-lg font-black text-[#1675F2] placeholder:text-[#566873]/20 focus:ring-4 focus:ring-[#F2E96D] transition-all uppercase"
              />
              <button 
                onClick={() => handleSetFamilyId(tempCode)}
                className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black text-md shadow-xl shadow-[#1675F2]/20 hover:brightness-110 active:scale-95 transition-all"
              >
                {tempCode.trim() ? '이 코드로 시작' : '새 코드 생성하고 시작'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[100] px-6 pt-9 pb-3 border-b border-[#566873]/5 shadow-sm h-[118px]">
        <div className="flex justify-between items-center h-full">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full uppercase tracking-tighter">실시간 공유 중</span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F1F2F0] rounded-full">
                {isSaving ? <RefreshCcw size={8} className="text-[#1675F2] animate-spin" /> : <CheckCircle2 size={8} className="text-[#1675F2]" />}
                <span className="text-[8px] font-bold text-[#566873]/60 uppercase">코드: {familyId}</span>
              </div>
            </div>
            <h1 className="text-xl font-black text-[#1675F2] tracking-tighter leading-tight">
              {SCHEDULE_DATA.title}
            </h1>
            <p className="text-[11px] font-bold text-[#566873]/40 tracking-tight mt-1">
              {familyId ? '가족 클라우드 연결됨' : '연결 중...'} | 열무&배추네
            </p>
          </div>
          <button 
            onClick={() => {
              setIsMenuOpen(true);
              setShowResetConfirm(false);
            }}
            className="w-10 h-10 bg-white border border-[#566873]/10 text-[#566873] rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-[118px] pb-32">
        {familyId && renderContent()}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[468px] bg-[#1675F2] rounded-full px-2 py-2 shadow-[0_20px_50px_rgba(22,117,242,0.3)] z-[150] flex justify-between items-center border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`relative flex items-center justify-center h-12 rounded-full transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-[#F2E96D] text-[#1675F2] px-6 flex-grow' 
                : 'text-white/50 w-12 hover:text-white'
            }`}
          >
            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
            {activeTab === tab.id && (
              <span className="ml-2 text-[11px] font-black uppercase tracking-tight">{tab.label}</span>
            )}
          </button>
        ))}
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-[#1675F2]/10 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute right-0 top-0 h-full w-[85%] bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-10 flex justify-between items-center shrink-0">
              <span className="text-xs font-black text-[#566873]/30 uppercase tracking-[0.3em]">메뉴</span>
              <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-[#F1F2F0] rounded-full flex items-center justify-center text-[#566873]">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 px-10 space-y-2 overflow-y-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full p-6 rounded-3xl transition-all ${
                    activeTab === tab.id ? 'bg-[#1675F2] text-white' : 'hover:bg-[#F1F2F0]'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <tab.icon size={20} strokeWidth={2.5} />
                    <span className="font-black text-xl tracking-tight">{tab.label}</span>
                  </div>
                  <ChevronRight size={16} opacity={0.3} />
                </button>
              ))}
            </div>

            <div className="p-10 border-t border-[#F1F2F0] bg-[#F8F9FD]">
              <div className="bg-white p-6 rounded-[2rem] border border-[#1675F2]/5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F1F2F0] text-[#1675F2] rounded-2xl flex items-center justify-center">
                    <Lock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#566873]/30 uppercase tracking-widest">현재 가족코드</p>
                    <p className="text-sm font-black text-[#1675F2] uppercase">{familyId}</p>
                  </div>
                </div>

                {!showResetConfirm ? (
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-[#566873]/5 hover:bg-[#566873]/10 text-[#566873] py-4 rounded-2xl text-xs font-black transition-all"
                  >
                    <LogOut size={14} />
                    코드 변경 및 초기화
                  </button>
                ) : (
                  <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-2xl border border-red-100 mb-1">
                      <AlertCircle size={14} />
                      <p className="text-[10px] font-bold">정말 초기화할까요? 데이터는 안전합니다.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleResetFamilyId}
                        className="flex-1 bg-red-500 text-white py-4 rounded-2xl text-xs font-black shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                      >
                        네, 초기화
                      </button>
                      <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 bg-[#F1F2F0] text-[#566873] py-4 rounded-2xl text-xs font-black active:scale-95 transition-all"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
