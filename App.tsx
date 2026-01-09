
import React, { useState, useEffect } from 'react';
import { Calendar, ShieldCheck, Calculator, ShoppingBag, MessageSquare, Menu, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import ScheduleView from './components/ScheduleView.tsx';
import RulesView from './components/RulesView.tsx';
import SettlementView from './components/SettlementView.tsx';
import SouvenirView from './components/SouvenirView.tsx';
import AIChatView from './components/AIChatView.tsx';
import { Expense, Souvenir } from './types.ts';
import { SCHEDULE_DATA } from './constants.tsx';

type TabType = 'schedule' | 'rules' | 'settlement' | 'souvenir' | 'ai';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('trip_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load expenses", e);
      return [];
    }
  });
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>(() => {
    try {
      const saved = localStorage.getItem('trip_souvenirs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load souvenirs", e);
      return [];
    }
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('trip_expenses', JSON.stringify(expenses));
    } catch (e) {
      console.error("Failed to save expenses", e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('trip_souvenirs', JSON.stringify(souvenirs));
    } catch (e) {
      console.error("Failed to save souvenirs", e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert("저장 공간이 부족합니다. 너무 큰 사진은 삭제해 주세요!");
      }
    }
  }, [souvenirs]);

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
      
      {/* Header - Fixed at Top */}
      <header className="bg-white fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[100] px-6 pt-9 pb-3 border-b border-[#566873]/5 shadow-sm h-[118px]">
        <div className="flex justify-between items-center h-full">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-[#F2E96D] text-[#1675F2] text-[9px] font-black rounded-full uppercase tracking-tighter">가족 여행</span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F1F2F0] rounded-full">
                <CheckCircle2 size={8} className="text-[#1675F2]" />
                <span className="text-[8px] font-bold text-[#566873]/60 uppercase">데이터 자동 저장 중</span>
              </div>
              <span className="text-[10px] font-bold text-[#566873]/50 uppercase tracking-widest ml-auto opacity-0">열무&배추네</span>
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
        {renderContent()}
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
            <div className="p-10 flex justify-between items-center">
              <span className="text-xs font-black text-[#566873]/30 uppercase tracking-[0.3em]">메뉴</span>
              <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-[#F1F2F0] rounded-full flex items-center justify-center text-[#566873]">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 px-10 space-y-2">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
