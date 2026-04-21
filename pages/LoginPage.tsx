import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { loginLocally } from '../contexts/AuthContext';
import { Sparkles, ArrowLeft, Database } from 'lucide-react';
import { Button, Input, Card } from '../components/ui/Shared';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!isSupabaseConfigured) {
       // Auto-redirect to local mode if they try to sign in normally
       loginLocally();
       return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link to="/" className="absolute top-8 left-8 text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/30">
             <Sparkles className="w-6 h-6" />
           </div>
           <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
           <p className="text-slate-500 mt-2">Sign in to your Enterprise Workspace</p>
        </div>

        <Card className="p-8 shadow-xl">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-100 flex items-start gap-3">
              <Database className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <strong>Offline / Local Mode Active</strong>
                <p className="mt-1 opacity-90">Supabase is not configured. Your data will be saved to your browser's local storage.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Email address" 
              type="email" 
              required={isSupabaseConfigured}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">Password</label>
              </div>
              <Input 
                type="password" 
                required={isSupabaseConfigured}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isSupabaseConfigured ? 'Sign In' : 'Enter Local Workspace'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account? <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold">Sign up</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;