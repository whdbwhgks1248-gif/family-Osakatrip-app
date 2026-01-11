
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, ShieldCheck, Calculator, ShoppingBag, MessageSquare, Menu, X, RefreshCcw, Loader2, KeyRound, Globe, LogOut, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ScheduleView from './components/ScheduleView';
import RulesView from './components/RulesView';
import SettlementView from './components/SettlementView';
import SouvenirView from './components/SouvenirView';
import AIChatView from './components/AIChatView';
import { Expense, Souvenir } from './types';
import { SCHEDULE_DATA } from './constants';

const getSupabaseConfig = () => {
  const env = (import.meta as any).env || {};
  const url = env.VITE_SUPABASE_URL || '';
  const anonKey = env.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey, isMissing: !url || !anonKey };
};

const config = getSupabaseConfig();
const supabase = !config.isMissing ? createClient(config.url, config.anonKey) : null;

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
  
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  
  const lastServerDataRef = useRef<string>(""); 
  const isUserActionRef = useRef<boolean>(false); 
  const initialLoadCompletedRef = useRef<boolean>(false);
  const fetchLock = useRef<boolean>(false);

  const fetchFamilyData = useCallback(async (id: string) => {
    if (!supabase || fetchLock.current) return;
    
    fetchLock.current = true;
    setIsLoading(true);
    // [중요] 새로고침 시 데이터가 안 보이는 현상을 방지하기 위해 로딩 시작 시 상태 보존
    
    const cleanId = id.trim().toUpperCase();
    try {
      const { data, error } = await supabase.from('family_state').select('*').eq('family_id', cleanId).maybeSingle();
      if (error) throw error;
      
      const safeE = (data && Array.isArray(data.expenses)) ? data.expenses : [];
      const safeS = (data && Array.isArray(data.souvenirs)) ? data.souvenirs : [];
      
      const dataStr = JSON.stringify({ e: safeE, s: safeS });
      lastServerDataRef.current = dataStr;
      
      // 사용자의 액션이 아닐 때만 업데이트하여 무한 루프 방지
      isUserActionRef.current = false; 
      setExpenses(safeE);
      setSouvenirs(safeS);
      
      initialLoadCompletedRef.current = true;
      setIsInitialLoadDone(true);
      setLastSyncedAt(new Date());
    } catch (e) { 
      console.error("Fetch error:", e);
      setIsInitialLoadDone(true); // 에러가 나더라도 빈 화면이라도 보여줌
      initialLoadCompletedRef.current = true;
    } finally { 
      setIsLoading(false); 
      fetchLock.current = false;
    }
  }, []);

  useEffect(() => {
    if (!supabase || !familyId || !isInitialLoadDone) return;
    
    const channel = supabase
      .channel(`realtime-${familyId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'family_state', filter: `family_id=eq.${familyId}` },
        (payload) => {
          const newData = payload.new as any;
          if (!newData) return;

          const dataStr = JSON.stringify({ e: newData.expenses, s: newData.souvenirs });
          
          if (dataStr !== lastServerDataRef.current) {
            isUserActionRef.current = false; 
            setExpenses(Array.isArray(newData.expenses) ? newData.expenses : []);
            setSouvenirs(Array.isArray(newData.souvenirs) ? newData.souvenirs : []);
            lastServerDataRef.current = dataStr;
            setLastSyncedAt(new Date());
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId, isInitialLoadDone]);

  const saveToSupabase = useCallback(async (newE: Expense[], newS: Souvenir[]) => {
    if (!familyId || !supabase || !initialLoadCompletedRef.current || isResetting) return;
    
    const currentDataStr = JSON.stringify({ e: newE, s: newS });
    if (currentDataStr === lastServerDataRef.current) return;

    const lastData = JSON.parse(lastServerDataRef.current || '{"e":[],"s":[]}');
    if ((lastData.e.length > 0 || lastData.s.length > 0) && (newE.length === 0 && newS.length === 0)) {
      console.warn("비정상 데이터 유실 감지로 저장을 중단했습니다.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('family_state').upsert({ 
        family_id: familyId, 
        expenses: newE, 
        souvenirs: newS, 
        updated_at: new Date().toISOString() 
      });
      if (error) throw error;
      lastServerDataRef.current = currentDataStr;
      setLastSyncedAt(new Date());
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [familyId, isResetting]);

  useEffect(() => {
    if (!isUserActionRef.current || !initialLoadCompletedRef.current) return;

    const timer = setTimeout(() => {
      saveToSupabase(expenses, souvenirs);
      isUserActionRef.current = false; 
    }, 1200);

    return () => clearTimeout(timer);
  }, [expenses, souvenirs, saveToSupabase]);

  const updateExpenses = (updater: React.SetStateAction<Expense[]>) => {
    isUserActionRef.current = true;
    setExpenses(updater);
  };

  const updateSouvenirs = (updater: React.SetStateAction<Souvenir[]>) => {
    isUserActionRef.current = true;
    setSouvenirs(updater);
  };

  useEffect(() => { 
    if (familyId) {
      fetchFamilyData(familyId); 
    }
  }, [familyId, fetchFamilyData]);

  const handleSetFamilyId = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    localStorage.setItem('family_id', clean);
    setFamilyId(clean);
  };

  const handleReset = () => {
    setIsResetting(true);
    localStorage.removeItem('family_id');
    window.location.href = window.location.origin;
  };

  if (config.isMissing) return <div className="p-10 text-red-500 font-bold">Supabase Config Missing</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col max-w-[500px] mx-auto relative font-sans text-[#566873]">
      {!familyId ? (
        <div className="fixed inset-0 z-[1000] bg-[#1675F2] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[360px] rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#F2E96D] text-[#1675F2] rounded-3xl flex items-center justify-center mx-auto mb-2"><KeyRound size={32} /></div>
              <h2 className="text-2xl font-black text-[#1675F2] tracking-tighter">우리 가족 코드</h2>
            </div>
            <div className="space-y-4">
              <input type="text" value={tempCode} onChange={(e) => setTempCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSetFamilyId(tempCode)} className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-5 text-center text-xl font-black uppercase text-[#1675F2]" placeholder="코드 입력" />
              <button onClick={() => handleSetFamilyId(tempCode)} className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black shadow-xl">여행 시작하기</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-white fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[100] px-6 pt-9 pb-3 border-b border-[#566873]/5 h-[118px]">
            <div className="flex justify-between items-center h-full">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isSaving ? (
                    <span className="px-2 py-0.5 bg-blue-100 text-[#1675F2] text-[9px] font-black rounded-full flex items-center gap-1">
                      <Loader2 size={8} className="animate-spin" /> SAVING...
                    </span>
                  ) : !isInitialLoadDone ? (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full flex items-center gap-1">
                      <RefreshCcw size={8} className="animate-spin" /> SYNCING...
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full flex items-center gap-1">
                      <CheckCircle size={8} /> LIVE
                    </span>
                  )}
                  <span className="text-[10px] font-black text-slate-300">ID: {familyId}</span>
                </div>
                <h1 className="text-xl font-black text-[#1675F2] tracking-tighter">{SCHEDULE_DATA.title}</h1>
              </div>
              <button onClick={() => setIsMenuOpen(true)} className="p-2.5 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"><Menu size={20}/></button>
            </div>
          </header>
          
          <main className="flex-1 px-4 pt-[118px] pb-32">
            {!isInitialLoadDone && !expenses.length && !souvenirs.length ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-[#1675F2]" size={32} />
                <p className="text-[10px] font-black text-[#1675F2] uppercase tracking-widest">데이터 불러오는 중...</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {activeTab === 'schedule' && <ScheduleView />}
                {activeTab === 'rules' && <RulesView />}
                {activeTab === 'settlement' && <SettlementView expenses={expenses} setExpenses={updateExpenses} />}
                {activeTab === 'souvenir' && <SouvenirView souvenirs={souvenirs} setSouvenirs={updateSouvenirs} />}
                {activeTab === 'ai' && <AIChatView />}
              </div>
            )}
          </main>

          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[468px] bg-[#1675F2] rounded-full px-2 py-2 shadow-2xl z-[150] flex justify-between items-center border border-white/10">
            {[
              { id: 'schedule', label: '일정', icon: Calendar },
              { id: 'rules', label: '규칙', icon: ShieldCheck },
              { id: 'settlement', label: '정산', icon: Calculator },
              { id: 'souvenir', label: '기념품', icon: ShoppingBag },
              { id: 'ai', label: 'AI', icon: MessageSquare },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center justify-center h-12 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-[#F2E96D] text-[#1675F2] px-6 shadow-lg' : 'text-white/50 w-12'}`}>
                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
                {activeTab === tab.id && <span className="ml-2 text-[11px] font-black">{tab.label}</span>}
              </button>
            ))}
          </nav>

          {isMenuOpen && (
            <div className="fixed inset-0 z-[700] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}>
              <div className="absolute right-0 top-0 h-full w-[85%] bg-white p-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-10">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Settings</span>
                  <button onClick={() => setIsMenuOpen(false)}><X size={24}/></button>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="p-8 bg-[#F8F9FD] rounded-[2.5rem] border border-slate-100 space-y-2">
                    <p className="text-[10px] font-black text-slate-400">현재 가족 코드</p>
                    <p className="text-3xl font-black text-[#1675F2] uppercase">{familyId}</p>
                    {lastSyncedAt && (
                      <p className="text-[9px] font-bold text-slate-300">최근 동기화: {lastSyncedAt.toLocaleTimeString()}</p>
                    )}
                  </div>
                  
                  <button onClick={() => { setIsMenuOpen(false); fetchFamilyData(familyId!); }} className="w-full py-5 bg-[#F1F2F0] text-[#566873] rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <RefreshCcw size={16} />데이터 강제 동기화
                  </button>

                  <button onClick={() => setShowResetConfirm(true)} className="w-full py-5 bg-red-50 text-red-500 rounded-2xl text-sm font-black flex items-center justify-center gap-2">
                    <LogOut size={16} />연결 해제
                  </button>

                  {showResetConfirm && (
                    <div className="p-6 bg-red-500 rounded-3xl text-white space-y-4 animate-in zoom-in-95">
                      <p className="text-xs font-bold text-center">연결을 해제하시겠습니까?</p>
                      <div className="flex gap-2">
                        <button onClick={handleReset} className="flex-1 py-3 bg-white text-red-500 rounded-xl font-black">확인</button>
                        <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black">취소</button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-center text-[9px] font-bold text-slate-200 uppercase tracking-widest pb-4">Family Trip Planner 2026</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
