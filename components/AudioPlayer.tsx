import React, { useEffect, useState } from 'react';
import { BookChapter } from '../types';
import { ttsService, TTSState } from '../services/ttsService';
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';

interface AudioPlayerProps {
  chapters: BookChapter[];
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ chapters, onClose }) => {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    currentChapterIndex: 0,
    progress: 0,
    currentSentence: ""
  });

  useEffect(() => {
    // Initialize service
    ttsService.loadContent(chapters);
    
    // Subscribe to updates
    const unsubscribe = ttsService.subscribe((newState) => {
      setState(newState);
    });

    // Auto-start
    ttsService.play(0);

    return () => {
      ttsService.stop();
      unsubscribe();
    };
  }, [chapters]);

  const currentChapter = chapters[state.currentChapterIndex];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 shadow-2xl border-t border-slate-700 z-50 animate-in slide-in-from-bottom-10 audio-player-dock">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        
        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <span className="bg-indigo-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
               Audiobook Mode
             </span>
             <span className="text-xs text-slate-400">
               Chapter {state.currentChapterIndex + 1} of {chapters.length}
             </span>
          </div>
          <h4 className="font-bold truncate text-slate-100">{currentChapter?.title}</h4>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => ttsService.prev()}
              className="text-slate-400 hover:text-white transition-colors"
              disabled={state.currentChapterIndex === 0}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => ttsService.togglePlay()}
              className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {state.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
            </button>

            <button 
              onClick={() => ttsService.next()}
              className="text-slate-400 hover:text-white transition-colors"
              disabled={state.currentChapterIndex === chapters.length - 1}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full max-w-xs h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300 ease-linear"
              style={{ width: `${state.progress * 100}%` }}
            />
          </div>
        </div>

        {/* Close */}
        <div className="flex-1 flex justify-end">
           <button 
             onClick={onClose}
             className="p-2 hover:bg-slate-800 rounded-full transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

      </div>
    </div>
  );
};

export default AudioPlayer;