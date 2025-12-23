
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Sparkles, Activity, MessageSquare } from 'lucide-react';
import { ChatMessage, GroundingSource } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Theme } from '../App';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  sources: GroundingSource[];
  isTyping: boolean;
  currentExperimentData: Array<{ x: number; y: number }>;
  isFullView?: boolean;
  theme: Theme;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  sources, 
  isTyping,
  currentExperimentData,
  isFullView = false,
  theme
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className={`flex flex-col h-full border-r z-20 shadow-2xl transition-all duration-500 ${isFullView ? 'flex-1' : 'w-[450px]'} ${isLight ? 'bg-white border-slate-200' : 'bg-[#020617] border-white/5'}`}>
      <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'bg-slate-50/50' : 'bg-slate-900/30'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
            <Bot size={18} className="text-white" />
          </div>
          <span className={`font-black text-xs uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>BART v.4 ANALYTICS</span>
        </div>
        <div className="flex items-center gap-4">
           {isFullView && <span className="text-[9px] text-blue-600 uppercase font-black tracking-widest bg-blue-600/10 px-2 py-1 rounded">Deep Neural Scope</span>}
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-400`}>
            <div className={`rounded-3xl p-6 shadow-xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none max-w-[85%]' 
                : `${isLight ? 'bg-slate-100/80 text-slate-900 border-slate-200' : 'bg-white/5 text-slate-200 border-white/10'} border rounded-tl-none backdrop-blur-md ${isFullView ? 'max-w-[75%]' : 'max-w-[95%]'}`
            }`}>
              <div className="flex items-center gap-2 mb-3 opacity-40">
                {msg.role === 'user' ? <User size={10} /> : <Sparkles size={10} />}
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                  {msg.role === 'user' ? 'LEAD RESEARCHER' : 'BART CORE'}
                </span>
              </div>
              <p className={`leading-relaxed whitespace-pre-wrap font-medium ${isFullView ? 'text-base' : 'text-sm'}`}>{msg.text}</p>
              
              {msg.role === 'model' && msg.showGraph && (
                <div className={`mt-6 p-5 border rounded-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-white/5'} ${isFullView ? 'h-72' : 'h-52'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={12} className="text-blue-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Spectral Data Array</span>
                  </div>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={currentExperimentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#00000008" : "#ffffff08"} vertical={false} />
                      <XAxis dataKey="x" hide />
                      <YAxis stroke={isLight ? "#94a3b8" : "#475569"} fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: isLight ? '#fff' : '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#2563eb' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#2563eb" 
                        strokeWidth={3} 
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`p-4 rounded-2xl rounded-tl-none ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className={`mt-8 p-6 rounded-3xl border ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/5 border-blue-500/10'}`}>
            <h4 className={`text-[10px] font-black mb-4 flex items-center gap-2 uppercase tracking-widest ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
              <Globe size={12} /> Neural Grounding Context
            </h4>
            <div className="space-y-3">
              {sources.map((src, idx) => (
                <a 
                  key={idx} 
                  href={src.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`block text-xs transition-colors truncate pl-3 border-l-2 ${isLight ? 'text-blue-600 hover:text-blue-800 border-blue-200' : 'text-blue-400 hover:text-blue-300 border-blue-500/30'}`}
                >
                  {src.title || src.uri}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={`p-6 border-t ${isLight ? 'bg-white' : 'bg-slate-900/50 backdrop-blur-3xl border-white/5'}`}>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command Bart... (Deep Research Enabled)"
            className={`w-full border rounded-2xl py-4 pl-6 pr-14 transition-all shadow-inner ${isLight ? 'bg-slate-100 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-blue-500/50'}`}
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-30 transition-all flex items-center justify-center text-white"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
