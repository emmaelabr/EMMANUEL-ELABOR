
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Info, Download } from 'lucide-react';
import { ExperimentState } from '../types';

interface DataVisualizerProps {
  experiment: ExperimentState | null;
}

const DataVisualizer: React.FC<DataVisualizerProps> = ({ experiment }) => {
  return (
    <div className="w-[300px] md:w-[400px] flex flex-col h-full bg-[#0f172a] border-l border-slate-700 p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-green-400" />
          <span className="font-semibold text-slate-200 uppercase text-xs tracking-widest">Analytics</span>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors">
          <Download size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 h-64">
          <h4 className="text-xs font-bold text-slate-400 mb-4">REAL-TIME DATA PLOT</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={experiment?.dataPoints || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="x" hide />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#60a5fa" 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
            <Info size={14} /> Observations
          </h4>
          <div className="space-y-3">
            {!experiment ? (
              <p className="text-xs text-slate-500 italic">No experiment active.</p>
            ) : (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Peak Value</span>
                  <span className="text-white font-mono">
                    {Math.max(...(experiment.dataPoints.map(p => p.y) || [0])).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Min Value</span>
                  <span className="text-white font-mono">
                    {Math.min(...(experiment.dataPoints.map(p => p.y) || [0])).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Sample Count</span>
                  <span className="text-white font-mono">{experiment.dataPoints.length}</span>
                </div>
                <div className="pt-4 mt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {experiment.description}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualizer;
