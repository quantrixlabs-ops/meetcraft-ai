import React, { useState, useMemo } from 'react';
import { KnowledgePackage } from '../types';
import { Search, Clock, Trash2, ArrowRight, Grid, List, Sparkles, FileText, MonitorPlay, Calendar, Plus, BarChart3, PieChart, Activity } from 'lucide-react';
import { Button, Card, Input, Badge } from './ui/Shared';
import AppShell from './Layout/AppShell';

interface ProjectHubProps {
  projects: (KnowledgePackage & { id: string, createdAt: number })[];
  onSelect: (project: KnowledgePackage & { id: string }) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  onOpenSettings: () => void;
}

const ProjectHub: React.FC<ProjectHubProps> = ({ projects, onSelect, onDelete, onCreateNew, onOpenSettings }) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.meta.topic.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.meta.industry.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [projects, searchTerm]);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalMinutes = projects.reduce((acc, curr) => acc + curr.meta.duration, 0);
  const totalSlides = projects.reduce((acc, curr) => acc + curr.slides.length, 0);

  const Header = (
    <div className="w-full flex justify-between items-center">
      <h1 className="text-xl font-bold text-slate-800">Workspace</h1>
      <div className="flex items-center gap-3">
        <div className="hidden md:block w-64">
          <Input 
            placeholder="Search projects..." 
            icon={<Search className="w-4 h-4" />} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onCreateNew}>New Project</Button>
      </div>
    </div>
  );

  return (
    <AppShell onGoHome={() => {}} onOpenSettings={onOpenSettings} headerContent={Header}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* STATS OVERVIEW */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-enter">
             <Card className="p-6 flex items-center gap-4 border-l-4 border-l-indigo-600">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                   <FileText className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-sm text-slate-500 font-medium">Active Projects</p>
                   <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                </div>
             </Card>
             <Card className="p-6 flex items-center gap-4 border-l-4 border-l-violet-600">
                <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-violet-600">
                   <Activity className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-sm text-slate-500 font-medium">Research Hours</p>
                   <p className="text-2xl font-bold text-slate-900">{(totalMinutes / 60).toFixed(1)}h</p>
                </div>
             </Card>
             <Card className="p-6 flex items-center gap-4 border-l-4 border-l-emerald-600">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                   <MonitorPlay className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-sm text-slate-500 font-medium">Slides Generated</p>
                   <p className="text-2xl font-bold text-slate-900">{totalSlides}</p>
                </div>
             </Card>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Start your first research project</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Generate comprehensive textbooks, slides, and quizzes in seconds using Gemini AI.
            </p>
            <Button size="lg" onClick={onCreateNew}>Create Project</Button>
          </div>
        )}

        {/* Grid View */}
        {view === 'grid' && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-enter">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id}
                onClick={() => onSelect(project)}
                className="group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all h-[260px] flex flex-col relative"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="p-2 text-slate-400 hover:text-red-500 bg-white/50 backdrop-blur rounded-full">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <Badge variant="neutral">{project.meta.industry}</Badge>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {project.meta.topic}
                  </h3>
                  
                  <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">
                    {project.overview.explanation}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(project.createdAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {project.meta.duration}m</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {view === 'list' && projects.length > 0 && (
          <Card className="divide-y divide-slate-100">
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
                onClick={() => onSelect(project)}
                className="flex items-center p-4 hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-4">
                  <FileText className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0 mr-8">
                  <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{project.meta.topic}</h3>
                  <p className="text-sm text-slate-500 truncate">{project.meta.industry}</p>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm text-slate-500 mr-8">
                  <span className="flex items-center gap-1 w-24"><Calendar className="w-3 h-3" /> {formatDate(project.createdAt)}</span>
                  <span className="flex items-center gap-1 w-16"><Clock className="w-3 h-3" /> {project.meta.duration}m</span>
                  <span className="flex items-center gap-1 w-20"><MonitorPlay className="w-3 h-3" /> {project.slides.length} slides</span>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                  className="p-2 text-slate-300 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default ProjectHub;