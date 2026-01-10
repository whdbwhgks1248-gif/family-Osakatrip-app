
import React, { useState, useMemo } from 'react';
import { Expense, MemberId, FAMILY_MEMBERS } from '../types.ts';
import { Plus, Trash2, CheckCircle2, History, TrendingUp, X, ReceiptText, CalendarDays, Users2 } from 'lucide-react';

interface SettlementViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const SettlementView: React.FC<SettlementViewProps> = ({ expenses = [], setExpenses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPayer, setNewPayer] = useState<MemberId>(FAMILY_MEMBERS[0] || '영수');
  const [newParticipants, setNewParticipants] = useState<MemberId[]>([...FAMILY_MEMBERS]);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const safeExpenses = useMemo(() => Array.isArray(expenses) ? expenses : [], [expenses]);

  const memberSummaries = useMemo(() => {
    const summary: Record<string, { 
      spent: number, 
      received: number, 
      paid: number, 
      toPay: number,
      toReceive: number 
    }> = {};

    FAMILY_MEMBERS.forEach(m => {
      summary[m] = { spent: 0, received: 0, paid: 0, toPay: 0, toReceive: 0 };
    });

    try {
      safeExpenses.forEach(exp => {
        if (!exp || typeof exp.amount !== 'number' || !Array.isArray(exp.participantIds)) return;
        
        const validParticipants = exp.participantIds.filter(p => FAMILY_MEMBERS.includes(p));
        if (validParticipants.length === 0) return;

        const share = exp.amount / validParticipants.length;
        
        if (summary[exp.payerId]) {
          summary[exp.payerId].spent += exp.amount;
        }

        validParticipants.forEach(pId => {
          if (!summary[pId]) return;
          if (pId !== exp.payerId) {
            const settled = Array.isArray(exp.settledMemberIds) ? exp.settledMemberIds : [];
            const isSettled = settled.includes(pId);
            if (isSettled) {
              summary[pId].paid += share;
              if (summary[exp.payerId]) summary[exp.payerId].received += share;
            } else {
              summary[pId].toPay += share;
              if (summary[exp.payerId]) summary[exp.payerId].toReceive += share;
            }
          }
        });
      });
    } catch (err) {
      console.error("Calculation error:", err);
    }

    return summary;
  }, [safeExpenses]);

  const toggleParticipant = (m: MemberId) => {
    setNewParticipants(prev => 
      prev.includes(m) ? (prev.length > 1 ? prev.filter(p => p !== m) : prev) : [...prev, m]
    );
  };

  const addExpense = () => {
    const amountNum = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(amountNum) || newParticipants.length === 0) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      amount: amountNum,
      payerId: newPayer,
      participantIds: [...newParticipants],
      settledMemberIds: [],
      date: new Date(newDate).getTime() || Date.now()
    };
    
    setExpenses(prev => [newExpense, ...(Array.isArray(prev) ? prev : [])]);
    setNewTitle('');
    setNewAmount('');
    setIsModalOpen(false);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => Array.isArray(prev) ? prev.filter(e => e.id !== id) : []);
  };

  const toggleSettlement = (expenseId: string, memberId: MemberId) => {
    setExpenses(prev => Array.isArray(prev) ? prev.map(exp => {
      if (exp.id !== expenseId) return exp;
      const settled = Array.isArray(exp.settledMemberIds) ? exp.settledMemberIds : [];
      return { 
        ...exp, 
        settledMemberIds: settled.includes(memberId) 
          ? settled.filter(id => id !== memberId) 
          : [...settled, memberId] 
      };
    }) : []);
  };

  const totalTripCost = useMemo(() => 
    safeExpenses.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0)
  , [safeExpenses]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#566873]/5">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1675F2] text-white rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-[#566873] tracking-tight">지출 요약</h2>
              <p className="text-[10px] text-[#1675F2] font-black uppercase tracking-widest">총 ₩{totalTripCost.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-[#F2E96D] text-[#1675F2] rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg"><Plus size={24} strokeWidth={3} /></button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {FAMILY_MEMBERS.map(member => {
            const mSummary = memberSummaries[member] || { spent: 0, toReceive: 0, toPay: 0 };
            return (
              <div key={member} className="flex items-center justify-between p-5 bg-[#F1F2F0] rounded-[2rem] border border-[#566873]/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-[#1675F2] border border-[#566873]/10 text-sm">{member[0]}</div>
                  <div>
                    <p className="text-sm font-black text-[#566873]">{member}</p>
                    <p className="text-[10px] text-[#566873]/50 font-bold uppercase">₩{Math.round(mSummary.spent).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    {mSummary.toReceive > 0 && <span className="text-[10px] font-black text-[#1675F2] bg-white px-3 py-1.5 rounded-full border border-[#1675F2]/10">받을 돈 ₩{Math.round(mSummary.toReceive).toLocaleString()}</span>}
                    {mSummary.toPay > 0 && <span className="text-[10px] font-black text-[#566873] bg-[#F2E96D] px-3 py-1.5 rounded-full">줄 돈 ₩{Math.round(mSummary.toPay).toLocaleString()}</span>}
                    {mSummary.toReceive <= 0 && mSummary.toPay <= 0 && <span className="text-[10px] font-black text-[#566873]/20 bg-white/50 px-3 py-1.5 rounded-full">완료</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-[#566873]/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-[#F1F2F0] text-[#1675F2] rounded-xl flex items-center justify-center"><History size={18} /></div>
          <h2 className="text-lg font-black text-[#566873] tracking-tight">상세 내역</h2>
        </div>
        {safeExpenses.length === 0 ? (
          <div className="text-center py-20 bg-[#F1F2F0] rounded-[2rem] border border-dashed border-[#566873]/10"><p className="text-xs font-black text-[#566873]/40 uppercase">내역이 없습니다</p></div>
        ) : (
          <div className="space-y-4">
            {safeExpenses.map((exp) => (
              <div key={exp.id} className="p-5 bg-[#F1F2F0]/50 border border-[#566873]/5 rounded-[2rem]">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="text-md font-black text-[#566873]">{exp.title}</h3>
                    <p className="text-[11px] font-bold text-[#566873]/60">₩{(Number(exp.amount) || 0).toLocaleString()} (결제: {exp.payerId})</p>
                  </div>
                  <button onClick={() => deleteExpense(exp.id)} className="text-[#566873]/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#566873]/5">
                  {(exp.participantIds || []).map(pId => {
                    if (pId === exp.payerId) return null;
                    const isSettled = (exp.settledMemberIds || []).includes(pId);
                    return (
                      <button key={pId} onClick={() => toggleSettlement(exp.id, pId)} className={`px-3 py-1.5 rounded-2xl text-[10px] font-black border-2 transition-all ${isSettled ? 'bg-[#1675F2] border-[#1675F2] text-white' : 'bg-white border-[#566873]/5 text-[#566873]/40'}`}>{pId}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-[#1675F2]/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 space-y-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-[#1675F2]">새로운 지출</h3><button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-[#F1F2F0] rounded-full flex items-center justify-center"><X size={20} /></button></div>
            <div className="space-y-4">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="지출 항목명" className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-4 font-bold" />
              <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="금액 (₩)" className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-4 font-black" />
              <div>
                <label className="block text-[10px] font-black text-[#566873]/30 uppercase mb-2">결제자</label>
                <div className="grid grid-cols-4 gap-2">{FAMILY_MEMBERS.map(m => (<button key={m} onClick={() => setNewPayer(m)} className={`py-2 rounded-xl text-[11px] font-black border ${newPayer === m ? 'bg-[#1675F2] border-[#1675F2] text-white' : 'bg-white border-[#566873]/10 text-[#566873]'}`}>{m}</button>))}</div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#566873]/30 uppercase mb-2">참여 인원</label>
                <div className="grid grid-cols-4 gap-2">{FAMILY_MEMBERS.map(m => (<button key={m} onClick={() => toggleParticipant(m)} className={`py-2 rounded-xl text-[11px] font-black border-2 ${newParticipants.includes(m) ? 'bg-[#1675F2]/5 border-[#1675F2] text-[#1675F2]' : 'bg-white border-[#566873]/5 text-[#566873]/20'}`}>{m}</button>))}</div>
              </div>
            </div>
            <button onClick={addExpense} className="w-full bg-[#1675F2] text-white py-5 rounded-full font-black text-lg">지출 등록</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementView;
