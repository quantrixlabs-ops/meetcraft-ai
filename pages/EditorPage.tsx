
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import Dashboard from '../components/Dashboard';
import { KnowledgePackage } from '../types';
import { Loader2, AlertTriangle } from 'lucide-react';
import AppShell from '../components/Layout/AppShell';

type ProjectRecord = KnowledgePackage & { id: string, createdAt: number };

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      try {
        const project = await storageService.getPackage(id);
        if (project) {
          setData(project);
        } else {
          setError("Project not found");
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id]);

  const handleUpdate = async (newData: KnowledgePackage) => {
    if (id) {
      await storageService.updatePackage(id, newData);
      // Optimistic update
      setData(prev => prev ? { ...newData, id: prev.id, createdAt: prev.createdAt } : null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading Workspace...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{error || "Project Not Found"}</h2>
        <button 
          onClick={() => navigate('/app')}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <Dashboard 
      data={data} 
      onBack={() => navigate('/app')}
      onUpdate={handleUpdate}
    />
  );
};

export default EditorPage;
