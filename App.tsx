
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LabScene from './components/LabScene';
import WelcomeScreen from './components/WelcomeScreen';
import NeutronStarLoading from './components/NeutronStarLoading';
import GlobalParticles from './components/GlobalParticles';
import { ExperimentState, ChatMessage, GroundingSource, ImageData } from './types';
import { getExperimentLogic, chatWithLabAssistant } from './services/geminiService';
import { ArrowLeft } from 'lucide-react';

type ViewState = 'welcome' | 'loading' | 'lab';
type LayoutMode = 'split' | 'chat-only';
export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('welcome');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  // Default to light for the professional Black & White look
  const [theme, setTheme] = useState<Theme>('light');
  const [experiment, setExperiment] = useState<ExperimentState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isLight = theme === 'light';

  useEffect(() => {
    document.body.style.backgroundColor = isLight ? '#ffffff' : '#020617';
    document.body.style.color = isLight ? '#000000' : '#f8fafc';
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
          text: `${result.description}\n\nRevolt core initialized. Simulation standing by.`,
          showGraph: prompt.toLowerCase().includes('graph') || prompt.toLowerCase().includes('plot'),
          sources: result.sources
        }
      ]);
      setTimeout(() => setView('lab'), 2000);
    } catch (error) {
      console.error(error);
      setView('welcome');
      alert("Neural sync failure.");
    }
  };

  const handleChat = async (text: string, image?: ImageData) => {
    setMessages(prev => [...prev, { role: 'user', text: text || (image ? "[Image Attached]" : "") }]);
    setIsTyping(true);
    try {
      const { text: reply, sources: newSources } = await chatWithLabAssistant([], text, image);
      const showGraph = text.toLowerCase().includes('graph') || text.toLowerCase().includes('plot');
      setMessages(prev => [...prev, { role: 'model', text: reply, showGraph, sources: newSources }]);
      setSources(newSources);
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
    <div className={`h-screen w-full transition-colors duration-700 overflow-hidden font-sans relative ${isLight ? 'bg-white text-black' : 'bg-[#020617] text-slate-200'}`}>
      <GlobalParticles theme={theme} />
      
      {view === 'welcome' && (
        <WelcomeScreen onStart={startExperiment} theme={theme} onThemeToggle={toggleTheme} />
      )}

      {view === 'loading' && <NeutronStarLoading />}

      {view === 'lab' && (
        <div className="flex h-screen w-full animate-in duration-700 relative z-10">
          <Sidebar 
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onNewExperiment={() => setView('welcome')} 
            onSelectSaved={(id) => startExperiment(`Experiment ${id}`, 'split')}
            theme={theme}
          />
          
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <header className={`h-16 flex items-center justify-between px-8 z-30 transition-all duration-700 ${isLight ? 'bg-white border-b border-black' : 'bg-transparent border-b border-white/10'}`}>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView('welcome')}
                  className={`p-2 rounded-lg transition-all ${isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="flex items-baseline gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLight ? 'text-slate-400' : 'text-blue-500/60'}`}>Experiment No. {experiment?.id.slice(-4)}</span>
                  <h2 className={`text-sm font-black uppercase tracking-widest ${isLight ? 'text-black' : 'text-white'}`}>
                    {experiment?.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setLayoutMode(layoutMode === 'split' ? 'chat-only' : 'split')}
                  className={`px-4 py-1.5 rounded-md border text-[9px] font-black transition-all uppercase tracking-[0.2em] ${isLight ? 'bg-white border-black text-black hover:bg-black hover:text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                >
                  {layoutMode === 'split' ? 'Maximize' : 'Split View'}
                </button>

                <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-2 group cursor-pointer outline-none"
                >
                   <div className={`w-8 h-4 rounded-full p-0.5 border transition-all ${isLight ? 'border-black bg-white' : 'border-white/20 bg-black'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isLight ? 'bg-black translate-x-0' : 'bg-white translate-x-4'}`} />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest">Toggle Phase</span>
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
                <div className="flex-1 flex flex-col border-l border-current/10">
                  <LabScene 
                    experiment={experiment} 
                    onUpdateParameters={handleUpdateParameters}
                    onDataUpdate={handleDataUpdate}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;