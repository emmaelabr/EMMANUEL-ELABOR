
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LabScene from './components/LabScene';
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
    // Storing data points silently for context, though no graph is shown
    setExperiment(prev => {
      if (!prev) return null;
      const newData = [...prev.dataPoints, point].slice(-100);
      return { ...prev, dataPoints: newData };
    });
  }, []);

  return (
    <div className="h-screen w-full bg-black text-slate-200 overflow-hidden font-sans selection:bg-blue-5