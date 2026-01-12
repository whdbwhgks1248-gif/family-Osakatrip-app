
import React, { useState, useRef, useMemo } from 'react';
import { Souvenir } from '../types';
import { ShoppingBag, Plus, CheckCircle2, Circle, Trash2, Gift, Image as ImageIcon, X, ExternalLink, Link2 } from 'lucide-react';

interface SouvenirViewProps {
  souvenirs: Souvenir[];
  setSouvenirs: React.Dispatch<React.SetStateAction<Souvenir[]>>;
}

const SouvenirView: React.FC<SouvenirViewProps> = ({ souvenirs = [], setSouvenirs }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ title: '', jpName: '', note: '', imageUrl: '', linkUrl: '' });

  const safeSouvenirs = useMemo(() => Array.isArray(souvenirs) ? souvenirs : [], [souvenirs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setFormData(prev => ({ ...prev, imageUrl: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const addSouvenir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    const newItem: Souvenir = { 
      id: Date.now().toString(), 
      title: formData.title.trim(), 
      jpName: formData.jpName.trim(), 
      note: formData.note.trim(), 
      imageUrl: formData.imageUrl.trim(), 
      linkUrl: formData.linkUrl.trim(),
      isPurchased: false 
    };
    // 상태 업데이트 즉시 반영
    setSouvenirs(prev => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    setFormData({ title: '', jpName: '', note: '', imageUrl: '', linkUrl: '' });
    setIsFormOpen(false);
  };

  const toggleStatus = (id: string) => {
    setSouvenirs(prev => (Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, isPurchased: !s.isPurchased } : s) : []));
  };

  const removeSouvenir = (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    setSouvenirs(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== id) : []));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 relative">
      {previewImage && (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-8 right-8 text-white"><X size={24} /></button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl" />
        </div>
      )}

      <div className="bg-white rounded-[3rem] p-8 shadow-[0_15px_40px_rgba(22,117,242,0.05)] border border-[#1675F2]/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#1675F2] text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-100">
              <ShoppingBag size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#566873] tracking-tight">쇼핑 도감</h2>
              <p className="text-[10px] text-[#1675F2] font-black uppercase tracking-widest">WISH LIST</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-14 h-14 bg-[#F2E96D] text-[#1675F2] rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-[#F2E96D]/30 active:scale-90 transition-all"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[550] bg-[#1675F2]/20 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-[500px] rounded-t-[3.5rem] p-10 space-y-8 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#1675F2] text-white rounded-xl flex items-center justify-center"><ShoppingBag size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-[#566873]">도감 등록</h3>
                </div>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center"><X size={20} /></button>
            </div>

            <form onSubmit={addSouvenir} className="space-y-4">
              <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))} placeholder="상품명 (한글)" className="w-full bg-[#F8F9FD] border-none rounded-[1.5rem] px-7 py-5 text-[15px] font-bold shadow-sm focus:ring-2 focus:ring-[#1675F2]" />
              <input type="text" value={formData.jpName} onChange={(e) => setFormData(prev => ({...prev, jpName: e.target.value}))} placeholder="일본어 명칭 (점원 보여주기용)" className="w-full bg-[#F8F9FD] border-none rounded-[1.5rem] px-7 py-5 text-[15px] font-bold shadow-sm focus:ring-2 focus:ring-[#1675F2]" />
              <div className="relative">
                <input type="url" value={formData.linkUrl} onChange={(e) => setFormData(prev => ({...prev, linkUrl: e.target.value}))} placeholder="참고 링크 (블로그 등)" className="w-full bg-[#F8F9FD] border-none rounded-[1.5rem] pl-14 pr-7 py-5 text-[15px] font-bold shadow-sm focus:ring-2 focus:ring-[#1675F2]" />
                <Link2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              </div>
              <textarea value={formData.note} onChange={(e) => setFormData(prev => ({...prev, note: e.target.value}))} placeholder="수량, 특징 등 메모..." className="w-full bg-[#F8F9FD] border-none rounded-[1.5rem] px-7 py-5 text-[15px] font-bold shadow-sm h-32 resize-none focus:ring-2 focus:ring-[#1675F2]" />
              
              <div className="flex gap-4">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white border-2 border-dashed border-slate-100 rounded-[1.5rem] py-5 text-sm font-bold text-slate-400 flex items-center justify-center gap-2 hover:border-[#1675F2] transition-all">
                  <ImageIcon size={18} />{formData.imageUrl ? '사진 교체' : '사진 추가'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <button type="submit" className="w-full bg-[#1675F2] text-white py-6 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all">도감에 추가</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {safeSouvenirs.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-[#566873]/10">
            <Gift className="mx-auto mb-5 opacity-10 text-[#566873]" size={64} />
            <p className="text-sm font-black text-[#566873]/30 uppercase tracking-widest">비어있습니다</p>
          </div>
        ) : (
          safeSouvenirs.map(item => (
            <div key={item.id} className={`bg-white rounded-[2.5rem] border transition-all duration-300 ${item.isPurchased ? 'opacity-40 grayscale border-transparent bg-slate-50' : 'shadow-sm border-[#566873]/5'}`}>
              <div className="flex items-stretch min-h-[160px]">
                <div 
                  className="w-[120px] sm:w-[150px] relative shrink-0 overflow-hidden cursor-pointer bg-[#F8F9FD] rounded-l-[2.5rem]"
                  onClick={() => item.imageUrl && !imageErrors[item.id] && setPreviewImage(item.imageUrl)}
                >
                  {item.imageUrl && !imageErrors[item.id] ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={() => setImageErrors(prev => ({...prev, [item.id]: true}))} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#566873]/10"><ImageIcon size={48} /></div>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleStatus(item.id); }} 
                    className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#1675F2] z-10"
                  >
                    {item.isPurchased ? <CheckCircle2 size={22} strokeWidth={3} /> : <Circle size={22} className="text-slate-200" strokeWidth={3} />}
                  </button>
                </div>

                <div className="flex-1 p-7 flex flex-col justify-between relative">
                  <button onClick={() => removeSouvenir(item.id)} className="absolute top-6 right-6 text-slate-200 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                  <div className="space-y-3 pr-6">
                    <div>
                      <h3 className={`text-lg font-black tracking-tight leading-tight ${item.isPurchased ? 'line-through text-slate-400' : 'text-[#566873]'}`}>{item.title}</h3>
                      {item.jpName && <p className="text-xs font-black text-[#1675F2] mt-1.5 opacity-80">{item.jpName}</p>}
                    </div>
                    {item.note && <p className="text-[13px] font-bold text-[#566873]/70 leading-relaxed whitespace-pre-wrap">{item.note}</p>}
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <div className="flex gap-2">
                      {item.linkUrl && (
                        <a 
                          href={item.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1.5 text-[11px] font-black text-[#1675F2] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100"
                        >
                          <ExternalLink size={12} /> 블로그 링크
                        </a>
                      )}
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl ${item.isPurchased ? 'bg-slate-100 text-slate-400' : 'bg-[#F2E96D] text-[#1675F2]'}`}>{item.isPurchased ? '구매 완료' : '위시리스트'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SouvenirView;
