
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LabScene from './components/LabScene';
import DataVisualizer from './components/DataVisualizer';
import { ExperimentState, ChatMessage, GroundingSource } from './types';
import { getExperimentLogic, chatWithLabAssistant } from './services/geminiService';
import { FlaskConical, Search } from 'lucide-react';

const App: React.FC = () => {
  const [experiment, setExperiment] = useState<ExperimentState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Welcome to Revolt Lab! I am your AI research assistant. Describe an experiment you\'d like to conduct, or ask me about physics and chemistry concepts.' }
  ]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [promptValue, setPromptValue] = useState('');

  const handleStartExperiment = async (text: string) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'user', text }]);
    
    try {
      const result = await getExperimentLogic(text);
      
      const newExp: ExperimentState = {
        id: Date.now().toString(),
        name: result.setup.name || 'Custom Experiment',
        type: result.setup.type as 'physics' | 'chemistry' || 'physics',
        description: result.description,
        parameters: result.setup.parameters || {},
        apparatus: result.setup.apparatus as any || [],
        dataPoints: [],
        status: 'idle',
      };

      setExperiment(newExp);
      setSources(result.sources || []);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `Experiment initialized: ${newExp.name}. I've set up the apparatus. You can adjust parameters like ${Object.keys(newExp.parameters).join(', ')} in the control panel.` 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I had trouble setting up that experiment. Could you try rephrasing?' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChat = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    
    try {
      // Check if user is asking for a new experiment
      if (text.toLowerCase().includes('simulate') || text.toLowerCase().includes('experiment') || text.toLowerCase().includes('start')) {
        await handleStartExperiment(text);
        return;
      }

      const reply = await chatWithLabAssistant([], text);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'I encountered an error while thinking. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleUpdateParameters = (newParams: Record<string, number>) => {
    if (!experiment) return;
    setExperiment({
      ...experiment,
      parameters: { ...experiment.parameters, ...newParams },
      dataPoints: [] // Reset data on param change
    });
  };

  const handleDataUpdate = useCallback((point: { x: number; y: number }) => {
    setExperiment(prev => {
      if (!prev) return null;
      // Keep only last 100 points for performance
      const newData = [...prev.dataPoints, point].slice(-100);
      return { ...prev, dataPoints: newData };
    });
  }, []);

  const resetLab = () => {
    setExperiment(null);
    setSources([]);
    setPromptValue('');
  };

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden">
      <Sidebar 
        onNewExperiment={resetLab} 
        onSelectSaved={(id) => handleStartExperiment(`Load experiment ${id}`)} 
      />
      
      <main className="flex-1 flex flex-col relative">
        {/* Top Header */}
        {!experiment && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none p-4">
            <div className="pointer-events-auto bg-[#1e293b]/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-2xl w-full text-center">
              <FlaskConical className="text-blue-500 mx-auto mb-4" size={48} />
              <h1 className="text-4xl font-bold text-white mb-2">Welcome to Revolt Lab</h1>
              <p className="text-slate-400 mb-8">Your intelligent sandbox for physics and chemistry.</p>
              
              <div className="relative group">
                <input
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartExperiment(promptValue)}
                  placeholder="Enter an experiment (e.g., 'A titration curve of HCl and NaOH')"
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 pl-6 pr-14 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all shadow-lg"
                />
                <button 
                  onClick={() => handleStartExperiment(promptValue)}
                  className="absolute right-3 top-3 p-2 bg-blue-600 rounded-xl hover:bg-blue-500 transition-all group-hover:scale-105"
                >
                  <Search size={24} />
                </button>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['Double Pendulum', 'Titration pH', 'Free Fall', 'Projectile Motion'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => handleStartExperiment(tag)}
                    className="px-4 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-xs font-medium transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Interface */}
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleChat} 
            sources={sources}
            isTyping={isTyping}
          />
          
          {/* 3D Scene */}
          <LabScene 
            experiment={experiment} 
            onUpdateParameters={handleUpdateParameters}
            onDataUpdate={handleDataUpdate}
          />
          
          {/* Right Data Plot */}
          <DataVisualizer experiment={experiment} />
        </div>
      </main>
    </div>
  );
};

export default App;
