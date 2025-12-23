
import React, { useRef, useEffect, useState } from 'react';
import { ExperimentState } from '../types';
import { Play, Pause, RotateCcw, Settings2, ShieldAlert } from 'lucide-react';

interface LabSceneProps {
  experiment: ExperimentState | null;
  onUpdateParameters: (params: Record<string, number>) => void;
  onDataUpdate: (point: { x: number; y: number }) => void;
}

const LabScene: React.FC<LabSceneProps> = ({ experiment, onUpdateParameters, onDataUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const experimentRef = useRef<ExperimentState | null>(experiment);
  useEffect(() => {
    experimentRef.current = experiment;
  }, [experiment]);

  const simState = useRef({
    time: 0,
    bubbles: [] as {x: number, y: number, r: number, s: number}[],
    colorPhase: 0
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

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.03)';
      ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    };

    const render = () => {
      const currentExp = experimentRef.current;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid();

      if (!currentExp) {
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 9px tracking-[0.5em] uppercase';
        ctx.textAlign = 'center';
        ctx.fillText('WAITING FOR EXPERIMENT COMMANDS', canvas.width / 2, canvas.height / 2);
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

      // --- ELECTRONICS ENHANCED ---
      if (currentExp.name.toLowerCase().includes('circuit') || currentExp.type === 'electronics') {
        const voltage = currentExp.parameters.voltage || 9;
        const resistance = currentExp.parameters.resistance || 10;
        const current = voltage / resistance;
        
        const circuitW = 440;
        const circuitH = 260;
        const cx = centerX - circuitW / 2;
        const cy = topAnchorY + 100;

        // Realistic Wire Loop with Glow
        ctx.shadowBlur = 15; ctx.shadowColor = isRunning ? 'rgba(59, 130, 246, 0.1)' : 'transparent';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';
        ctx.strokeRect(cx, cy, circuitW, circuitH);
        ctx.shadowBlur = 0;

        // Battery Rendering
        const batX = cx;
        const batY = cy + circuitH / 2;
        ctx.fillStyle = '#050505';
        ctx.fillRect(batX - 15, batY - 40, 30, 80);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        for(let i=0; i<6; i++) {
          const w = i % 2 === 0 ? 20 : 10;
          ctx.beginPath(); ctx.moveTo(batX - w, batY - 25 + i * 10); ctx.lineTo(batX + w, batY - 25 + i * 10); ctx.stroke();
        }

        // Resistor
        const resX = cx + circuitW;
        const resY = cy + circuitH / 2;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(resX - 20, resY - 40, 40, 80);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i=0; i<8; i++) {
          ctx.lineTo(resX + (i%2?15:-15), resY - 30 + i*9);
        }
        ctx.stroke();

        // Bulb with Filament
        const bulbX = cx + circuitW / 2;
        const bulbY = cy;
        const brightness = Math.min(1, current * 0.5);
        
        if (isRunning && current > 0) {
          const radial = ctx.createRadialGradient(bulbX, bulbY, 0, bulbX, bulbY, 100 * brightness);
          radial.addColorStop(0, `rgba(253, 224, 71, ${0.4 * brightness})`);
          radial.addColorStop(1, 'transparent');
          ctx.fillStyle = radial;
          ctx.fillRect(bulbX - 100, bulbY - 100, 200, 200);
        }

        ctx.fillStyle = isRunning && current > 0 ? `rgba(253, 224, 71, ${0.2 + brightness})` : '#0f172a';
        ctx.beginPath(); ctx.arc(bulbX, bulbY, 35, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        
        // Filament
        ctx.strokeStyle = isRunning && current > 0 ? '#fff' : '#475569';
        ctx.beginPath();
        ctx.moveTo(bulbX - 10, bulbY + 10);
        ctx.bezierCurveTo(bulbX - 10, bulbY - 20, bulbX + 10, bulbY - 20, bulbX + 10, bulbY + 10);
        ctx.stroke();

        if (isRunning) {
          const t = simState.current.time;
          const speed = current * 80;
          const totalDist = (circuitW + circuitH) * 2;
          ctx.fillStyle = '#3b82f6';
          for(let i=0; i<20; i++) {
            let p = (t * speed + (i/20) * totalDist) % totalDist;
            let ex, ey;
            if (p < circuitW) { ex = cx + p; ey = cy; }
            else if (p < circuitW + circuitH) { ex = cx + circuitW; ey = cy + (p - circuitW); }
            else if (p < 2 * circuitW + circuitH) { ex = cx + circuitW - (p - (circuitW + circuitH)); ey = cy + circuitH; }
            else { ex = cx; ey = cy + circuitH - (p - (2 * circuitW + circuitH)); }
            ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
          }
          onDataUpdate({ x: t, y: current });
        }
      } 
      // --- CHEMISTRY ENHANCED ---
      else if (currentExp.type === 'chemistry' || currentExp.name.toLowerCase().includes('reaction')) {
        const bWidth = 180;
        const bHeight = 240;
        const bx = centerX - bWidth / 2;
        const by = topAnchorY + 80;
        
        // Dynamic reaction properties
        const reactivity = currentExp.parameters.reactivity || 5;
        const targetPh = currentExp.parameters.ph || 7;
        
        // Interpolate color phase
        if (isRunning) {
          simState.current.colorPhase += (targetPh - simState.current.colorPhase) * 0.01;
        }
        
        const hue = (simState.current.colorPhase / 14) * 280;
        const liquidH = 160;

        // Beaker Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(bx + 10, by + bHeight, bWidth, 10);

        // Liquid with Gradient
        const liquidGrad = ctx.createLinearGradient(bx, by + bHeight - liquidH, bx, by + bHeight);
        liquidGrad.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.4)`);
        liquidGrad.addColorStop(1, `hsla(${hue}, 70%, 30%, 0.7)`);
        ctx.fillStyle = liquidGrad;
        ctx.fillRect(bx + 5, by + bHeight - liquidH - 5, bWidth - 10, liquidH);

        // Bubble Physics
        if (isRunning && reactivity > 2) {
          if (Math.random() < reactivity * 0.05) {
            simState.current.bubbles.push({
              x: bx + 10 + Math.random() * (bWidth - 20),
              y: by + bHeight - 10,
              r: Math.random() * 3 + 1,
              s: Math.random() * reactivity * 0.5 + 1
            });
          }
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          simState.current.bubbles.forEach((b, idx) => {
            b.y -= b.s;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
            if (b.y < by + bHeight - liquidH) simState.current.bubbles.splice(idx, 1);
          });
        }

        // Glassware highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(bx, by + bHeight); ctx.lineTo(bx + bWidth, by + bHeight); ctx.lineTo(bx + bWidth, by);
        ctx.stroke();
        
        // Beaker measurement marks
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        for(let i=1; i<5; i++) {
          const my = by + bHeight - (i * 40);
          ctx.beginPath(); ctx.moveTo(bx + 5, my); ctx.lineTo(bx + 25, my); ctx.stroke();
        }

        if (isRunning) onDataUpdate({ x: simState.current.time, y: simState.current.colorPhase });
      }
      // --- PENDULUM ---
      else if (currentExp.name.toLowerCase().includes('pendulum')) {
        const L = ((currentExp.parameters.length || 5) / 10) * (canvas.height * 0.6);
        const g = currentExp.parameters.gravity || 9.81;
        const angle = 0.6 * Math.cos(Math.sqrt(g / (L/100)) * simState.current.time);
        
        const px = centerX;
        const py = topAnchorY + 50;
        const bobX = px + L * Math.sin(angle);
        const bobY = py + L * Math.cos(angle);

        // Pivot base
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - 40, py - 10, 80, 10);

        // String
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bobX, bobY); ctx.stroke();

        // Bob Glow
        ctx.shadowBlur = 30; ctx.shadowColor = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.arc(bobX, bobY, 20, 0, Math.PI * 2); ctx.fill();
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
  }, [isRunning, experiment?.id]);

  return (
    <div className="flex-1 relative bg-[#020617] overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* HUD Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-40 transition-all">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setIsRunning(!isRunning)}
             className={`p-2.5 rounded-xl transition-all ${isRunning ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10 hover:scale-110 active:scale-95'}`}
           >
             {isRunning ? <Pause size={20} /> : <Play size={20} />}
           </button>
           <button onClick={() => { setIsRunning(false); setTime(0); simState.current.time = 0; }} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
             <RotateCcw size={20} />
           </button>
        </div>
        
        <div className="w-[1px] h-8 bg-white/10" />
        
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Chronos Engine</span>
          <span className="text-white font-mono font-bold text-base">{time.toFixed(3)}s</span>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2.5 rounded-xl transition-all ${showSettings ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white'}`}
        >
          <Settings2 size={20} />
        </button>
      </div>

      {showSettings && experiment && (
        <div className="absolute top-24 right-8 bg-slate-900/95 backdrop-blur-3xl p-6 rounded-3xl border border-white/10 w-72 z-40 shadow-2xl animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Experiment Variables</h3>
            <ShieldAlert size={12} className="text-slate-600" />
          </div>
          <div className="space-y-6">
            {Object.entries(experiment.parameters).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                  <span>{key}</span>
                  <span className="text-white font-mono">{value}</span>
                </div>
                <input 
                  type="range" min={0.1} max={100} step={0.1}
                  value={value}
                  onChange={(e) => onUpdateParameters({ [key]: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
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
