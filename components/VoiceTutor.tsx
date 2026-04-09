import React, { useState, useEffect, useRef } from 'react';
import { KnowledgePackage } from '../types';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Card, Button } from './ui/Shared';

interface VoiceTutorProps {
  data: KnowledgePackage;
}

const VoiceTutor: React.FC<VoiceTutorProps> = ({ data }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    setStatus('Connecting...');
    
    // Connect to Backend WebSocket on the backend port (5001)
    // Vite proxy does not forward WebSocket upgrades for custom paths,
    // so we connect directly to the backend server.
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname + ':5001';
    const wsUrl = `${protocol}://${wsHost}/ws/live`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setStatus('Live');
      setIsActive(true);
      // Send context
      wsRef.current?.send(JSON.stringify({ 
          setup: { 
              context: `You are a tutor for: ${data.meta.topic}. ${data.overview.explanation}` 
          } 
      }));
    };

    wsRef.current.onclose = () => {
      setStatus('Disconnected');
      setIsActive(false);
    };

    wsRef.current.onerror = () => {
      setStatus('Error');
      setIsActive(false);
    };
  };

  const disconnect = () => {
    wsRef.current?.close();
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-12">
       <Card className="p-8 text-center relative overflow-hidden">
          {isActive && (
            <div className="absolute inset-0 bg-indigo-500/5 animate-pulse z-0"></div>
          )}
          
          <div className="relative z-10">
            <div className={`w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-xl shadow-indigo-400/50 scale-110' : 'bg-slate-100'}`}>
               <Mic className={`w-12 h-12 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-2">Gemini Live Tutor</h2>
            <p className="text-slate-500 mb-8">
              {isActive ? "Listening... Speak naturally." : "Start a real-time voice conversation about your topic."}
            </p>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-mono text-slate-500 mb-8">
               <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
               {status}
            </div>

            <div className="flex justify-center gap-4">
               {!isActive ? (
                 <Button onClick={connect} size="lg" className="px-12">
                   Start Session
                 </Button>
               ) : (
                 <Button onClick={disconnect} variant="danger" size="lg" className="px-12">
                   End Call
                 </Button>
               )}
            </div>
          </div>
       </Card>
    </div>
  );
};

export default VoiceTutor;