import React, { useState } from 'react';
import { KnowledgePackage, Flashcard } from '../types';
import { generateFlashcards } from '../services/geminiService';
import { Layers, RotateCw, ArrowRight, ArrowLeft, Check, Play, RefreshCw } from 'lucide-react';

interface FlashcardViewProps {
  data: KnowledgePackage;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ data }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateFlashcards(data);
      setCards(result);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate flashcards.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % cards.length);
    }, 200);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
    }, 200);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (cards.length === 0 && !isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <Layers className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Master The Concepts</h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Convert key definitions and core concepts into interactive flashcards for active recall study.
        </p>
        <button 
          onClick={handleGenerate}
          className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2 mx-auto"
        >
          <Play className="w-5 h-5 fill-current" />
          Start Session
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
         <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
         <h3 className="text-xl font-bold text-slate-700">Synthesizing Cards...</h3>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col items-center justify-center pb-12">
      
      {/* Progress */}
      <div className="w-full max-w-lg mb-8 flex justify-between items-center text-slate-500 font-medium">
         <span>Card {currentIndex + 1} of {cards.length}</span>
         <span className="uppercase text-xs tracking-wider px-2 py-1 bg-slate-100 rounded text-slate-600 font-bold">
            {currentCard.category}
         </span>
      </div>

      {/* Card Scene */}
      <div className="relative w-full max-w-xl aspect-[3/2] perspective-1000 group cursor-pointer" onClick={handleFlip}>
         <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d shadow-2xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-12 text-center hover:border-indigo-300 transition-colors">
               <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Term</span>
               <h3 className="text-4xl font-black text-slate-800">{currentCard.term}</h3>
               <p className="text-slate-400 text-sm mt-8 absolute bottom-8">Tap to flip</p>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full backface-hidden bg-indigo-900 rounded-2xl border border-indigo-800 rotate-y-180 flex flex-col items-center justify-center p-12 text-center text-white">
               <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">Definition</span>
               <p className="text-xl font-medium leading-relaxed">{currentCard.definition}</p>
            </div>

         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mt-12">
         <button onClick={prevCard} className="p-4 rounded-full bg-white shadow hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
         </button>
         
         <button onClick={handleFlip} className="p-4 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200 text-white hover:bg-indigo-700 transition-transform hover:scale-105">
            <RotateCw className="w-6 h-6" />
         </button>

         <button onClick={nextCard} className="p-4 rounded-full bg-white shadow hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors">
            <ArrowRight className="w-6 h-6" />
         </button>
      </div>
      
      <button 
        onClick={handleGenerate}
        className="mt-12 text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-sm transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Regenerate Deck
      </button>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardView;
