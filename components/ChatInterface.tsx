
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Sparkles, Activity, ImagePlus, X, CheckCircle2, FileText } from 'lucide-react';
import { ChatMessage, GroundingSource, AttachmentData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Theme } from '../App';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachment?: AttachmentData) => void;
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
  const [selectedFile, setSelectedFile] = useState<AttachmentData | null>(null);
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
    if (!input.trim() && !selectedFile) return;
    onSendMessage(input, selectedFile || undefined);
    setInput('');
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedFile({ 
          data: base64String, 
          mimeType: file.type || 'application/octet-stream',
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`flex flex-col h-full transition-all duration-700 ${isFullView ? 'flex-1' : 'w-[450px]'}`}>
      
      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar border-b border-current/10`}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`p-5 transition-all max-w-[90%] ${
              msg.role === 'user' 
                ? `bg-black text-white border border-black` 
                : `bg-white text-black border border-black shadow-[4px_4px_0_0_#000]`
            }`}>
              <div className="flex items-center gap-2 mb-2 opacity-50">
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {msg.role === 'user' ? 'USR_RESEARCH' : 'CORE_SYSTEM'}
                </span>
              </div>
              <p className={`leading-relaxed font-medium text-sm whitespace-pre-wrap`}>{msg.text}</p>
              
              {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <div className="flex items-center gap-1 mb-2 opacity-50">
                    <Globe size={10} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Research_Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {msg.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold underline hover:text-blue-600 transition-colors"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {msg.role === 'model' && msg.showGraph && (
                <div className={`mt-6 p-4 border border-black/10 bg-slate-50 h-48`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentExperimentData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#00000010" vertical={false} />
                      <XAxis dataKey="x" hide />
                      <YAxis stroke="#000" fontSize={8} tickLine={false} axisLine={false} />
                      <Line type="monotone" dataKey="y" stroke="#000" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <span className="text-[8px] font-black uppercase tracking-widest animate-pulse">Processing_Analysis...</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-current/5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {selectedFile && (
            <div className={`flex items-center gap-2 px-3 py-1 text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white w-fit animate-in slide-in-from-bottom-1`}>
              {selectedFile.mimeType === 'application/pdf' ? <FileText size={10} /> : <CheckCircle2 size={10} />}
              {selectedFile.name?.toUpperCase() || 'FILE_ATTACHED'}
              <button type="button" onClick={() => setSelectedFile(null)} className="ml-2 hover:opacity-50"><X size={10} /></button>
            </div>
          )}
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf,text/plain" 
              onChange={handleFileChange} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border border-black hover:bg-black hover:text-white transition-all`}
              title="Attach File (Image, PDF, TXT)"
            >
              <ImagePlus size={18} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter command or analysis request..."
              className={`flex-1 border border-black p-4 text-sm focus:outline-none bg-white`}
            />
            <button 
              type="submit"
              disabled={!input.trim() && !selectedFile}
              className={`p-4 bg-black text-white hover:bg-slate-800 disabled:opacity-20 transition-all`}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
