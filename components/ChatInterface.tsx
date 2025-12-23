
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Sparkles, Activity, MessageSquare } from 'lucide-react';
import { ChatMessage, GroundingSource } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  sources: GroundingSource[];
  isTyping: boolean;
  currentExperimentData: Array<{ x: number; y: number }>;
  isFullView?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  sources, 
  isTyping,
  currentExperimentData,
  isFullView = false
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className={`flex flex-col h-full bg-[#020617] border-r border-white/5 z-20 shadow-2xl transition-all duration-500 ${isFullView ? 'w-full' : 'w-[320px] md:w-[450px]'}`}>
      <div className="p-4 border-b border-white/5 bg-slate-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Bot size={18} className="text-blue-400" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white uppercase tracking-widest">BART - LAB ANALYTICS</span>
        </div>
        <div className="flex items-center gap-4">
           {isFullView && <span className="text-[9px] text-blue-400 uppercase font-black tracking-widest bg-blue-500/10 px-2 py-1 rounded">Focused View</span>}
           <div className="flex items-center gap-2">
             <span className="text-[9px] text-slate-500 uppercase font-black">Syncing</span>
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`rounded-2xl p-5 shadow-lg ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none max-w-[85%]' 
                : `bg-white/5 border border-white/10 text-slate-200 rounded-tl-none backdrop-blur-md ${isFullView ? 'max-w-[70%]' : 'max-w-[95%]'}`
            }`}>
              <div className="flex items-center gap-2 mb-2 opacity-50">
                {msg.role === 'user' ? <User size={10} /> : <Sparkles size={10} />}
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                  {msg.role === 'user' ? 'Scientist' : 'Bart'}
                </span>
              </div>
              <p className={`leading-relaxed whitespace-pre-wrap ${isFullView ? 'text-base' : 'text-sm'}`}>{msg.text}</p>
              
              {msg.role === 'model' && msg.showGraph && (
                <div className={`mt-4 p-4 bg-black/40 border border-white/5 rounded-xl overflow-hidden ${isFullView ? 'h-64' : 'h-48'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={12} className="text-blue-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Dynamic Plot</span>
                  </div>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={currentExperimentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis dataKey="x" hide />
                      <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ color: '#60a5fa' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
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
            <div className="bg-white/5 border border-white/10 text-slate-200 rounded-2xl rounded-tl-none p-4 backdrop-blur-md">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-8 p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <h4 className="text-[10px] font-black text-indigo-300 mb-3 flex items-center gap-2 uppercase tracking-widest">
              <Globe size={12} /> External Intelligence Grounding
            </h4>
            <div className="space-y-2">
              {sources.map((src, idx) => (
                <a 
                  key={idx} 
                  href={src.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors truncate pl-3 border-l border-indigo-500/30"
                >
                  {src.title || src.uri}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-900/50 backdrop-blur-xl border-t border-white/5">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
             <MessageSquare size={16} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Talk to Bart... (say 'open experimental page' for split view)"
            className={`w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-14 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner ${isFullView ? 'text-lg' : 'text-sm'}`}
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 transition-all flex items-center justify-center text-white"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
