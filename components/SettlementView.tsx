
import React, { useState, useMemo } from 'react';
import { Expense, MemberId, FAMILY_MEMBERS } from '../types';
import { Plus, Trash2, History, TrendingUp, X, ArrowRightLeft, CreditCard, UserCheck } from 'lucide-react';

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

  // 정산 계산 통합 로직
  const settlementData = useMemo(() => {
    const summary: Record<string, { 
      paidTotal: number,      // 내가 직접 결제한 총액
      consumptionTotal: number, // 내가 참여한 지출의 내 몫 합계 (내가 쓴 돈)
      netBalance: number      // 최종 정산 잔액 (받을 돈 + / 줄 돈 -)
    }> = {};

    FAMILY_MEMBERS.forEach(m => {
      summary[m] = { paidTotal: 0, consumptionTotal: 0, netBalance: 0 };
    });

    safeExpenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      const validParticipants = exp.participantIds.filter(p => FAMILY_MEMBERS.includes(p));
      if (validParticipants.length === 0) return;

      const share = amount / validParticipants.length;
      
      // 1. 내가 결제한 총액 기록
      if (summary[exp.payerId]) {
        summary[exp.payerId].paidTotal += amount;
      }

      validParticipants.forEach(pId => {
        if (!summary[pId]) return;
        // 2. 내 몫(소비액) 기록
        summary[pId].consumptionTotal += share;
        
        // 3. 잔액 계산
        // 결제자는 참여자들의 몫만큼 '받을 권리'가 생기고
        // 참여자(결제자 제외)는 자기 몫만큼 '줄 의무'가 생김
        if (pId === exp.payerId) {
          summary[pId].netBalance += (amount - share);
        } else {
          summary[pId].netBalance -= share;
        }
      });
    });

    // 4. 송금 경로 계산 (누가 누구에게)
    const transfers: { from: MemberId, to: MemberId, amount: number }[] = [];
    const balances = FAMILY_MEMBERS.map(m => ({ id: m, bal: summary[m].netBalance }));
    
    let debtors = balances.filter(b => b.bal < -0.1).sort((a, b) => a.bal - b.bal);
    let creditors = balances.filter(b => b.bal > 0.1).sort((a, b) => b.bal - a.bal);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const d = debtors[dIdx];
      const c = creditors[cIdx];
      const amount = Math.min(Math.abs(d.bal), c.bal);

      if (amount > 1) {
        transfers.push({ from: d.id, to: c.id, amount });
      }

      d.bal += amount;
      c.bal -= amount;

      if (Math.abs(d.bal) < 0.1) dIdx++;
      if (Math.abs(c.bal) < 0.1) cIdx++;
    }

    return { summary, transfers };
  }, [safeExpenses]);

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

  const toggleParticipant = (m: MemberId) => {
    setNewParticipants(prev => 
      prev.includes(m) ? (prev.length > 1 ? prev.filter(p => p !== m) : prev) : [...prev, m]
    );
  };

  const totalTripCost = safeExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* 지출 요약 상단 카드 */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#566873]/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1675F2] text-white rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-[#566873] tracking-tight">정산 리포트</h2>
              <p className="text-[10px] text-[#1675F2] font-black uppercase tracking-widest">총 지출 ₩{totalTripCost.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-[#F2E96D] text-[#1675F2] rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg"><Plus size={24} strokeWidth={3} /></button>
        </div>

        <div className="space-y-3">
          {FAMILY_MEMBERS.map(member => {
            const data = settlementData.summary[member];
            return (
              <div key={member} className="p-5 bg-[#F8F9FD] rounded-[2rem] border border-[#566873]/5">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center font-black text-[#1675F2] border border-[#566873]/10 text-xs shadow-sm">{member[0]}</div>
                    <span className="font-black text-[#566873]">{member}</span>
                  </div>
                  <div className="text-right">
                    {data.netBalance > 0.1 ? (
                      <span className="text-[11px] font-black text-[#1675F2] bg-white px-3 py-1.5 rounded-full border border-[#1675F2]/20">받을 돈 ₩{Math.round(data.netBalance).toLocaleString()}</span>
                    ) : data.netBalance < -0.1 ? (
                      <span className="text-[11px] font-black text-[#E11D48] bg-rose-50 px-3 py-1.5 rounded-full">보낼 돈 ₩{Math.round(Math.abs(data.netBalance)).toLocaleString()}</span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300">정산 완료</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 pt-3 border-t border-[#566873]/5 text-[10px] font-bold text-[#566873]/50">
                  <div className="flex items-center gap-1"><CreditCard size={10}/> 결제액: ₩{Math.round(data.paidTotal).toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-[#1675F2]"><UserCheck size={10}/> 소비액: ₩{Math.round(data.consumptionTotal).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 송금 가이드 카드 */}
      {settlementData.transfers.length > 0 && (
        <div className="bg-[#1675F2] rounded-[2.5rem] p-8 shadow-xl shadow-[#1675F2]/20 text-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><ArrowRightLeft size={100} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center"><ArrowRightLeft size={20} /></div>
              <h2 className="text-lg font-black tracking-tight">송금 가이드</h2>
            </div>
            <div className="space-y-3">
              {settlementData.transfers.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#F2E96D]">{t.from}</span>
                    <span className="text-[10px] opacity-60 font-bold">님이</span>
                    <span className="font-black text-white">{t.to}</span>
                    <span className="text-[10px] opacity-60 font-bold">님에게</span>
                  </div>
                  <span className="font-black text-white tracking-tighter">₩{Math.round(t.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 상세 내역 리스트 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-[#566873]/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-[#F8F9FD] text-[#1675F2] rounded-xl flex items-center justify-center font-black">#</div>
          <h2 className="text-lg font-black text-[#566873] tracking-tight">상세 지출 내역</h2>
        </div>
        {safeExpenses.length === 0 ? (
          <div className="text-center py-20 bg-[#F8F9FD] rounded-[2rem] border border-dashed border-[#566873]/10 text-xs font-black text-slate-300">내역이 없습니다</div>
        ) : (
          <div className="space-y-4">
            {safeExpenses.map((exp) => (
              <div key={exp.id} className="p-5 bg-white border border-[#566873]/5 rounded-[2rem] shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-[#566873]">{exp.title}</h3>
                  <button onClick={() => deleteExpense(exp.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xl font-black text-[#1675F2]">₩{Number(exp.amount).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400">결제: {exp.payerId} / 참여: {exp.participantIds.join(', ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 지출 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-[#1675F2]/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-[#1675F2]">지출 등록</h3><button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button></div>
            <div className="space-y-4">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="어디에 썼나요?" className="w-full bg-[#F8F9FD] border-none rounded-2xl px-6 py-4 font-bold" />
              <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="얼마인가요? (₩)" className="w-full bg-[#F8F9FD] border-none rounded-2xl px-6 py-4 font-black text-[#1675F2] text-xl" />
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">누가 냈나요?</label>
                <div className="grid grid-cols-4 gap-2">{FAMILY_MEMBERS.map(m => (<button key={m} onClick={() => setNewPayer(m)} className={`py-3 rounded-xl text-[11px] font-black border-2 transition-all ${newPayer === m ? 'bg-[#1675F2] border-[#1675F2] text-white' : 'bg-white border-slate-100 text-slate-400'}`}>{m}</button>))}</div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">누가 참여했나요?</label>
                <div className="grid grid-cols-4 gap-2">{FAMILY_MEMBERS.map(m => (<button key={m} onClick={() => toggleParticipant(m)} className={`py-3 rounded-xl text-[11px] font-black border-2 transition-all ${newParticipants.includes(m) ? 'bg-[#1675F2]/5 border-[#1675F2] text-[#1675F2]' : 'bg-white border-slate-100 text-slate-200'}`}>{m}</button>))}</div>
              </div>
            </div>
            <button onClick={addExpense} className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black shadow-xl">등록 완료</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementView;
