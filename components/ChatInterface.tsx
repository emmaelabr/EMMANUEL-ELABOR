
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Sparkles, Activity, ImagePlus, X, CheckCircle2 } from 'lucide-react';
import { ChatMessage, GroundingSource, ImageData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Theme } from '../App';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, image?: ImageData) => void;
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
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;
    onSendMessage(input, selectedImage || undefined);
    setInput('');
    setSelectedImage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage({ data: base64String, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`flex flex-col h-full z-20 transition-all duration-700 ${isFullView ? 'flex-1' : 'w-[500px]'}`}>
      
      <div className={`flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth custom-scrollbar rounded-[2.5rem] border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] mb-6 ${isLight ? 'bg-white/60 border-black/5' : 'bg-slate-900/40 border-white/5 backdrop-blur-3xl'}`}>
        
        <div className="flex items-center justify-between pb-6 border-b border-current/5 mb-8">
           <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${isLight ? 'bg-black text-white' : 'bg-blue-600 text-white'}`}>
               <Bot size={18} />
             </div>
             <span className={`font-black text-[10px] uppercase tracking-[0.3em] ${isLight ? 'text-slate-900' : 'text-blue-500'}`}>BART ANALYTICS</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`p-8 shadow-2xl transition-all ${
              msg.role === 'user' 
                ? `rounded-[2rem] rounded-tr-none ${isLight ? 'bg-black text-white' : 'bg-blue-600 text-white shadow-blue-500/10'} max-w-[85%]` 
                : `rounded-[2rem] rounded-tl-none border ${isLight ? 'bg-white text-slate-900 border-black/5' : 'bg-slate-950/60 text-slate-200 border-white/5 shadow-black/40'} max-w-[90%]`
            }`}>
              <div className="flex items-center gap-3 mb-4 opacity-40">
                {msg.role === 'user' ? <User size={12} /> : <Sparkles size={12} />}
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                  {msg.role === 'user' ? 'RESEARCHER' : 'CORE'}
                </span>
              </div>
              <p className={`leading-relaxed font-medium whitespace-pre-wrap ${isFullView ? 'text-lg' : 'text-base'}`}>{msg.text}</p>
              
              {msg.role === 'model' && msg.showGraph && (
                <div className={`mt-8 p-6 border rounded-3xl overflow-hidden ${isLight ? 'bg-slate-50 border-black/5' : 'bg-black/40 border-white/5'} ${isFullView ? 'h-80' : 'h-60'}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <Activity size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spectral Stream</span>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={currentExperimentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#00000008" : "#ffffff08"} vertical={false} />
                      <XAxis dataKey="x" hide />
                      <YAxis stroke={isLight ? "#94a3b8" : "#475569"} fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: isLight ? '#fff' : '#0f172a', border: 'none', borderRadius: '16px', fontSize: '11px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                      />
                      <Line type="monotone" dataKey="y" stroke="#2563eb" strokeWidth={4} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`p-5 rounded-2xl rounded-tl-none ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className={`mt-10 p-8 rounded-[2.5rem] border ${isLight ? 'bg-slate-50 border-black/5' : 'bg-blue-500/5 border-white/5'}`}>
            <h4 className={`text-[10px] font-black mb-6 flex items-center gap-3 uppercase tracking-[0.3em] ${isLight ? 'text-slate-900' : 'text-blue-400'}`}>
              <Globe size={14} /> Grounding Stream
            </h4>
            <div className="space-y-4">
              {sources.map((src, idx) => (
                <a 
                  key={idx} 
                  href={src.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`block text-xs font-bold transition-all truncate pl-4 border-l-2 hover:translate-x-1 ${isLight ? 'text-blue-600 border-blue-200' : 'text-blue-400 border-blue-500/30'}`}
                >
                  {src.title || src.uri}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative group">
        {selectedImage && (
          <div className={`absolute -top-12 left-4 flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-2 ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            <CheckCircle2 size={12} /> Data Attached
            <button onClick={() => setSelectedImage(null)} className="ml-1 p-0.5 hover:bg-red-500/10 rounded-full">
              <X size={10} />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center transition-all border ${isLight ? 'bg-white border-slate-200 text-slate-400 hover:text-black hover:border-black' : 'bg-slate-900/50 border-white/10 text-slate-500 hover:text-white hover:border-blue-500'}`}
          >
            <ImagePlus size={24} />
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Command Bart..."
              className={`w-full border rounded-[2rem] py-8 pl-10 pr-20 text-lg transition-all shadow-2xl focus:outline-none focus:ring-8 focus:ring-blue-500/5 ${isLight ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-900/50 border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50'}`}
            />
            <button 
              type="submit"
              disabled={!input.trim() && !selectedImage}
              className={`absolute right-3 top-3 bottom-3 aspect-square rounded-[1.5rem] flex items-center justify-center transition-all disabled:opacity-20 ${isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-500'}`}
            >
              <Send size={24} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
