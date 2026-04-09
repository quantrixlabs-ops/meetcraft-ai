import React, { useState } from 'react';
import { KnowledgePackage, VideoData } from '../types';
import { generateAIVideo } from '../services/geminiService';
import { Video, Loader2, PlayCircle, AlertCircle } from 'lucide-react';
import { Card, Button } from './ui/Shared';

interface VideoGeneratorProps {
  data: KnowledgePackage;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const prompt = `Cinematic intro video for: ${data.meta.topic}. Industry: ${data.meta.industry}. Audience: ${data.meta.audience}. Professional, high resolution, 4k, drone shot style.`;
      const result = await generateAIVideo(prompt);
      
      // Since Veo API is mocked in our current architecture phase
      // We simulate the structure
      setVideo({
         id: 'mock_vid_' + Date.now(),
         url: result.url,
         prompt,
         createdAt: Date.now(),
         status: 'completed'
      });
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('501') || msg.includes('not supported') || msg.includes('Not Implemented')) {
        setError('Video generation is coming soon. This feature is not yet available.');
      } else {
        setError(msg || 'Video generation failed. Please try again later.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
             <Video className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-slate-900">Veo Video Studio</h2>
             <p className="text-slate-500">Generate cinema-quality intro videos for your presentation using Gemini Veo.</p>
           </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {!video && !isGenerating && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
             <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-700 mb-2">No Video Generated</h3>
             <p className="text-slate-500 mb-6">Create a unique video intro based on your research topic.</p>
             <Button onClick={handleGenerate} size="lg">
               Generate Intro (10 Credits)
             </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-20">
             <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-6" />
             <h3 className="text-xl font-bold text-slate-800">Rendering Video...</h3>
             <p className="text-slate-500">This may take up to 60 seconds.</p>
          </div>
        )}

        {video && !isGenerating && (
          <div className="space-y-6">
             <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                <video controls className="w-full h-full" poster="https://placehold.co/1280x720/1e1b4b/FFF?text=Veo+Preview">
                   <source src={video.url} type="video/mp4" />
                   Your browser does not support video.
                </video>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-xs text-slate-400 font-mono">ID: {video.id}</div>
                <Button onClick={handleGenerate} variant="secondary">Regenerate</Button>
             </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VideoGenerator;