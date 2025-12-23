
import React, { useState, useEffect, useRef } from 'react';
import { Brain, FlaskConical, Atom, Zap, Microscope, Beaker } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: (prompt: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [prompt, setPrompt] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [isInputFocused, setIsInputFocused] = useState(false);

  const suggestions = [
    { label: 'Pendulum Motion', icon: <Atom size={14} /> },
    { label: 'HCl + NaOH Titration', icon: <FlaskConical size={14} /> },
    { label: 'Projectile Trajectory', icon: <Zap size={14} /> },
    { label: 'Osmosis Visualization', icon: <Microscope size={14} /> },
  ];

  const typingSuggestions = [
    "Simulate a simple pendulum at 45 degrees...",
    "Visualize HCl and NaOH titration curve...",
    "Model projectile motion with 20m/s velocity...",
    "Analyze Brownian motion of gold particles...",
    "Observe osmosis in a semi-permeable membrane..."
  ];

  // Placeholder typing effect
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
        speed = 2000; // Pause at end
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        currentIdx = (currentIdx + 1) % typingSuggestions.length;
        speed = 500; // Pause before new word
      }

      timeout = window.setTimeout(type, speed);
    };

    type();
    return () => clearTimeout(timeout);
  }, []);

  // Particle simulation with mouse interactivity
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseRadius: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();

    // Initialize particles
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2 + 1;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: radius,
        baseRadius: radius,
        color: Math.random() > 0.6 ? '#3b82f6' : '#ffffff',
      });
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Brownian motion kicks
        p.vx += (Math.random() - 0.5) * 0.15;
        p.vy += (Math.random() - 0.5) * 0.15;

        // Mouse interaction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          p.vx -= (dx / dist) * force * 0.4; // Repel
          p.vy -= (dy / dist) * force * 0.4;
          p.radius = p.baseRadius * (1 + force * 2);
        } else {
          p.radius = p.baseRadius;
        }

        // Velocity damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Bounce walls
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = dist < maxDist ? 15 : 0;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Connections
      ctx.lineWidth = 0.4;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.2;
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) onStart(prompt);
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="z-10 w-full max-w-4xl px-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
        
        {/* The Badge - Scientific and Simple */}
        <div className="mb-10 inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.1)] group hover:border-blue-500/30 transition-all duration-500">
          <Beaker className="text-blue-500 group-hover:scale-110 group-hover:rotate-12 transition-all" size={20} />
          <span className="text-sm font-bold tracking-[0.6em] uppercase text-white pl-2">RevoltLab</span>
        </div>

        <p className="text-2xl md:text-3xl text-white mb-16 max-w-2xl mx-auto font-extralight leading-tight tracking-tight">
          Design, simulate, and analyze your next breakthrough in our <span className="text-blue-500 font-normal">AI-driven</span> virtual laboratory.
        </p>

        <form onSubmit={handleSubmit} className="relative group w-full max-w-2xl mx-auto mb-12">
          {/* Decorative glow that 'flows' with the concept */}
          <div className="absolute -inset-4 bg-blue-600 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-10 transition duration-1000"></div>
          
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={prompt ? "" : placeholder}
              className="w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-8 pl-10 pr-24 text-white text-xl placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 transition-all shadow-2xl"
            />
            {/* Visual indicator for "active" input */}
            <div className={`absolute bottom-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent transition-opacity duration-500 ${isInputFocused ? 'opacity-100' : 'opacity-20'}`}></div>
            
            <button 
              type="submit"
              className="absolute right-4 top-4 bottom-4 aspect-square bg-blue-600 text-white rounded-3xl flex items-center justify-center hover:bg-blue-500 hover:scale-105 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all active:scale-95 shadow-lg"
            >
              <Brain size={32} />
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-5">
          {suggestions.map((item) => (
            <button
              key={item.label}
              onClick={() => onStart(item.label)}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/40 hover:translate-y-[-2px] transition-all text-sm font-medium text-slate-400 hover:text-white group backdrop-blur-md"
            >
              <span className="text-blue-500 group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-24 flex justify-center gap-24 text-slate-600">
          <div className="flex flex-col items-center group cursor-default">
            <span className="text-5xl font-extralight text-white group-hover:text-blue-400 transition-colors">40+</span>
            <span className="text-[10px] uppercase tracking-[0.5em] font-black mt-4 text-slate-500 group-hover:text-slate-300 transition-colors">Apparatus</span>
          </div>
          <div className="flex flex-col items-center group cursor-default">
            <span className="text-5xl font-extralight text-white tracking-[0.1em] group-hover:text-blue-400 transition-colors">REAL</span>
            <span className="text-[10px] uppercase tracking-[0.5em] font-black mt-4 text-slate-500 group-hover:text-slate-300 transition-colors">Data Feed</span>
          </div>
          <div className="flex flex-col items-center group cursor-default">
            <span className="text-5xl font-extralight text-white group-hover:text-blue-400 transition-colors">AI</span>
            <span className="text-[10px] uppercase tracking-[0.5em] font-black mt-4 text-slate-500 group-hover:text-slate-300 transition-colors">Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
