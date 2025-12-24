
import React, { useRef, useEffect, useState } from 'react';
import { ExperimentState } from '../types';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
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
  
  const isLight = theme === 'light';
  const experimentRef = useRef<ExperimentState | null>(experiment);
  useEffect(() => {
    experimentRef.current = experiment;
  }, [experiment]);

  const simState = useRef({
    time: 0,
    pendulumTheta: 0.6,
    pendulumOmega: 0,
    v1: 0,
    v2: 0,
    y1: 0,
    y2: 0,
    phHistory: [] as number[]
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    // Fix: ResizeObserver loop completed with undelivered notifications
    // Using requestAnimationFrame to ensure resize happens in the next frame
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(resize);
    });
    
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    resize();

    const drawHatching = (x: number, y: number, w: number, h: number, angle: number = 45) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      const step = 8;
      for (let i = -w - h; i < w + h; i += step) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h, y + h);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawAnnotation = (text: string, x: number, y: number, align: CanvasTextAlign = 'left') => {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = isLight ? '#000' : '#fff';
      ctx.textAlign = align;
      ctx.fillText(text.toUpperCase(), x, y);
    };

    const render = () => {
      const currentExp = experimentRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Textbook Grid
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      if (!currentExp) {
        ctx.fillStyle = isLight ? '#000' : '#475569';
        ctx.font = '900 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CORE_STANDBY // LAB_READY', canvas.width / 2, canvas.height / 2);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Realistic Physics Rendering
      if (currentExp.type === 'falling_objects') {
        const g = currentExp.parameters.gravity || 9.81;
        const mass1 = currentExp.parameters.mass1 || 3;
        const mass2 = currentExp.parameters.mass2 || 2;
        const density = currentExp.parameters.density || 1.225; // kg/m3 (Air default)
        
        const dt = 0.016;
        if (isRunning) {
          simState.current.time += dt;
          setTime(simState.current.time);

          // Force = m*g - drag
          const Cd = 0.47; // Sphere
          const r1 = Math.pow(mass1, 1/3) * 0.1;
          const r2 = Math.pow(mass2, 1/3) * 0.1;
          const area1 = Math.PI * r1 * r1;
          const area2 = Math.PI * r2 * r2;

          const drag1 = 0.5 * density * simState.current.v1 * simState.current.v1 * Cd * area1;
          const drag2 = 0.5 * density * simState.current.v2 * simState.current.v2 * Cd * area2;

          const a1 = g - (drag1 / mass1);
          const a2 = g - (drag2 / mass2);

          simState.current.v1 += a1 * dt;
          simState.current.v2 += a2 * dt;
          
          const groundY = canvas.height - 100;
          simState.current.y1 = Math.min(groundY, simState.current.y1 + simState.current.v1 * 5); 
          simState.current.y2 = Math.min(groundY, simState.current.y2 + simState.current.v2 * 5);
        }

        // Draw Liquid Tank if in fluid
        const isInFluid = density > 200; 
        if (isInFluid) {
          ctx.strokeStyle = isLight ? '#000' : '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(centerX - 150, 100, 300, canvas.height - 200);
          ctx.fillStyle = isLight ? 'rgba(0,100,255,0.05)' : 'rgba(0,100,255,0.2)';
          ctx.fillRect(centerX - 150, 100, 300, canvas.height - 200);
          drawAnnotation('Fluid Medium (ρ=' + density.toFixed(1) + ')', centerX - 140, 120);
        }

        // Ground Hatching
        drawHatching(centerX - 250, canvas.height - 100, 500, 40);
        ctx.beginPath(); ctx.moveTo(centerX - 250, canvas.height - 100); ctx.lineTo(centerX + 250, canvas.height - 100); ctx.stroke();

        // Draw balls
        const drawBall = (x: number, y: number, m: number, color: string, label: string) => {
          const r = Math.pow(m, 1/3) * 12;
          ctx.strokeStyle = isLight ? '#000' : '#fff';
          ctx.lineWidth = 1.5;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          
          if (isRunning) {
            ctx.setLineDash([2, 2]);
            ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, y + r + 20); ctx.stroke();
            ctx.setLineDash([]);
          }
          drawAnnotation(`m=${m.toFixed(1)}g`, x + r + 5, y, 'left');
          drawAnnotation(label, x - r - 5, y, 'right');
        };

        drawBall(centerX - 60, 120 + simState.current.y1, mass1, isLight ? 'rgba(0,0,0,0.1)' : 'rgba(59,130,246,0.3)', 'Obj_A');
        drawBall(centerX + 60, 120 + simState.current.y2, mass2, isLight ? 'rgba(0,0,0,0.1)' : 'rgba(245,158,11,0.3)', 'Obj_B');

        if (isRunning) onDataUpdate({ x: simState.current.time, y: canvas.height - simState.current.y1 });
      }

      else if (currentExp.type === 'physics') {
        const L = currentExp.parameters.length || 10;
        const g = currentExp.parameters.gravity || 9.81;
        const viscosity = currentExp.parameters.viscosity || 0.1;
        const dt = 0.016;

        if (isRunning) {
          const damping = 0.05 * viscosity; 
          const alpha = -(g / L) * Math.sin(simState.current.pendulumTheta) - damping * simState.current.pendulumOmega;
          simState.current.pendulumOmega += alpha * dt;
          simState.current.pendulumTheta += simState.current.pendulumOmega * dt;
          simState.current.time += dt;
          setTime(simState.current.time);
        }

        const px = centerX, py = centerY - 150;
        const rodL = 250;
        const bx = px + rodL * Math.sin(simState.current.pendulumTheta);
        const by = py + rodL * Math.cos(simState.current.pendulumTheta);

        const inFluid = viscosity > 0.5;
        if (inFluid) {
          const fluidY = centerY;
          ctx.fillStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
          ctx.fillRect(centerX - 200, fluidY, 400, canvas.height - fluidY);
          ctx.strokeStyle = isLight ? '#000' : '#fff';
          ctx.beginPath(); ctx.moveTo(centerX - 200, fluidY); ctx.lineTo(centerX + 200, fluidY); ctx.stroke();
          drawAnnotation('Liquid Phase (η=' + viscosity.toFixed(2) + ')', centerX - 190, fluidY + 15);
        }

        drawHatching(centerX - 40, py - 10, 80, 10);
        ctx.beginPath(); ctx.moveTo(centerX - 40, py); ctx.lineTo(centerX + 40, py); ctx.stroke();

        ctx.strokeStyle = isLight ? '#000' : '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = isLight ? '#fff' : '#000';
        ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + rodL + 20); ctx.stroke();
        ctx.setLineDash([]);
        
        drawAnnotation('θ = ' + (simState.current.pendulumTheta * 180 / Math.PI).toFixed(1) + '°', bx + 25, by);

        if (isRunning) onDataUpdate({ x: simState.current.time, y: simState.current.pendulumTheta });
      }

      else if (currentExp.type === 'chemistry') {
        const ph = currentExp.parameters.ph || 7;
        const temp = currentExp.parameters.temperature || 25;
        if (isRunning) {
          simState.current.time += 0.016;
          setTime(simState.current.time);
        }

        const bw = 140, bh = 180;
        const bx = centerX - bw/2, by = centerY - bh/2;
        
        ctx.strokeStyle = isLight ? '#000' : '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by);
        ctx.stroke();

        for(let i=1; i<=5; i++) {
          ctx.beginPath();
          ctx.moveTo(bx, by + bh - i * 30);
          ctx.lineTo(bx + 15, by + bh - i * 30);
          ctx.stroke();
          drawAnnotation((i * 50) + 'ml', bx + 18, by + bh - i * 30 + 3);
        }

        const hue = (ph / 14) * 280;
        ctx.fillStyle = `hsla(${hue}, 60%, 50%, 0.2)`;
        ctx.fillRect(bx + 2, by + 40, bw - 4, bh - 42);

        drawAnnotation('Beaker // pH: ' + ph.toFixed(1), bx, by - 15);
        drawAnnotation('Temp: ' + temp.toFixed(1) + '°C', bx, by - 5);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, theme, experiment?.id]);

  const getParamRange = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('gravity')) return { min: 0, max: 20, step: 0.1 };
    if (n.includes('viscosity')) return { min: 0, max: 5, step: 0.01 };
    if (n.includes('density')) return { min: 0, max: 2000, step: 1 };
    if (n.includes('mass')) return { min: 0.1, max: 10, step: 0.1 };
    if (n.includes('length')) return { min: 1, max: 50, step: 0.5 };
    if (n.includes('ph')) return { min: 0, max: 14, step: 0.1 };
    if (n.includes('temperature')) return { min: -50, max: 100, step: 1 };
    return { min: 0, max: 100, step: 1 };
  };

  return (
    <div className={`flex-1 relative overflow-hidden flex flex-col`}>
      <canvas ref={canvasRef} className="flex-1 block" />
      
      <div className={`absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 border transition-all ${isLight ? 'bg-white border-black shadow-[4px_4px_0_0_#000]' : 'bg-slate-900 border-white/20'}`}>
         <button 
           onClick={() => setIsRunning(!isRunning)}
           className={`p-2 transition-all ${isLight ? 'hover:bg-black hover:text-white' : 'hover:bg-white hover:text-black'}`}
         >
           {isRunning ? <Pause size={18} /> : <Play size={18} />}
         </button>
         <button 
           onClick={() => { 
             setIsRunning(false); 
             setTime(0); 
             simState.current.time = 0; 
             simState.current.pendulumTheta = 0.6; 
             simState.current.pendulumOmega = 0;
             simState.current.v1 = 0;
             simState.current.v2 = 0;
             simState.current.y1 = 0;
             simState.current.y2 = 0;
           }}
           className={`p-2 transition-all ${isLight ? 'hover:bg-black hover:text-white' : 'hover:bg-white hover:text-black'}`}
         >
           <RotateCcw size={18} />
         </button>
         <div className={`w-[1px] h-6 ${isLight ? 'bg-black' : 'bg-white/20'}`} />
         <span className="font-mono text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
           T_ELAPSED: {time.toFixed(3)}s
         </span>
         <button 
           onClick={() => setShowSettings(!showSettings)}
           className={`p-2 transition-all ${isLight ? 'hover:bg-black hover:text-white' : 'hover:bg-white hover:text-black'} ${showSettings && (isLight ? 'bg-black text-white' : 'bg-white text-black')}`}
         >
           <Settings2 size={18} />
         </button>
      </div>

      {showSettings && experiment && (
        <div className={`absolute top-24 right-6 p-6 border w-72 animate-in fade-in slide-in-from-right-4 transition-all z-50 ${isLight ? 'bg-white border-black shadow-[8px_8px_0_0_#000]' : 'bg-slate-900 border-white/20'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest">Calibration_Matrix</h3>
            <button onClick={() => setShowSettings(false)} className="opacity-50 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-black">CLOSE [X]</span>
            </button>
          </div>
          <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(experiment.parameters).map(([key, val]) => {
              const range = getParamRange(key);
              return (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between text-[9px] uppercase tracking-widest font-black opacity-80">
                    <span className="truncate max-w-[150px]">{key}</span>
                    <span className="font-mono">{(val as number).toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={range.min} 
                    max={range.max} 
                    step={range.step}
                    value={val}
                    onChange={(e) => onUpdateParameters({ [key]: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-current/20 appearance-none cursor-pointer accent-current rounded-full"
                  />
                  <div className="flex justify-between text-[7px] font-black opacity-40">
                    <span>MIN {range.min}</span>
                    <span>MAX {range.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabScene;
