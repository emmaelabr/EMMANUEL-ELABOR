
import React, { useEffect, useRef } from 'react';
import { Theme } from '../App';

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

const GlobalParticles: React.FC<{ theme: Theme }> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const isLight = theme === 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const createParticles = () => {
      particlesRef.current = [];
      const density = 8000; // Increased density for more particles
      const count = Math.min(250, Math.floor((window.innerWidth * window.innerHeight) / density));
      const particleColor = isLight ? '#000000' : '#3b82f6';
      
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
          radius: Math.random() * 3 + 2, // Bolder radius (2-5px)
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const connectionDist = 180; // Larger connection radius
      const mouseDist = 300;      // More sensitive mouse interaction

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Bold interactivity: Stronger repulsion
        if (dist < mouseDist) {
          const force = (mouseDist - dist) / mouseDist;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force * 1.2;
          p.vy -= Math.sin(angle) * force * 1.2;
        } else {
          p.vx += (p.baseVx - p.vx) * 0.05;
          p.vy += (p.baseVy - p.vy) * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98; // Slightly more drag for controlled movement
        p.vy *= 0.98;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Bold Plexus: Thicker, more opaque lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (dist2 < connectionDist) {
            const opacity = (1 - dist2 / connectionDist) * (isLight ? 0.3 : 0.6);
            ctx.strokeStyle = isLight ? `rgba(0,0,0,${opacity})` : `rgba(59,130,246,${opacity})`;
            ctx.lineWidth = 1.5; // Bolder lines
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Bold Particles: Higher alpha and clear presence
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = isLight ? 0.4 : 0.8; // High visibility
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

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000" />;
};

export default GlobalParticles;
