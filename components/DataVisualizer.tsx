
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Info, Download, Maximize2 } from 'lucide-react';
import { ExperimentState } from '../types';

interface DataVisualizerProps {
  experiment: ExperimentState | null;
}

const DataVisualizer: React.FC<DataVisualizerProps> = ({ experiment }) => {
  const peakY = experiment?.dataPoints.length 
    ? Math.max(...experiment.dataPoints.map(p => p.y)) 
    : 0;
  
  const minY = experiment?.dataPoints.length 
    ? Math.min(...experiment.dataPoints.map(p => p.y)) 
    : 0;

  return (
    <div className="w-[320px] md:w-[400px] flex flex-col h-full bg-[#020617] border-l border-white/5 p-6 z-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <BarChart3 size={18} className="text-emerald-400" />
          </div>
          <span className="font-bold text-xs tracking-[0.2em] text-white uppercase">Analytics</span>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
            <Download size={14} />
          </button>
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
        {/* Chart Card */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 h-72 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-emerald-500/50 opacity-30"></div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Spectral Analysis</h4>
            <span className="text-[10px] text-emerald-400 font-mono animate-pulse">LIVE FEED</span>
          </div>
          
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={experiment?.dataPoints || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="x" hide />
              <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/5 rounded-xl p-3">
            <span className="block text-[8px] font-black text-slate-500 uppercase mb-1">Peak Amplitude</span>
            <span className="text-lg font-mono text-white">{peakY.toFixed(3)}</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-3">
            <span className="block text-[8px] font-black text-slate-500 uppercase mb-1">Minimum</span>
            <span className="text-lg font-mono text-white">{minY.toFixed(3)}</span>
          </div>
        </div>

        {/* Notes Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h4 className="text-[10px] font-black text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Info size={12} className="text-blue-400" /> Lab Observations
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed font-light italic">
            {experiment?.description || "Awaiting initialization signal..."}
          </p>
          
          {experiment && (
            <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Stability Index</span>
                <span className="text-emerald-400 font-bold">98.2%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[98%] h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualizer;
