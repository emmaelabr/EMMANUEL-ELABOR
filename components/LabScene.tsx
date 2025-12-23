
import React, { useRef, useEffect, useState } from 'react';
import { ExperimentState } from '../types';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';

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

  // Simulation state for 2D rendering
  const simState = useRef({
    time: 0,
    projectilePos: { x: 0, y: 0 },
    pendulumAngle: 0,
    phValue: 7
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const step = 50;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const render = () => {
      const currentExp = experimentRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();

      if (!currentExp) {
        ctx.fillStyle = '#475569';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WAITING FOR EXPERIMENT INITIALIZATION...', canvas.width / 2, canvas.height / 2);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (isRunning) {
        simState.current.time += 0.016;
        setTime(simState.current.time);
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Logic based on experiment type
      if (currentExp.name.toLowerCase().includes('pendulum')) {
        const L = (currentExp.parameters.length || 5) * 40; // Scale for 2D
        const g = currentExp.parameters.gravity || 9.81;
        const angle = 0.5 * Math.cos(Math.sqrt(g / (L/40)) * simState.current.time);
        
        const pivotX = centerX;
        const pivotY = 100;
        const bobX = pivotX + L * Math.sin(angle);
        const bobY = pivotY + L * Math.cos(angle);

        // Draw string
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        // Draw pivot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw bob
        ctx.fillStyle = '#3b82f6';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3b82f6';
        ctx.beginPath();
        ctx.arc(bobX, bobY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isRunning) onDataUpdate({ x: simState.current.time, y: angle });
      } 
      else if (currentExp.name.toLowerCase().includes('projectile')) {
        const v0 = currentExp.parameters.velocity || 50;
        const angleDeg = currentExp.parameters.angle || 45;
        const angleRad = angleDeg * (Math.PI / 180);
        const g = 9.81 * 10; // Scaled gravity

        const t = simState.current.time;
        const x = v0 * Math.cos(angleRad) * t;
        const y = v0 * Math.sin(angleRad) * t - 0.5 * g * t * t;

        const startX = 100;
        const startY = canvas.height - 100;
        const drawX = startX + x;
        const drawY = startY - y;

        // Draw Trajectory Path (simplified)
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for(let pt = 0; pt < t; pt += 0.1) {
            const px = v0 * Math.cos(angleRad) * pt;
            const py = v0 * Math.sin(angleRad) * pt - 0.5 * g * pt * pt;
            ctx.lineTo(startX + px, startY - py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Launcher
        ctx.save();
        ctx.translate(startX, startY);
        ctx.rotate(-angleRad);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, -10, 40, 20);
        ctx.restore();

        // Draw Projectile
        if (drawY <= startY + 20) {
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 8, 0, Math.PI * 2);
            ctx.fill();
            if (isRunning) onDataUpdate({ x: t, y: y });
        } else {
            setIsRunning(false);
        }
      } 
      else if (currentExp.type === 'chemistry') {
        // Draw Beaker
        const bWidth = 150;
        const bHeight = 200;
        const bx = centerX - bWidth / 2;
        const by = centerY - bHeight / 2;

        // Liquid color based on pH/time
        const ph = 7 + 7 * Math.sin(simState.current.time * 0.5);
        const hue = (ph / 14) * 280; // Red to Purple
        const liquidColor = `hsla(${hue}, 70%, 50%, 0.6)`;

        // Draw liquid
        ctx.fillStyle = liquidColor;
        ctx.fillRect(bx + 5, by + bHeight - 145, bWidth - 10, 140);

        // Draw glass
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + bHeight);
        ctx.lineTo(bx + bWidth, by + bHeight);
        ctx.lineTo(bx + bWidth, by);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`PH LEVEL: ${ph.toFixed(2)}`, centerX, by + bHeight + 30);

        if (isRunning) onDataUpdate({ x: simState.current.time, y: ph });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, experiment?.id]);

  const handleReset = () => {
    setIsRunning(false);
    simState.current.time = 0;
    setTime(0);
  };

  return (
    <div className="flex-1 relative bg-[#050505] overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Control Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 flex items-center gap-8 z-10 shadow-2xl shadow-blue-500/5 transition-all">
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className={`p-3 rounded-xl transition-all ${isRunning ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10 hover:scale-105'}`}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button onClick={handleReset} className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <RotateCcw size={24} />
        </button>
        <div className="w-[1px] h-10 bg-white/10 mx-2" />
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Chronometer</span>
          <span className="text-white font-mono font-bold">{time.toFixed(2)}s</span>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-xl transition-all ${showSettings ? 'text-blue-400 bg-blue-500/20' : 'text-slate-400 hover:text-white'}`}
        >
          <Settings2 size={24} />
        </button>
      </div>

      {showSettings && experiment && (
        <div className="absolute top-24 right-8 bg-black/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 w-72 z-10 shadow-2xl animate-in fade-in slide-in-from-right-4">
          <h3 className="text-[10px] font-black text-blue-500 mb-6 flex items-center gap-2 uppercase tracking-[0.3em]">
            <Settings2 size={14} /> Parameter Adjustment
          </h3>
          <div className="space-y-6">
            {Object.entries(experiment.parameters).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2">
                  <span>{key}</span>
                  <span className="text-white font-mono">{value}</span>
                </div>
                <input 
                  type="range" 
                  min={0.1} 
                  max={100} 
                  step={0.1}
                  value={value}
                  onChange={(e) => onUpdateParameters({ [key]: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experiment Legend */}
      {experiment && (
        <div className="absolute bottom-8 left-8 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/5 pointer-events-none">
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-1">Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <span className="text-xs text-white uppercase font-bold tracking-tight">
              {isRunning ? 'Simulation Running' : 'Idle / Calibrating'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabScene;
