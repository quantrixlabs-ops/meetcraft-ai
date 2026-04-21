
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import ProjectHub from '../components/ProjectHub';
import { KnowledgePackage, UserInput } from '../types';
import Form from '../components/Form';
import AppShell from '../components/Layout/AppShell';
import { generateKnowledgePackage } from '../services/geminiService';
import { Loader2 } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';

type ProjectRecord = KnowledgePackage & { id: string, createdAt: number };

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [view, setView] = useState<'hub' | 'create'>('hub');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    // Migration check implicit in App init usually, but good to be safe
    await storageService.migrateFromLocalStorage(); 
    const all = await storageService.getAllPackages();
    setProjects(all);
    if (all.length === 0) setView('create');
  };

  const handleCreate = async (input: UserInput) => {
    setIsGenerating(true);
    try {
      const data = await generateKnowledgePackage(input);
      const id = await storageService.savePackage(data);
      navigate(`/app/${id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to create project. Please check API Key.");
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      await storageService.deletePackage(id);
      await loadProjects();
    }
  };

  if (isGenerating) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-2xl animate-pulse">✨</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Topic...</h2>
          <p className="text-slate-500 max-w-md text-center px-4">
            Our AI experts are researching content and designing slides. This typically takes 30-45 seconds.
          </p>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
        {projects.length > 0 && (
          <button 
            onClick={() => setView('hub')}
            className="absolute top-6 left-6 z-20 text-white/70 hover:text-white font-medium flex items-center gap-2"
          >
            ← Back to Hub
          </button>
        )}
        <div className="relative z-10 w-full max-w-3xl mx-auto">
          <Form onSubmit={handleCreate} isGenerating={false} />
        </div>
      </div>
    );
  }

  return (
    <>
      <ProjectHub 
        projects={projects}
        onSelect={(p) => navigate(`/app/${p.id}`)}
        onDelete={handleDelete}
        onCreateNew={() => setView('create')}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default WorkspacePage;
