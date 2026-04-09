import React, { useState } from 'react';
import { KnowledgePackage } from '../types';
import { ChevronLeft, ChevronRight, Presentation, MonitorPlay, Download, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { generateAIImage } from '../services/geminiService';

interface PresentationViewProps {
  data: KnowledgePackage;
}

const PresentationView: React.FC<PresentationViewProps> = ({ data }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideImages, setSlideImages] = useState<{[key: number]: string}>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Helper to parse bold markdown (**text**)
  const renderTextWithBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return (
      <>
        {parts.map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="font-bold text-inherit">{part}</strong> : part
        )}
      </>
    );
  };

  const titleSlide = {
      title: data.meta.topic,
      subtitle: data.meta.audience,
      type: 'title',
      bullets: [
        `${data.meta.industry}`,
        `${data.meta.duration} Minute Session`,
        new Date().toLocaleDateString()
      ],
      speakerNotes: `Welcome everyone. Today we are discussing ${data.meta.topic}.`,
      visualSuggestion: "High-impact title image related to the topic."
  };

  const agendaSlide = {
    title: "Meeting Agenda",
    type: 'agenda',
    bullets: data.agenda.map(item => `${item.time}m - ${item.section}`),
    speakerNotes: "Here is our roadmap for today's session.",
    visualSuggestion: "Timeline or list graphic."
  };

  const cleanContentSlides = data.slides.filter(s => {
    const t = s.title.toLowerCase();
    return !t.includes("agenda") && !t.includes("table of contents");
  });

  const finalDeck = [
    titleSlide,
    agendaSlide,
    ...cleanContentSlides,
    {
      title: "Q&A and Next Steps",
      type: 'end',
      bullets: ["Questions?", ...data.takeaways.nextSteps.slice(0, 2)],
      speakerNotes: "Open floor for questions.",
      visualSuggestion: "Minimalist icon or team photo."
    }
  ];

  const slide = finalDeck[currentSlide];

  const handleGenerateImage = async () => {
    if (isGeneratingImage || !slide.visualSuggestion) return;
    setIsGeneratingImage(true);
    try {
      // Use the visual suggestion or title as prompt
      const prompt = slide.visualSuggestion + ` Context: ${slide.title}`;
      const imageUrl = await generateAIImage(prompt);
      setSlideImages(prev => ({ ...prev, [currentSlide]: imageUrl }));
    } catch (e) {
      console.error("Image generation failed", e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < finalDeck.length - 1) setCurrentSlide(curr => curr + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
  };

  const getSlideStyle = (type: string) => {
    switch(type) {
      case 'title': return "bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white";
      case 'agenda': return "bg-white text-slate-900";
      case 'end': return "bg-slate-900 text-white";
      default: return "bg-gradient-to-br from-white to-slate-50 text-slate-900";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Presentation className="w-5 h-5 text-indigo-600" />
          Presentation Deck
        </h2>
        <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-mono">
            {currentSlide + 1} / {finalDeck.length}
            </span>
        </div>
      </div>

      <div className={`relative w-full aspect-video rounded-xl shadow-2xl overflow-hidden flex mb-6 transition-all duration-500 ${getSlideStyle(slide.type || 'content')}`}>
        
        {/* Layout: Split for Content Slides */}
        <div className={`flex flex-col flex-1 p-12 z-10 ${slide.type !== 'title' && slide.type !== 'end' ? 'w-2/3' : 'w-full items-center justify-center text-center'}`}>
           
           {/* Header */}
           <div className="mb-8 relative">
              {slide.type === 'agenda' && <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-2 block">Roadmap</span>}
              <h1 className={`font-bold leading-tight ${slide.type === 'title' ? 'text-6xl mb-4' : 'text-4xl'}`}>
                {renderTextWithBold(slide.title)}
              </h1>
              {slide.type === 'title' && <span className="block text-2xl font-light text-indigo-200 mt-4 opacity-90">{slide.bullets[0]}</span>}
              <div className={`h-1 w-24 mt-6 ${slide.type === 'title' || slide.type === 'end' ? 'bg-indigo-400 mx-auto' : 'bg-indigo-600'}`}></div>
           </div>

           {/* Bullets */}
           <ul className={`space-y-4 ${slide.type === 'title' ? 'hidden' : 'block'}`}>
            {slide.bullets.map((bullet, idx) => (
              <li key={idx} className={`flex items-start text-xl ${slide.type === 'end' ? 'justify-center text-indigo-100' : 'text-slate-700'}`}>
                 {slide.type !== 'title' && slide.type !== 'end' && (
                   <span className="mr-4 mt-2 w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                 )}
                 <span>{renderTextWithBold(bullet)}</span>
              </li>
            ))}
           </ul>
        </div>

        {/* Image Side (Content Slides Only) */}
        {slide.type !== 'title' && slide.type !== 'end' && (
           <div className="w-1/3 bg-slate-100 border-l border-slate-200 relative overflow-hidden group">
              {slideImages[currentSlide] ? (
                 <img src={slideImages[currentSlide]} alt="AI Generated" className="w-full h-full object-cover" />
              ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-xs text-slate-400 mb-4 font-mono">{slide.visualSuggestion}</p>
                    <button 
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                      {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>Generate Visual</span>
                    </button>
                 </div>
              )}
           </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-6 right-6 text-xs font-mono opacity-50">
          CONFIDENTIAL • {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-8 mb-8">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="p-3 rounded-full hover:bg-slate-200 bg-white shadow-sm border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <button
          onClick={nextSlide}
          disabled={currentSlide === finalDeck.length - 1}
          className="p-3 rounded-full hover:bg-slate-200 bg-white shadow-sm border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-slate-700" />
        </button>
      </div>

      {/* Notes */}
      <div className="bg-slate-800 text-slate-200 p-6 rounded-xl shadow-inner">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Speaker Notes</h3>
          <p className="text-lg leading-relaxed font-serif">{renderTextWithBold(slide.speakerNotes)}</p>
      </div>
    </div>
  );
};

export default PresentationView;