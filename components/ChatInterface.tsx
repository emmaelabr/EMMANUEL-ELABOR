
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Sparkles } from 'lucide-react';
import { ChatMessage, GroundingSource } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  sources: GroundingSource[];
  isTyping: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, sources, isTyping }) => {
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
    <div className="w-[320px] md:w-[400px] flex flex-col h-full bg-[#020617] border-r border-white/5 z-20 shadow-2xl">
      <div className="p-4 border-b border-white/5 bg-slate-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Bot size={18} className="text-blue-400" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">LAB ASSISTANT</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none backdrop-blur-md'
            }`}>
              <div className="flex items-center gap-2 mb-2 opacity-50">
                {msg.role === 'user' ? <User size={10} /> : <Sparkles size={10} />}
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                  {msg.role === 'user' ? 'Scientist' : 'Intelligence'}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 text-slate-200 rounded-2xl rounded-tl-none p-4 backdrop-blur-md">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-8 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <h4 className="text-[10px] font-black text-indigo-300 mb-3 flex items-center gap-2 uppercase tracking-widest">
              <Globe size={12} /> External Grounding
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
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Direct the experiment..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-5 pr-14 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 transition-all flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
