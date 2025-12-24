
import React, { useRef, useEffect, useState } from 'react';
import { ExperimentState, Entity, PhysicsRule } from '../types';
import { Play, Pause, RotateCcw, Settings2, ZoomIn, ZoomOut } from 'lucide-react';
import { Theme } from '../App';

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
  
  // Local state for the physics engine
  const stateRef = useRef<{
    entities: Entity[];
    time: number;
    lastTime: number;
  }>({
    entities: [],
    time: 0,
    lastTime: performance.now()
  });

  // Re-initialize engine when experiment changes
  useEffect(() => {
    if (experiment?.entities) {
      stateRef.current.entities = JSON.parse(JSON.stringify(experiment.entities));
      stateRef.current.time = 0;
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

    const drawAnnotation = (text: string, x: number, y: number, align: CanvasTextAlign = 'center') => {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = isLight ? '#000' : '#fff';
      ctx.textAlign = align;
      ctx.fillText(text.toUpperCase(), x, y);
    };

    const updatePhysics = (dt: number) => {
      if (!experiment?.physicsRules) return;
      const entities = stateRef.current.entities;

      entities.forEach(ent => {
        if (ent.vx === undefined) ent.vx = 0;
        if (ent.vy === undefined) ent.vy = 0;

        experiment.physicsRules?.forEach(rule => {
          if (rule.type === 'gravity') {
            const strength = rule.strength ?? experiment.parameters.gravity ?? 9.81;
            ent.vy! += strength * dt * 50; 
          }
          if (rule.type === 'brownian') {
            const temp = experiment.parameters.temperature ?? 300;
            ent.vx! += (Math.random() - 0.5) * (temp / 100);
            ent.vy! += (Math.random() - 0.5) * (temp / 100);
          }
          if (rule.type === 'oscillation') {
            const freq = experiment.parameters.frequency ?? 1;
            const amp = experiment.parameters.amplitude ?? 50;
            ent.x = ent.x + Math.sin(stateRef.current.time * freq) * amp * dt;
          }
        });

        // Basic integration
        ent.x += ent.vx! * dt;
        ent.y += ent.vy! * dt;

        // Collision with walls
        if (ent.radius) {
          if (ent.x - ent.radius < 0 || ent.x + ent.radius > canvas.width) ent.vx! *= -0.8;
          if (ent.y - ent.radius < 0 || ent.y + ent.radius > canvas.height) ent.vy! *= -0.8;
        }
      });

      // Data logging for charts
      if (entities.length > 0) {
        onDataUpdate({ x: stateRef.current.time, y: entities[0].y });
      }
    };

    const render = () => {
      const now = performance.now();
      const dt = (now - stateRef.current.lastTime) / 1000;
      stateRef.current.lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Grid
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
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

      stateRef.current.entities.forEach(ent => {
        ctx.strokeStyle = isLight ? '#000' : '#fff';
        ctx.fillStyle = ent.color || (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)');
        ctx.lineWidth = 2;

        if (ent.type === 'circle' || ent.type === 'atom') {
          const r = ent.radius || 20;
          ctx.beginPath(); ctx.arc(ent.x, ent.y, r, 0, Math.PI*2); 
          ctx.fill(); ctx.stroke();
          if (ent.label) drawAnnotation(ent.label, ent.x, ent.y + r + 15);
        } else if (ent.type === 'box' || ent.type === 'container') {
          const w = ent.width || 100, h = ent.height || 100;
          ctx.strokeRect(ent.x - w/2, ent.y - h/2, w, h);
          if (ent.type === 'container') {
            ctx.globalAlpha = 0.2;
            ctx.fillRect(ent.x - w/2, ent.y - h/2, w, h);
            ctx.globalAlpha = 1.0;
          }
          if (ent.label) drawAnnotation(ent.label, ent.x, ent.y - h/2 - 10);
        } else if (ent.type === 'ray') {
          ctx.setLineDash([5, 5]);
          ctx.beginPath(); ctx.moveTo(ent.x, ent.y); ctx.lineTo(ent.x + 200, ent.y + 100); ctx.stroke();
          ctx.setLineDash([]);
        }
      });
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, theme, experiment?.id, zoom]);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="flex-1 block" />
      
      <div className={`absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 border transition-all ${isLight ? 'bg-white border-black shadow-[4px_4px_0_0_#000]' : 'bg-slate-900 border-white/20'}`}>
         <button onClick={() => setIsRunning(!isRunning)} className="p-2 hover:bg-current/10 transition-colors">
           {isRunning ? <Pause size={18} /> : <Play size={18} />}
         </button>
         <button onClick={() => { setIsRunning(false); setTime(0); }} className="p-2 hover:bg-current/10">
           <RotateCcw size={18} />
         </button>
         <div className="w-[1px] h-6 bg-current/20" />
         <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2"><ZoomOut size={16}/></button>
         <span className="font-mono text-[10px] font-black tracking-widest">{time.toFixed(2)}s</span>
         <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2"><ZoomIn size={16}/></button>
         <div className="w-[1px] h-6 bg-current/20" />
         <button onClick={() => setShowSettings(!showSettings)} className="p-2">
           <Settings2 size={18} />
         </button>
      </div>

      {showSettings && experiment && (
        <div className={`absolute top-24 right-6 p-6 border w-72 z-50 animate-in slide-in-from-right-4 ${isLight ? 'bg-white border-black shadow-[8px_8px_0_0_#000]' : 'bg-slate-900 border-white/20'}`}>
          <h3 className="text-[10px] font-black uppercase mb-4 tracking-tighter">Experimental Control</h3>
          <div className="space-y-4">
            {Object.entries(experiment.parameters).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-[8px] mb-1 font-bold">
                  <span>{key.toUpperCase()}</span>
                  <span>{val.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max={val * 2 || 100} step="0.01" value={val}
                  onChange={(e) => onUpdateParameters({ [key]: parseFloat(e.target.value) })}
                  className="w-full accent-current h-1 bg-current/10 appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabScene;
