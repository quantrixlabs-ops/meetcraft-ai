
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, BrainCircuit, Globe, Layers, ShieldCheck, PlayCircle } from 'lucide-react';
import { Button } from '../components/ui/Shared';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-xl">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            MeetCraft AI
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign In</Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8">
            <Zap className="w-3 h-3" /> New: Enterprise Team Features
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            Turn Chaos Into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Structured Knowledge</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered workspace that transforms complex topics into comprehensive textbooks, presentation slides, quizzes, and interactive flashcards in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-indigo-500/20">
                Start Creating for Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <button className="flex items-center gap-2 text-slate-600 font-medium px-6 py-4 rounded-lg hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-200">
              <PlayCircle className="w-5 h-5 text-indigo-600" /> Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Complete Learning Ecosystem</h2>
            <p className="text-slate-500">Everything you need to master a new domain, instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Deep Research", desc: "Generates 8-chapter textbooks with academic rigor and citations." },
              { icon: Layers, title: "Instant Slides", desc: "Creates professional PowerPoint decks with speaker notes and visuals." },
              { icon: BrainCircuit, title: "AI Tutor", desc: "Chat with your content. Ask questions, get definitions, and roleplay scenarios." },
              { icon: ShieldCheck, title: "Interactive Quizzes", desc: "Auto-generated exams to test retention and understanding." },
              { icon: Sparkles, title: "Flashcard Decks", desc: "Spaced repetition study sets created automatically from core concepts." },
              { icon: Zap, title: "Live Audio", desc: "Listen to your content on the go with neural text-to-speech." }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:bg-white transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-6 text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-white text-xl mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              MeetCraft
            </div>
            <p className="text-sm">Building the future of automated learning and knowledge management.</p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
            </ul>
          </div>
          
          <div>
             <h4 className="text-white font-bold mb-6">Resources</h4>
             <ul className="space-y-4 text-sm">
               <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
               <li><a href="#" className="hover:text-white transition-colors">API</a></li>
               <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
             </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
