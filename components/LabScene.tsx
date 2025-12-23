
import React, { useRef, useEffect, useState } from 'react';
import { ExperimentState } from '../types';
import { Play, Pause, RotateCcw, Settings2, ShieldAlert, Zap, Monitor, Activity } from 'lucide-react';
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
    particles: [] as any[]
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
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

    const render = () => {
      const currentExp = experimentRef.current;
      ctx.fillStyle = isLight ? '#f8fafc' : '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(59,130,246,0.03)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      if (!currentExp) {
        ctx.fillStyle = isLight ? '#cbd5e1' : '#334155';
        ctx.font = 'black 10px tracking-[0.5em] uppercase';
        ctx.textAlign = 'center';
        ctx.fillText('NEURAL STANDBY', canvas.width / 2, canvas.height / 2);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (isRunning) {
        simState.current.time += 0.016;
        setTime(simState.current.time);
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const topAnchorY = canvas.height * 0.15;

      // --- ENHANCED CHEMISTRY ---
      if (currentExp.type === 'chemistry') {
        const bWidth = 200;
        const bHeight = 280;
        const bx = centerX - bWidth / 2;
        const by = centerY - bHeight / 2;
        const targetPh = currentExp.parameters.ph || 7;
        const reactivity = currentExp.parameters.reactivity || 5;

        if (isRunning) {
          simState.current.colorPhase += (targetPh - simState.current.colorPhase) * 0.01;
        }

        const hue = (simState.current.colorPhase / 14) * 280;
        const liquidH = 200;

        // Beaker Shadow
        ctx.fillStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX, by + bHeight + 5, bWidth/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Liquid with refractive gradients
        const liquidGrad = ctx.createLinearGradient(bx, by + bHeight - liquidH, bx, by + bHeight);
        liquidGrad.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.5)`);
        liquidGrad.addColorStop(1, `hsla(${hue}, 80%, 30%, 0.8)`);
        ctx.fillStyle = liquidGrad;
        ctx.fillRect(bx + 6, by + bHeight - liquidH - 5, bWidth - 12, liquidH);
        
        // Liquid highlight/sheen
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(bx + 12, by + bHeight - liquidH - 5, 10, liquidH);

        // Advanced Bubble/Vapor Physics
        if (isRunning && reactivity > 1) {
          if (Math.random() < reactivity * 0.06) {
            simState.current.bubbles.push({
              x: bx + 20 + Math.random() * (bWidth - 40),
              y: by + bHeight - 10,
              r: Math.random() * 4 + 1,
              s: Math.random() * reactivity * 0.6 + 1,
              opacity: 0.6
            });
          }
          simState.current.bubbles.forEach((b, idx) => {
            b.y -= b.s;
            b.opacity -= 0.001;
            ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity})`;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
            if (b.y < by + bHeight - liquidH) simState.current.bubbles.splice(idx, 1);
          });
        }

        // Glassware with refractive highlights
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(bx, by + bHeight); ctx.lineTo(bx + bWidth, by + bHeight); ctx.lineTo(bx + bWidth, by);
        ctx.stroke();

        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        for(let i=1; i<6; i++) {
          const my = by + bHeight - (i * 45);
          ctx.beginPath(); ctx.moveTo(bx + 10, my); ctx.lineTo(bx + 35, my); ctx.stroke();
        }
        
        if (isRunning) onDataUpdate({ x: simState.current.time, y: simState.current.colorPhase });
      }

      // --- ENHANCED ELECTRONICS ---
      else if (currentExp.type === 'electronics') {
        const voltage = currentExp.parameters.voltage || 12;
        const resistance = currentExp.parameters.resistance || 50;
        const current = voltage / resistance;
        
        const circW = 500;
        const circH = 300;
        const cx = centerX - circW/2;
        const cy = centerY - circH/2;

        // Wire path with pulsating current
        ctx.strokeStyle = isLight ? '#334155' : '#1e293b';
        ctx.lineWidth = 10;
        ctx.strokeRect(cx, cy, circW, circH);

        // Electron flow (Neural visualization)
        if (isRunning && current > 0) {
          const speed = current * 120;
          const totalDist = (circW + circH) * 2;
          const electronCount = 25;
          ctx.fillStyle = isLight ? '#2563eb' : '#3b82f6';
          for(let i=0; i<electronCount; i++) {
            let p = (simState.current.time * speed + (i/electronCount) * totalDist) % totalDist;
            let ex, ey;
            if (p < circW) { ex = cx + p; ey = cy; }
            else if (p < circW + circH) { ex = cx + circW; ey = cy + (p - circW); }
            else if (p < 2 * circW + circH) { ex = cx + circW - (p - (circW + circH)); ey = cy + circH; }
            else { ex = cx; ey = cy + circH - (p - (2 * circW + circH)); }
            ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle as string;
            ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
          }
        }

        // Component: Light Bulb with heat glow
        const bulbX = cx + circW/2;
        const bulbY = cy;
        const intensity = Math.min(1.5, current * 10);
        
        if (isRunning && intensity > 0.1) {
          const radial = ctx.createRadialGradient(bulbX, bulbY, 0, bulbX, bulbY, 150 * intensity);
          radial.addColorStop(0, `rgba(251, 191, 36, ${0.4 * intensity})`);
          radial.addColorStop(1, 'transparent');
          ctx.fillStyle = radial;
          ctx.fillRect(bulbX - 200, bulbY - 200, 400, 400);
        }

        ctx.fillStyle = isRunning && intensity > 0.1 ? `rgba(253, 224, 71, ${0.5 + intensity/3})` : (isLight ? '#f1f5f9' : '#0f172a');
        ctx.beginPath(); ctx.arc(bulbX, bulbY, 40, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isLight ? '#64748b' : '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

        // Component: Variable Resistor
        const resX = cx + circW;
        const resY = centerY;
        ctx.fillStyle = isLight ? '#e2e8f0' : '#1e293b';
        ctx.fillRect(resX - 25, resY - 50, 50, 100);
        ctx.strokeStyle = isLight ? '#1e293b' : '#94a3b8'; ctx.lineWidth = 3;
        ctx.beginPath();
        for(let i=0; i<8; i++) {
          ctx.lineTo(resX + (i%2?18:-18), resY - 35 + i * 10);
        }
        ctx.stroke();

        if (isRunning) onDataUpdate({ x: simState.current.time, y: current });
      }

      // --- ENHANCED PHYSICS (Pendulum) ---
      else {
        const L = (currentExp.parameters.length || 10) * 15;
        const g = currentExp.parameters.gravity || 9.81;
        const angle = 0.5 * Math.cos(Math.sqrt(g / (L/100)) * simState.current.time);
        
        const px = centerX;
        const py = topAnchorY + 100;
        const bx = px + L * Math.sin(angle);
        const by = py + L * Math.cos(angle);

        // String
        ctx.strokeStyle = isLight ? '#000' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();

        // Bob with depth
        const grad = ctx.createRadialGradient(bx - 5, by - 5, 0, bx, by, 25);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(1, '#1d4ed8');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 20; ctx.shadowColor = '#1d4ed8';
        ctx.beginPath(); ctx.arc(bx, by, 25, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        if (isRunning) onDataUpdate({ x: simState.current.time, y: angle });
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
    <div className={`flex-1 relative overflow-hidden transition-colors duration-500 ${isLight ? 'bg-slate-50' : 'bg-[#020617]'}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Telemetry Monitor Overlay */}
      <div className={`absolute bottom-6 left-6 p-4 rounded-2xl border backdrop-blur-3xl shadow-2xl transition-all duration-500 ${isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/60 border-white/5'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={12} className="text-blue-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Neural Feed</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-24 h-12 rounded-lg overflow-hidden border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5'}`}>
             <div className="h-full w-full opacity-50 flex items-center justify-center">
                <Zap size={16} className="text-blue-500" />
             </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>X_VAR: {time.toFixed(2)}</span>
            <span className={`text-[10px] font-mono text-blue-500`}>Y_STAT: {(Math.random()*100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Control HUD */}
      <div className={`absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 border rounded-2xl shadow-2xl z-40 backdrop-blur-3xl transition-all ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/80 border-white/10'}`}>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setIsRunning(!isRunning)}
             className={`p-3 rounded-xl transition-all ${isRunning ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10 hover:scale-110'}`}
           >
             {isRunning ? <Pause size={20} /> : <Play size={20} />}
           </button>
           <button onClick={() => { setIsRunning(false); setTime(0); simState.current.time = 0; }} className={`p-3 rounded-xl transition-all ${isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
             <RotateCcw size={20} />
           </button>
        </div>
        
        <div className={`w-[1px] h-8 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
        
        <div className="flex flex-col min-w-[80px]">
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Master Time</span>
          <span className={`font-mono font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>{time.toFixed(3)}s</span>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-xl transition-all ${showSettings ? 'text-blue-500 bg-blue-500/10' : (isLight ? 'text-slate-400 hover:text-slate-900' : 'text-slate-500 hover:text-white')}`}
        >
          <Settings2 size={20} />
        </button>
      </div>

      {showSettings && experiment && (
        <div className={`absolute top-24 right-8 p-6 rounded-3xl border w-72 z-40 shadow-2xl animate-in fade-in slide-in-from-right-4 backdrop-blur-3xl ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-white/10'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Calibration</h3>
            <ShieldAlert size={12} className="text-slate-400" />
          </div>
          <div className="space-y-6">
            {Object.entries(experiment.parameters).map(([key, val]) => {
              // Cast value to number to fix 'unknown' type error for toFixed
              const value = val as number;
              return (
                <div key={key}>
                  <div className="flex justify-between text-[9px] uppercase tracking-widest font-black mb-2">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{key}</span>
                    <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{value.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" min={0.1} max={100} step={0.1}
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
  );
};

export default LabScene;
