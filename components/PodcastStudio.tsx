import React, { useState } from 'react';
import { KnowledgePackage, PodcastData } from '../types';
import { generatePodcast } from '../services/geminiService';
import { Radio, Loader2, Play, Pause, AlertCircle } from 'lucide-react';
import { Card, Button } from './ui/Shared';

interface PodcastStudioProps {
  data: KnowledgePackage;
}

const PodcastStudio: React.FC<PodcastStudioProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [podcast, setPodcast] = useState<PodcastData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generatePodcast(data.meta.topic, data.overview.explanation);

      const audioUrl = `data:audio/mp3;base64,${result.audioUrl}`;
      setPodcast({
         id: 'pod_' + Date.now(),
         audioUrl,
         script: result.script || "Audio generated.",
         createdAt: Date.now()
      });

      const newAudio = new Audio(audioUrl);
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);

    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('501') || msg.includes('not supported') || msg.includes('Not Implemented')) {
        setError('Podcast generation is coming soon. This feature is not yet available.');
      } else {
        setError(msg || 'Podcast generation failed. Please try again later.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
             <Radio className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-slate-900">Neural Podcast Studio</h2>
             <p className="text-slate-500">Convert your research into a 2-person dialogue podcast.</p>
           </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {!podcast && !isGenerating && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
             <Radio className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-700 mb-2">No Episode Created</h3>
             <p className="text-slate-500 mb-6">Generate an engaging audio summary featuring two AI hosts.</p>
             <Button onClick={handleGenerate} size="lg">
               Generate Episode (20 Credits)
             </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-20">
             <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-6" />
             <h3 className="text-xl font-bold text-slate-800">Recording Session...</h3>
             <p className="text-slate-500">Synthesizing neural voices. This takes ~30 seconds.</p>
          </div>
        )}

        {podcast && !isGenerating && (
          <div className="bg-slate-900 rounded-2xl p-8 text-white flex items-center justify-between shadow-xl">
             <div className="flex items-center gap-6">
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
                <div>
                   <h3 className="font-bold text-lg">{data.meta.topic}</h3>
                   <p className="text-indigo-300 text-sm">Hosted by Alex & Jamie</p>
                </div>
             </div>
             
             <div className="hidden md:flex gap-2">
                 {[1,2,3,4,5,4,3,2,1,2,3,4,5].map((h, i) => (
                    <div key={i} className={`w-1bg-indigo-500 rounded-full animate-pulse`} style={{ height: h * 4 + 'px', width: '4px', animationDelay: i * 0.1 + 's' }}></div>
                 ))}
             </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PodcastStudio;