
import React, { useState, useRef, useMemo } from 'react';
import { Souvenir } from '../types';
import { ShoppingBag, Plus, CheckCircle2, Circle, Trash2, Gift, Image as ImageIcon, X, FileText, ExternalLink, Link2 } from 'lucide-react';

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
    setSouvenirs(prev => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    setFormData({ title: '', jpName: '', note: '', imageUrl: '', linkUrl: '' });
    setIsFormOpen(false);
  };

  const toggleStatus = (id: string) => {
    setSouvenirs(prev => (Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, isPurchased: !s.isPurchased } : s) : []));
  };

  const removeSouvenir = (id: string) => {
    setSouvenirs(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== id) : []));
  };

  const handleImageError = (id: string) => { setImageErrors(prev => ({ ...prev, [id]: true })); };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      {previewImage && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-8 right-8 text-white"><X size={24} /></button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#566873]/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1675F2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100"><ShoppingBag size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-[#566873] tracking-tight">쇼핑 도감</h2>
              <p className="text-[10px] text-[#1675F2] font-black uppercase tracking-widest">WISH LIST</p>
            </div>
          </div>
          <button onClick={() => setIsFormOpen(!isFormOpen)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isFormOpen ? 'bg-[#F8F9FD] text-[#566873]' : 'bg-[#F2E96D] text-[#1675F2] shadow-lg shadow-[#F2E96D]/30'}`}>{isFormOpen ? <X size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}</button>
        </div>

        {isFormOpen && (
          <form onSubmit={addSouvenir} className="space-y-4 mb-10 p-6 bg-[#F8F9FD] rounded-[2.5rem] border border-[#1675F2]/10 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-3">
              <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))} placeholder="상품명 (한글)" className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#1675F2]" />
              <input type="text" value={formData.jpName} onChange={(e) => setFormData(prev => ({...prev, jpName: e.target.value}))} placeholder="일본어 명칭 (점원 보여주기용)" className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#1675F2]" />
              <div className="relative">
                <input type="url" value={formData.linkUrl} onChange={(e) => setFormData(prev => ({...prev, linkUrl: e.target.value}))} placeholder="참고 링크 (http://...)" className="w-full bg-white border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#1675F2]" />
                <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              </div>
              <textarea value={formData.note} onChange={(e) => setFormData(prev => ({...prev, note: e.target.value}))} placeholder="수량, 특징 등 메모..." className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold shadow-sm h-24 resize-none focus:ring-2 focus:ring-[#1675F2]" />
            </div>
            
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white rounded-2xl px-5 py-4 text-sm font-bold shadow-sm flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#1675F2] hover:text-[#1675F2] transition-all">
                <ImageIcon size={16} />{formData.imageUrl ? '사진 선택됨' : '사진 추가'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <button type="submit" className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black text-sm shadow-lg shadow-[#1675F2]/20 hover:brightness-110 active:scale-95 transition-all">도감에 추가</button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4">
          {safeSouvenirs.length === 0 ? (
            <div className="text-center py-24 bg-[#F8F9FD] rounded-[2rem] border border-dashed border-[#566873]/10"><Gift className="mx-auto mb-4 opacity-10 text-[#566873]" size={60} /><p className="text-sm font-black text-[#566873]/30 uppercase tracking-widest">비어있습니다</p></div>
          ) : (
            safeSouvenirs.map(item => (
              <div key={item.id} className={`bg-white rounded-[2rem] border transition-all ${item.isPurchased ? 'opacity-40 grayscale border-transparent bg-slate-50' : 'shadow-sm border-[#566873]/5'}`}>
                <div className="flex items-stretch min-h-[140px]">
                  <div className="w-[120px] p-2 relative shrink-0 flex items-center justify-center border-r border-[#566873]/5" onClick={() => item.imageUrl && !imageErrors[item.id] && setPreviewImage(item.imageUrl)}>
                    {item.imageUrl && !imageErrors[item.id] ? (<img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-2xl shadow-sm" onError={() => handleImageError(item.id)}/>) : (<div className="text-[#566873]/10"><ImageIcon size={40} /></div>)}
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(item.id); }} className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#1675F2] border border-slate-100 active:scale-90 transition-all">{item.isPurchased ? <CheckCircle2 size={18} strokeWidth={3} /> : <Circle size={18} className="text-slate-200" strokeWidth={3} />}</button>
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-[15px] font-black tracking-tight ${item.isPurchased ? 'line-through text-slate-400' : 'text-[#566873]'}`}>{item.title}</h3>
                        <button onClick={() => removeSouvenir(item.id)} className="text-slate-200 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                      </div>
                      {item.jpName && (<p className="text-[11px] font-black text-[#1675F2] mt-0.5">{item.jpName}</p>)}
                      
                      {item.note && (
                        <div className="mt-2.5 flex items-start gap-1.5 opacity-70">
                          <FileText size={10} className="mt-1 shrink-0" />
                          <p className="text-[10px] font-bold leading-relaxed whitespace-pre-wrap">{item.note}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      {item.linkUrl ? (
                        <a 
                          href={item.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 text-[9px] font-black text-[#1675F2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 hover:bg-[#1675F2] hover:text-white transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={10} /> 링크 이동
                        </a>
                      ) : <div />}
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${item.isPurchased ? 'bg-slate-100 text-slate-400' : 'bg-[#F2E96D] text-[#1675F2]'}`}>{item.isPurchased ? '구매 완료' : '위시리스트'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SouvenirView;
