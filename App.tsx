
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
          text: `${result.description}\n\nRevolt core initialized. Analysis standing by.`,
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

  const handleChat = async (text: string, image?: ImageData) => {
    setMessages(prev => [...prev, { role: 'user', text: text || (image ? "[Image Attached]" : "") }]);
    setIsTyping(true);
    try {
      const reply = await chatWithLabAssistant([], text, image);
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
    <div className={`h-screen w-full transition-colors duration-700 overflow-hidden font-sans relative ${isLight ? 'bg-white text-slate-900' : 'bg-[#020617] text-slate-200'}`}>
      <GlobalParticles theme={theme} />
      
      {view === 'welcome' && (
        <WelcomeScreen onStart={startExperiment} theme={theme} onThemeToggle={toggleTheme} />
      )}

      {view === 'loading' && <NeutronStarLoading />}

      {view === 'lab' && (
        <div className="flex h-screen w-full animate-in zoom-in-95 duration-1000 relative z-10 backdrop-blur-[2px]">
          <Sidebar 
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onNewExperiment={() => setView('welcome')} 
            onSelectSaved={(id) => startExperiment(`Experiment ${id}`, 'split')}
            theme={theme}
          />
          
          <main className="flex-1 flex flex-col overflow-hidden">
            <header className={`h-20 flex items-center justify-between px-10 z-30 transition-all duration-700 ${isLight ? 'bg-white/40 border-b border-black/5' : 'bg-transparent'}`}>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView('welcome')}
                  className={`p-3 rounded-2xl transition-all shadow-xl ${isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-2 ${isLight ? 'text-slate-400' : 'text-blue-500/60'}`}>Research Stream</span>
                  <h2 className={`text-xl font-extralight tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {experiment?.name.split(' ').map((word, i) => i === 0 ? <span key={i} className="font-bold italic mr-1">{word}</span> : word + ' ')}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <button 
                  onClick={() => setLayoutMode(layoutMode === 'split' ? 'chat-only' : 'split')}
                  className={`px-6 py-2 rounded-2xl border text-[10px] font-black transition-all uppercase tracking-[0.2em] shadow-lg ${isLight ? 'bg-black border-black text-white hover:bg-slate-800' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                >
                  {layoutMode === 'split' ? 'Deep View' : 'Split Feed'}
                </button>

                <button 
                  onClick={toggleTheme}
                  className="group flex items-center gap-4 py-2.5 px-6 rounded-full border border-current/10 bg-current/5 backdrop-blur-md transition-all hover:bg-current/10 hover:scale-105 active:scale-95 shadow-xl outline-none"
                >
                  <div className={`transition-all duration-700 ease-in-out transform flex items-center gap-3 ${isLight ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isLight ? 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.2)]' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse'}`} />
                    <div className="flex flex-col items-start leading-none pointer-events-none">
                      <div className="flex items-center gap-0.5">
                        <span className={`text-sm font-black tracking-tighter transition-colors ${isLight ? 'text-black' : 'text-white'}`}>REVOLT</span>
                        <span className={`text-sm font-black tracking-tighter transition-colors ${isLight ? 'text-slate-400' : 'text-blue-500/80'}`}>LAB</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden p-6 gap-6">
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
