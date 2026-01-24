
import React, { useState, useMemo } from 'react';
import { PublicFundTransaction } from '../types';
import { Wallet, Plus, Trash2, X, TrendingUp, TrendingDown, Coins, PlusCircle, MinusCircle, History } from 'lucide-react';

interface PublicFundViewProps {
  transactions: PublicFundTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<PublicFundTransaction[]>>;
}

const PublicFundView: React.FC<PublicFundViewProps> = ({ transactions = [], setTransactions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'deposit' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState<string>('식비');

  const safeTransactions = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);

  const summary = useMemo(() => {
    const totalDeposit = safeTransactions
      .filter(t => t.type === 'deposit')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    
    const totalExpense = safeTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    
    return {
      deposit: totalDeposit,
      expense: totalExpense,
      balance: totalDeposit - totalExpense
    };
  }, [safeTransactions]);

  const addTransaction = () => {
    const amountNum = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(amountNum)) return;

    const newTx: PublicFundTransaction = {
      id: Date.now().toString(),
      type: newType,
      title: newTitle.trim(),
      amount: amountNum,
      date: Date.now(),
      category: newType === 'deposit' ? '입금' : (newCategory as any)
    };
    
    setTransactions(prev => [newTx, ...(Array.isArray(prev) ? prev : [])]);
    setNewTitle('');
    setNewAmount('');
    setIsModalOpen(false);
  };

  const deleteTransaction = (id: string) => {
    if (confirm("이 내역을 삭제하시겠습니까?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const categories = ['식비', '교통비', '관광', '쇼핑', '숙박', '기타'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* 1. 요약 대시보드 */}
      <div className="bg-[#1675F2] rounded-[2.5rem] p-8 text-white shadow-xl shadow-[#1675F2]/20 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-10 rotate-12">
          <Wallet size={140} />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">현재 공금 잔액</p>
              <h2 className="text-4xl font-black tracking-tighter">
                ₩{summary.balance.toLocaleString()}
              </h2>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 bg-[#F2E96D] text-[#1675F2] rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-black uppercase tracking-widest">
                <TrendingUp size={10} className="text-[#F2E96D]" /> 총 입금액
              </div>
              <p className="text-lg font-black tracking-tight">₩{summary.deposit.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-black uppercase tracking-widest">
                <TrendingDown size={10} className="text-rose-300" /> 총 지출액
              </div>
              <p className="text-lg font-black tracking-tight">₩{summary.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 상세 내역 리스트 */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-[#566873]/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F8F9FD] text-[#1675F2] rounded-xl flex items-center justify-center">
              <History size={18} />
            </div>
            <h3 className="text-lg font-black text-[#566873] tracking-tight">공금 입출 내역</h3>
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{safeTransactions.length}건</span>
        </div>

        {safeTransactions.length === 0 ? (
          <div className="text-center py-24 bg-[#F8F9FD] rounded-[2rem] border border-dashed border-[#566873]/10">
            <Coins className="mx-auto mb-4 opacity-10 text-slate-400" size={48} />
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeTransactions.map((tx) => (
              <div key={tx.id} className="group relative flex items-center justify-between p-5 bg-white border border-[#566873]/5 rounded-3xl hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-blue-50 text-[#1675F2]' : 'bg-rose-50 text-rose-500'
                  }`}>
                    {tx.type === 'deposit' ? <PlusCircle size={20} /> : <MinusCircle size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#566873]">{tx.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-black text-slate-300 uppercase">
                        {new Date(tx.date).toLocaleDateString()}
                      </span>
                      {tx.category && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                          tx.type === 'deposit' ? 'bg-blue-100 text-[#1675F2]' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {tx.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[15px] font-black tracking-tighter ${
                    tx.type === 'deposit' ? 'text-[#1675F2]' : 'text-[#566873]'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'} ₩{tx.amount.toLocaleString()}
                  </span>
                  <button 
                    onClick={() => deleteTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] bg-[#1675F2]/20 backdrop-blur-md flex items-end justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-[460px] rounded-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-500 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1675F2] text-white rounded-2xl flex items-center justify-center"><Wallet size={20} /></div>
                <h3 className="text-xl font-black text-[#566873]">내역 추가</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              {/* 타입 선택 */}
              <div className="flex p-1 bg-[#F1F2F0] rounded-2xl">
                <button 
                  onClick={() => { setNewType('expense'); setNewCategory('식비'); }}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newType === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
                >
                  지출 (-)
                </button>
                <button 
                  onClick={() => { setNewType('deposit'); setNewCategory('입금'); }}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newType === 'deposit' ? 'bg-white text-[#1675F2] shadow-sm' : 'text-slate-400'}`}
                >
                  입금 (+)
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">항목 이름</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예: 점심 식사, 부모님 입금" className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1675F2]" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">금액 (₩)</label>
                  <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0" className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-4 text-xl font-black text-[#1675F2] focus:ring-2 focus:ring-[#1675F2]" />
                </div>

                {newType === 'expense' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">카테고리</label>
                    <div className="grid grid-cols-3 gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setNewCategory(cat)}
                          className={`py-3 rounded-xl text-[10px] font-black border-2 transition-all ${newCategory === cat ? 'border-[#1675F2] bg-blue-50 text-[#1675F2]' : 'border-slate-50 text-slate-300'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={addTransaction}
              className={`w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${
                newType === 'deposit' ? 'bg-[#1675F2] shadow-blue-100' : 'bg-rose-500 shadow-rose-100'
              }`}
            >
              기록하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicFundView;
