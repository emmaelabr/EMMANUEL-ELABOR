
import React, { useState, useCallback } from 'react';
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

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('welcome');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [experiment, setExperiment] = useState<ExperimentState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          text: `${result.description}\n\nRevolt core initialized. I've configured the ${newExp.name}. ${mode === 'split' ? 'Real-time visualization is now active.' : 'I am standing by for deeper analysis.'}`,
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
    <div className="h-screen w-full bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {view === 'welcome' && (
        <WelcomeScreen onStart={startExperiment} />
      )}

      {view === 'loading' && (
        <NeutronStarLoading />
      )}

      {view === 'lab'