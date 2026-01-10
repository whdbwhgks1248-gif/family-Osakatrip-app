console.log("ENV CHECK", {
  VITE_SUPABASE_URL: (window as any)?.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: (window as any)?.VITE_SUPABASE_ANON_KEY,
});

import React, { useState, useEffect } from 'react';
import { Calendar, ShieldCheck, Calculator, ShoppingBag, MessageSquare, Menu, X, ChevronRight, CheckCircle2, Lock, LogOut, KeyRound } from 'lucide-react';
import ScheduleView from './components/ScheduleView.tsx';
import RulesView from './components/RulesView.tsx';
import SettlementView from './components/SettlementView.tsx';
import SouvenirView from './components/SouvenirView.tsx';
import AIChatView from './components/AIChatView.tsx';
import { Expense, Souvenir } from './types.ts';
import { SCHEDULE_DATA } from './constants.tsx';

type TabType = 'schedule' | 'rules' | 'settlement' | 'souvenir' | 'ai';

const App: React.FC = () => {
  const [familyId, setFamilyId] = useState<string | null>(() => localStorage.getItem('family_id'));
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tempCode, setTempCode] = useState('');

  // 가족 코드별 데이터 키 생성 함수
  const getStorageKey = (key: string) => familyId ? `${key}_${familyId}` : key;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);

  // 초기 데이터 로드 (가족 코드가 결정된 후 실행)
  useEffect(() => {
    if (!familyId) return;
    
    try {
      const savedExpenses = localStorage.getItem(getStorageKey('trip_expenses'));
      const savedSouvenirs = localStorage.getItem(getStorageKey('trip_souvenirs'));
      
      setExpenses(savedExpenses ? JSON.parse(savedExpenses) : []);
      setSouvenirs(savedSouvenirs ? JSON.parse(savedSouvenirs) : []);
    } catch (e) {
      console.error("Failed to load family data", e);
    }
  }, [familyId]);

  // 데이터 저장 (가족 코드 기반)
  useEffect(() => {
    if (!familyId) return;
    localStorage.setItem(getStorageKey('trip_expenses'), JSON.stringify(expenses));
  }, [expenses, familyId]);

  useEffect(() => {
    if (!familyId) return;
    localStorage.setItem(getStorageKey('trip_souvenirs'), JSON.stringify(souvenirs));
  }, [souvenirs, familyId]);

  const handleSetFamilyId = (code: string) => {
    const cleanCode = code.trim().toLowerCase();
    if (cleanCode) {
      localStorage.setItem('family_id', cleanCode);
      setFamilyId(cleanCode);
      setTempCode('');
    }
  };

  const handleResetFamilyId = () => {
    if (window.confirm('가족 코드를 변경하시겠습니까? 현재 코드의 데이터는 유지되지만, 새로운 코드를 입력해야 합니다.')) {
      localStorage.removeItem('family_id');
      setFamilyId(null);
      setIsMenuOpen(false);
    }
  };

  const tabs = [
    { id: 'schedule', label: '일정', icon: Calendar },
    { id: 'rules', label: '규칙', icon: ShieldCheck },
    { id: 'settlement', label: '정산', icon: Calculator },
    { id: 'souvenir', label: '기념품', icon: ShoppingBag },
    { id: 'ai', label: '가이드', icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule': return <ScheduleView />;
      case 'rules': return <RulesView />;
      case 'settlement': return <SettlementView expenses={expenses} setExpenses={setExpenses} />;
      case 'souvenir': return <SouvenirView souvenirs={souvenirs} setSouvenirs={setSouvenirs} />;
      case 'ai': return <AIChatView />;
      default: return <ScheduleView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col max-w-[500px] mx-auto relative font-sans text-[#566873]">
      
      {/* Family ID Entry Modal */}
      {!familyId && (
        <div className="fixed inset-0 z-[1000] bg-[#1675F2] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-[360px] rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#F2E96D] text-[#1675F2] rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-[#F2E96D]/20">
                <KeyRound size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-[#1675F2] tracking-tighter">가족 코드 입력</h2>
              <p className="text-sm font-bold text-[#566873]/60 leading-relaxed">우리 가족만의 코드를 입력하면<br/>일정과 정산을 함께 관리할 수 있어요.</p>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text" 
                value={tempCode}
                onChange={(e) => setTempCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetFamilyId(tempCode)}
                placeholder="예: osaka2026"
                className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-5 text-center text-lg font-black text-[#1675F2] placeholder:text-[#566873]/20 focus:ring-4 focus:ring-[#F2E96D] transition-all"
              />
              <button 
                onClick={() => handleSetFamilyId(tempCode)}
                disabled={!tempCode.trim()}
                className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black text-md shadow-xl shadow-[#1675F2]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
              >
                여행 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Fixed at Top */}
      <header className="bg-white fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[100] px-6 pt-9 pb-3 border-b border-[#566873]/5 shadow-sm h-[118px]">
        <div className="flex justify-between items-center h-full">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full uppercase tracking-tighter">가족 여행</span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F1F2F0] rounded-full">
                <CheckCircle2 size={8} className="text-[#1675F2]" />
                <span className="text-[8px] font-bold text-[#566873]/60 uppercase">코드: {familyId}</span>
              </div>
            </div>
            <h1 className="text-xl font-black text-[#1675F2] tracking-tighter leading-tight">
              {SCHEDULE_DATA.title}
            </h1>
            <p className="text-[11px] font-bold text-[#566873]/40 tracking-tight mt-1">
              2026.02.15 - 2026.02.19 | 열무&배추네
            </p>
          </div>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-10 h-10 bg-white border border-[#566873]/10 text-[#566873] rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-[118px] pb-32">
        {familyId && renderContent()}
      </main>

      {/* Bottom Navigation */}
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

      {/* Side Menu Overlay */}
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

            {/* Menu Footer: Family ID Management */}
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
                <button 
                  onClick={handleResetFamilyId}
                  className="w-full flex items-center justify-center gap-2 bg-[#566873]/5 hover:bg-[#566873]/10 text-[#566873] py-4 rounded-2xl text-xs font-black transition-all"
                >
                  <LogOut size={14} />
                  코드 변경 및 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
