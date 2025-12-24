
import React, { useRef, useEffect, useState } from 'react';
import { ExperimentState, Entity, PhysicsRule } from '../types';
import { Play, Pause, RotateCcw, Settings2, ZoomIn, ZoomOut, FlaskConical, Thermometer } from 'lucide-react';
import { Theme } from '../App';

interface TrailPoint { x: number; y: number; alpha: number; color: string; }
interface GasParticle { x: number; y: number; vx: number; vy: number; life: number; size: number; }

interface LabSceneProps {
  experiment: ExperimentState | null;
  onUpdateParameters: (params: Record<string, number>) => void;
  onDataUpdate: (point: { x: number; y: number }) => void;
  theme: Theme;
}

const LabScene: React.FC<LabSceneProps> = ({ experiment, onUpdateParameters, onDataUpdate, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const isLight = theme === 'light';
  
  const stateRef = useRef<{ 
    entities: Entity[]; 
    time: number; 
    lastTime: number; 
    bubbles: any[]; 
    trails: TrailPoint[];
    gasParticles: GasParticle[];
  }>({
    entities: [], time: 0, lastTime: performance.now(), bubbles: [], trails: [], gasParticles: []
  });

  useEffect(() => {
    if (experiment?.entities) {
      stateRef.current.entities = JSON.parse(JSON.stringify(experiment.entities));
      stateRef.current.time = 0;
      stateRef.current.bubbles = [];
      stateRef.current.trails = [];
      stateRef.current.gasParticles = [];
      setTime(0);
    }
  }, [experiment?.id, experiment?.entities]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const drawFluid = (ent: Entity, w: number, h: number, baseY: number) => {
      if (!ent.fluidLevel) return;
      const level = Math.max(0, Math.min(1, ent.fluidLevel));
      const fillH = h * level;
      const fillY = baseY - fillH;
      
      const grad = ctx.createLinearGradient(0, fillY, 0, baseY);
      const color = ent.color || '#3b82f6';
      grad.addColorStop(0, color + '99');
      grad.addColorStop(1, color + '44');
      
      ctx.fillStyle = grad;
      ctx.fillRect(-w/2 + 2, fillY, w - 4, fillH);

      // Liquid Surface highlight
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-w/2 + 2, fillY); ctx.lineTo(w/2 - 2, fillY); ctx.stroke();
    };

    const drawApparatus = (ent: Entity) => {
      ctx.save();
      ctx.translate(ent.x, ent.y);
      if (ent.angle) ctx.rotate(ent.angle);
      
      const mainColor = ent.color || (isLight ? '#000' : '#fff');
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2.5;

      switch (ent.type) {
        case 'beaker':
          drawFluid(ent, 100, 120, 60);
          ctx.beginPath();
          ctx.moveTo(-50, -60); ctx.lineTo(-50, 60); ctx.lineTo(50, 60); ctx.lineTo(50, -60);
          ctx.stroke();
          break;
        case 'flask':
          if (ent.fluidLevel) {
            ctx.fillStyle = (ent.color || '#3b82f6') + '66';
            ctx.beginPath();
            ctx.moveTo(-45, 60); ctx.lineTo(45, 60); ctx.lineTo(15, -10); ctx.lineTo(-15, -10);
            ctx.closePath(); ctx.fill();
          }
          ctx.beginPath();
          ctx.moveTo(-15, -60); ctx.lineTo(-15, -20); ctx.lineTo(-45, 60);
          ctx.lineTo(45, 60); ctx.lineTo(15, -20); ctx.lineTo(15, -60);
          ctx.stroke();
          break;
        case 'circle':
          const radius = ent.radius || 20;
          const circGrad = ctx.createRadialGradient(-radius/3, -radius/3, 0, 0, 0, radius);
          circGrad.addColorStop(0, '#fff');
          circGrad.addColorStop(1, mainColor);
          ctx.fillStyle = circGrad;
          ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          break;
        case 'bunsen':
          ctx.fillStyle = isLight ? '#cbd5e1' : '#334155';
          ctx.fillRect(-20, 30, 40, 10);
          ctx.strokeRect(-20, 30, 40, 10);
          ctx.strokeRect(-5, -20, 10, 50);
          if (isRunning) {
            const flicker = Math.sin(stateRef.current.time * 20) * 5;
            ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.moveTo(-4, -25); ctx.quadraticCurveTo(0, -45 + flicker, 4, -25); ctx.fill();
          }
          break;
        case 'container':
          ctx.strokeRect(-150, -20, 300, 40);
          break;
      }

      if (ent.label) {
        ctx.fillStyle = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
        ctx.font = 'bold 9px ui-monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${ent.label.toUpperCase()}${ent.state === 'reacting' ? ' [REACTING]' : ''}`, 0, (ent.height || 40)/2 + 25);
      }
      ctx.restore();
    };

    const updatePhysics = (dt: number) => {
      const { entities, gasParticles, trails } = stateRef.current;
      
      entities.forEach(ent => {
        if (ent.vx === undefined) ent.vx = 0;
        if (ent.vy === undefined) ent.vy = 0;

        experiment?.physicsRules?.forEach(rule => {
          if (rule.type === 'gravity') ent.vy! += (experiment.parameters.gravity || 9.81) * dt * 80;
          
          if (rule.type === 'chemical_reaction') {
            // Find if this entity is in a container with water
            const waterSource = entities.find(e => (e.type === 'beaker' || e.type === 'container') && e.fluidLevel);
            if (waterSource) {
              const waterTopY = waterSource.y + (60 - (120 * waterSource.fluidLevel!)); // Approximate beaker center mapping
              
              if (Math.abs(ent.y - waterTopY) < 15) {
                ent.state = 'reacting';
                // Skittering propulsion for reactive metals
                if (ent.buoyancy) {
                  ent.y = waterTopY;
                  ent.vy = 0;
                  ent.vx! += (Math.random() - 0.5) * 40;
                  ent.vx! *= 0.95;
                }

                // Consumption (Shrinking)
                if (ent.consumptionRate && ent.radius) {
                  ent.radius -= ent.consumptionRate * dt * 10;
                  if (ent.radius < 2) {
                    ent.radius = 0;
                    ent.state = 'idle';
                  }
                }

                // Trail (NaOH pink trail)
                if (ent.trailColor && Math.random() > 0.3) {
                  trails.push({ x: ent.x, y: ent.y, alpha: 1.0, color: ent.trailColor });
                }

                // Gas emission
                if ((ent.gasEvolutionRate || 0) > Math.random()) {
                  gasParticles.push({
                    x: ent.x, y: ent.y,
                    vx: (Math.random() - 0.5) * 50,
                    vy: -Math.random() * 100 - 50,
                    life: 1.0,
                    size: Math.random() * 3 + 1
                  });
                }
              }
            }
          }
        });

        ent.x += ent.vx! * dt;
        ent.y += ent.vy! * dt;

        // Container boundaries
        if (ent.x < 50 || ent.x > canvas.width - 50) ent.vx! *= -0.8;
      });

      // Update trails & gas
      stateRef.current.trails = trails.map(t => ({ ...t, alpha: t.alpha - 0.5 * dt })).filter(t => t.alpha > 0);
      stateRef.current.gasParticles = gasParticles.map(p => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        life: p.life - 1.0 * dt
      })).filter(p => p.life > 0);

      if (entities.length > 0) onDataUpdate({ x: stateRef.current.time, y: entities[0].radius || entities[0].y });
    };

    const render = () => {
      const now = performance.now();
      const dt = Math.min((now - stateRef.current.lastTime) / 1000, 0.05);
      stateRef.current.lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Grid Background
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)';
      for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      if (isRunning) {
        stateRef.current.time += dt;
        setTime(stateRef.current.time);
        updatePhysics(dt);
      }

      ctx.save();
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width/2, -canvas.height/2);

      // Draw Trails
      stateRef.current.trails.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.alpha * 0.4;
        ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Entities
      stateRef.current.entities.forEach(drawApparatus);

      // Draw Gas
      stateRef.current.gasParticles.forEach(p => {
        ctx.fillStyle = isLight ? `rgba(100,100,100,${p.life})` : `rgba(200,200,200,${p.life})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
  }, [isRunning, theme, experiment?.id, zoom]);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col bg-current/5">
      <canvas ref={canvasRef} className="flex-1 block" />
      
      <div className="absolute top-6 left-8 pointer-events-none">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Lab_State: {isRunning ? 'EXECUTING' : 'READY'}</span>
        </div>
      </div>

      <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 border backdrop-blur-md transition-all duration-500 ${isLight ? 'bg-white/80 border-black shadow-[4px_4px_0_0_#000]' : 'bg-slate-900/80 border-white/20'}`}>
         <button onClick={() => setIsRunning(!isRunning)} className={`p-2 rounded-full transition-colors ${isRunning ? 'text-rose-500' : 'text-emerald-500'} hover:bg-current/10`}>
           {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
         </button>
         <button onClick={() => { setIsRunning(false); setTime(0); }} className="p-2 hover:bg-current/10 rounded-full transition-colors"><RotateCcw size={18} /></button>
         <div className="w-[1px] h-6 bg-current/20 mx-2" />
         <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut size={16}/></button>
         <span className="font-mono text-[11px] font-bold w-14 text-center tracking-tighter">{time.toFixed(2)}s</span>
         <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn size={16}/></button>
         <div className="w-[1px] h-6 bg-current/20 mx-2" />
         <button onClick={() => setShowSettings(!showSettings)} className={`p-2 transition-all ${showSettings ? 'text-blue-500 bg-blue-500/10' : 'hover:bg-current/10'} rounded-full`}>
           <Settings2 size={18} />
         </button>
      </div>

      {showSettings && experiment && (
        <div className={`absolute top-24 right-6 p-6 border w-72 z-50 animate-in slide-in-from-right-4 duration-300 ${isLight ? 'bg-white border-black shadow-[10px_10px_0_0_#000]' : 'bg-slate-900 border-white/20 shadow-2xl'}`}>
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="w-1 h-3 bg-blue-500" /> Physical Parameters
          </h3>
          <div className="space-y-6">
            {Object.entries(experiment.parameters).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-[9px] mb-2 font-black tracking-tight"><span>{key.toUpperCase()}</span><span>{val.toFixed(2)}</span></div>
                <input type="range" min="0" max={val * 2 || 100} step="0.01" value={val} onChange={(e) => onUpdateParameters({ [key]: parseFloat(e.target.value) })} className="w-full h-1.5 appearance-none cursor-pointer rounded-full bg-current/10" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabScene;
