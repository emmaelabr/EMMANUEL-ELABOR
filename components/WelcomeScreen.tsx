
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
    "Two balls falling from 100m in water, g=10m/s2...",
    "Pendulum in oil with high viscosity...",
    "Analyze the refraction of light through a prism...",
    "Visualize the reaction between sodium and water...",
    "Kinematics of a projectile launched at 45 degrees..."
  ];

  useEffect(() => {
    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout: number;
    const type = () => {
      const currentText = typingSuggestions[currentIdx];
      if (isDeleting) { setPlaceholder(currentText.substring(0, charIdx - 1)); charIdx--; } 
      else { setPlaceholder(currentText.substring(0, charIdx + 1)); charIdx++; }
      let speed = isDeleting ? 30 : 60;
      if (!isDeleting && charIdx === currentText.length) { isDeleting = true; speed = 2000; } 
      else if (isDeleting && charIdx === 0) { isDeleting = false; currentIdx = (currentIdx + 1) % typingSuggestions.length; speed = 500; }
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
      onStart(prompt || "Analysis based on image", mode, selectedImage || undefined);
    }
  };

  return (
    <div className={`relative h-screen w-full flex flex-col items-center justify-center overflow-hidden transition-colors duration-700 z-10`}>
      
      <div className="w-full max-w-4xl px-8 flex flex-col items-center animate-in fade-in duration-1000">
        
        <button 
          onClick={onThemeToggle}
          className="mb-16 flex flex-col items-center gap-2 group cursor-pointer outline-none"
        >
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs font-black tracking-[0.4em] uppercase">REVOLT</span>
            <span className="text-xs font-black tracking-[0.4em] uppercase opacity-30">LAB</span>
          </div>
          <div className={`w-12 h-6 rounded-full border p-1 transition-all ${isLight ? 'border-black bg-white' : 'border-white/20 bg-black'}`}>
             <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isLight ? 'bg-black translate-x-0' : 'bg-white translate-x-6'}`} />
          </div>
        </button>

        <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter mb-16 text-center leading-[1.1] transition-all duration-700`}>
          Ignite every <span className={`italic opacity-40`}>fact</span>, <br className="hidden md:block"/> see science <span className={`italic opacity-40`}>react</span>
        </h1>

        <div className="relative w-full max-w-xl mx-auto mb-10">
          <div className="relative flex items-center border-2 border-current p-1 bg-white/5 backdrop-blur-sm">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={prompt ? "" : placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleAction('split')}
              className={`w-full py-6 pl-8 pr-44 text-sm font-bold uppercase tracking-widest transition-all bg-transparent focus:outline-none placeholder-current/30`}
            />
            
            <div className="absolute right-1 flex items-center gap-1">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageImport} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-12 h-12 border border-current flex items-center justify-center transition-all ${selectedImage ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
                title="Attach Document"
              >
                {selectedImage ? <CheckCircle2 size={16} /> : <ImagePlus size={16} />}
              </button>
              <button 
                onClick={() => handleAction('split')}
                className={`w-14 h-14 bg-black text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl active:scale-95`}
                title="Initialize"
              >
                <BrainCircuit size={20} />
              </button>
            </div>
          </div>
          
          {selectedImage && (
            <div className="absolute -bottom-8 left-0 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] animate-in slide-in-from-top-1">
              <Atom size={10} className="animate-spin-slow" /> Calibration_Stream_Ready
              <button onClick={() => setSelectedImage(null)} className="ml-2 hover:line-through opacity-50 transition-opacity">Discard</button>
            </div>
          )}
        </div>

        <div className="flex gap-8 mt-4">
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-black tracking-widest">REAL-TIME_PHYSICS</span>
             <div className="h-[1px] w-8 bg-current/20 mt-1" />
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-black tracking-widest">CHEMICAL_SIMULATION</span>
             <div className="h-[1px] w-8 bg-current/20 mt-1" />
           </div>
        </div>

        <p className="mt-20 text-[9px] uppercase tracking-[0.5em] opacity-20 font-black">Powered by Research Core V.4</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
