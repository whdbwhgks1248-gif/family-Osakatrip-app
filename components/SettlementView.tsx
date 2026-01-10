
import React, { useState, useMemo } from 'react';
import { Expense, MemberId, FAMILY_MEMBERS } from '../types';
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

  // 방어 로직: props가 배열이 아닐 경우 강제로 빈 배열 처리
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
      console.error("Summary Calculation Error:", err);
    }

    return summary;
  }, [safeExpenses]);

  const toggleParticipant = (m: MemberId) => {
    setNewParticipants(prev => {
      if (prev.includes(m)) {
        return prev.length > 1 ? prev.filter(p => p !== m) : prev;
      }
      return [...prev, m];
    });
  };

  const addExpense = () => {
    if (!newTitle.trim() || !newAmount || newParticipants.length === 0) return;
    const amountNum = parseFloat(newAmount);
    if (isNaN(amountNum)) return;

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
    setNewParticipants([...FAMILY_MEMBERS]);
    setIsModalOpen(false);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => Array.isArray(prev) ? prev.filter(e => e.id !== id) : []);
  };

  const toggleSettlement = (expenseId: string, memberId: MemberId) => {
    setExpenses(prev => (Array.isArray(prev) ? prev.map(exp => {
      if (exp.id !== expenseId) return exp;
      const settled = Array.isArray(exp.settledMemberIds) ? exp.settledMemberIds : [];
      const newSettled = settled.includes(memberId)
        ? settled.filter(id => id !== memberId)
        : [...settled, memberId];
      return { ...exp, settledMemberIds: newSettled };
    }) : []));
  };

  const totalTripCost = useMemo(() => 
    safeExpenses.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0)
  , [safeExpenses]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#566873]/5">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1675F2] text-white rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-[#566873] tracking-tight">지출 요약</h2>
              <p className="text-[10px] text-[#1675F2] font-black uppercase tracking-widest">총 지출 ₩{totalTripCost.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-[#F2E96D] text-[#1675F2] rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-[#F2E96D]/30"><Plus size={24} strokeWidth={3} /></button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {FAMILY_MEMBERS.map(member => {
            const mSummary = memberSummaries[member] || { spent: 0, toReceive: 0, toPay: 0 };
            return (
              <div key={member} className="flex items-center justify-between p-5 bg-[#F1F2F0] rounded-[2rem] border border-[#566873]/5 transition-all hover:bg-white hover:border-[#1675F2]/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-[#1675F2] border border-[#566873]/10 text-sm">{member[0]}</div>
                  <div>
                    <p className="text-sm font-black text-[#566873]">{member}</p>
                    <p className="text-[10px] text-[#566873]/50 font-bold uppercase">₩{(Number(mSummary.spent) || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    {mSummary.toReceive > 0 && <span className="text-[10px] font-black text-[#1675F2] bg-white px-3 py-1.5 rounded-full border border-[#1675F2]/10">받을 돈 ₩{Math.round(mSummary.toReceive).toLocaleString()}</span>}
                    {mSummary.toPay > 0 && <span className="text-[10px] font-black text-[#566873] bg-[#F2E96D] px-3 py-1.5 rounded-full">줄 돈 ₩{Math.round(mSummary.toPay).toLocaleString()}</span>}
                    {mSummary.toReceive <= 0 && mSummary.toPay <= 0 && <span className="text-[10px] font-black text-[#566873]/20 bg-white/50 px-3 py-1.5 rounded-full">정산 완료</span>}
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
          <div className="text-center py-20 bg-[#F1F2F0] rounded-[2rem] border border-dashed border-[#566873]/10"><ReceiptText className="mx-auto mb-3 opacity-20 text-[#566873]" size={40} /><p className="text-xs font-black text-[#566873]/40 uppercase tracking-widest">내역이 없습니다</p></div>
        ) : (
          <div className="space-y-4">
            {safeExpenses.map((exp) => (
              <div key={exp.id} className="p-5 bg-[#F1F2F0]/50 border border-[#566873]/5 rounded-[2rem] hover:bg-white hover:border-[#3084F2]/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-md font-black text-[#566873]">{exp.title}</h3>
                      <span className="text-[9px] text-[#566873]/40 font-bold">{new Date(exp.date || Date.now()).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-[#1675F2] bg-white px-2 py-0.5 rounded-lg uppercase tracking-tighter">결제: {exp.payerId}</span>
                      <span className="text-[11px] font-bold text-[#566873]/60">₩{(Number(exp.amount) || 0).toLocaleString()} ({(exp.participantIds || []).length}인)</span>
                    </div>
                  </div>
                  <button onClick={() => deleteExpense(exp.id)} className="w-8 h-8 flex items-center justify-center text-[#566873]/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#566873]/5">
                  <p className="text-[9px] font-black text-[#566873]/40 uppercase tracking-[0.2em]">정산 상태</p>
                  <div className="flex flex-wrap gap-2">
                    {(exp.participantIds || []).map(pId => {
                      if (pId === exp.payerId) return null;
                      const settled = Array.isArray(exp.settledMemberIds) ? exp.settledMemberIds : [];
                      const isSettled = settled.includes(pId);
                      return (
                        <button key={pId} onClick={() => toggleSettlement(exp.id, pId)} className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[10px] font-black border-2 transition-all duration-300 ${isSettled ? 'bg-[#1675F2] border-[#1675F2] text-white shadow-md shadow-[#1675F2]/10' : 'bg-white border-[#566873]/5 text-[#566873]/40 hover:border-[#1675F2]/30'}`}><CheckCircle2 size={12} strokeWidth={3} />{pId}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-[#1675F2]/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-center px-8 pt-8 pb-4 shrink-0"><h3 className="text-2xl font-black text-[#1675F2] tracking-tighter">새로운 지출</h3><button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-[#F1F2F0] rounded-full flex items-center justify-center text-[#566873]"><X size={20} /></button></div>
            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-8 no-scrollbar">
              <div><label className="flex items-center gap-2 text-[10px] font-black text-[#566873]/30 uppercase mb-3 tracking-[0.2em]"><ReceiptText size={12} /> 지출 항목명</label><input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예: 편의점, 기차표..." className="w-full bg-[#F1F2F0] border-none rounded-3xl px-6 py-5 text-base font-bold text-[#566873] focus:ring-2 focus:ring-[#1675F2] transition-all" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="flex items-center gap-2 text-[10px] font-black text-[#566873]/30 uppercase mb-3 tracking-[0.2em]">금액 (₩)</label><input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0" className="w-full bg-[#F1F2F0] border-none rounded-3xl px-6 py-5 text-xl font-black text-[#566873] focus:ring-2 focus:ring-[#1675F2] transition-all" /></div>
                <div><label className="flex items-center gap-2 text-[10px] font-black text-[#566873]/30 uppercase mb-3 tracking-[0.2em]"><CalendarDays size={12} /> 결제일</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-[#F1F2F0] border-none rounded-3xl px-4 py-5 text-sm font-black text-[#566873] focus:ring-2 focus:ring-[#1675F2] transition-all" /></div>
              </div>
              <div><label className="block text-[10px] font-black text-[#566873]/30 uppercase mb-3 tracking-[0.2em]">결제자</label><div className="grid grid-cols-4 gap-2">{FAMILY_MEMBERS.map(m => (<button key={m} onClick={() => setNewPayer(m)} className={`py-3 rounded-2xl text-[11px] font-black transition-all border ${newPayer === m ? 'bg-[#1675F2] border-[#1675F2] text-white shadow-md' : 'bg-white border-[#566873]/10 text-[#566873]'}`}>{m}</button>))}</div></div>
              <div><label className="flex items-center gap-2 text-[10px] font-black text-[#566873]/30 uppercase mb-3 tracking-[0.2em]"><Users2 size={12} /> 함께한 사람 (N분의 1)</label><div className="grid grid-cols-4 gap-2">{FAMILY_MEMBERS.map(m => (<button key={m} onClick={() => toggleParticipant(m)} className={`py-3 rounded-2xl text-[11px] font-black transition-all border-2 ${newParticipants.includes(m) ? 'bg-[#1675F2]/5 border-[#1675F2] text-[#1675F2]' : 'bg-white border-[#566873]/5 text-[#566873]/20'}`}>{m}</button>))}</div><p className="mt-2 text-[9px] text-[#566873]/40 font-bold px-1 italic">* 선택한 {newParticipants.length}명에게 금액이 자동 분할됩니다.</p></div>
            </div>
            <div className="p-8 pb-10 shrink-0 bg-white border-t border-[#F1F2F0]"><button onClick={addExpense} disabled={!newTitle.trim() || !newAmount || newParticipants.length === 0} className="w-full bg-[#1675F2] text-white py-6 rounded-full font-black text-lg shadow-xl shadow-[#1675F2]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30">지출 등록</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementView;
