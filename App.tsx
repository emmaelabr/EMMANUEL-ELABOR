
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LabScene from './components/LabScene';
import DataVisualizer from './components/DataVisualizer';
import WelcomeScreen from './components/WelcomeScreen';
import { ExperimentState, ChatMessage, GroundingSource } from './types';
import { getExperimentLogic, chatWithLabAssistant } from './services/geminiService';
import { ArrowLeft, Loader2 } from 'lucide-react';

type ViewState = 'welcome' | 'loading' | 'lab';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('welcome');
  const [experiment, setExperiment] = useState<ExperimentState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const startExperiment = async (prompt: string) => {
    setView('loading');
    setMessages([{ role: 'user', text: prompt }]);
    
    try {
      const result = await getExperimentLogic(prompt);
      
      const newExp: ExperimentState = {
        id: Date.now().toString(),
        name: result.setup.name || 'New Experiment',
        type: result.setup.type as 'physics' | 'chemistry' || 'physics',
        description: result.description,
        parameters: result.setup.parameters || {},
        apparatus: result.setup.apparatus as any || [],
        dataPoints: [],
        status: 'idle',
      };

      setExperiment(newExp);
      setSources(result.sources || []);
      setMessages(prev => [
        ...prev,
        { role: 'model', text: `System online. I've prepared the ${newExp.name}. ${result.description}` }
      ]);
      setView('lab');
    } catch (error) {
      console.error(error);
      setView('welcome');
      alert("The lab encountered a calibration error. Please try a different prompt.");
    }
  };

  const handleChat = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    
    try {
      const reply = await chatWithLabAssistant([], text);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Calibration interrupted. Please repeat.' }]);
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
    <div className="h-screen w-full bg-black text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {view === 'welcome' && (
        <WelcomeScreen onStart={startExperiment} />
      )}

      {view === 'loading' && (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black animate-in fade-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-600 blur-3xl opacity-20 animate-pulse"></div>
            <Loader2 className="animate-spin text-blue-500 relative" size={72} />
          </div>
          <h2 className="mt-10 text-sm font-bold tracking-[0.5em] text-white uppercase animate-pulse">Synchronising Realities</h2>
        </div>
      )}

      {view === 'lab' && (
        <div className="flex h-screen w-full animate-in zoom-in-95 duration-500">
          <Sidebar 
            onNewExperiment={() => setView('welcome')} 
            onSelectSaved={(id) => startExperiment(`Experiment ${id}`)} 
          />
          
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Header Control Bar */}
            <header className="h-16 border-b border-white/10 bg-black backdrop-blur-md flex items-center justify-between px-8 z-30">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView('welcome')}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white border border-white/5"
                  title="Back to Hall"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Active Research</span>
                  <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                    {experiment?.name}
                  </h2>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Lab Online
                </div>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden bg-black">
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleChat} 
                sources={sources}
                isTyping={isTyping}
              />
              
              <LabScene 
                experiment={experiment} 
                onUpdateParameters={handleUpdateParameters}
                onDataUpdate={handleDataUpdate}
              />
              
              <DataVisualizer experiment={experiment} />
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
