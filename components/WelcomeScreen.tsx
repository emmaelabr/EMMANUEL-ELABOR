
import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, MessageCircleDashed, ImagePlus, Atom, Beaker, CheckCircle2 } from 'lucide-react';
import { ImageData } from '../types';

interface WelcomeScreenProps {
  onStart: (prompt: string, mode: 'split' | 'chat-only', image?: ImageData) => void;
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

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
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
      // Increased count for higher visibility
      const count = Math.floor((window.innerWidth * window.innerHeight) / 10000);
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 1.2;
        const vy = (Math.random() - 0.5) * 1.2;
        const color = Math.random() > 0.5 ? '#3b82f6' : '#ffffff';
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: vx,
          vy: vy,
          baseVx: vx,
          baseVy: vy,
          radius: Math.random() * 3 + 1.5, // Larger particles
          color: color
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
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(p => {
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          p.vx -= (dx / dist) * force * 0.8;
          p.vy -= (dy / dist) * force * 0.8;
        } else {
          p.vx += (p.baseVx - p.vx) * 0.05;
          p.vy += (p.baseVy - p.vy) * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        
        // Glow effect
        ctx.shadowBlur = dist < maxDist ? 20 : 10;
        ctx.shadowColor = p.color;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = dist < maxDist ? 1.0 : 0.7; // Higher visibility
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      // Connecting lines
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const d = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
          if (d < 120) {
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
  }, []);

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
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-[#020617] overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="z-10 w-full max-w-4xl px-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000">
        <div className="mb-8 inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl group hover:border-blue-500/30 transition-all duration-500">
          <Beaker className="text-blue-500" size={18} />
          <span className="text-[10px] font-black tracking-[0.6em] uppercase text-slate-300">Revolt Lab</span>
        </div>

        <h1 className="text-4xl md:text-6xl text-white font-extralight mb-16 tracking-tight">
          A lab <span className="text-blue-500 font-bold italic">right in your system</span>
        </h1>

        <div className="relative w-full max-w-2xl mx-auto mb-8">
          <div className="relative flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={prompt ? "" : placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleAction('split')}
              className="w-full bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-3xl py-7 pl-8 pr-56 text-white text-lg placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            />
            
            <div className="absolute right-3 flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageImport}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selectedImage ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                title="Import Image Context"
              >
                {selectedImage ? <CheckCircle2 size={20} /> : <ImagePlus size={20} />}
              </button>
              <button 
                onClick={() => handleAction('chat-only')}
                className="w-12 h-12 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
                title="Bart Analytics"
              >
                <MessageCircleDashed size={20} />
              </button>
              <button 
                onClick={() => handleAction('split')}
                className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-500 hover:scale-105 transition-all shadow-xl"
                title="Launch Experiment"
              >
                <BrainCircuit size={24} />
              </button>
            </div>
          </div>
          
          {selectedImage && (
            <div className="absolute -bottom-10 left-8 flex items-center gap-2 text-[10px] text-emerald-400 font-black uppercase tracking-widest animate-pulse">
              <Atom size={12} /> Visual Data Cached
              <button onClick={() => setSelectedImage(null)} className="ml-2 text-slate-500 hover:text-white transition-colors">Clear</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
