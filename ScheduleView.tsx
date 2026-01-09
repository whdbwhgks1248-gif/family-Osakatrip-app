
import React, { useState } from 'react';
import { SCHEDULE_DATA } from '../constants.tsx';
import { MapPin, Coins, Clock, CarFront, MoveRight, TrainFront, Plane, FileText, ExternalLink, Bus, Footprints, Info } from 'lucide-react';
import { ScheduleItem } from '../types.ts';

const ScheduleView: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(0);

  const safeData = SCHEDULE_DATA.days;
  const currentDayData = safeData[selectedDay] || { label: 'Unknown', items: [] };
  const isInfoTab = currentDayData.label === '정보';

  const getTransportIcon = (item: ScheduleItem) => {
    // 1. Explicit transport field
    if (item.transport === 'bus') return <Bus size={14} />;
    if (item.transport === 'walk') return <Footprints size={14} />;
    if (item.transport === 'taxi') return <CarFront size={14} />;
    if (item.transport === 'train') return <TrainFront size={14} />;
    if (item.transport === 'flight') return <Plane size={14} />;
    if (item.transport === 'move') return <MoveRight size={14} />;

    // 2. Fallback to keyword detection (legacy support)
    const title = item.title;
    const cost = item.expectedCost || '';
    if (title.includes('🚕') || cost.includes('택시비')) return <CarFront size={14} />;
    if (title.includes('🚎') || cost.includes('버스비')) return <Bus size={14} />;
    if (title.includes('->') || title.includes('→') || title.includes('KIX')) return <Plane size={14} />;
    if (title.includes('역') || cost.includes('교통비')) return <TrainFront size={14} />;
    
    return null;
  };

  return (
    <div className="space-y-2 animate-in fade-in duration-700">
      {/* Date Selector - Adjusted for symmetric padding */}
      <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar -mx-4 px-4 bg-[#FCFCFC]">
        {safeData.map((day, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedDay(idx);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-shrink-0 min-w-[85px] px-3 py-3.5 rounded-3xl transition-all duration-300 border flex flex-col items-center justify-center ${
              selectedDay === idx 
                ? 'bg-[#1675F2] text-white border-[#1675F2] shadow-lg shadow-[#1675F2]/20 scale-105' 
                : 'bg-white text-[#566873] border-[#566873]/10 hover:border-[#1675F2]/30'
            }`}
          >
            <div className="text-sm font-black tracking-tight">{day.label}</div>
          </button>
        ))}
      </div>

      {/* List Container - Balanced spacing */}
      <div className={`space-y-5 relative pt-2 ${!isInfoTab ? 'pl-3 border-l-2 border-[#1675F2]/10' : ''}`}>
        {currentDayData.items.map((item, idx) => {
          const transportIcon = getTransportIcon(item);
          const isMovement = !!item.transport || item.title.includes('→') || item.title.includes('->');
          const hasImage = !item.noImage && (item.image || (item.images && item.images.length > 0));
          
          const displayTitle = item.title.replace(/^([🚕→🚎]|\-\>)\s*/, '').trim();

          return (
            <div key={idx} className="relative">
              {/* Timeline Dot (Only for schedule tabs) */}
              {!isInfoTab && (
                <div className="absolute -left-[22px] top-0 w-4 h-4 rounded-full border-4 border-[#FCFCFC] bg-[#1675F2] z-10"></div>
              )}
              
              <div className={`bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(86,104,115,0.06)] border transition-all ${isInfoTab ? 'border-[#1675F2]/10 bg-gradient-to-br from-white to-[#F8F9FD]' : isMovement ? 'border-[#1675F2]/20 bg-gradient-to-br from-white to-[#1675F2]/5' : 'border-[#566873]/5'}`}>
                {/* Header Info */}
                <div className={`p-6 ${hasImage ? 'pb-6' : 'pb-4'}`}>
                  {/* Row for Map and Time (If not info tab) */}
                  {(!isInfoTab || item.mapUrl) && (
                    <div className={`flex justify-between items-start ${isInfoTab ? 'mb-1.5' : 'mb-2'}`}>
                      <div className="flex items-center gap-1.5">
                        {!isInfoTab && (
                          <>
                            <Clock size={10} className="text-[#1675F2]" />
                            <span className="text-[10px] font-black text-[#1675F2] tracking-widest uppercase">{item.time || '유동적'}</span>
                          </>
                        )}
                      </div>
                      {item.mapUrl && (
                        <a 
                          href={item.mapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-7 h-7 bg-[#F1F2F0] text-[#1675F2] rounded-full flex items-center justify-center transition-all hover:bg-[#1675F2] hover:text-white"
                        >
                          <MapPin size={12} />
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2.5">
                    {transportIcon && <div className="p-1.5 bg-[#1675F2] text-white rounded-lg shadow-sm shrink-0 flex items-center justify-center"><div className="w-3.5 h-3.5 flex items-center justify-center">{transportIcon}</div></div>}
                    {!transportIcon && isMovement && <div className="p-1.5 bg-[#566873]/10 text-[#566873] rounded-lg shrink-0 flex items-center justify-center"><MoveRight size={14} /></div>}
                    {isInfoTab && !transportIcon && <div className="p-1.5 bg-[#F2E96D] text-[#1675F2] rounded-lg shadow-sm shrink-0 flex items-center justify-center"><Info size={14} /></div>}
                    <h3 className={`text-[17px] font-black leading-none tracking-tight -mt-0.5 ${isInfoTab || isMovement ? 'text-[#1675F2]' : 'text-[#566873]'}`}>
                      {displayTitle}
                    </h3>
                  </div>
                </div>

                {/* Hero Image (Single) */}
                {!item.noImage && item.image && (
                  <div className="relative w-full aspect-[16/10] bg-[#F1F2F0] overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                    />
                  </div>
                )}

                {/* Multiple Images (Gallary style or list) */}
                {!item.noImage && item.images && item.images.map((img, i) => (
                  <div key={i} className={`relative w-full border-b border-[#566873]/5 last:border-b-0 bg-[#F1F2F0] overflow-hidden ${img.fit === 'contain' ? 'aspect-auto py-4 bg-white' : 'aspect-[16/10]'}`}>
                    <img 
                      src={img.src} 
                      alt={img.alt || item.title} 
                      className={`w-full h-full transition-transform duration-1000 ${img.fit === 'contain' ? 'object-contain max-h-[80vh]' : 'object-cover hover:scale-105'}`}
                    />
                  </div>
                ))}

                {/* PDF/Link Document Block */}
                {item.pdfUrl && (
                  <div className={`px-6 pb-6 ${hasImage ? 'pt-6' : 'pt-2'}`}>
                    <a 
                      href={item.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full bg-[#1675F2]/5 hover:bg-[#1675F2]/10 border border-[#1675F2]/10 p-4 rounded-3xl transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white text-[#1675F2] rounded-2xl flex items-center justify-center shadow-sm border border-[#1675F2]/5 group-hover:scale-105 transition-transform">
                          <FileText size={22} />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-[#1675F2] leading-tight">예약 확인서 / 관련 정보</p>
                          <p className="text-[10px] text-[#566873]/40 font-bold">클릭하여 자세히 보기</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center text-[#1675F2]/30 group-hover:text-[#1675F2] transition-colors">
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  </div>
                )}

                {/* Expected Cost */}
                {item.expectedCost && (
                  <div className={`px-6 ${hasImage && !item.pdfUrl ? 'pt-6' : 'pt-1'} ${!item.note ? 'pb-8' : 'pb-1'}`}>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FDF6B2]/80 text-[#1675F2] rounded-xl text-[11px] font-black shadow-sm border border-[#F2E96D]/30">
                      <Coins size={12} />
                      {item.expectedCost}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {item.note && (
                  <div className={`p-6 ${hasImage && !item.pdfUrl && !item.expectedCost ? 'pt-6' : 'pt-2'}`}>
                    <div className={`${isInfoTab ? 'bg-white' : 'bg-[#F1F2F0]/40'} p-4 rounded-2xl border border-[#566873]/5`}>
                      {item.note.split('\n').map((line, i) => {
                        const hasOriginalBullet = /^[•\-*]/.test(line);
                        const cleanLine = line.replace(/^[•\-*]\s?/, '');
                        if (!cleanLine.trim() && i > 0) return <div key={i} className="h-2" />;
                        
                        return (
                          <div key={i} className={`flex ${hasOriginalBullet ? 'gap-2.5' : 'gap-0'} mb-1 last:mb-0`}>
                            {hasOriginalBullet && (
                              <span className="w-1 h-1 bg-[#1675F2] rounded-full mt-2 flex-shrink-0"></span>
                            )}
                            <span className="text-[13px] font-medium text-[#566873]/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanLine }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleView;
