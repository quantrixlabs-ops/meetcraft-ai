import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Circle, BrainCircuit, FileText, Layout, Search } from 'lucide-react';

const STEPS = [
  { id: 'init', label: 'Initializing Context', icon: BrainCircuit, duration: 2000 },
  { id: 'research', label: 'Deep Research & Analysis', icon: Search, duration: 8000 },
  { id: 'draft', label: 'Drafting Content Chapters', icon: FileText, duration: 15000 },
  { id: 'visuals', label: 'Generating Slides & Visuals', icon: Layout, duration: 5000 },
];

export const GenerationProgress = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const advance = (step: number) => {
      if (step >= STEPS.length) return;
      setCurrentStep(step);
      timeout = setTimeout(() => advance(step + 1), STEPS[step].duration);
    };

    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-xl mx-auto px-6">
       <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-2xl"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-2xl border-t-transparent animate-spin"></div>
            <BrainCircuit className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {currentStep < STEPS.length ? STEPS[currentStep].label : 'Finalizing...'}
          </h2>
          <p className="text-slate-500">
            Orchestrating AI agents to build your knowledge package.
          </p>
       </div>

       <div className="w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <div key={step.id} className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'scale-105' : 'opacity-60'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                  isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 
                  'bg-white border-slate-200 text-slate-300'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Circle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-sm ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</h4>
                </div>
              </div>
            );
          })}
       </div>
    </div>
  );
};