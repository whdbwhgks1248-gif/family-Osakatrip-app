
import React, { useState, useMemo } from 'react';
import { PackItem, Assignee, ASSIGNEE_OPTIONS } from '../types';
import { Briefcase, Plus, CheckCircle2, Circle, Trash2, X, User, Users } from 'lucide-react';

interface PackViewProps {
  packItems: PackItem[];
  setPackItems: React.Dispatch<React.SetStateAction<PackItem[]>>;
}

const PackView: React.FC<PackViewProps> = ({ packItems = [], setPackItems }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState<Assignee>('공통');
  const [filter, setFilter] = useState<Assignee | '전체'>('전체');

  const safeItems = useMemo(() => Array.isArray(packItems) ? packItems : [], [packItems]);

  const filteredItems = useMemo(() => {
    if (filter === '전체') return safeItems;
    return safeItems.filter(item => item.assignedTo === filter);
  }, [safeItems, filter]);

  const addItem = () => {
    if (!newTitle.trim()) return;
    const newItem: PackItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      assignedTo: newAssignedTo,
      isDone: false
    };
    setPackItems(prev => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    setNewTitle('');
    setIsModalOpen(false);
  };

  const toggleDone = (id: string) => {
    setPackItems(prev => prev.map(item => item.id === id ? { ...item, isDone: !item.isDone } : item));
  };

  const removeItem = (id: string) => {
    setPackItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      {/* 헤더 섹션 */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#566873]/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1675F2] text-white rounded-2xl flex items-center justify-center"><Briefcase size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-[#566873] tracking-tight">준비물 리스트</h2>
              <p className="text-[10px] text-[#1675F2] font-black uppercase tracking-widest">누락 없이 꼼꼼하게</p>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-[#F2E96D] text-[#1675F2] rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={24} strokeWidth={3} /></button>
        </div>

        {/* 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2">
          {['전체', ...ASSIGNEE_OPTIONS].map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt as any)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-black border transition-all ${
                filter === opt 
                  ? 'bg-[#1675F2] text-white border-[#1675F2] shadow-md' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-blue-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="space-y-3 px-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <Briefcase className="mx-auto mb-4 opacity-10 text-slate-400" size={48} />
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">목록이 비어있습니다</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`bg-white p-5 rounded-[1.75rem] border flex items-center justify-between group transition-all ${
                item.isDone ? 'opacity-40 bg-slate-50 border-transparent' : 'border-[#566873]/5 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 flex-1 mr-4">
                <button 
                  onClick={() => toggleDone(item.id)}
                  className={`shrink-0 transition-all ${item.isDone ? 'text-[#1675F2]' : 'text-slate-200 hover:text-blue-200'}`}
                >
                  {item.isDone ? <CheckCircle2 size={24} strokeWidth={3} /> : <Circle size={24} strokeWidth={3} />}
                </button>
                <div className="flex flex-col">
                  <span className={`text-[15px] font-bold leading-tight ${item.isDone ? 'line-through text-slate-400' : 'text-[#566873]'}`}>
                    {item.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {item.assignedTo === '공통' ? (
                      <div className="flex items-center gap-1 text-[9px] font-black text-[#1675F2] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
                        <Users size={10} /> 공통 (모두 챙기기)
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        <User size={10} /> {item.assignedTo} 담당
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-red-400 transition-colors p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] bg-[#1675F2]/20 backdrop-blur-md flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-[460px] rounded-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-500 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1675F2] text-white rounded-xl flex items-center justify-center"><Briefcase size={20} /></div>
                <h3 className="text-xl font-black text-[#566873]">준비물 추가</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">물건 이름</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="예: 돼지코 어댑터, 여권" 
                  className="w-full bg-[#F8F9FD] border-none rounded-2xl px-6 py-4 text-base font-bold shadow-sm focus:ring-2 focus:ring-[#1675F2]" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">누가 챙길까요?</label>
                <div className="grid grid-cols-4 gap-2">
                  {ASSIGNEE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setNewAssignedTo(opt)}
                      className={`py-3 rounded-xl text-[11px] font-black border-2 transition-all ${
                        newAssignedTo === opt 
                          ? 'bg-[#1675F2] border-[#1675F2] text-white shadow-md' 
                          : 'bg-white border-slate-50 text-slate-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={addItem}
              className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:brightness-110 active:scale-95 transition-all"
            >
              리스트에 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackView;
