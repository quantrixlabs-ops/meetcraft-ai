import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { ApiKey } from '../types';
import { listApiKeys, saveApiKey, deleteApiKey } from '../services/geminiService';
import { Input, Button, Badge } from './ui/Shared';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Provider config ──────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: 'auto',      label: '✨ Auto-Detect (Recommended)', placeholder: 'Paste any API key — provider detected automatically', prefix: '',       color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500'  },
  { id: 'google',      label: 'Google Gemini',    placeholder: 'Paste Gemini API Key (AIza...)',        prefix: 'AIza',    color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  { id: 'anthropic',   label: 'Anthropic Claude',  placeholder: 'Paste Claude API Key (sk-ant-...)',     prefix: 'sk-ant-', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { id: 'openai',      label: 'OpenAI',            placeholder: 'Paste OpenAI API Key (sk-...)',         prefix: 'sk-',     color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  { id: 'openrouter',  label: 'OpenRouter',        placeholder: 'Paste OpenRouter API Key (sk-or-...)', prefix: 'sk-or-',  color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { id: 'perplexity',  label: 'Perplexity',        placeholder: 'Paste Perplexity API Key (pplx-...)',  prefix: 'pplx-',   color: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-500'   },
  { id: 'groq',        label: 'Groq',              placeholder: 'Paste Groq API Key (gsk_...)',          prefix: 'gsk_',    color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
] as const;

type ProviderId = typeof PROVIDERS[number]['id'];

function getProviderConfig(id: string) {
  return PROVIDERS.find(p => p.id === id) ?? PROVIDERS[0];
}

function validateKeyPrefix(provider: string, key: string): string | null {
  // Skip validation when auto-detect is selected
  if (provider === 'auto') return null;
  const cfg = getProviderConfig(provider);
  // openai & openrouter share 'sk-' prefix — only check after disambiguating
  if (provider === 'openai' && key.startsWith('sk-ant-')) return 'That looks like an Anthropic key. Use Auto-Detect or select "Anthropic Claude".';
  if (provider === 'openai' && key.startsWith('sk-or-'))  return 'That looks like an OpenRouter key. Use Auto-Detect or select "OpenRouter".';
  if (provider === 'anthropic' && !key.startsWith('sk-ant-')) return 'Anthropic keys must start with sk-ant-';
  if (provider === 'google'    && !key.startsWith('AIza'))    return 'Gemini keys must start with AIza';
  if (provider === 'openrouter' && !key.startsWith('sk-or-') && !key.startsWith('sk-')) return 'OpenRouter keys must start with sk-or- or sk-';
  if (provider === 'perplexity' && !key.startsWith('pplx-') && !key.startsWith('sk-')) return null;
  if (provider === 'groq'       && !key.startsWith('gsk_'))  return 'Groq keys must start with gsk_';
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'keys'>('general');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New Key Form
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('auto');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadKeys();
    }
  }, [isOpen]);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;

    // Client-side prefix validation
    const prefixError = validateKeyPrefix(selectedProvider, newKey.trim());
    if (prefixError) {
      setError(prefixError);
      return;
    }
    
    setIsAdding(true);
    setError('');
    
    try {
      const cfg = getProviderConfig(selectedProvider);
      const autoLabel = newLabel || `${cfg.label} Key`;
      await saveApiKey(selectedProvider, newKey.trim(), autoLabel);
      setNewKey('');
      setNewLabel('');
      await loadKeys();
    } catch (e: any) {
      setError(e.message || "Failed to save key");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this key?")) {
       try {
         await deleteApiKey(id);
         await loadKeys();
       } catch (e) {
         console.error(e);
       }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800">Settings</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTab('keys')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'keys' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
            >
              AI Providers & Keys
            </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
           {activeTab === 'general' && (
             <div>
               <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                 Appearance
               </label>
               <div className="grid grid-cols-2 gap-3 mb-6">
                 <button className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-indigo-600 bg-indigo-50 text-indigo-700 font-medium">
                   Light Mode
                 </button>
                 <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" disabled>
                   Dark Mode
                 </button>
               </div>
               <p className="text-xs text-slate-400">Application Version: 1.4.2</p>
             </div>
           )}

           {activeTab === 'keys' && (
             <div className="space-y-6">
               <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <h3 className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    Bring Your Own Key (BYOK)
                  </h3>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Add your personal API keys to bypass platform rate limits and use your own billing quotas. Keys are encrypted (AES-256) and stored securely.
                  </p>
               </div>

               {/* Active Keys List */}
               <div className="space-y-3">
                 <h4 className="text-sm font-bold text-slate-700">Your Keys</h4>
                 {isLoading && <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" />}
                 
                 {!isLoading && keys.length === 0 && (
                   <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                      <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No custom keys found.</p>
                      <p className="text-xs text-slate-400">Using Platform Shared Quota.</p>
                   </div>
                 )}

                 {keys.map((k) => {
                   const cfg = getProviderConfig(k.provider);
                   return (
                     <div key={k.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded flex items-center justify-center ${cfg.color}`}>
                             <ShieldCheck className="w-4 h-4" />
                           </div>
                           <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                 <span className="font-bold text-sm text-slate-800">{k.label}</span>
                                 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                                   {cfg.label}
                                 </span>
                                 {k.isActive && <Badge variant="success">Active</Badge>}
                              </div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                 ••••••{k.keyMask}
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(k.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   );
                 })}
               </div>

               <div className="h-px bg-slate-100 my-4"></div>

               {/* Add New Key */}
               <form onSubmit={handleSaveKey} className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">Add New Key</h4>
                  
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  {/* Provider Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Provider</label>
                    <div className="grid grid-cols-1 gap-1">
                      <select
                        value={selectedProvider}
                        onChange={(e) => {
                          setSelectedProvider(e.target.value as ProviderId);
                          setError('');
                          setNewKey('');
                        }}
                        className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 font-medium cursor-pointer"
                      >
                        {PROVIDERS.map(p => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Provider hint pill */}
                    <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full mt-1 ${getProviderConfig(selectedProvider).color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getProviderConfig(selectedProvider).dot}`}></span>
                      {getProviderConfig(selectedProvider).label}
                    </div>
                  </div>

                  <Input 
                    placeholder="Key Label (optional — auto-filled if blank)" 
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                  
                  <div className="relative">
                    <Input 
                       type="password"
                       placeholder={getProviderConfig(selectedProvider).placeholder}
                       value={newKey}
                       onChange={(e) => { setNewKey(e.target.value); setError(''); }}
                       icon={<Key className="w-4 h-4" />}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    isLoading={isAdding}
                    disabled={!newKey || isAdding}
                  >
                    <Plus className="w-4 h-4" /> Encrypt & Save Key
                  </Button>
               </form>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;