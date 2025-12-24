
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
    <div className={`relative h-full flex flex-col transition-all duration-500 ease-in-out z-40 ${isOpen ? 'w-64' : 'w-16'} border-r ${isLight ? 'bg-white border-black' : 'bg-[#020617] border-white/10'}`}>
        <button 
          onClick={onToggle}
          className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center transition-all z-50 border ${isLight ? 'bg-white border-black text-black' : 'bg-black border-white/10 text-white'}`}
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className={`flex flex-col h-full p-4 overflow-hidden transition-all duration-300 ${!isOpen && 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-3 mb-10">
            <FlaskConical size={20} />
            <h1 className="text-sm font-black tracking-widest">REVOLT</h1>
          </div>

          <button 
            onClick={onNewExperiment}
            className={`flex items-center gap-2 font-black py-3 px-4 border mb-8 transition-all uppercase text-[9px] tracking-widest ${isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'}`}
          >
            <Plus size={14} /> New Research
          </button>

          <div className="space-y-10 flex-1">
             <div>
                <h3 className="text-[8px] font-black uppercase tracking-widest mb-4 opacity-40">System_History</h3>
                <span className="text-[9px] italic opacity-30">No_Stored_Data</span>
             </div>
          </div>

          <div className="pt-4 border-t border-current/10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest">Researcher_01</span>
                <span className="text-[8px] uppercase tracking-widest opacity-40">Phase_Calibration: OK</span>
              </div>
          </div>
        </div>

        {!isOpen && (
          <div className="flex flex-col items-center pt-8 gap-8 h-full">
            <FlaskConical size={16} />
            <LayoutGrid size={16} className="opacity-40" />
            <Plus onClick={onNewExperiment} size={16} className="cursor-pointer" />
          </div>
        )}
    </div>
  );
};

export default Sidebar;
