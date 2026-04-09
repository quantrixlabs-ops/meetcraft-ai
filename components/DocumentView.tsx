import React, { useEffect, useState } from 'react';
import { KnowledgePackage } from '../types';
import { Theme } from '../themes';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { ExternalLink, Box, BookOpen, List, Sparkles, Globe, FileText, ChevronRight } from 'lucide-react';
import { Badge, Card } from './ui/Shared';

interface DocumentViewProps {
  data: KnowledgePackage;
  theme: Theme;
}

const DocumentView: React.FC<DocumentViewProps> = ({ data, theme }) => {
  const [activeChapter, setActiveChapter] = useState<number | null>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
    setTimeout(() => {
      mermaid.contentLoaded();
    }, 500);
  }, [data]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      
      {/* LEFT SIDEBAR - NAVIGATION */}
      <div className="hidden lg:block w-64 shrink-0">
         <div className="sticky top-24 space-y-6">
            <Card className="p-4 shadow-sm border-slate-200">
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                 <List className="w-3 h-3" /> Table of Contents
               </h3>
               <nav className="space-y-1">
                 <button 
                   onClick={() => scrollToSection('exec-summary')}
                   className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors"
                 >
                   Executive Summary
                 </button>
                 {data.bookChapters.map((chapter, idx) => (
                   <button
                     key={idx}
                     onClick={() => {
                        scrollToSection(`chapter-${idx}`);
                        setActiveChapter(idx);
                     }}
                     className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex justify-between items-center group ${activeChapter === idx ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                   >
                     <span className="truncate">{chapter.title.split(':')[0]}</span>
                     {activeChapter === idx && <ChevronRight className="w-3 h-3" />}
                   </button>
                 ))}
                 <button 
                   onClick={() => scrollToSection('references')}
                   className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors"
                 >
                   References
                 </button>
               </nav>
            </Card>

            <div className="p-4 bg-indigo-900 rounded-xl text-white">
               <h4 className="font-bold text-sm mb-1">{data.meta.topic}</h4>
               <p className="text-xs text-indigo-300 mb-3">{data.meta.industry}</p>
               <div className="flex items-center gap-2 text-xs opacity-70">
                 <BookOpen className="w-3 h-3" />
                 <span>{data.bookChapters.length} Chapters</span>
               </div>
            </div>
         </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0">
        
        {/* EXECUTIVE SUMMARY */}
        <section id="exec-summary" className="mb-12 scroll-mt-24">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-indigo-600" />
             </div>
             
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-6">
                  <Badge variant="ai">AI Generated</Badge>
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Executive Brief</span>
               </div>
               
               <h1 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                 {data.meta.topic}
               </h1>
               
               <div className="prose prose-lg text-slate-600 max-w-none">
                 <p className="lead">{data.overview.explanation}</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Primary Objective</h3>
                       <p className="text-slate-800 font-medium m-0">{data.overview.purpose}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Strategic Relevance</h3>
                       <p className="text-slate-800 font-medium m-0">{data.overview.relevance}</p>
                    </div>
                 </div>
               </div>
             </div>
          </div>
        </section>

        {/* CHAPTERS */}
        <div className="space-y-12">
          {data.bookChapters.map((chapter, idx) => (
            <section key={idx} id={`chapter-${idx}`} className="scroll-mt-24">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12">
                  <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
                     <div>
                        <span className="text-indigo-600 font-bold tracking-wider text-sm uppercase mb-1 block">Chapter {idx + 1}</span>
                        <h2 className="text-3xl font-bold text-slate-900">{chapter.title.replace(/^Chapter \d+:?\s*/i, '')}</h2>
                     </div>
                     <Badge variant="neutral">
                       <FileText className="w-3 h-3 mr-1" />
                       Content
                     </Badge>
                  </div>

                  {chapter.diagram && (
                    <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                       <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <Box className="w-4 h-4" /> Concept Visualizer
                       </div>
                       <div className="mermaid flex justify-center">{chapter.diagram}</div>
                    </div>
                  )}

                  <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed">
                    <ReactMarkdown 
                      components={{
                        h1: ({node, ...props}) => <h3 className="text-xl mt-8 mb-4" {...props} />,
                        h2: ({node, ...props}) => <h4 className="text-lg mt-6 mb-3" {...props} />,
                      }}
                    >
                      {chapter.content}
                    </ReactMarkdown>
                  </div>
               </div>
            </section>
          ))}
        </div>

        {/* REFERENCES */}
        {data.sources && data.sources.length > 0 && (
          <section id="references" className="mt-12 scroll-mt-24">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Globe className="w-5 h-5 text-indigo-600" />
                   References & Citations
                </h2>
                <div className="grid grid-cols-1 gap-3">
                   {data.sources.map((source, i) => (
                     <a 
                       key={i} 
                       href={source.uri} 
                       target="_blank" 
                       rel="noreferrer"
                       className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-indigo-200 transition-all group"
                     >
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-mono group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                           {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{source.title}</div>
                           <div className="text-xs text-slate-400 truncate">{source.uri}</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                     </a>
                   ))}
                </div>
             </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DocumentView;