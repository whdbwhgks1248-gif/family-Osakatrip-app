
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

  // 이미지 압축 함수: 서버 부하를 줄이고 저장 오류를 방지합니다.
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 최대 해상도를 800px로 제한 (모바일 보기 충분)
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // 화질 0.7로 압축하여 용량을 획기적으로 줄임
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setFormData(prev => ({ ...prev, imageUrl: compressed }));
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const openForm = (item?: Souvenir) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        title: item.title, 
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
    if (!formData.title.trim()) return;

    if (editingItem) {
      setSouvenirs(prev => prev.map(s => s.id === editingItem.id ? { 
        ...s, 
        ...formData, 
        title: formData.title.trim(),
        jpName: formData.jpName.trim(),
        note: formData.note.trim(),
        imageUrl: formData.imageUrl.trim(),
        linkUrl: formData.linkUrl.trim()
      } : s));
    } else {
      const newItem: Souvenir = { 
        id: Date.now().toString(), 
        title: formData.title.trim(), 
        jpName: formData.jpName.trim(), 
        note: formData.note.trim(), 
        imageUrl: formData.imageUrl.trim(), 
        linkUrl: formData.linkUrl.trim(),
        isPurchased: false 
      };
      setSouvenirs(prev => [newItem, ...prev]);
    }
    setIsFormOpen(false);
  };

  const toggleStatus = (id: string) => {
    setSouvenirs(prev => prev.map(s => s.id === id ? { ...s, isPurchased: !s.isPurchased } : s));
  };

  const removeSouvenir = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setSouvenirs(prev => prev.filter(s => s.id !== id));
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

      {/* 헤더 섹션 - 소형화 */}
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

      {/* 2열 그리드 리스트 */}
      <div className="grid grid-cols-2 gap-3">
        {safeSouvenirs.length === 0 ? (
          <div className="col-span-2 text-center py-20 bg-white rounded-[2rem] border border-dashed border-[#566873]/10">
            <Gift className="mx-auto mb-3 opacity-10 text-[#566873]" size={40} />
            <p className="text-[11px] font-black text-[#566873]/30 uppercase tracking-widest">목록이 비어있습니다</p>
          </div>
        ) : (
          safeSouvenirs.map(item => (
            <div 
              key={item.id} 
              className={`bg-white rounded-[1.5rem] border overflow-hidden flex flex-col relative transition-all duration-300 ${
                item.isPurchased ? 'opacity-40 grayscale-[0.8] border-transparent' : 'shadow-sm border-[#566873]/5'
              }`}
            >
              {/* 이미지 영역 (Aspect Ratio 1:1) */}
              <div className="relative aspect-square bg-[#F8F9FD] overflow-hidden group">
                {item.imageUrl && !imageErrors[item.id] ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={() => setImageErrors(p => ({...p, [item.id]: true}))} onClick={() => setPreviewImage(item.imageUrl!)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#566873]/10"><ImageIcon size={32} /></div>
                )}
                <button onClick={() => toggleStatus(item.id)} className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-[#1675F2]">
                  {item.isPurchased ? <CheckCircle2 size={16} strokeWidth={3} /> : <Circle size={16} className="text-slate-200" strokeWidth={3} />}
                </button>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <button onClick={() => openForm(item)} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-slate-400 hover:text-[#1675F2]"><Pencil size={12} /></button>
                  <button onClick={() => removeSouvenir(item.id)} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>

              {/* 정보 영역 (최소화) */}
              <div className="p-3 space-y-1">
                <h3 className={`text-[13px] font-black leading-tight line-clamp-1 ${item.isPurchased ? 'line-through text-slate-400' : 'text-[#566873]'}`}>{item.title}</h3>
                {item.jpName && <p className="text-[10px] font-bold text-[#1675F2] line-clamp-1">{item.jpName}</p>}
                {item.note && <p className="text-[10px] text-[#566873]/60 line-clamp-2 leading-tight h-[2.5em]">{item.note}</p>}
                
                {item.linkUrl && (
                  <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[9px] font-black text-[#1675F2] bg-blue-50 px-2 py-1 rounded-md border border-blue-100 mt-1">링크</a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 등록/수정 모달 */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[550] bg-black/30 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-[460px] rounded-[2.5rem] p-8 space-y-6 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[#566873]">{editingItem ? '정보 수정' : '쇼핑 도감 추가'}</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} placeholder="상품명 (한글)" className="w-full bg-[#F8F9FD] border-none rounded-xl px-5 py-4 text-sm font-bold" />
              <input type="text" value={formData.jpName} onChange={(e) => setFormData(p => ({...p, jpName: e.target.value}))} placeholder="일본어 명칭" className="w-full bg-[#F8F9FD] border-none rounded-xl px-5 py-4 text-sm font-bold" />
              <div className="relative">
                <input type="url" value={formData.linkUrl} onChange={(e) => setFormData(p => ({...p, linkUrl: e.target.value}))} placeholder="참고 링크" className="w-full bg-[#F8F9FD] border-none rounded-xl pl-12 pr-5 py-4 text-sm font-bold" />
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              </div>
              <textarea value={formData.note} onChange={(e) => setFormData(p => ({...p, note: e.target.value}))} placeholder="메모..." className="w-full bg-[#F8F9FD] border-none rounded-xl px-5 py-4 text-sm font-bold h-24 resize-none" />
              
              <button 
                type="button" 
                disabled={isCompressing}
                onClick={() => fileInputRef.current?.click()} 
                className={`w-full py-4 border-2 border-dashed rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  isCompressing ? 'bg-slate-50 border-slate-200 text-slate-300' : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                {isCompressing ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                {isCompressing ? '사진 최적화 중...' : (formData.imageUrl ? '사진 교체' : '사진 추가')}
              </button>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button 
                type="submit" 
                disabled={isCompressing}
                className="w-full bg-[#1675F2] text-white py-5 rounded-xl font-black text-lg shadow-xl disabled:opacity-50"
              >
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
