
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Calendar, ShieldCheck, Calculator, ShoppingBag, Wallet, Menu, X, RefreshCcw, Loader2, KeyRound, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ScheduleView from './components/ScheduleView';
import RulesView from './components/RulesView';
import SettlementView from './components/SettlementView';
import SouvenirView from './components/SouvenirView';
import PublicFundView from './components/PublicFundView';
import { Expense, Souvenir, PublicFundTransaction } from './types';
import { SCHEDULE_DATA } from './constants';

const getSupabaseConfig = () => {
  const env = (import.meta as any).env || {};
  const url = env.VITE_SUPABASE_URL || '';
  const anonKey = env.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey, isMissing: !url || !anonKey };
};

const config = getSupabaseConfig();
const supabase = !config.isMissing ? createClient(config.url, config.anonKey) : null;

type TabType = 'schedule' | 'rules' | 'settlement' | 'souvenir' | 'fund';

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
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [fundTransactions, setFundTransactions] = useState<PublicFundTransaction[]>([]);
  
  const initialLoadCompletedRef = useRef<boolean>(false);
  const isUserActionRef = useRef<boolean>(false); 
  const fetchLock = useRef<boolean>(false);

  const mergeCollection = <T extends { id: string }>(local: T[], server: T[]): T[] => {
    const merged = [...local];
    server.forEach(serverItem => {
      const exists = merged.find(localItem => localItem.id === serverItem.id);
      if (!exists) {
        merged.push(serverItem);
      } else {
        const idx = merged.findIndex(m => m.id === serverItem.id);
        merged[idx] = serverItem;
      }
    });
    return merged;
  };

  const mergeAllData = useCallback((serverData: any) => {
    const safeE = Array.isArray(serverData.expenses) ? serverData.expenses : [];
    const safeS = Array.isArray(serverData.souvenirs) ? serverData.souvenirs : [];
    // DB 컬럼명을 public_fund로 매핑 (기존 pack_items 데이터가 있다면 무시됨)
    const safeF = Array.isArray(serverData.public_fund) ? serverData.public_fund : []; 

    setExpenses(prev => mergeCollection<Expense>(prev, safeE).sort((a, b) => b.date - a.date));
    setSouvenirs(prev => mergeCollection<Souvenir>(prev, safeS));
    setFundTransactions(prev => mergeCollection<PublicFundTransaction>(prev, safeF).sort((a, b) => b.date - a.date));
  }, []);

  useEffect(() => {
    if (!familyId || !supabase) return;

    const channel = supabase
      .channel(`sync-${familyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'family_state', filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (!isSaving) {
            mergeAllData(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, mergeAllData, isSaving]);

  const fetchFamilyData = useCallback(async (id: string, isSilent = false) => {
    if (!supabase || fetchLock.current) return;
    fetchLock.current = true;
    if (!isSilent && !isInitialLoadDone) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('family_state')
        .select('expenses, souvenirs, public_fund') // public_fund 컬럼 조회
        .eq('family_id', id.toUpperCase())
        .maybeSingle();
        
      if (error) throw error;
      if (data) mergeAllData(data);
      
      initialLoadCompletedRef.current = true;
      setIsInitialLoadDone(true);
      setSaveError(null);
    } catch (e) { 
      console.error("Fetch error:", e);
      if (!isSilent) setSaveError("데이터 동기화 실패");
    } finally { 
      setIsLoading(false); 
      fetchLock.current = false;
    }
  }, [isInitialLoadDone, mergeAllData]);

  const saveToSupabase = useCallback(async () => {
    if (!familyId || !supabase || !initialLoadCompletedRef.current || isSaving) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('family_state').upsert({
        family_id: familyId,
        expenses: expenses,
        souvenirs: souvenirs,
        public_fund: fundTransactions, // public_fund 컬럼으로 저장
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setSaveError(null);
      isUserActionRef.current = false; 
    } catch (e: any) {
      console.error("저장 실패:", e);
      setSaveError("서버 저장 중 충돌이 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [familyId, expenses, souvenirs, fundTransactions, isSaving]);

  useEffect(() => {
    if (!isUserActionRef.current || !initialLoadCompletedRef.current) return;
    const timer = setTimeout(() => saveToSupabase(), 1500); 
    return () => clearTimeout(timer);
  }, [expenses, souvenirs, fundTransactions, saveToSupabase]);

  const updateExpenses = (updater: React.SetStateAction<Expense[]>) => {
    isUserActionRef.current = true;
    setExpenses(updater);
  };

  const updateSouvenirs = (updater: React.SetStateAction<Souvenir[]>) => {
    isUserActionRef.current = true;
    setSouvenirs(updater);
  };

  const updateFundTransactions = (updater: React.SetStateAction<PublicFundTransaction[]>) => {
    isUserActionRef.current = true;
    setFundTransactions(updater);
  };

  useEffect(() => { 
    if (familyId && !isInitialLoadDone) fetchFamilyData(familyId); 
  }, [familyId, isInitialLoadDone, fetchFamilyData]);

  if (config.isMissing) return <div className="p-10 text-red-500 font-bold">Supabase Config Missing</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col max-w-[500px] mx-auto relative font-sans text-[#566873]">
      {!familyId ? (
        <div className="fixed inset-0 z-[1000] bg-[#1675F2] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[360px] rounded-[3rem] p-10 shadow-2xl space-y-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#F2E96D] text-[#1675F2] rounded-3xl flex items-center justify-center mx-auto mb-2"><KeyRound size={32} /></div>
            <h2 className="text-2xl font-black text-[#1675F2] tracking-tighter">우리 가족 코드</h2>
            <div className="space-y-4">
              <input type="text" value={tempCode} onChange={(e) => setTempCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && familyId === null && setFamilyId(tempCode.trim().toUpperCase())} className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-5 text-center text-xl font-black uppercase text-[#1675F2]" placeholder="코드 입력" />
              <button onClick={() => { if(tempCode.trim()) setFamilyId(tempCode.trim().toUpperCase()); }} className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all">여행 시작하기</button>
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
                    <span className="px-2 py-0.5 bg-blue-100 text-[#1675F2] text-[9px] font-black rounded-full flex items-center gap-1"><Loader2 size={8} className="animate-spin" /> SAVING...</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full flex items-center gap-1"><CheckCircle size={8} /> LIVE SYNCED</span>
                  )}
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID: {familyId}</span>
                </div>
                <h1 className="text-xl font-black text-[#1675F2] tracking-tighter">{SCHEDULE_DATA.title}</h1>
              </div>
              <button onClick={() => setIsMenuOpen(true)} className="p-2.5 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors">
                <Menu size={20}/>
              </button>
            </div>
          </header>
          
          <main className="flex-1 px-4 pt-[118px] pb-32">
            {saveError && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-700 text-[11px] font-black animate-in slide-in-from-top-2">
                <AlertCircle size={14} /> {saveError}
              </div>
            )}
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-[#1675F2]" size={32} />
                <p className="text-[10px] font-black text-[#1675F2] uppercase tracking-widest text-center">가족 데이터를 동기화 중...</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                {activeTab === 'schedule' && <ScheduleView />}
                {activeTab === 'rules' && <RulesView />}
                {activeTab === 'settlement' && <SettlementView expenses={expenses} setExpenses={updateExpenses} />}
                {activeTab === 'souvenir' && <SouvenirView souvenirs={souvenirs} setSouvenirs={updateSouvenirs} />}
                {activeTab === 'fund' && <PublicFundView transactions={fundTransactions} setTransactions={updateFundTransactions} />}
              </div>
            )}
          </main>

          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[468px] bg-[#1675F2] rounded-full px-2 py-2 shadow-2xl z-[150] flex justify-between items-center border border-white/10">
            {[
              { id: 'schedule', label: '일정', icon: Calendar },
              { id: 'rules', label: '규칙', icon: ShieldCheck },
              { id: 'fund', label: '공금', icon: Wallet },
              { id: 'settlement', label: '개별정산', icon: Calculator },
              { id: 'souvenir', label: '쇼핑', icon: ShoppingBag },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center justify-center h-12 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-[#F2E96D] text-[#1675F2] px-6 shadow-lg' : 'text-white/50 w-12'}`}>
                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
                {activeTab === tab.id && <span className="ml-2 text-[11px] font-black">{tab.label}</span>}
              </button>
            ))}
          </nav>

          {isMenuOpen && (
            <div className="fixed inset-0 z-[700] bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMenuOpen(false)}>
              <div className="absolute right-0 top-0 h-full w-[85%] bg-white p-10 flex flex-col shadow-2xl animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-10"><span className="text-[10px] font-black text-slate-300 uppercase">Settings</span><button onClick={() => setIsMenuOpen(false)}><X size={24}/></button></div>
                
                <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                  <div className="p-8 bg-[#F8F9FD] rounded-[2.5rem] border border-slate-100 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">현재 가족 코드</p>
                    <p className="text-3xl font-black text-[#1675F2] uppercase">{familyId}</p>
                  </div>
                  <button onClick={() => { fetchFamilyData(familyId!, false); setIsMenuOpen(false); }} className="w-full py-5 bg-[#F1F2F0] text-[#566873] rounded-2xl text-sm font-black flex items-center justify-center gap-2">
                    <RefreshCcw size={16} />데이터 새로고침
                  </button>
                  <button onClick={() => { localStorage.removeItem('family_id'); window.location.reload(); }} className="w-full py-5 bg-red-50 text-red-500 rounded-2xl text-sm font-black flex items-center justify-center gap-2">
                    <LogOut size={16} />연결 해제
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
