
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LabScene from './components/LabScene';
import WelcomeScreen from './components/WelcomeScreen';
import NeutronStarLoading from './components/NeutronStarLoading';
import { ExperimentState, ChatMessage, GroundingSource, ImageData } from './types';
import { getExperimentLogic, chatWithLabAssistant } from './services/geminiService';
import { ArrowLeft } from 'lucide-react';

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

  const isLight = theme === 'light';

  useEffect(() => {
    document.body.style.backgroundColor = isLight ? '#ffffff' : '#020617';
    document.body.style.color = isLight ? '#0f172a' : '#f8fafc';
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
      alert("Neural sync failure.");
    }
  };

  const handleChat = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    try {
      const reply = await chatWithLabAssistant([], text);
      const showGraph = text.toLowerCase().includes('graph') || text.toLowerCase().includes('plot');
      setMessages(prev => [...prev, { role: 'model', text: reply, showGraph }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Communication error.' }]);
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
    <div className={`h-screen w-full transition-colors duration-500 overflow-hidden font-sans ${isLight ? 'bg-white text-slate-900' : 'bg-[#020617] text-slate-200'}`}>
      {view === 'welcome' && (
        <WelcomeScreen onStart={startExperiment} theme={theme} onThemeToggle={toggleTheme} />
      )}

      {view === 'loading' && <NeutronStarLoading />}

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
            <header className={`h-16 border-b flex items-center justify-between px-8 z-30 backdrop-blur-3xl transition-colors duration-500 ${isLight ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-slate-900/40 border-white/5'}`}>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView('welcome')}
                  className={`p-2 rounded-lg transition-all ${isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex flex-col">
                  <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${isLight ? 'text-black' : 'text-blue-500'}`}>Revolt Research Core</span>
                  <h2 className={`text-xs font-bold tracking-tight uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {experiment?.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setLayoutMode(layoutMode === 'split' ? 'chat-only' : 'split')}
                  className={`px-4 py-1.5 rounded-xl border text-[9px] font-black transition-all uppercase tracking-widest ${isLight ? 'bg-black border-black text-white hover:bg-slate-800' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                >
                  {layoutMode === 'split' ? 'Full Report' : 'Split Feed'}
                </button>

                {/* Revolt Lab Branding Toggle Logo */}
                <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-3 border-l pl-6 border-current/10 h-10 group"
                >
                  <div className="flex items-center gap-3 py-1 px-4 rounded-full border border-current/5 bg-current/5 transition-all hover:bg-current/10">
                    {!isLight && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    )}
                    <div className="flex flex-col items-start leading-none">
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-black tracking-tighter ${isLight ? 'text-black' : 'text-white'}`}>REVOLT</span>
                        <span className={`text-sm font-black tracking-tighter ${isLight ? 'text-slate-400' : 'text-blue-500'}`}>LAB</span>
                      </div>
                    </div>
                    {isLight && (
                      <div className="w-2 h-2 rounded-full bg-black" />
                    )}
                  </div>
                </button>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleChat} 
                sources={sources}
                isTyping={isTyping}
                currentExperimentData={experiment?.dataPoints || []}
                isFullView={layoutMode === 'chat-only'}
                theme={theme}
              />
              {layoutMode === 'split' && (
                <LabScene 
                  experiment={experiment} 
                  onUpdateParameters={handleUpdateParameters}
                  onDataUpdate={handleDataUpdate}
                  theme={theme}
                />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
