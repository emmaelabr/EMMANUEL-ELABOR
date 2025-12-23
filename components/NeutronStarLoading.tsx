import React, { useEffect, useRef } from 'react';

const NeutronStarLoading: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Orbiting parameters: they spiral inward
      const orbitRadius = Math.max(0, 150 - time * 15); 
      const speed = 0.5 + (150 - orbitRadius) * 0.1; // Gets faster as they close in
      
      const x1 = centerX + Math.cos(time * speed) * orbitRadius;
      const y1 = centerY + Math.sin(time * speed) * orbitRadius;
      
      const x2 = centerX + Math.cos(time * speed + Math.PI) * orbitRadius;
      const y2 = centerY + Math.sin(time * speed + Math.PI) * orbitRadius;

      // Draw stars
      [ {x: x1, y: y1}, {x: x2, y: y2} ].forEach(pos => {
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 15);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, '#60a5fa');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Emission particles
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
        if (p.life <= 0) particles.splice(i, 1);
        
        ctx.strokeStyle = `rgba(96, 165, 250, ${p.life})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.stroke();
      });

      // Collision Event
      if (orbitRadius <= 5) {
        // Star collision starts when orbitRadius hits ~5 (t ~= 9.67)
        // Ensure explosionRadius is never negative to avoid createRadialGradient IndexSizeError
        const explosionRadius = Math.max(0.01, (time - 9.6) * 100); 
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, explosionRadius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.2, 'rgba(59, 130, 246, 0.4)');
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, explosionRadius, 0, Math.PI * 2);
        ctx.fill();

        if (time > 15) time = 0; // Loop simulation if still loading
      }

      // Text overlay
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px tracking-widest';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.5;
      ctx.fillText("SYNTHESIZING EXPERIMENTAL REALITY", centerX, centerY + 200);
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 bg-black" />;
};

export default NeutronStarLoading;