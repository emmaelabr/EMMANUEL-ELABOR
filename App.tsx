
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LabScene from './components/LabScene';
import WelcomeScreen from './components/WelcomeScreen';
import NeutronStarLoading from './components/NeutronStarLoading';
import { ExperimentState, ChatMessage, GroundingSource, ImageData } from './types';
import { getExperimentLogic, chatWithLabAssistant } from './services/geminiService';
import { ArrowLeft, Monitor, Atom } from 'lucide-react';

type ViewState = 'welcome' | 'loading' | 'lab';
type LayoutMode = 'split' | 'chat-only';
export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('welcome');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [theme, setTheme] = useState<Theme>('dark');
  const [experiment, setExperiment] = useState<ExperimentState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Apply theme to body
  useEffect(() => {
    document.body.style.backgroundColor = theme === 'light' ? '#ffffff' : '#020617';
    document.body.style.color = theme === 'light' ? '#0f172a' : '#f8fafc';
  }, [theme]);

  const startExperiment = async (prompt: string, mode: LayoutMode = 'split', image?: ImageData) => {
    setView('loading');
    setLayoutMode(mode);
    setMessages([{ role: 'user', text: prompt }]);
    
    try {
      const result = await getExperimentLogic(prompt, image);
      
      const newExp: ExperimentState = {
        id: Date.now().toString(),
        name: result.setup.name || 'New Experiment',
        type: (result.setup.type as any) || 'physics',
        description: result.description,
        parameters: result.setup.parameters || {},
        apparatus: (result.setup.apparatus as any) || [],
        dataPoints: [],
        status: 'idle',
      };

      setExperiment(newExp);
      setSources(result.sources || []);
      setMessages(prev => [
        ...prev,
        { 
          role: 'model', 
          text: `${result.description}\n\nRevolt core initialized. I've configured the ${newExp.name}. ${mode === 'split' ? 'Real-time visualization and neural monitoring active.' : 'I am standing by for deeper analysis.'}`,
          showGraph: prompt.toLowerCase().includes('graph') || prompt.toLowerCase().includes('plot')
        }
      ]);
      setTimeout(() => setView('lab'), 2000);
    } catch (error) {
      console.error(error);
      setView('welcome');
      alert("Neural sync failure. Please retry with a different prompt.");
    }
  };

  const handleChat = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);

    if (text.toLowerCase().includes('open experimental page')) {
      setLayoutMode('split');
      setMessages(prev => [...prev, { role: 'model', text: 'Switching to laboratory visualization mode.' }]);
      return;
    }

    setIsTyping(true);
    try {
      const reply = await chatWithLabAssistant([], text);
      const showGraph = text.toLowerCase().includes('graph') || text.toLowerCase().includes('plot') || text.toLowerCase().includes('data');
      setMessages(prev => [...prev, { role: 'model', text: reply, showGraph }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Communication error. Please restate.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleUpdateParameters = (newParams: Record<string, number>) => {
    if (!experiment) return;
    setExperiment({
      ...experiment,
      parameters: { ...experiment.parameters, ...newParams },
      dataPoints: [] 
    });
  };

  const handleDataUpdate = useCallback((point: { x: number; y: number }) => {
    setExperiment(prev => {
      if (!prev) return null;
      const newData = [...prev.dataPoints, point].slice(-100);
      return { ...prev, dataPoints: newData };
    });
  }, []);

  return (
    <div className={`h-screen w-full transition-colors duration-500 overflow-hidden font-sans selection:bg-blue-500/30 ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-[#020617] text-slate-200'}`}>
      {view === 'welcome' && (
        <WelcomeScreen onStart={startExperiment} theme={theme} onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
      )}

      {view === 'loading' && (
        <NeutronStarLoading />
      )}

      {view === 'lab' && (
        <div className="flex h-screen w-full animate-in zoom-in-95 duration-700">
          <Sidebar 
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onNewExperiment={() => setView('welcome')} 
            onSelectSaved={(id) => startExperiment(`Experiment ${id}`, 'split')}
            theme={theme}
          />
          
          <main className="flex-1 flex flex-col overflow-hidden">
            <header className={`h-16 border-b flex items-center justify-between px-8 z-30 backdrop-blur-3xl transition-colors duration-500 ${theme === 'light' ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-slate-900/40 border-white/5'}`}>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView('welcome')}
                  className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-black text-white hover:bg-slate-800' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex flex-col">
                  <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${theme === 'light' ? 'text-black' : 'text-blue-500'}`}>Revolt Research Core</span>
                  <h2 className={`text-xs font-bold tracking-tight uppercase ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {experiment?.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setLayoutMode(layoutMode === 'split' ? 'chat-only' : 'split')}
                  className={`px-4 py-1.5 rounded-xl border text-[9px] font-black transition-all uppercase tracking-widest ${theme === 'light' ? 'bg-black border-black text-white hover:bg-slate-800' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                >
                  {layoutMode === 'split' ? 'Full Report' : 'Split Feed'}
                </button>

                {/* Revolt Lab Theme-Responsive Logo */}
                <div className="flex items-center gap-3 border-l pl-6 border-current/10">
                  <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden transition-all duration-500 ${theme === 'light' ? 'bg-black' : 'bg-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.3)]'}`}>
                    <Atom 
                      size={20} 
                      className={`animate-[spin_4s_linear_infinite] ${theme === 'light' ? 'text-white' : 'text-blue-400'}`} 
                    />
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className={`text-sm font-black tracking-tighter ${theme === 'light' ? 'text-black' : 'text-white'}`}>REVOLT</span>
                    <span className={`text-[10px] font-light tracking-[0.2em] ${theme === 'light' ? 'text-slate-500' : 'text-blue-400/80'}`}>LAB</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden transition-all">
              <div className={`transition-all duration-700 flex ${layoutMode === 'chat-only' ? 'flex-1' : 'w-[450px]'}`}>
                <ChatInterface 
                  messages={messages} 
                  onSendMessage={handleChat} 
                  sources={sources}
                  isTyping={isTyping}
                  currentExperimentData={experiment?.dataPoints || []}
                  isFullView={layoutMode === 'chat-only'}
                  theme={theme}
                />
              </div>
              
              <div className={`transition-all duration-700 ${layoutMode === 'split' ? 'flex-1 opacity-100 scale-100' : 'w-0 opacity-0 scale-95 overflow-hidden'}`}>
                <LabScene 
                  experiment={experiment} 
                  onUpdateParameters={handleUpdateParameters}
                  onDataUpdate={handleDataUpdate}
                  theme={theme}
                />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
