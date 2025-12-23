
import React, { useRef, useEffect, useState } from 'react';
import { ExperimentState } from '../types';
import { Play, Pause, RotateCcw, Settings2, ShieldAlert, Zap, Activity } from 'lucide-react';
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
    bubbles: [] as {x: number, y: number, r: number, s: number, opacity: number}[],
    colorPhase: 0,
    particles: [] as any[],
    pendulumTheta: 0.6,
    pendulumOmega: 0
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
    
    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    resize();

    const drawGlassContainer = (x: number, y: number, w: number, h: number, fluidLevel: number, color: string) => {
      // Glass walls
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, [0, 0, 30, 30]);
      ctx.stroke();

      // Fluid
      if (fluidLevel > 0) {
        ctx.fillStyle = color;
        const fh = h * fluidLevel;
        ctx.beginPath();
        ctx.roundRect(x + 5, y + h - fh, w - 10, fh - 5, [0, 0, 25, 25]);
        ctx.fill();
        
        // Surface Tension/Refraction line
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + h - fh);
        ctx.bezierTo(x + w/2, y + h - fh - 5, x + w/2, y + h - fh + 5, x + w - 5, y + h - fh);
        ctx.stroke();
      }

      // Highlights for glass look
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 20, y + 20);
      ctx.lineTo(x + 20, y + h - 40);
      ctx.stroke();
    };

    const render = () => {
      const currentExp = experimentRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subgrid for lab precision
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(59,130,246,0.05)';
      ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      if (!currentExp) {
        ctx.fillStyle = isLight ? '#cbd5e1' : '#334155';
        ctx.font = 'bold 12px tracking-[0.8em]';
        ctx.textAlign = 'center';
        ctx.fillText('CORE STANDBY', canvas.width / 2, canvas.height / 2);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // --- SIMULATION RENDERING ---
      if (currentExp.type === 'chemistry') {
        if (isRunning) {
          simState.current.time += 0.016;
          setTime(simState.current.time);
        }
        
        const bWidth = 240;
        const bHeight = 320;
        const bx = centerX - bWidth / 2;
        const by = centerY - bHeight / 2;
        const targetPh = currentExp.parameters.ph || 7;
        const reactivity = currentExp.parameters.reactivity || 5;

        if (isRunning) simState.current.colorPhase += (targetPh - simState.current.colorPhase) * 0.01;
        const hue = (simState.current.colorPhase / 14) * 280;
        
        drawGlassContainer(bx, by, bWidth, bHeight, 0.7, `hsla(${hue}, 70%, 50%, 0.4)`);

        if (isRunning && reactivity > 1) {
          if (Math.random() < reactivity * 0.1) {
            simState.current.bubbles.push({
              x: bx + 40 + Math.random() * (bWidth - 80),
              y: by + bHeight - 20,
              r: Math.random() * 4 + 1,
              s: Math.random() * reactivity * 0.4 + 1,
              opacity: 0.6
            });
          }
          simState.current.bubbles.forEach((b, idx) => {
            b.y -= b.s;
            b.opacity -= 0.004;
            ctx.fillStyle = isLight ? `rgba(0, 0, 0, ${b.opacity * 0.2})` : `rgba(255, 255, 255, ${b.opacity})`;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
            if (b.y < by + 100) simState.current.bubbles.splice(idx, 1);
          });
        }
        
        if (isRunning) onDataUpdate({ x: simState.current.time, y: simState.current.colorPhase });
      }

      else if (currentExp.type === 'electronics') {
        if (isRunning) {
          simState.current.time += 0.016;
          setTime(simState.current.time);
        }
        const voltage = currentExp.parameters.voltage || 12;
        const resistance = currentExp.parameters.resistance || 50;
        const current = voltage / resistance;
        const circW = 550;
        const circH = 350;
        const cx = centerX - circW/2;
        const cy = centerY - circH/2;

        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.8)' : '#1e293b';
        ctx.lineWidth = 14;
        ctx.beginPath(); ctx.roundRect(cx, cy, circW, circH, 60); ctx.stroke();

        if (isRunning && current > 0) {
          const speed = current * 200;
          const electronCount = 20;
          ctx.fillStyle = isLight ? '#2563eb' : '#3b82f6';
          for(let i=0; i<electronCount; i++) {
             const t = (simState.current.time * speed + i * (1000/electronCount)) % 1000;
             let ex = cx, ey = cy;
             // Simple loop around rect path
             if (t < 250) { ex = cx + (t/250)*circW; ey = cy; }
             else if (t < 500) { ex = cx + circW; ey = cy + ((t-250)/250)*circH; }
             else if (t < 750) { ex = cx + circW - ((t-500)/250)*circW; ey = cy + circH; }
             else { ex = cx; ey = cy + circH - ((t-750)/250)*circH; }
             
             ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle as string;
             ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
             ctx.shadowBlur = 0;
          }
        }

        const bulbX = cx + circW/2;
        const bulbY = cy;
        const intensity = Math.min(1.5, current * 12);
        
        if (isRunning && intensity > 0.05) {
          const radial = ctx.createRadialGradient(bulbX, bulbY, 0, bulbX, bulbY, 200 * intensity);
          radial.addColorStop(0, `rgba(251, 191, 36, ${0.5 * intensity})`);
          radial.addColorStop(1, 'transparent');
          ctx.fillStyle = radial; ctx.fillRect(bulbX - 300, bulbY - 300, 600, 600);
        }
        ctx.fillStyle = isRunning && intensity > 0.05 ? `rgba(253, 224, 71, ${0.7 + intensity/3})` : (isLight ? '#f1f5f9' : '#0f172a');
        ctx.beginPath(); ctx.arc(bulbX, bulbY, 50, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isLight ? '#000' : '#fff'; ctx.lineWidth = 4; ctx.stroke();

        if (isRunning) onDataUpdate({ x: simState.current.time, y: current });
      }

      else {
        // Physics / Pendulum
        const bWidth = 300;
        const bHeight = 400;
        const bx = centerX - bWidth/2;
        const by = centerY - bHeight/2;
        
        // Fluid Properties
        const viscosity = currentExp.parameters.viscosity || 0.1; // 0.1 to 10
        const density = currentExp.parameters.density || 1; // 1 to 20
        const isInFluid = viscosity > 0.5 || density > 1;

        if (isInFluid) {
          const fluidHue = 200 + density; 
          drawGlassContainer(bx, by, bWidth, bHeight, 0.85, `hsla(${fluidHue}, 60%, 40%, 0.3)`);
        }

        if (isRunning) {
          const L = (currentExp.parameters.length || 10);
          const g = currentExp.parameters.gravity || 9.81;
          const dt = 0.016;
          
          // Drag force equation: Fd = -b * v (Simplified)
          const damping = 0.05 * viscosity * density;
          const alpha = -(g / L) * Math.sin(simState.current.pendulumTheta) - damping * simState.current.pendulumOmega;
          
          simState.current.pendulumOmega += alpha * dt;
          simState.current.pendulumTheta += simState.current.pendulumOmega * dt;
          simState.current.time += dt;
          setTime(simState.current.time);
        }

        const rodL = (currentExp.parameters.length || 10) * 15;
        const startX = centerX;
        const startY = by + 40;
        const endX = startX + rodL * Math.sin(simState.current.pendulumTheta);
        const endY = startY + rodL * Math.cos(simState.current.pendulumTheta);

        ctx.strokeStyle = isLight ? '#334155' : '#475569';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        
        // Pivot point
        ctx.fillStyle = isLight ? '#000' : '#fff';
        ctx.beginPath(); ctx.arc(startX, startY, 6, 0, Math.PI * 2); ctx.fill();

        const bobGrad = ctx.createRadialGradient(endX - 8, endY - 8, 0, endX, endY, 35);
        bobGrad.addColorStop(0, isLight ? '#cbd5e1' : '#60a5fa');
        bobGrad.addColorStop(1, isLight ? '#1e293b' : '#1d4ed8');
        ctx.fillStyle = bobGrad;
        ctx.shadowBlur = 40; ctx.shadowColor = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(59,130,246,0.6)';
        ctx.beginPath(); ctx.arc(endX, endY, 35, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        if (isRunning) onDataUpdate({ x: simState.current.time, y: simState.current.pendulumTheta });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, theme, experiment?.id]);

  return (
    <div className={`flex-1 relative overflow-hidden p-4`}>
      <div className={`w-full h-full rounded-[3.5rem] border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative transition-all duration-700 ${isLight ? 'bg-white/40 border-black/5' : 'bg-slate-900/40 border-white/5 backdrop-blur-md'}`}>
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Telemetry HUD */}
        <div className={`absolute bottom-8 left-8 p-6 rounded-3xl border shadow-2xl transition-all duration-500 backdrop-blur-3xl ${isLight ? 'bg-white/90 border-black/5' : 'bg-slate-950/70 border-white/5'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Activity size={14} className="text-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Neural Sync Feed</span>
          </div>
          <div className="flex items-center gap-6">
            <div className={`w-28 h-14 rounded-xl flex items-center justify-center border shadow-inner ${isLight ? 'bg-slate-50 border-black/5' : 'bg-black/40 border-white/5'}`}>
               <Zap size={20} className="text-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>T: {time.toFixed(3)}s</span>
              <span className={`text-[10px] font-mono font-black text-blue-500`}>CORE_SYNC: OK</span>
            </div>
          </div>
        </div>

        {/* Floating Controls */}
        <div className={`absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 border rounded-[2.5rem] shadow-2xl z-40 transition-all ${isLight ? 'bg-black border-black text-white' : 'bg-slate-900/90 border-white/10 backdrop-blur-3xl'}`}>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsRunning(!isRunning)}
               className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isRunning ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10 hover:scale-110 shadow-lg'}`}
             >
               {isRunning ? <Pause size={20} /> : <Play size={20} />}
             </button>
             <button onClick={() => { setIsRunning(false); setTime(0); simState.current.time = 0; simState.current.pendulumTheta = 0.6; simState.current.pendulumOmega = 0; }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isLight ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
               <RotateCcw size={20} />
             </button>
          </div>
          
          <div className={`w-[1px] h-8 ${isLight ? 'bg-white/10' : 'bg-white/5'}`} />
          
          <div className="flex flex-col min-w-[80px]">
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Clock</span>
            <span className={`font-mono font-bold text-lg`}>{time.toFixed(3)}<span className="text-[10px] ml-1 opacity-50">s</span></span>
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showSettings ? 'text-blue-500 bg-blue-500/10' : (isLight ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-white')}`}
          >
            <Settings2 size={20} />
          </button>
        </div>

        {showSettings && experiment && (
          <div className={`absolute top-32 right-8 p-8 rounded-[2.5rem] border w-80 z-40 shadow-2xl animate-in fade-in slide-in-from-right-8 backdrop-blur-3xl ${isLight ? 'bg-white/95 border-black/5' : 'bg-slate-900/95 border-white/10'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Neural Calibration</h3>
              <ShieldAlert size={14} className="text-slate-400" />
            </div>
            <div className="space-y-8">
              {Object.entries(experiment.parameters).map(([key, val]) => {
                const value = val as number;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-black mb-3">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{key}</span>
                      <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{value.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min={0.1} max={50} step={0.1}
                      value={value}
                      onChange={(e) => onUpdateParameters({ [key]: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-blue-500/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabScene;
