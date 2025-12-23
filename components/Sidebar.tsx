
import React from 'react';
import { FlaskConical, Atom, History, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { DEFAULT_EXPERIMENTS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewExperiment: () => void;
  onSelectSaved: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onNewExperiment, onSelectSaved }) => {
  return (
    <div 
      className={`relative h-full bg-[#1e293b] border-r border-slate-700 flex flex-col transition-all duration-500 ease-in-out z-40 shadow-2xl ${isOpen ? 'w-64' : 'w-12'}`}
    >
      {/* Toggle Handle */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-12 bg-blue-600 rounded-r-lg flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg z-50 border border-white/10"
      >
        {isOpen ? <ChevronLeft size={16} className="text-white" /> : <ChevronRight size={16} className="text-white" />}
      </button>

      {/* Content wrapper to handle overflow during animation */}
      <div className={`flex flex-col h-full overflow-hidden p-4 whitespace-nowrap ${!isOpen && 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2 mb-8 px-2">
          <FlaskConical className="text-blue-400" size={28} />
          <h1 className="text-xl font-bold text-white tracking-tight">Revolt Lab</h1>
        </div>

        <button 
          onClick={onNewExperiment}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-all mb-6 w-full justify-center shadow-lg active:scale-95"
        >
          <Plus size={18} />
          New Experiment
        </button>

        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <Atom size={14} /> Recommended
            </h3>
            <ul className="space-y-1">
              {DEFAULT_EXPERIMENTS.map((exp) => (
                <li key={exp.id}>
                  <button 
                    onClick={() => onSelectSaved(exp.id)}
                    className="w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm truncate"
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
              No recent history.
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700 mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">RL</div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-200">Lab Tech</span>
              <span className="text-xs text-slate-400">Researcher</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed State Visual */}
      {!isOpen && (
        <div className="flex flex-col items-center pt-8 gap-6 h-full">
          <FlaskConical className="text-slate-600" size={20} />
          <Atom className="text-slate-600" size={20} />
          <History className="text-slate-600 mt-auto mb-12" size={20} />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
