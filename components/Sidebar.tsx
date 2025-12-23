
import React from 'react';
import { FlaskConical, History, Plus, ChevronRight, ChevronLeft, LayoutGrid } from 'lucide-react';
import { Theme } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewExperiment: () => void;
  onSelectSaved: (id: string) => void;
  theme: Theme;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onNewExperiment, onSelectSaved, theme }) => {
  const isLight = theme === 'light';

  return (
    <div 
      className={`relative h-full border-r flex flex-col transition-all duration-500 ease-in-out z-40 shadow-2xl ${isOpen ? 'w-64' : 'w-12'} ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b] border-slate-700'}`}
    >
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-12 bg-blue-600 rounded-r-lg flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg z-50 border border-white/10"
      >
        {isOpen ? <ChevronLeft size={16} className="text-white" /> : <ChevronRight size={16} className="text-white" />}
      </button>

      <div className={`flex flex-col h-full overflow-hidden p-4 whitespace-nowrap transition-opacity duration-300 ${!isOpen && 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FlaskConical className="text-white" size={24} />
          </div>
          <h1 className={`text-xl font-bold tracking-tighter ${isLight ? 'text-slate-900' : 'text-white'}`}>Revolt</h1>
        </div>

        <button 
          onClick={onNewExperiment}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all mb-8 w-full justify-center shadow-lg active:scale-95 uppercase text-xs tracking-widest"
        >
          <Plus size={16} />
          New Research
        </button>

        <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              <History size={14} /> Neural History
            </h3>
            <div className={`px-2 text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
              History empty.
            </div>
          </div>
        </div>

        <div className={`pt-6 border-t mt-auto ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <div className="flex items-center gap-3 px-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'}`}>
              RT
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>RESEARCHER</span>
              <span className={`text-[10px] font-medium uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Level 01</span>
            </div>
          </div>
        </div>
      </div>

      {!isOpen && (
        <div className="flex flex-col items-center pt-8 gap-8 h-full">
          <FlaskConical className={isLight ? 'text-slate-300' : 'text-slate-700'} size={20} />
          <LayoutGrid className={isLight ? 'text-slate-300' : 'text-slate-700'} size={20} />
          <History className={`mt-auto mb-12 ${isLight ? 'text-slate-300' : 'text-slate-700'}`} size={20} />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
