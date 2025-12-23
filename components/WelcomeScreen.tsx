
import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, MessageCircleDashed, ImagePlus, Atom, CheckCircle2, X } from 'lucide-react';
import { ImageData } from '../types';
import { Theme } from '../App';

interface WelcomeScreenProps {
  onStart: (prompt: string, mode: 'split' | 'chat-only', image?: ImageData) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, theme, onThemeToggle }) => {
  const [prompt, setPrompt] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === 'light';

  const typingSuggestions = [
    "Simulate a simple pendulum at 45 degrees...",
    "Visualize sodium and water reaction...",
    "Model projectile motion with air resistance...",
    "Analyze Brownian motion in fluid...",
    "Design a circuit with a variable resistor..."
  ];

  useEffect(() => {
    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout: number;

    const type = () => {
      const currentText = typingSuggestions[currentIdx];
      if (isDeleting) {
        setPlaceholder(currentText.substring(0, charIdx - 1));
        charIdx--;
      } else {
        setPlaceholder(currentText.substring(0, charIdx + 1));
        charIdx++;
      }
      let speed = isDeleting ? 30 : 70;
      if (!isDeleting && charIdx === currentText.length) {
        isDeleting = true;
        speed = 2000;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        currentIdx = (currentIdx + 1) % typingSuggestions.length;
        speed = 500;
      }
      timeout = window.setTimeout(type, speed);
    };
    type();
    return () => clearTimeout(timeout);
  }, []);

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleAction = (mode: 'split' | 'chat-only') => {
    if (prompt.trim() || selectedImage) {
      onStart(prompt || "Experiment based on image", mode, selectedImage || undefined);
    }
  };

  return (
    <div className={`relative h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none transition-colors duration-500 z-10`}>
      
      <div className="w-full max-w-4xl px-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000">
        
        <button 
          onClick={onThemeToggle}
          className="group mb-16 flex items-center gap-6 cursor-pointer outline-none"
        >
          <div className="flex items-center gap-5 py-4 px-10 rounded-full border border-current/10 bg-current/5 backdrop-blur-md transition-all hover:bg-current/10 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
            <div className={`transition-all duration-700 ease-in-out transform flex items-center gap-5 ${isLight ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-5 h-5 rounded-full transition-all duration-500 ${isLight ? 'bg-black shadow-[0_0_15px_rgba(0,0,0,0.2)]' : 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.9)] animate-pulse'}`} />
              <div className="flex flex-col items-start leading-none pointer-events-none">
                <div className="flex items-center gap-1">
                  <span className={`text-3xl font-black tracking-tighter transition-colors ${isLight ? 'text-black' : 'text-white'}`}>REVOLT</span>
                  <span className={`text-3xl font-black tracking-tighter transition-colors ${isLight ? 'text-slate-400' : 'text-blue-500/80'}`}>LAB</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        <h1 className={`text-5xl md:text-8xl font-extralight mb-16 tracking-tight leading-[1.1] ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Ignite every <span className={`font-bold italic transition-colors ${isLight ? 'text-black' : 'text-blue-600'}`}>fact</span>, <br className="hidden md:block"/> see science <span className={`font-bold italic transition-colors ${isLight ? 'text-black' : 'text-blue-600'}`}>react</span>
        </h1>

        <div className="relative w-full max-w-2xl mx-auto mb-12">
          <div className="relative flex items-center group">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={prompt ? "" : placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleAction('split')}
              className={`w-full border rounded-[2.5rem] py-8 pl-10 pr-44 text-lg transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-8 focus:ring-blue-500/5 ${isLight ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-black shadow-black/5' : 'bg-slate-900/40 border-white/5 text-white placeholder-slate-600 focus:border-blue-500/50'}`}
            />
            
            <div className="absolute right-3 flex items-center gap-1.5 p-1 rounded-[2rem] bg-current/5 backdrop-blur-md">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageImport} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${selectedImage ? 'bg-emerald-600 text-white' : (isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-white/5 text-slate-400 hover:text-white')}`}
                title="Attach Data"
              >
                {selectedImage ? <CheckCircle2 size={18} /> : <ImagePlus size={18} />}
              </button>
              <button 
                onClick={() => handleAction('chat-only')}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                title="Chat Only"
              >
                <MessageCircleDashed size={18} />
              </button>
              <button 
                onClick={() => handleAction('split')}
                className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-95 hover:scale-105 ${isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'}`}
                title="Initialize Lab"
              >
                <BrainCircuit size={22} />
              </button>
            </div>
          </div>
          
          {selectedImage && (
            <div className={`absolute -bottom-10 left-10 flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] transition-all animate-in slide-in-from-top-2 ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              <Atom size={12} /> Neural Context Ready
              <button onClick={() => setSelectedImage(null)} className="ml-2 p-1 hover:bg-red-500/10 rounded-full transition-colors">
                <X size={10} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
