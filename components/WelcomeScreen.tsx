
import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, MessageCircleDashed, ImagePlus, Atom, CheckCircle2, Moon, Sun } from 'lucide-react';
import { ImageData } from '../types';
import { Theme } from '../App';

interface WelcomeScreenProps {
  onStart: (prompt: string, mode: 'split' | 'chat-only', image?: ImageData) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseVx: number;
  baseVy: number;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, theme, onThemeToggle }) => {
  const [prompt, setPrompt] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const createParticles = () => {
      particlesRef.current = [];
      const count = Math.floor((window.innerWidth * window.innerHeight) / 7000);
      const particleColor = theme === 'light' ? '#000000' : '#3b82f6';
      const secondaryColor = theme === 'light' ? '#000000' : '#ffffff';
      
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 1.5;
        const vy = (Math.random() - 0.5) * 1.5;
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: vx,
          vy: vy,
          baseVx: vx,
          baseVy: vy,
          radius: Math.random() * 3 + 2,
          color: Math.random() > 0.4 ? particleColor : secondaryColor
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.fillStyle = theme === 'light' ? '#ffffff' : '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(p => {
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 200;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          p.vx -= (dx / dist) * force * 1.5;
          p.vy -= (dy / dist) * force * 1.5;
        } else {
          p.vx += (p.baseVx - p.vx) * 0.08;
          p.vy += (p.baseVy - p.vy) * 0.08;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        
        ctx.shadowBlur = dist < maxDist ? 20 : 0;
        ctx.shadowColor = p.color;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = theme === 'light' ? 0.3 : 0.7; // Lower opacity for light mode to keep it subtle
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      ctx.strokeStyle = theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particlesRef.current.length; i += 3) {
        for (let j = i + 1; j < Math.min(i + 4, particlesRef.current.length); j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const d = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
          if (d < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage({
          data: base64String,
          mimeType: file.type
        });
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
    <div className={`relative h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none transition-colors duration-500 ${theme === 'light' ? 'bg-white' : 'bg-[#020617]'}`}>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="z-10 w-full max-w-4xl px-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000">
        
        {/* Theme Switching Bullet Toggle */}
        <div className="mb-10 flex items-center gap-4">
          <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-black' : 'text-slate-600'}`}>Light</span>
          <button 
            onClick={onThemeToggle}
            className={`relative w-16 h-8 rounded-full transition-all duration-500 border overflow-hidden shadow-inner ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-white/5'}`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-500 flex items-center justify-center ${theme === 'light' ? 'left-1 bg-white shadow-md' : 'left-9 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.6)]'}`}>
              {theme === 'light' ? <Sun size={12} className="text-amber-500" /> : <Moon size={12} className="text-white" />}
            </div>
          </button>
          <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-blue-500' : 'text-slate-300'}`}>Dark</span>
        </div>

        <h1 className={`text-4xl md:text-7xl font-extralight mb-16 tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          Ignite every <span className={`font-bold italic ${theme === 'light' ? 'text-black' : 'text-blue-600'}`}>fact</span>, <br className="hidden md:block"/> see science <span className={`font-bold italic ${theme === 'light' ? 'text-black' : 'text-blue-600'}`}>react</span>
        </h1>

        <div className="relative w-full max-w-2xl mx-auto mb-8 group">
          <div className="relative flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={prompt ? "" : placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleAction('split')}
              className={`w-full border rounded-[2rem] py-8 pl-10 pr-60 text-lg transition-all shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-black shadow-black/5' : 'bg-slate-900/50 border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50 shadow-black/40'}`}
            />
            
            <div className="absolute right-4 flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageImport} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedImage ? 'bg-emerald-600 text-white' : (theme === 'light' ? 'bg-black text-white hover:bg-slate-900 shadow-xl' : 'bg-white/5 text-slate-400 hover:text-white')}`}
                title="Visual Context Import"
              >
                {selectedImage ? <CheckCircle2 size={24} /> : <ImagePlus size={24} />}
              </button>
              <button 
                onClick={() => handleAction('chat-only')}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${theme === 'light' ? 'bg-black text-white hover:bg-slate-900 shadow-xl' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                title="Deep Analysis"
              >
                <MessageCircleDashed size={24} />
              </button>
              <button 
                onClick={() => handleAction('split')}
                className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-95 hover:scale-105 ${theme === 'light' ? 'bg-black text-white hover:bg-slate-900 shadow-black/20' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'}`}
                title="Launch Lab"
              >
                <BrainCircuit size={28} />
              </button>
            </div>
          </div>
          
          {selectedImage && (
            <div className={`absolute -bottom-10 left-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-pulse ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-600'}`}>
              <Atom size={12} /> Neural Context Ready
              <button onClick={() => setSelectedImage(null)} className="ml-2 text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
