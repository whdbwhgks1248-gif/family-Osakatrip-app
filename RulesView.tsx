
import React from 'react';
import { PARENT_RULES, SIBLING_RULES } from '../constants.tsx';
import { ShieldCheck, Info, Heart, Users } from 'lucide-react';

const RulesView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 pt-3">
      {/* Header Info Card */}
      <div className="bg-[#1675F2] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-[#1675F2]/20">
        <div className="absolute -right-6 -top-6 opacity-10 rotate-12 text-[#F2E96D]">
          <ShieldCheck size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-2 flex items-center gap-2">
            <ShieldCheck size={22} className="text-[#F2E96D]" />
            가족 여행 평화 수칙
          </h3>
          <p className="text-xs text-white/80 font-bold leading-relaxed">
            모두가 즐거운 여행을 위해 각자의 위치에서 이것만은 꼭 지켜주세요! <br/>
            행복한 추억은 서로를 향한 배려에서 시작됩니다.
          </p>
        </div>
      </div>

      {/* Mom & Dad Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#566873]/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
            <Heart size={24} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#566873] tracking-tight">엄마 & 아빠 규칙</h2>
            <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">존경과 배려의 마음으로</p>
          </div>
        </div>

        <div className="space-y-3">
          {PARENT_RULES.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-4 p-5 bg-[#F8F9FD] rounded-3xl border border-transparent hover:border-rose-100 transition-all group">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-[11px] font-black text-rose-400 border border-rose-50">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <p className="text-sm font-bold text-[#566873]">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Siblings Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#566873]/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 text-[#1675F2] rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#566873] tracking-tight">형제자매 규칙</h2>
            <p className="text-[10px] text-[#1675F2] font-black uppercase tracking-widest">협력과 웃음의 여행을 위해</p>
          </div>
        </div>

        <div className="space-y-3">
          {SIBLING_RULES.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-4 p-5 bg-[#F8F9FD] rounded-3xl border border-transparent hover:border-blue-100 transition-all group">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-[11px] font-black text-[#1675F2] border border-blue-50">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <p className="text-sm font-bold text-[#566873]">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-3 px-8 text-[#566873]/40">
        <div className="w-5 h-5 flex items-center justify-center">
          <Info size={14} />
        </div>
        <p className="text-[11px] font-bold italic">"여행지에서 짜증이 날 땐 심호흡을 세 번 합시다!"</p>
      </div>
    </div>
  );
};

export default RulesView;
