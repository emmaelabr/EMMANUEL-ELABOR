
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe } from 'lucide-react';
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="w-[300px] md:w-[400px] flex flex-col h-full bg-[#0f172a] border-r border-slate-700">
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <Bot size={20} className="text-blue-400" />
        <span className="font-semibold text-slate-200">Lab Assistant</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl p-3 animate-pulse">
              <span className="text-xs italic">Thinking...</span>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/50">
            <h4 className="text-xs font-bold text-blue-300 mb-2 flex items-center gap-1">
              <Globe size={12} /> Grounded Sources
            </h4>
            <div className="space-y-1">
              {sources.map((src, idx) => (
                <a 
                  key={idx} 
                  href={src.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-400 hover:underline truncate"
                >
                  • {src.title || src.uri}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
