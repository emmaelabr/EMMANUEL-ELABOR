
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
      className={`relative h-full flex flex-col transition-all duration-700 ease-in-out z-40 ${isOpen ? 'w-80' : 'w-20'} p-4`}
    >
      <div className={`h-full w-full rounded-[2.5rem] flex flex-col overflow-hidden transition-all duration-700 border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] ${isLight ? 'bg-white/60 border-black/5' : 'bg-slate-900/40 border-white/5 backdrop-blur-3xl'}`}>
        
        <button 
          onClick={onToggle}
          className={`absolute -right-2 top-24 w-8 h-16 rounded-2xl flex items-center justify-center transition-all shadow-2xl z-50 border ${isLight ? 'bg-black border-black text-white' : 'bg-blue-600 border-white/10 text-white hover:bg-blue-500'}`}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className={`flex flex-col h-full p-8 whitespace-nowrap transition-all duration-500 ${!isOpen && 'opacity-0 scale-90 pointer-events-none'}`}>
          <div className="flex items-center gap-4 mb-14 px-2">
            <div className={`p-3 rounded-2xl shadow-lg ${isLight ? 'bg-black' : 'bg-blue-600'}`}>
              <FlaskConical className="text-white" size={24} />
            </div>
            <h1 className={`text-2xl font-black tracking-tighter ${isLight ? 'text-slate-900' : 'text-white'}`}>
              REVOLT
            </h1>
          </div>

          <button 
            onClick={onNewExperiment}
            className={`flex items-center gap-3 font-black py-5 px-6 rounded-3xl transition-all mb-12 w-full justify-center shadow-xl active:scale-95 uppercase text-xs tracking-widest ${isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'}`}
          >
            <Plus size={18} />
            New Research
          </button>

          <div className="space-y-12 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div>
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 px-2 flex items-center gap-3 ${isLight ? 'text-slate-400' : 'text-blue-500/60'}`}>
                <History size={16} /> History
              </h3>
              <div className={`px-2 text-xs font-medium italic ${isLight ? 'text-slate-300' : 'text-slate-600'}`}>
                Neural history offline.
              </div>
            </div>
          </div>

          <div className={`pt-8 border-t mt-auto ${isLight ? 'border-black/5' : 'border-white/5'}`}>
            <div className="flex items-center gap-5 px-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner transition-colors ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-white/5 text-slate-400'}`}>
                RT
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>RESEARCHER</span>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${isLight ? 'text-slate-400' : 'text-blue-500/40'}`}>Rank 01</span>
              </div>
            </div>
          </div>
        </div>

        {!isOpen && (
          <div className="flex flex-col items-center pt-10 gap-10 h-full animate-in fade-in duration-500">
            <div className={`p-2.5 rounded-xl ${isLight ? 'bg-black text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
              <FlaskConical size={20} />
            </div>
            <LayoutGrid className={isLight ? 'text-slate-300' : 'text-slate-600'} size={22} />
            <History className={`mt-auto mb-16 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} size={22} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
