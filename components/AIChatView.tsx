
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types.ts';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const AIChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '안녕하세요! 가족 여행 도우미 AI입니다. 궁금한 게 있으시면 무엇이든 물어보세요!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "당신은 일본 오사카/교토 가족 여행 가이드입니다. 인사말이나 서론 없이, 사용자의 질문에 대한 답변만 최대한 간결하고 명확하게 제공하세요. 7명의 대가족(영수, 연실, 한나, 유나, 아라, 현아, 건) 상황을 고려하여 핵심 정보 위주로 한국어로 답변합니다.",
        }
      });

      const aiText = response.text || '답변을 생성하지 못했습니다.';
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `오류: ${error.message || '가이드와 연결할 수 없습니다.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-230px)] animate-in fade-in duration-500">
      <div className="bg-white rounded-t-[2.5rem] p-6 border-b border-[#566873]/5 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#F2E96D] text-[#1675F2] rounded-2xl flex items-center justify-center">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-md font-black text-[#566873] tracking-tight">AI 가이드</h2>
          <p className="text-[9px] text-[#1675F2] font-black uppercase tracking-[0.2em]">무엇이든 물어보세요</p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/30 backdrop-blur-sm"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                msg.role === 'user' ? 'bg-[#1675F2] text-white border-white/20' : 'bg-[#F2E96D] text-[#1675F2] border-transparent'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#1675F2] text-white rounded-tr-none' 
                  : 'bg-white text-[#566873] border border-[#566873]/5 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F2E96D] text-[#1675F2] flex items-center justify-center shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-[#566873]/5 shadow-sm flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-[#1675F2]" />
                <span className="text-[10px] font-black text-[#1675F2] uppercase tracking-widest">분석 중...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white rounded-b-[2.5rem] border-t border-[#566873]/5 shadow-[0_-10px_40px_rgba(86,104,115,0.03)]">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="가이드에게 질문하기..."
            className="w-full bg-[#F1F2F0] border-none rounded-full pl-6 pr-14 py-5 text-sm font-bold text-[#566873] focus:ring-2 focus:ring-[#1675F2] shadow-inner transition-all"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bg-[#1675F2] text-white w-11 h-11 rounded-full flex items-center justify-center hover:brightness-110 disabled:opacity-30 transition-all active:scale-90"
          >
            <Send size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
