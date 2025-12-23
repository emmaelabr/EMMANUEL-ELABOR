
import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, MessageCircleDashed, ImagePlus, Atom, CheckCircle2 } from 'lucide-react';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const createParticles = () => {
      particlesRef.current = [];
      const density = 8000;
      const count = Math.min(250, Math.floor((window.innerWidth * window.innerHeight) / density));
      const particleColor = isLight ? '#000000' : '#3b82f6';
      
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 1.2;
        const vy = (Math.random() - 0.5) * 1.2;
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: vx,
          vy: vy,
          baseVx: vx,
          baseVy: vy,
          radius: Math.random() * 2.5 + 1.5,
          color: particleColor
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
      ctx.fillStyle = isLight ? '#ffffff' : '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const connectionDist = 140;
      const mouseDist = 200;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse Interactivity: Smooth repulsion
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseDist) {
          const force = (mouseDist - dist) / mouseDist;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force * 0.8;
          p.vy -= Math.sin(angle) * force * 0.8;
          // Slowly increase radius near mouse
          p.radius = Math.min(5, p.radius + 0.1);
        } else {
          p.vx += (p.baseVx - p.vx) * 0.05;
          p.vy += (p.baseVy - p.vy) * 0.05;
          p.radius = Math.max(1.5, p.radius - 0.05);
        }

        p.x += p.vx;
        p.y += p.vy;

        // Friction to prevent infinite acceleration
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Boundary bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Plexus Effect: Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (dist2 < connectionDist) {
            const opacity = (1 - dist2 / connectionDist) * (isLight ? 0.2 : 0.4);
            ctx.strokeStyle = isLight ? `rgba(0,0,0,${opacity})` : `rgba(59,130,246,${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = isLight ? 0.3 : 0.6;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLight]);

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
    <div className={`relative h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none transition-colors duration-500 ${isLight ? 'bg-white' : 'bg-[#020617]'}`}>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="z-10 w-full max-w-4xl px-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000">
        
        {/* Revolt Lab Kinetic Theme Toggle Logo */}
        <button 
          onClick={onThemeToggle}
          className="group mb-16 flex items-center gap-6 cursor-pointer outline-none"
        >
          <div className="flex items-center gap-4 py-3 px-8 rounded-full border border-current/10 bg-current/5 backdrop-blur-md transition-all hover:bg-current/10 hover:scale-105 active:scale-95 shadow-xl">
            <div className={`transition-all duration-700 ease-in-out transform flex items-center gap-4 ${isLight ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-4 h-4 rounded-full transition-all duration-500 ${isLight ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.3)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.9)] animate-pulse'}`} />
              <div className="flex flex-col items-start leading-none pointer-events-none">
                <div className="flex items-center gap-1">
                  <span className={`text-2xl font-black tracking-tighter transition-colors ${isLight ? 'text-black' : 'text-white'}`}>REVOLT</span>
                  <span className={`text-2xl font-black tracking-tighter transition-colors ${isLight ? 'text-slate-400' : 'text-blue-500/80'}`}>LAB</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        <h1 className={`text-4xl md:text-7xl font-extralight mb-16 tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Ignite every <span className={`font-bold italic transition-colors ${isLight ? 'text-black' : 'text-blue-600'}`}>fact</span>, <br className="hidden md:block"/> see science <span className={`font-bold italic transition-colors ${isLight ? 'text-black' : 'text-blue-600'}`}>react</span>
        </h1>

        <div className="relative w-full max-w-2xl mx-auto mb-8">
          <div className="relative flex items-center group">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={prompt ? "" : placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleAction('split')}
              className={`w-full border rounded-[2rem] py-8 pl-10 pr-60 text-lg transition-all shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${isLight ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-black shadow-black/5' : 'bg-slate-900/50 border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50 shadow-black/40'}`}
            />
            
            <div className="absolute right-4 flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageImport} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedImage ? 'bg-emerald-600 text-white' : (isLight ? 'bg-black text-white hover:bg-slate-900 shadow-xl' : 'bg-white/5 text-slate-400 hover:text-white')}`}
              >
                {selectedImage ? <CheckCircle2 size={24} /> : <ImagePlus size={24} />}
              </button>
              <button 
                onClick={() => handleAction('chat-only')}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isLight ? 'bg-black text-white hover:bg-slate-900 shadow-xl' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                <MessageCircleDashed size={24} />
              </button>
              <button 
                onClick={() => handleAction('split')}
                className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-95 hover:scale-105 ${isLight ? 'bg-black text-white hover:bg-slate-900' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
              >
                <BrainCircuit size={28} />
              </button>
            </div>
          </div>
          
          {selectedImage && (
            <div className={`absolute -bottom-10 left-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-pulse ${isLight ? 'text-emerald-700' : 'text-emerald-600'}`}>
              <Atom size={12} /> Neural Context Ready
              <button onClick={() => setSelectedImage(null)} className="ml-2 text-slate-400 hover:text-slate-900">Discard</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
