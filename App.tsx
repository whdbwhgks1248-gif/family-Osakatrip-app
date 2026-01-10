
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, ShieldCheck, Calculator, ShoppingBag, MessageSquare, Menu, X, RefreshCcw, Loader2, KeyRound, Globe, LogOut, WifiOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ScheduleView from './components/ScheduleView.tsx';
import RulesView from './components/RulesView.tsx';
import SettlementView from './components/SettlementView.tsx';
import SouvenirView from './components/SouvenirView.tsx';
import AIChatView from './components/AIChatView.tsx';
import { Expense, Souvenir } from './types.ts';
import { SCHEDULE_DATA } from './constants.tsx';

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

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!supabase || !familyId) return;
    const channel = supabase
      .channel(`realtime-family-${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_state', filter: `family_id=eq.${familyId}` },
        (payload) => {
          const newData = payload.new as any;
          if (newData) {
            const safeExpenses = Array.isArray(newData.expenses) ? newData.expenses : [];
            const safeSouvenirs = Array.isArray(newData.souvenirs) ? newData.souvenirs : [];
            setExpenses(safeExpenses);
            setSouvenirs(safeSouvenirs);
            lastSavedRef.current = JSON.stringify({ e: safeExpenses, s: safeSouvenirs });
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId]);

  const fetchFamilyData = useCallback(async (id: string) => {
    if (!supabase) return;
    setIsLoading(true);
    const cleanId = id.trim().toUpperCase();
    try {
      const { data, error } = await supabase.from('family_state').select('*').eq('family_id', cleanId).maybeSingle();
      if (error) throw error;
      if (data) {
        const safeE = Array.isArray(data.expenses) ? data.expenses : [];
        const safeS = Array.isArray(data.souvenirs) ? data.souvenirs : [];
        setExpenses(safeE);
        setSouvenirs(safeS);
        lastSavedRef.current = JSON.stringify({ e: safeE, s: safeS });
      } else {
        await supabase.from('family_state').upsert({ family_id: cleanId, expenses: [], souvenirs: [] });
      }
    } catch (e) { 
      console.error("Fetch Error:", e); 
      setExpenses([]);
      setSouvenirs([]);
    } finally { 
      setIsLoading(false); 
    }
  }, []);

  const saveToSupabase = useCallback(async (id: string, newExpenses: Expense[], newSouvenirs: Souvenir[]) => {
    if (!id || !supabase) return;
    const currentString = JSON.stringify({ e: newExpenses, s: newSouvenirs });
    if (currentString === lastSavedRef.current) return;
    setIsSaving(true);
    try {
      await supabase.from('family_state').upsert({ family_id: id.toUpperCase(), expenses: newExpenses, souvenirs: newSouvenirs, updated_at: new Date().toISOString() });
      lastSavedRef.current = currentString;
    } catch (e) { console.error("Save Error:", e); } finally { setIsSaving(false); }
  }, []);

  useEffect(() => { if (familyId) fetchFamilyData(familyId); }, [familyId, fetchFamilyData]);

  useEffect(() => {
    if (!familyId || isLoading || isResetting) return;
    const timeout = setTimeout(() => { saveToSupabase(familyId, expenses, souvenirs); }, 1200);
    return () => clearTimeout(timeout);
  }, [expenses, souvenirs, familyId, saveToSupabase, isLoading, isResetting]);

  const handleSetFamilyId = (code: string) => {
    let cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    localStorage.setItem('family_id', cleanCode);
    setFamilyId(cleanCode);
    setTempCode('');
  };

  const handleResetFamilyId = () => {
    setIsResetting(true);
    setTimeout(() => {
      localStorage.removeItem('family_id');
      setFamilyId(null);
      setExpenses([]);
      setSouvenirs([]);
      setIsResetting(false);
      setIsMenuOpen(false);
      setShowResetConfirm(false);
    }, 800);
  };

  if (config.isMissing) {
    return (
      <div className="fixed inset-0 bg-[#F8F9FD] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-red-100 max-w-sm w-full text-center space-y-8">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto"><WifiOff size={40} /></div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter">연결 설정 필요</h2>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Vercel 환경 변수 설정 후<br/>반드시 <b>Redeploy</b>를 해주세요.</p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black shadow-xl">새로고침</button>
        </div>
      </div>
    );
  }

  if (isResetting) {
    return (
      <div className="fixed inset-0 bg-[#1675F2] flex flex-col items-center justify-center z-[2000] text-white gap-4">
        <Loader2 className="animate-spin text-[#F2E96D]" size={40} /><p className="font-black tracking-widest uppercase text-xs">연결 해제 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col max-w-[500px] mx-auto relative font-sans text-[#566873]">
      {!familyId ? (
        <div className="fixed inset-0 z-[1000] bg-[#1675F2] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-[360px] rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#F2E96D] text-[#1675F2] rounded-3xl flex items-center justify-center mx-auto mb-2"><KeyRound size={32} /></div>
              <h2 className="text-2xl font-black text-[#1675F2] tracking-tighter">우리 가족 코드</h2>
              <p className="text-sm text-slate-400 font-bold leading-tight">가족끼리 맞춘 코드를 입력하면<br/>실시간으로 공유됩니다.</p>
            </div>
            <div className="space-y-4">
              <input type="text" value={tempCode} onChange={(e) => setTempCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSetFamilyId(tempCode)} className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-5 text-center text-xl font-black uppercase text-[#1675F2] placeholder:text-slate-300" placeholder="코드 입력" />
              <button onClick={() => handleSetFamilyId(tempCode)} disabled={!tempCode.trim()} className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50">여행 시작하기</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-white fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[100] px-6 pt-9 pb-3 border-b border-[#566873]/5 shadow-sm h-[118px]">
            <div className="flex justify-between items-center h-full">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full animate-pulse">LIVE SYNC</span>
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-300"><Globe size={10} /><span>ID: {familyId}</span></div>
                </div>
                <h1 className="text-xl font-black text-[#1675F2] tracking-tighter">{SCHEDULE_DATA.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && <RefreshCcw size={14} className="text-blue-400 animate-spin mr-1" />}
                <button onClick={() => setIsMenuOpen(true)} className="p-2.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-full active:scale-90 transition-all"><Menu size={20}/></button>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 pt-[118px] pb-32">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 className="animate-spin text-[#1675F2]" size={32} /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">데이터 불러오는 중...</p></div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {activeTab === 'schedule' && <ScheduleView />}
                {activeTab === 'rules' && <RulesView />}
                {activeTab === 'settlement' && <SettlementView expenses={expenses} setExpenses={setExpenses} />}
                {activeTab === 'souvenir' && <SouvenirView souvenirs={souvenirs} setSouvenirs={setSouvenirs} />}
                {activeTab === 'ai' && <AIChatView />}
              </div>
            )}
          </main>
          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[468px] bg-[#1675F2] rounded-full px-2 py-2 shadow-2xl z-[150] flex justify-between items-center border border-white/10 backdrop-blur-md">
            {[
              { id: 'schedule', label: '일정', icon: Calendar },
              { id: 'rules', label: '규칙', icon: ShieldCheck },
              { id: 'settlement', label: '정산', icon: Calculator },
              { id: 'souvenir', label: '기념품', icon: ShoppingBag },
              { id: 'ai', label: 'AI', icon: MessageSquare },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center justify-center h-12 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-[#F2E96D] text-[#1675F2] px-6' : 'text-white/50 w-12 hover:text-white'}`}>
                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
                {activeTab === tab.id && <span className="ml-2 text-[11px] font-black tracking-tight">{tab.label}</span>}
              </button>
            ))}
          </nav>
          {isMenuOpen && (
            <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm animate-in fade-in">
              <div className="absolute right-0 top-0 h-full w-[85%] bg-white p-10 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
                <div className="flex justify-between items-center mb-10"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Settings</span><button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
                <div className="flex-1 space-y-6">
                  <div className="p-8 bg-[#F8F9FD] rounded-[2.5rem] border border-slate-100 space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">현재 가족 코드</p><p className="text-3xl font-black text-[#1675F2] tracking-tighter uppercase">{familyId}</p><p className="text-xs font-bold text-slate-400 leading-relaxed">가족들에게 이 코드를 알려주면 모두 함께 실시간으로 일정을 관리할 수 있습니다.</p></div>
                  <button onClick={() => setShowResetConfirm(true)} className="w-full py-5 bg-red-50 text-red-500 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition-all"><LogOut size={16} />연결 해제 및 코드 변경</button>
                  {showResetConfirm && (
                    <div className="p-6 bg-red-500 rounded-3xl text-white space-y-4 animate-in slide-in-from-bottom-4"><p className="text-xs font-bold leading-relaxed text-center">정말 연결을 해제할까요?<br/>기존 코드를 다시 입력하면 데이터는 유지됩니다.</p>
                      <div className="flex gap-2"><button onClick={handleResetFamilyId} className="flex-1 py-3 bg-white text-red-500 rounded-xl text-[11px] font-black">해제하기</button><button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[11px] font-black">취소</button></div>
                    </div>
                  )}
                </div>
                <p className="text-center text-[10px] font-black text-slate-200 tracking-widest uppercase">Family Trip Planner v1.5</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
