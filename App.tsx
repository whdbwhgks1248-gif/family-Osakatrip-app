
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
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSizeDetails, setShowSizeDetails] = useState(false);
  
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [packItems, setPackItems] = useState<PackItem[]>([]);
  
  const lastServerDataRef = useRef<string>(""); 
  const isUserActionRef = useRef<boolean>(false); 
  const lastLocalChangeAtRef = useRef<number>(0);
  const initialLoadCompletedRef = useRef<boolean>(false);
  const fetchLock = useRef<boolean>(false);

  const currentDataStr = useMemo(() => JSON.stringify({ e: expenses, s: souvenirs, p: packItems }), [expenses, souvenirs, packItems]);
  const isOutOfSync = useMemo(() => currentDataStr !== lastServerDataRef.current, [currentDataStr]);
  
  const currentDataSizeMB = useMemo(() => {
    return (new Blob([currentDataStr]).size / (1024 * 1024)).toFixed(2);
  }, [currentDataStr]);

  const itemSizes = useMemo(() => {
    return souvenirs.map(s => ({
      title: s.title,
      size: (new Blob([JSON.stringify(s)]).size / 1024).toFixed(1) + 'KB'
    })).sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
  }, [souvenirs]);

  const fetchFamilyData = useCallback(async (id: string) => {
    if (!supabase || fetchLock.current) return;
    
    fetchLock.current = true;
    setIsLoading(true);
    
    const cleanId = id.trim().toUpperCase();
    try {
      const { data, error } = await supabase
        .from('family_state')
        .select('expenses, souvenirs, pack_items, updated_at')
        .eq('family_id', cleanId)
        .maybeSingle();
        
      if (error) throw error;
      
      const safeE = (data && Array.isArray(data.expenses)) ? data.expenses : [];
      const safeS = (data && Array.isArray(data.souvenirs)) ? data.souvenirs : [];
      const safeP = (data && Array.isArray(data.pack_items)) ? data.pack_items : [];
      
      const dataStr = JSON.stringify({ e: safeE, s: safeS, p: safeP });
      lastServerDataRef.current = dataStr;
      
      setExpenses(safeE);
      setSouvenirs(safeS);
      setPackItems(safeP);
      
      initialLoadCompletedRef.current = true;
      setIsInitialLoadDone(true);
      setLastSyncedAt(new Date());
      setSaveError(null);
    } catch (e) { 
      console.error("Fetch error:", e);
      setSaveError("데이터를 불러오지 못했습니다.");
    } finally { 
      setIsLoading(false); 
      fetchLock.current = false;
    }
  }, []);

  const saveToSupabase = useCallback(async (forcedData?: {e: Expense[], s: Souvenir[], p: PackItem[]}) => {
    if (!familyId || !supabase || !initialLoadCompletedRef.current) return;
    
    const targetE = forcedData ? forcedData.e : expenses;
    const targetS = forcedData ? forcedData.s : souvenirs;
    const targetP = forcedData ? forcedData.p : packItems;
    
    const dataStr = JSON.stringify({ e: targetE, s: targetS, p: targetP });
    const sizeInMB = new Blob([dataStr]).size / (1024 * 1024);

    if (sizeInMB > 9.8) {
      setSaveError(`저장 불가 (${sizeInMB.toFixed(1)}MB)! 8MB 이하로 줄여야 서버에 저장됩니다.`);
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('family_state').upsert({
        family_id: familyId,
        expenses: targetE,
        souvenirs: targetS,
        pack_items: targetP,
        updated_at: now
      });

      if (error) throw error;
      
      lastServerDataRef.current = dataStr;
      setLastSyncedAt(new Date());
      setSaveError(null);
      isUserActionRef.current = false;
    } catch (e: any) {
      console.error("Save error:", e);
      setSaveError("저장 실패! 용량이 너무 큽니다. 사진을 더 지워주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [familyId, expenses, souvenirs, packItems]);

  // 변경 발생 시 자동 저장 (1.5초 뒤)
  useEffect(() => {
    if (!isUserActionRef.current || !initialLoadCompletedRef.current) return;
    const timer = setTimeout(() => {
      saveToSupabase();
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentDataStr, saveToSupabase]);

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

  const handleSetFamilyId = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    localStorage.setItem('family_id', clean);
    setFamilyId(clean);
  };

  if (config.isMissing) return <div className="p-10 text-red-500 font-bold">Supabase Config Missing</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col max-w-[500px] mx-auto relative font-sans text-[#566873]">
      {!familyId ? (
        <div className="fixed inset-0 z-[1000] bg-[#1675F2] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[360px] rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-[#F2E96D] text-[#1675F2] rounded-3xl flex items-center justify-center mx-auto mb-2"><KeyRound size={32} /></div>
            <h2 className="text-2xl font-black text-[#1675F2] tracking-tighter">우리 가족 코드</h2>
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
                    <span className="px-2 py-0.5 bg-blue-100 text-[#1675F2] text-[9px] font-black rounded-full flex items-center gap-1"><Loader2 size={8} className="animate-spin" /> SYNCING...</span>
                  ) : isOutOfSync ? (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black rounded-full flex items-center gap-1"><CloudOff size={8} /> UNSAVED (TOO LARGE)</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full flex items-center gap-1"><CheckCircle size={8} /> CLOUD SAVED</span>
                  )}
                  <span className="text-[10px] font-black text-slate-300 uppercase">ID: {familyId}</span>
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
              <div className="mb-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col gap-2 text-orange-700 text-[11px] font-black animate-in shake duration-500">
                <div className="flex items-center gap-2"><AlertCircle size={14} /> {saveError}</div>
                <p className="font-medium opacity-80">현재 삭제한 내용이 서버에 저장되지 않고 있습니다. 용량 게이지가 파란색이 될 때까지 더 지워주세요.</p>
              </div>
            )}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-[#1675F2]" size={32} />
                <p className="text-[10px] font-black text-[#1675F2] uppercase tracking-widest">데이터 동기화 중...</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
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
                  {isOutOfSync && (
                    <div className="p-5 bg-orange-50 border border-orange-100 rounded-3xl space-y-3">
                      <div className="flex items-center gap-2 text-orange-600 font-black text-xs">
                        <CloudOff size={16} /> 저장되지 않은 변경사항 있음
                      </div>
                      <p className="text-[10px] text-orange-500 font-bold leading-tight">현재 데이터가 너무 커서 서버 전송에 실패했습니다. 사진을 더 삭제하여 용량을 8MB 이하로 낮춰야 정상 저장됩니다.</p>
                      <button 
                        onClick={() => { if(confirm("저장되지 않은 모든 변경사항(사진 삭제 등)을 취소하고 서버에 있는 마지막 데이터로 되돌릴까요?")) fetchFamilyData(familyId!); }}
                        className="w-full py-2.5 bg-white border border-orange-200 text-orange-600 rounded-xl text-[10px] font-black"
                      >
                        서버 데이터로 되돌리기 (초기화)
                      </button>
                    </div>
                  )}

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
                      <span className={`text-[11px] font-black ${Number(currentDataSizeMB) > 8 ? 'text-red-500' : 'text-[#1675F2]'}`}>{currentDataSizeMB}MB / 8.0MB</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${Number(currentDataSizeMB) > 8 ? 'bg-red-500' : Number(currentDataSizeMB) > 6 ? 'bg-orange-400' : 'bg-[#1675F2]'}`}
                        style={{ width: `${Math.min((Number(currentDataSizeMB) / 8.0) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <button 
                      onClick={() => setShowSizeDetails(!showSizeDetails)}
                      className="text-[9px] text-[#1675F2] font-black flex items-center gap-1 uppercase tracking-widest"
                    >
                      <BarChart3 size={10} /> {showSizeDetails ? '분석 닫기' : '아이템별 용량 분석'}
                    </button>
                    
                    {showSizeDetails && (
                      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar animate-in slide-in-from-top-2">
                        {itemSizes.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] font-bold border-b border-slate-50 pb-1">
                            <span className="text-slate-500 truncate mr-2">{item.title}</span>
                            <span className="text-[#1675F2] shrink-0">{item.size}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => saveToSupabase()}
                    disabled={isSaving || !isOutOfSync || Number(currentDataSizeMB) > 9}
                    className="w-full py-5 bg-[#1675F2] text-white disabled:bg-slate-100 disabled:text-slate-300 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CloudSync size={16} />}
                    즉시 동기화 실행
                  </button>

                  <button onClick={() => setShowResetConfirm(true)} className="w-full py-5 bg-red-50 text-red-500 rounded-2xl text-sm font-black flex items-center justify-center gap-2"><LogOut size={16} />연결 해제</button>
                  
                  {showResetConfirm && (
                    <div className="p-6 bg-red-500 rounded-3xl text-white space-y-4 animate-in zoom-in-95">
                      <p className="text-xs font-bold text-center">연결을 해제하시겠습니까?</p>
                      <div className="flex gap-2">
                        <button onClick={() => {localStorage.removeItem('family_id'); window.location.reload();}} className="flex-1 py-3 bg-white text-red-500 rounded-xl font-black">확인</button>
                        <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black">취소</button>
                      </div>
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
