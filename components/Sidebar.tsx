
import React from 'react';
import { FlaskConical, Atom, History, Save, Plus } from 'lucide-react';
import { DEFAULT_EXPERIMENTS } from '../constants';

interface SidebarProps {
  onNewExperiment: () => void;
  onSelectSaved: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewExperiment, onSelectSaved }) => {
  return (
    <div className="w-64 h-full bg-[#1e293b] border-r border-slate-700 flex flex-col p-4 z-10">
      <div className="flex items-center gap-2 mb-8 px-2">
        <FlaskConical className="text-blue-400" size={28} />
        <h1 className="text-xl font-bold text-white tracking-tight">Revolt Lab</h1>
      </div>

      <button 
        onClick={onNewExperiment}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-all mb-6 w-full justify-center"
      >
        <Plus size={18} />
        New Experiment
      </button>

      <div className="space-y-6 flex-1 overflow-y-auto">
        <div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
            <Atom size={14} /> Recommended
          </h3>
          <ul className="space-y-1">
            {DEFAULT_EXPERIMENTS.map((exp) => (
              <li key={exp.id}>
                <button 
                  onClick={() => onSelectSaved(exp.id)}
                  className="w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
                >
                  {exp.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
            <History size={14} /> Recent Saves
          </h3>
          <div className="px-2 text-slate-500 text-xs italic">
            No recent experiments saved.
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">RL</div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">Lab Tech</span>
            <span className="text-xs text-slate-400">Pro Researcher</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
