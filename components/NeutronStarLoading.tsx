
import React, { useEffect, useRef } from 'react';
import { Theme } from '../App';

interface NeutronStarLoadingProps {
  theme: Theme;
}

const NeutronStarLoading: React.FC<NeutronStarLoadingProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const particles: {x: number, y: number, vx: number, vy: number, life: number}[] = [];

    const draw = () => {
      time += 0.02;
      
      // Theme-based background
      if (isLight) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const orbitRadius = Math.max(0, 150 - time * 15); 
      const speed = 0.5 + (150 - orbitRadius) * 0.1; 
      
      const x1 = centerX + Math.cos(time * speed) * orbitRadius;
      const y1 = centerY + Math.sin(time * speed) * orbitRadius;
      
      const x2 = centerX + Math.cos(time * speed + Math.PI) * orbitRadius;
      const y2 = centerY + Math.sin(time * speed + Math.PI) * orbitRadius;

      // Draw entities
      [ {x: x1, y: y1}, {x: x2, y: y2} ].forEach(pos => {
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 15);
        
        if (isLight) {
          gradient.addColorStop(0, '#000');
          gradient.addColorStop(0.3, '#333');
          gradient.addColorStop(1, 'transparent');
        } else {
          gradient.addColorStop(0, '#fff');
          gradient.addColorStop(0.3, '#60a5fa');
          gradient.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.fill();

        if (orbitRadius > 5) {
          for(let i=0; i<3; i++) {
            particles.push({
              x: pos.x,
              y: pos.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 1.0
            });
          }
        }
      });

      // Handle particles
      ctx.lineWidth = 1;
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
          particles.splice(i, 1);
          return;
        }
        
        const opacity = p.life;
        if (isLight) {
          ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
        } else {
          ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
        }
        
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.stroke();
      });

      // Collision/Merge Event
      if (orbitRadius <= 5) {
        const explosionRadius = Math.max(0.01, (time - 9.6) * 100); 
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, explosionRadius);
        
        if (isLight) {
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
          grad.addColorStop(0.2, 'rgba(50, 50, 50, 0.4)');
          grad.addColorStop(1, 'transparent');
        } else {
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          grad.addColorStop(0.2, 'rgba(59, 130, 246, 0.4)');
          grad.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, explosionRadius, 0, Math.PI * 2);
        ctx.fill();

        if (time > 15) time = 0; 
      }

      // Technical Grid during loading (Light Mode Only)
      if (isLight) {
        ctx.strokeStyle = 'rgba(0,0,0,0.02)';
        ctx.lineWidth = 1;
        for(let x=0; x<canvas.width; x+=50) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for(let y=0; y<canvas.height; y+=50) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
      }

      // Text overlay
      ctx.fillStyle = isLight ? '#000' : '#fff';
      ctx.font = 'black 12px monospace';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '10px';
      ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.5;
      ctx.fillText("SYNTHESIZING_EXPERIMENTAL_REALITY", centerX, centerY + 250);
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLight]);

  return <canvas ref={canvasRef} className={`fixed inset-0 z-50 ${isLight ? 'bg-white' : 'bg-black'}`} />;
};

export default NeutronStarLoading;
