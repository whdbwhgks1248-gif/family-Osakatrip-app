
import React, { useState, useRef } from 'react';
import { Souvenir } from '../types.ts';
import { ShoppingBag, Plus, CheckCircle2, Circle, Trash2, Gift, Image as ImageIcon, X, Languages, Upload, ZoomIn } from 'lucide-react';

interface SouvenirViewProps {
  souvenirs: Souvenir[];
  setSouvenirs: React.Dispatch<React.SetStateAction<Souvenir[]>>;
}

const SouvenirView: React.FC<SouvenirViewProps> = ({ souvenirs, setSouvenirs }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    jpName: '',
    note: '',
    imageUrl: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
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
      isPurchased: false,
    };
    
    setSouvenirs([newItem, ...souvenirs]);
    setFormData({ title: '', jpName: '', note: '', imageUrl: '' });
    setIsFormOpen(false);
  };

  const toggleStatus = (id: string) => {
    setSouvenirs(souvenirs.map(s => s.id === id ? { ...s, isPurchased: !s.isPurchased } : s));
  };

  const removeSouvenir = (id: string) => {
    setSouvenirs(souvenirs.filter(s => s.id !== id));
  };

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const purchasedCount = souvenirs.filter(s => s.isPurchased).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" 
          />
          <div className="absolute bottom-10 text-white/40 text-[10px] font-bold uppercase tracking-widest">탭하여 닫기</div>
        </div>
      )}

      {/* Header Summary Card */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#566873]/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1675F2] text-white rounded-2xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#566873] tracking-tight">쇼핑 도감</h2>
              <p className="text-[10px] text-[#1675F2] font-black uppercase tracking-widest">WISH LIST</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${
              isFormOpen ? 'bg-[#F1F2F0] text-[#566873]' : 'bg-[#F2E96D] text-[#1675F2] shadow-[#F2E96D]/30'
            }`}
          >
            {isFormOpen ? <X size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
          </button>
        </div>

        {/* Add Form Section */}
        {isFormOpen && (
          <form onSubmit={addSouvenir} className="space-y-4 mb-10 p-6 bg-[#F1F2F0]/50 rounded-[2rem] border border-[#1675F2]/10 animate-in zoom-in-95 duration-300">
            <div className="space-y-3">
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="상품명 (한글)"
                className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold text-[#566873] focus:ring-2 focus:ring-[#1675F2] shadow-sm"
              />
              <div className="relative">
                <Languages size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1675F2]/40" />
                <input 
                  type="text" 
                  value={formData.jpName}
                  onChange={(e) => setFormData({...formData, jpName: e.target.value})}
                  placeholder="일본어 명칭 (점원 보여주기용)"
                  className="w-full bg-white border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold text-[#1675F2] focus:ring-2 focus:ring-[#1675F2] shadow-sm placeholder:text-[#1675F2]/20"
                />
              </div>
              <input 
                type="text" 
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                placeholder="상세 메모 (예: 156매입)"
                className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold text-[#566873]/60 focus:ring-2 focus:ring-[#1675F2] shadow-sm"
              />
              
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold text-[#566873]/40 shadow-sm hover:bg-white/80 transition-all"
                >
                  {formData.imageUrl ? <ImageIcon size={16} className="text-[#1675F2]" /> : <Upload size={16} />}
                  {formData.imageUrl ? '사진 변경' : '갤러리 사진 선택'}
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={!formData.title}
              className="w-full bg-[#1675F2] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-[#1675F2]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
            >
              리스트에 추가하기
            </button>
          </form>
        )}

        {/* Counter */}
        <div className="flex justify-between items-center mb-6 px-2">
          <span className="text-[10px] font-black text-[#566873]/40 uppercase tracking-widest">총 {souvenirs.length}개</span>
          <span className="text-[10px] font-black text-[#1675F2] bg-[#F2E96D] px-3 py-1.5 rounded-full">구매완료 {purchasedCount}</span>
        </div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 gap-4">
          {souvenirs.length === 0 ? (
            <div className="text-center py-24 bg-[#F1F2F0] rounded-[2rem] border border-dashed border-[#566873]/10">
              <Gift className="mx-auto mb-4 opacity-10 text-[#566873]" size={60} />
              <p className="text-sm font-black text-[#566873]/30 uppercase tracking-widest">비어있습니다</p>
            </div>
          ) : (
            souvenirs.map(item => (
              <div 
                key={item.id} 
                className={`relative group overflow-hidden bg-white rounded-[2rem] border transition-all ${
                  item.isPurchased 
                  ? 'opacity-40 grayscale border-transparent' 
                  : 'shadow-sm border-[#566873]/5 hover:border-[#1675F2]/20'
                }`}
              >
                <div className="flex items-stretch min-h-[160px]">
                  {/* Product Image Section */}
                  <div 
                    className={`w-1/3 bg-white p-2 relative overflow-hidden shrink-0 flex items-center justify-center border-r border-[#566873]/5 cursor-zoom-in group/img ${item.isPurchased ? 'bg-[#F1F2F0]' : ''}`}
                    onClick={() => item.imageUrl && !imageErrors[item.id] && setPreviewImage(item.imageUrl)}
                  >
                    {item.imageUrl && !imageErrors[item.id] ? (
                      <>
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-contain transition-transform duration-500 group-hover/img:scale-110" 
                          onError={() => handleImageError(item.id)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 flex items-center justify-center transition-all opacity-0 group-hover/img:opacity-100">
                          <ZoomIn className="text-white drop-shadow-md" size={24} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#566873]/10">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    {/* Purchase Toggle Over Image */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(item.id);
                      }}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#1675F2] active:scale-90 transition-transform border border-[#566873]/5 z-10"
                    >
                      {item.isPurchased ? <CheckCircle2 size={16} strokeWidth={3} /> : <Circle size={16} className="text-[#566873]/20" strokeWidth={3} />}
                    </button>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className={`text-[15px] font-black tracking-tight leading-tight ${item.isPurchased ? 'line-through text-[#566873]/40' : 'text-[#566873]'}`}>
                          {item.title}
                        </h3>
                        <button 
                          onClick={() => removeSouvenir(item.id)}
                          className="text-[#566873]/10 hover:text-red-400 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {item.jpName && (
                        <div className="mt-2 p-2 bg-[#1675F2]/5 rounded-xl border border-[#1675F2]/5">
                          <p className="text-[11px] font-black text-[#1675F2] leading-tight break-all font-mono">
                            {item.jpName}
                          </p>
                        </div>
                      )}
                      
                      {item.note && (
                        <p className="mt-2 text-[10px] font-bold text-[#566873]/50 leading-tight">
                          💡 {item.note}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                       <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${item.isPurchased ? 'bg-[#566873]/10 text-[#566873]/40' : 'bg-[#F2E96D] text-[#1675F2]'}`}>
                        {item.isPurchased ? 'Purchased' : 'In Wishlist'}
                      </span>
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
