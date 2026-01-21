
import React, { useState, useRef, useMemo } from 'react';
import { Souvenir } from '../types';
import { ShoppingBag, Plus, CheckCircle2, Circle, Trash2, Gift, Image as ImageIcon, X, Link2, Pencil, Loader2 } from 'lucide-react';

interface SouvenirViewProps {
  souvenirs: Souvenir[];
  setSouvenirs: React.Dispatch<React.SetStateAction<Souvenir[]>>;
}

const SouvenirView: React.FC<SouvenirViewProps> = ({ souvenirs = [], setSouvenirs }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [editingItem, setEditingItem] = useState<Souvenir | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ title: '', jpName: '', note: '', imageUrl: '', linkUrl: '' });

  const safeSouvenirs = useMemo(() => Array.isArray(souvenirs) ? souvenirs : [], [souvenirs]);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1024;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("파일이 너무 큽니다. 15MB 이하의 이미지를 선택해주세요.");
        return;
      }
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const compressed = await compressImage(base64);
          setFormData(prev => ({ ...prev, imageUrl: compressed }));
        } catch (err) {
          console.error("Compression failed", err);
          alert("이미지 최적화에 실패했습니다.");
        } finally {
          setIsCompressing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openForm = (item?: Souvenir) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        title: item.title || '', 
        jpName: item.jpName || '', 
        note: item.note || '', 
        imageUrl: item.imageUrl || '', 
        linkUrl: item.linkUrl || '' 
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', jpName: '', note: '', imageUrl: '', linkUrl: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || isCompressing) return;

    const updatedData = {
      title: formData.title.trim(),
      jpName: (formData.jpName || '').trim(),
      note: (formData.note || '').trim(),
      imageUrl: formData.imageUrl,
      linkUrl: (formData.linkUrl || '').trim()
    };

    if (editingItem) {
      setSouvenirs(prev => Array.isArray(prev) ? prev.map(s => s.id === editingItem.id ? { ...s, ...updatedData } : s) : []);
    } else {
      const newItem: Souvenir = { 
        id: Date.now().toString(), 
        ...updatedData,
        isPurchased: false 
      };
      setSouvenirs(prev => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    }
    
    setIsFormOpen(false);
  };

  const toggleStatus = (id: string) => {
    setSouvenirs(prev => Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, isPurchased: !s.isPurchased } : s) : []);
  };

  const removeSouvenir = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setSouvenirs(prev => Array.isArray(prev) ? prev.filter(s => s.id !== id) : []);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 relative">
      {previewImage && (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-8 right-8 text-white"><X size={24} /></button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-3xl" />
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-[#1675F2]/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1675F2] text-white rounded-xl flex items-center justify-center shadow-md"><ShoppingBag size={20} /></div>
          <div>
            <h2 className="text-lg font-black text-[#566873] tracking-tight">쇼핑 도감</h2>
            <p className="text-[9px] text-[#1675F2] font-black uppercase tracking-widest">WISH LIST</p>
          </div>
        </div>
        <button onClick={() => openForm()} className="w-11 h-11 bg-[#F2E96D] text-[#1675F2] rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus size={24} strokeWidth={3} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3 items-stretch">
        {safeSouvenirs.length === 0 ? (
          <div className="col-span-2 text-center py-20 bg-white rounded-[2rem] border border-dashed border-[#566873]/10">
            <Gift className="mx-auto mb-3 opacity-10 text-[#566873]" size={40} />
            <p className="text-[11px] font-black text-[#566873]/30 uppercase tracking-widest">목록이 비어있습니다</p>
          </div>
        ) : (
          safeSouvenirs.map(item => (
            <div 
              key={item.id} 
              className={`bg-white rounded-[2rem] border overflow-hidden flex flex-col relative transition-all duration-300 ${
                item.isPurchased ? 'opacity-40 grayscale-[0.8] border-transparent' : 'shadow-sm border-[#566873]/5'
              }`}
            >
              <div className="relative aspect-square bg-[#F8F9FD] overflow-hidden">
                {item.imageUrl && !imageErrors[item.id] ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={() => setImageErrors(p => ({...p, [item.id]: true}))} onClick={() => setPreviewImage(item.imageUrl!)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#566873]/10"><ImageIcon size={32} /></div>
                )}
                <button onClick={() => toggleStatus(item.id)} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-[#1675F2] z-10">
                  {item.isPurchased ? <CheckCircle2 size={18} strokeWidth={3} /> : <Circle size={18} className="text-slate-200" strokeWidth={3} />}
                </button>
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                  <button onClick={() => openForm(item)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-slate-400 hover:text-[#1675F2]"><Pencil size={14} /></button>
                  <button onClick={() => removeSouvenir(item.id)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* 텍스트 영역: min-height를 설정하여 옆 카드와 제목 위치를 맞춤 */}
              <div className="p-4 flex-1 flex flex-col space-y-1.5 min-h-[110px]">
                <h3 className={`text-[14px] font-black leading-tight line-clamp-2 ${item.isPurchased ? 'line-through text-slate-400' : 'text-[#566873]'}`}>
                  {item.title}
                </h3>
                
                {item.jpName && (
                  <p className="text-[11px] font-bold text-[#1675F2] line-clamp-1">
                    {item.jpName}
                  </p>
                )}
                
                {/* 줄바꿈(pre-wrap) 적용 및 가독성 개선 */}
                <div className={`text-[10px] leading-relaxed break-words whitespace-pre-wrap flex-1 ${item.isPurchased ? 'text-slate-300' : 'text-[#566873]/60'}`}>
                  {item.note || <span className="opacity-0">설명 없음</span>}
                </div>

                {item.linkUrl && (
                  <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[9px] font-black text-[#1675F2] bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 self-start mt-1 transition-colors hover:bg-blue-100">
                    <Link2 size={10} /> 링크
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[550] bg-black/30 backdrop-blur-sm flex items-end justify-center p-4" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white w-full max-w-[460px] rounded-[2.5rem] p-8 space-y-6 animate-in slide-in-from-bottom-full duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[#566873]">{editingItem ? '정보 수정' : '쇼핑 도감 추가'}</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">상품명 (한글)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} placeholder="예: 로토 안약" className="w-full bg-[#F8F9FD] border-none rounded-xl px-5 py-4 text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">일본어 명칭 (점원 제시용)</label>
                <input type="text" value={formData.jpName} onChange={(e) => setFormData(p => ({...p, jpName: e.target.value}))} placeholder="예: ロート養潤水" className="w-full bg-[#F8F9FD] border-none rounded-xl px-5 py-4 text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">참고 링크</label>
                <div className="relative">
                  <input type="url" value={formData.linkUrl} onChange={(e) => setFormData(p => ({...p, linkUrl: e.target.value}))} placeholder="https://..." className="w-full bg-[#F8F9FD] border-none rounded-xl pl-12 pr-5 py-4 text-sm font-bold" />
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">상세 메모 (줄바꿈 가능)</label>
                <textarea value={formData.note} onChange={(e) => setFormData(p => ({...p, note: e.target.value}))} placeholder="• 수량: 2개&#10;• 특징: 자기전 사용" className="w-full bg-[#F8F9FD] border-none rounded-xl px-5 py-4 text-sm font-bold h-32 resize-none leading-relaxed" />
              </div>
              
              <button type="button" disabled={isCompressing} onClick={() => fileInputRef.current?.click()} className={`w-full py-4 border-2 border-dashed rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isCompressing ? 'bg-slate-50 border-slate-200 text-slate-300' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                {isCompressing ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                {isCompressing ? '최적화 중...' : (formData.imageUrl ? '사진 교체됨' : '사진 추가')}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              
              <button type="submit" disabled={isCompressing || !formData.title.trim()} className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black text-lg shadow-xl disabled:opacity-30 transition-all active:scale-95">
                {editingItem ? '수정 완료' : '추가하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SouvenirView;
