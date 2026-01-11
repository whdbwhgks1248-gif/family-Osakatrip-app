
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, ShieldCheck, Calculator, ShoppingBag, MessageSquare, Menu, X, RefreshCcw, Loader2, KeyRound, Globe, LogOut, WifiOff, CheckCircle } from 'lucide-react';
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
  
  // 데이터 안전 장치: 서버 로딩이 완전히 끝나야만 저장이 가능함
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  
  // 무한 저장 방지 및 로컬/서버 동기화 상태 추적용 Ref
  const lastSavedRef = useRef<string>("");
  const fetchInProgress = useRef(false);

  // 1. 실시간 데이터 동기화 구독
  useEffect(() => {
    if (!supabase || !familyId || !isInitialLoadDone) return;
    
    const channel = supabase
      .channel(`realtime-family-${familyId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'family_state', filter: `family_id=eq.${familyId}` },
        (payload) => {
          const newData = payload.new as any;
          if (newData) {
            const dataString = JSON.stringify({ e: newData.expenses, s: newData.souvenirs });
            // 내가 저장한 데이터가 돌아온 것이 아닐 때만 업데이트 (루프 방지)
            if (dataString !== lastSavedRef.current) {
              setExpenses(Array.isArray(newData.expenses) ? newData.expenses : []);
              setSouvenirs(Array.isArray(newData.souvenirs) ? newData.souvenirs : []);
              lastSavedRef.current = dataString;
            }
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId, isInitialLoadDone]);

  // 2. 초기 데이터 가져오기
  const fetchFamilyData = useCallback(async (id: string) => {
    if (!supabase || fetchInProgress.current) return;
    fetchInProgress.current = true;
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
        // 불러온 시점의 상태를 '마지막 저장 상태'로 기록
        lastSavedRef.current = JSON.stringify({ e: safeE, s: safeS });
      } else {
        // 데이터가 없는 경우 새로 생성
        await supabase.from('family_state').upsert({ family_id: cleanId, expenses: [], souvenirs: [] });
        lastSavedRef.current = JSON.stringify({ e: [], s: [] });
      }
      
      // 불러오기가 확실히 끝났을 때만 저장 권한 부여
      setIsInitialLoadDone(true);
    } catch (e) { 
      console.error("데이터 로드 실패:", e);
    } finally { 
      setIsLoading(false); 
      fetchInProgress.current = false;
    }
  }, []);

  // 3. 서버에 데이터 저장하기
  const saveToSupabase = useCallback(async (id: string, newExpenses: Expense[], newSouvenirs: Souvenir[]) => {
    if (!id || !supabase || !isInitialLoadDone) return;
    
    const currentString = JSON.stringify({ e: newExpenses, s: newSouvenirs });
    // 서버 데이터와 로컬 데이터가 같으면 저장하지 않음 (네트워크 낭비 방지)
    if (currentString === lastSavedRef.current) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('family_state').upsert({ 
        family_id: id.toUpperCase(), 
        expenses: newExpenses, 
        souvenirs: newSouvenirs, 
        updated_at: new Date().toISOString() 
      });
      if (error) throw error;
      lastSavedRef.current = currentString;
    } catch (e) { 
      console.error("저장 실패:", e); 
    } finally { 
      // 저장 완료 후 잠시 표시를 유지하기 위해 약간의 딜레이
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [isInitialLoadDone]);

  // ID 변경 시 로드
  useEffect(() => { 
    if (familyId) {
      setIsInitialLoadDone(false);
      fetchFamilyData(familyId); 
    }
  }, [familyId, fetchFamilyData]);

  // 자동 저장 타이머 (데이터 변경 시 1.2초 후 실행)
  useEffect(() => {
    if (!familyId || isLoading || isResetting || !isInitialLoadDone) return;
    
    const timeout = setTimeout(() => { 
      saveToSupabase(familyId, expenses, souvenirs); 
    }, 1200);
    
    return () => clearTimeout(timeout);
  }, [expenses, souvenirs, familyId, saveToSupabase, isLoading, isResetting, isInitialLoadDone]);

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
      setIsInitialLoadDone(false);
      setIsResetting(false);
      setIsMenuOpen(false);
      setShowResetConfirm(false);
    }, 800);
  };

  if (config.isMissing) {
    return <div className="p-10 text-center font-bold text-red-500">Supabase 설정이 필요합니다.</div>;
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col max-w-[500px] mx-auto relative font-sans text-[#566873]">
      {!familyId ? (
        <div className="fixed inset-0 z-[1000] bg-[#1675F2] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[360px] rounded-[3rem] p-10 shadow-2xl space-y-8">
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
                  ) : (
                    <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full flex items-center gap-1">
                      <CheckCircle size={8} /> LIVE
                    </span>
                  )}
                  <span className="text-[10px] font-black text-slate-300">ID: {familyId}</span>
                </div>
                <h1 className="text-xl font-black text-[#1675F2] tracking-tighter">{SCHEDULE_DATA.title}</h1>
              </div>
              <button onClick={() => setIsMenuOpen(true)} className="p-2.5 bg-slate-50 text-slate-400 rounded-full"><Menu size={20}/></button>
            </div>
          </header>
          <main className="flex-1 px-4 pt-[118px] pb-32">
            {isLoading && !isInitialLoadDone ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-[#1675F2]" size={32} />
                <p className="text-[10px] font-black text-[#1675F2] uppercase tracking-widest">데이터 동기화 중...</p>
              </div>
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
          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[468px] bg-[#1675F2] rounded-full px-2 py-2 shadow-2xl z-[150] flex justify-between items-center border border-white/10">
            {[
              { id: 'schedule', label: '일정', icon: Calendar },
              { id: 'rules', label: '규칙', icon: ShieldCheck },
              { id: 'settlement', label: '정산', icon: Calculator },
              { id: 'souvenir', label: '기념품', icon: ShoppingBag },
              { id: 'ai', label: 'AI', icon: MessageSquare },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center justify-center h-12 rounded-full transition-all ${activeTab === tab.id ? 'bg-[#F2E96D] text-[#1675F2] px-6' : 'text-white/50 w-12'}`}>
                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
                {activeTab === tab.id && <span className="ml-2 text-[11px] font-black">{tab.label}</span>}
              </button>
            ))}
          </nav>
          {isMenuOpen && (
            <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm">
              <div className="absolute right-0 top-0 h-full w-[85%] bg-white p-10 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-10"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Settings</span><button onClick={() => setIsMenuOpen(false)}><X size={24}/></button></div>
                <div className="flex-1 space-y-6">
                  <div className="p-8 bg-[#F8F9FD] rounded-[2.5rem] border border-slate-100 space-y-2"><p className="text-[10px] font-black text-slate-400">현재 가족 코드</p><p className="text-3xl font-black text-[#1675F2] uppercase">{familyId}</p></div>
                  <button onClick={() => fetchFamilyData(familyId)} className="w-full py-5 bg-[#F1F2F0] text-[#566873] rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95"><RefreshCcw size={16} />데이터 강제 새로고침</button>
                  <button onClick={() => setShowResetConfirm(true)} className="w-full py-5 bg-red-50 text-red-500 rounded-2xl text-sm font-black flex items-center justify-center gap-2"><LogOut size={16} />연결 해제</button>
                  {showResetConfirm && (
                    <div className="p-6 bg-red-500 rounded-3xl text-white space-y-4">
                      <p className="text-xs font-bold text-center">정말 연결을 해제할까요?</p>
                      <div className="flex gap-2"><button onClick={handleResetFamilyId} className="flex-1 py-3 bg-white text-red-500 rounded-xl font-black">해제</button><button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black">취소</button></div>
                    </div>
                  )}
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
