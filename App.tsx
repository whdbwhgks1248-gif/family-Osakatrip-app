
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Calendar, ShieldCheck, Calculator, ShoppingBag, Briefcase, Menu, X, RefreshCcw, Loader2, KeyRound, LogOut, CheckCircle, AlertCircle, HardDrive, BarChart3, CloudOff, CloudSync } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ScheduleView from './components/ScheduleView';
import RulesView from './components/RulesView';
import SettlementView from './components/SettlementView';
import SouvenirView from './components/SouvenirView';
import PackView from './components/PackView';
import { Expense, Souvenir, PackItem } from './types';
import { SCHEDULE_DATA } from './constants';

const getSupabaseConfig = () => {
  const env = (import.meta as any).env || {};
  const url = env.VITE_SUPABASE_URL || '';
  const anonKey = env.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey, isMissing: !url || !anonKey };
};

const config = getSupabaseConfig();
const supabase = !config.isMissing ? createClient(config.url, config.anonKey) : null;

type TabType = 'schedule' | 'rules' | 'settlement' | 'souvenir' | 'pack';

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
  const [showSizeDetails, setShowSizeDetails] = useState(false);
  
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [packItems, setPackItems] = useState<PackItem[]>([]);
  
  const lastServerDataRef = useRef<string>(""); 
  const isUserActionRef = useRef<boolean>(false); 
  const initialLoadCompletedRef = useRef<boolean>(false);
  const fetchLock = useRef<boolean>(false);

  // 고유 ID를 기반으로 데이터를 병합하는 함수 (중요: 데이터 유실 방지)
  const mergeCollection = <T extends { id: string }>(local: T[], server: T[]): T[] => {
    const merged = [...local];
    server.forEach(serverItem => {
      const exists = merged.find(localItem => localItem.id === serverItem.id);
      if (!exists) {
        // 내 리스트에 없는 항목(다른 사람이 추가한 것)만 추가
        merged.push(serverItem);
      } else {
        // 이미 있는 항목이라면? 
        // 실시간 업데이트의 경우 서버가 최신이므로 서버 데이터로 동기화 (단, 내가 수정 중인 항목이 아닐 때만 - 이 앱은 항목 단위 편집이므로 ID 일치 시 교체)
        const idx = merged.findIndex(m => m.id === serverItem.id);
        merged[idx] = serverItem;
      }
    });
    return merged;
  };

  const mergeAllData = useCallback((serverData: any) => {
    const safeE = Array.isArray(serverData.expenses) ? serverData.expenses : [];
    const safeS = Array.isArray(serverData.souvenirs) ? serverData.souvenirs : [];
    const safeP = Array.isArray(serverData.pack_items) ? serverData.pack_items : [];

    // Explicitly add generic type parameters to fix the TypeScript error on line 71 where b.date was not being found.
    setExpenses(prev => mergeCollection<Expense>(prev, safeE).sort((a, b) => b.date - a.date));
    setSouvenirs(prev => mergeCollection<Souvenir>(prev, safeS));
    setPackItems(prev => mergeCollection<PackItem>(prev, safeP));

    lastServerDataRef.current = JSON.stringify({ e: safeE, s: safeS, p: safeP });
  }, []);

  // [실시간 동기화 리스너]
  useEffect(() => {
    if (!familyId || !supabase) return;

    const channel = supabase
      .channel(`sync-${familyId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'family_state', 
          filter: `family_id=eq.${familyId}` 
        },
        (payload) => {
          // 내가 지금 "저장 중"인 찰나가 아니라면 실시간으로 데이터를 합칩니다.
          // isUserActionRef가 true라도 새로운 ID를 가진 데이터는 받아와야 합니다.
          if (!isSaving) {
            console.log("실시간 업데이트 감지: 데이터 병합 중...");
            mergeAllData(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, mergeAllData, isSaving]);

  const getCurrentDataStr = useCallback(() => {
    return JSON.stringify({ e: expenses, s: souvenirs, p: packItems });
  }, [expenses, souvenirs, packItems]);

  const stats = useMemo(() => {
    if (!isMenuOpen) return { sizeMB: "0.00", items: [] };
    const dataStr = getCurrentDataStr();
    const sizeMB = (new Blob([dataStr]).size / (1024 * 1024)).toFixed(2);
    const items = souvenirs.map(s => ({
      title: s.title || '이름 없음',
      size: (new Blob([JSON.stringify(s)]).size / 1024).toFixed(1) + 'KB'
    })).sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
    return { sizeMB, items };
  }, [isMenuOpen, souvenirs, getCurrentDataStr]);

  const isOutOfSync = useMemo(() => isUserActionRef.current, [isUserActionRef.current]);

  const fetchFamilyData = useCallback(async (id: string, isSilent = false) => {
    if (!supabase || fetchLock.current) return;
    fetchLock.current = true;
    
    if (!isSilent && !isInitialLoadDone) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('family_state')
        .select('expenses, souvenirs, pack_items')
        .eq('family_id', id.toUpperCase())
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        mergeAllData(data);
      }
      
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
    
    // 저장 전 한 번 더 병합할 수도 있지만, Realtime이 계속 병합해주므로 현재 상태가 최선이라고 가정
    const dataStr = getCurrentDataStr();
    const sizeInMB = new Blob([dataStr]).size / (1024 * 1024);

    if (sizeInMB > 9.8) {
      setSaveError(`용량 초과 (${sizeInMB.toFixed(1)}MB)! 사진을 줄여주세요.`);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('family_state').upsert({
        family_id: familyId,
        expenses: expenses,
        souvenirs: souvenirs,
        pack_items: packItems,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      
      lastServerDataRef.current = dataStr;
      setSaveError(null);
      isUserActionRef.current = false; 
    } catch (e: any) {
      console.error("저장 실패:", e);
      setSaveError("서버 저장 중 충돌이 발생했습니다. 다시 시도합니다.");
    } finally {
      setIsSaving(false);
    }
  }, [familyId, expenses, souvenirs, packItems, getCurrentDataStr, isSaving]);

  useEffect(() => {
    if (!isUserActionRef.current || !initialLoadCompletedRef.current) return;
    const timer = setTimeout(() => {
      saveToSupabase();
    }, 1500); 
    return () => clearTimeout(timer);
  }, [expenses, souvenirs, packItems, saveToSupabase]);

  const updateExpenses = (updater: React.SetStateAction<Expense[]>) => {
    isUserActionRef.current = true;
    setExpenses(updater);
  };

  const updateSouvenirs = (updater: React.SetStateAction<Souvenir[]>) => {
    isUserActionRef.current = true;
    setSouvenirs(updater);
  };

  const updatePackItems = (updater: React.SetStateAction<PackItem[]>) => {
    isUserActionRef.current = true;
    setPackItems(updater);
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
                  ) : isOutOfSync ? (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black rounded-full flex items-center gap-1"><CloudOff size={8} /> LOCAL CHANGED</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full flex items-center gap-1"><CheckCircle size={8} /> MULTI-SYNCED</span>
                  )}
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID: {familyId}</span>
                </div>
                <h1 className="text-xl font-black text-[#1675F2] tracking-tighter">{SCHEDULE_DATA.title}</h1>
              </div>
              <button onClick={() => setIsMenuOpen(true)} className="p-2.5 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors relative">
                <Menu size={20}/>
                {isOutOfSync && <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></div>}
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
                <p className="text-[10px] font-black text-[#1675F2] uppercase tracking-widest text-center">동기화된 가족 데이터를<br/>불러오는 중입니다...</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                {activeTab === 'schedule' && <ScheduleView />}
                {activeTab === 'rules' && <RulesView />}
                {activeTab === 'settlement' && <SettlementView expenses={expenses} setExpenses={updateExpenses} />}
                {activeTab === 'souvenir' && <SouvenirView souvenirs={souvenirs} setSouvenirs={updateSouvenirs} />}
                {activeTab === 'pack' && <PackView packItems={packItems} setPackItems={updatePackItems} />}
              </div>
            )}
          </main>

          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[468px] bg-[#1675F2] rounded-full px-2 py-2 shadow-2xl z-[150] flex justify-between items-center border border-white/10">
            {[
              { id: 'schedule', label: '일정', icon: Calendar },
              { id: 'rules', label: '규칙', icon: ShieldCheck },
              { id: 'settlement', label: '정산', icon: Calculator },
              { id: 'souvenir', label: '기념품', icon: ShoppingBag },
              { id: 'pack', label: '준비물', icon: Briefcase },
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

                  <div className="p-6 bg-white rounded-3xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2 text-[#566873]">
                        <HardDrive size={16} />
                        <span className="text-xs font-black">저장 공간 사용량</span>
                      </div>
                      <span className={`text-[11px] font-black ${Number(stats.sizeMB) > 8 ? 'text-red-500' : 'text-[#1675F2]'}`}>{stats.sizeMB}MB / 8.0MB</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${Number(stats.sizeMB) > 8 ? 'bg-red-500' : Number(stats.sizeMB) > 6 ? 'bg-orange-400' : 'bg-[#1675F2]'}`}
                        style={{ width: `${Math.min((Number(stats.sizeMB) / 8.0) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <button onClick={() => setShowSizeDetails(!showSizeDetails)} className="text-[9px] text-[#1675F2] font-black flex items-center gap-1 uppercase tracking-widest">
                      <BarChart3 size={10} /> {showSizeDetails ? '분석 닫기' : '아이템별 용량 분석'}
                    </button>
                    {showSizeDetails && (
                      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                        {stats.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] font-bold border-b border-slate-50 pb-1">
                            <span className="text-slate-500 truncate mr-2">{item.title}</span>
                            <span className="text-[#1675F2] shrink-0">{item.size}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
