
import React, { useState, useRef, useMemo } from 'react';
import { Souvenir } from '../types';
import { ShoppingBag, Plus, CheckCircle2, Circle, Trash2, Gift, Image as ImageIcon, X, Link2, Pencil, Loader2, Languages } from 'lucide-react';

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
    <div className="space-y-5 animate-in fade-in duration-500 pb-24 relative">
      {previewImage && (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-8 right-8 text-white"><X size={24} /></button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-3xl" />
        </div>
      )}

      {/* 헤더 바 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#566873]/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1675F2] text-white rounded-2xl flex items-center justify-center shadow-lg"><ShoppingBag size={20} /></div>
          <div>
            <h2 className="text-lg font-black text-[#1675F2] tracking-tighter">쇼핑 도감</h2>
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Bucket List</p>
          </div>
        </div>
        <button onClick={() => openForm()} className="h-11 px-5 bg-[#F2E96D] text-[#1675F2] rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
          <Plus size={18} strokeWidth={3} />
          <span className="text-xs font-black">추가</span>
        </button>
      </div>

      {/* 그리드 컨테이너: items-start로 카드 높이 불일치 문제 해결 */}
      <div className="grid grid-cols-2 gap-4 items-start">
        {safeSouvenirs.length === 0 ? (
          <div className="col-span-2 text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-[#566873]/10">
            <Gift className="mx-auto mb-4 opacity-10 text-[#566873]" size={48} />
            <p className="text-[11px] font-black text-[#566873]/30 uppercase tracking-[0.3em]">목록이 비어있습니다</p>
          </div>
        ) : (
          safeSouvenirs.map(item => (
            <div 
              key={item.id} 
              className={`group bg-white rounded-[2rem] border transition-all duration-300 flex flex-col relative overflow-hidden ${
                item.isPurchased 
                  ? 'opacity-40 grayscale-[0.6] border-slate-100 bg-slate-50' 
                  : 'shadow-md border-[#566873]/5 hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {/* 이미지 영역 */}
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                {item.imageUrl && !imageErrors[item.id] ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover" 
                    onError={() => setImageErrors(p => ({...p, [item.id]: true}))} 
                    onClick={() => setPreviewImage(item.imageUrl!)} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={40} strokeWidth={1} /></div>
                )}
                
                {/* 우측 상단 관리 버튼 (Hover 시 더 선명하게) */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openForm(item)} className="w-7 h-7 rounded-full bg-white/90 text-slate-400 flex items-center justify-center shadow-sm hover:text-[#1675F2]"><Pencil size={12} /></button>
                  <button onClick={() => removeSouvenir(item.id)} className="w-7 h-7 rounded-full bg-white/90 text-slate-400 flex items-center justify-center shadow-sm hover:text-red-500"><Trash2 size={12} /></button>
                </div>

                {/* 구매 완료 체크 표시 */}
                <button 
                  onClick={() => toggleStatus(item.id)} 
                  className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 transition-all shadow-lg ${
                    item.isPurchased 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/90 text-[#1675F2] border border-blue-50'
                  }`}
                >
                  {item.isPurchased ? <CheckCircle2 size={14} strokeWidth={3} /> : <Circle size={14} strokeWidth={3} />}
                  <span className="text-[10px] font-black">{item.isPurchased ? '구매완료' : '구매전'}</span>
                </button>
              </div>

              {/* 텍스트 정보 영역: 가변 높이 */}
              <div className="p-4 space-y-2">
                <h3 className={`text-[14px] font-black leading-tight break-all ${item.isPurchased ? 'line-through text-slate-400' : 'text-[#566873]'}`}>
                  {item.title}
                </h3>
                
                {/* 일본어 명칭 태그 스타일 */}
                {item.jpName && (
                  <div className="inline-flex items-center gap-1 bg-[#F2E96D]/30 border border-[#F2E96D]/50 px-2 py-1 rounded-lg">
                    <Languages size={10} className="text-[#1675F2]" />
                    <span className="text-[10px] font-black text-[#1675F2] tracking-tighter">{item.jpName}</span>
                  </div>
                )}
                
                {/* 설명 영역: 내용이 있을 때만 메모지 스타일로 표시 */}
                {item.note && (
                  <div className={`text-[10px] leading-relaxed p-3 rounded-xl border border-[#566873]/5 whitespace-pre-wrap break-words ${
                    item.isPurchased ? 'bg-slate-100 text-slate-300' : 'bg-[#F8F9FD] text-[#566873]/70'
                  }`}>
                    {item.note}
                  </div>
                )}

                {item.linkUrl && (
                  <a 
                    href={item.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-[9px] font-black text-[#1675F2] hover:underline"
                  >
                    <Link2 size={10} /> 참고 링크 보기
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 등록/수정 모달 */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[550] bg-black/40 backdrop-blur-md flex items-end justify-center p-4" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white w-full max-w-[460px] rounded-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-500" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F2E96D] text-[#1675F2] rounded-2xl flex items-center justify-center shadow-sm"><ShoppingBag size={20} /></div>
                <h3 className="text-xl font-black text-[#566873] tracking-tighter">{editingItem ? '상품 수정' : '위시리스트 추가'}</h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">상품명 (한글)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} placeholder="무엇을 살까요?" className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1675F2]" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">일본어 명칭 (점원 제시용)</label>
                <div className="relative">
                  <input type="text" value={formData.jpName} onChange={(e) => setFormData(p => ({...p, jpName: e.target.value}))} placeholder="현지 명칭 입력" className="w-full bg-[#F1F2F0] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1675F2]" />
                  <Languages className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">상세 메모 (줄바꿈 가능)</label>
                <textarea value={formData.note} onChange={(e) => setFormData(p => ({...p, note: e.target.value}))} placeholder="수량, 가격, 특징 등..." className="w-full bg-[#F1F2F0] border-none rounded-2xl px-6 py-4 text-sm font-bold h-32 resize-none leading-relaxed focus:ring-2 focus:ring-[#1675F2]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" disabled={isCompressing} onClick={() => fileInputRef.current?.click()} className={`py-4 border-2 border-dashed rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${isCompressing ? 'bg-slate-50 border-slate-200 text-slate-300' : 'border-[#1675F2]/20 text-[#1675F2] hover:bg-blue-50'}`}>
                  {isCompressing ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  {formData.imageUrl ? '사진 변경' : '사진 추가'}
                </button>
                <div className="relative">
                  <input type="url" value={formData.linkUrl} onChange={(e) => setFormData(p => ({...p, linkUrl: e.target.value}))} placeholder="링크(선택)" className="w-full h-full bg-[#F1F2F0] border-none rounded-2xl px-6 text-xs font-bold focus:ring-2 focus:ring-[#1675F2]" />
                  <Link2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                </div>
              </div>
              
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              
              <button type="submit" disabled={isCompressing || !formData.title.trim()} className="w-full bg-[#1675F2] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 disabled:opacity-30 transition-all active:scale-95">
                {editingItem ? '수정 내용 저장' : '위시리스트 등록'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SouvenirView;
