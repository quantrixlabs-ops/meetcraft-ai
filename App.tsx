import React, { useState, useEffect } from 'react';
import Form from './components/Form';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { ErrorProvider } from './context/ErrorContext';
import ErrorAlert from './components/Alerts/ErrorAlert';
import SuccessAlert from './components/Alerts/SuccessAlert';
import WarningAlert from './components/Alerts/WarningAlert';
import InfoAlert from './components/Alerts/InfoAlert';
import { AuthProvider } from './contexts/AuthContext';
import SettingsModal from './components/SettingsModal';
import { generateKnowledgePackage } from './services/geminiService';
import { KnowledgePackage, UserInput } from './types';
import { Sparkles, AlertTriangle, CloudOff, X, RefreshCw, Settings, Moon, Sun } from 'lucide-react';
import { GenerationProgress } from './components/GenerationProgress';
import { useTheme, ThemeProvider } from './context/ThemeContext';

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
  dismissible: boolean;
  retryable: boolean;
  timestamp: number;
}

const mapErrorToMessage = (error: any): ErrorState => {
  const message = error.message || "An unexpected error occurred";
  let code = 'UNKNOWN';
  let type: 'error' | 'warning' | 'info' = 'error';
  let dismissible = true;
  let retryable = true;

  // Check for specific error patterns
  if (message.includes("401") || message.includes("Unauthorized") || message.includes("Session expired")) {
    return {
      message: "Your session has expired. Please refresh the page to log in again.",
      type: 'error',
      code: '401',
      dismissible: true,
      retryable: false,
      timestamp: Date.now()
    };
  }

  if (message.includes("403") || message.includes("Forbidden")) {
    return {
      message: "You don't have permission to perform this action. Please check your account settings.",
      type: 'error',
      code: '403',
      dismissible: true,
      retryable: false,
      timestamp: Date.now()
    };
  }

  if (message.includes("400") || message.includes("Invalid input") || message.includes("validation")) {
    // Show backend's specific error message if available
    let userMessage = "Invalid input provided. Please check your form and try again.";
    if (error && typeof error === 'object' && 'response' in error) {
      const backendMsg = error.response?.data?.message || error.response?.data?.error || error.response?.data;
      if (typeof backendMsg === 'string' && backendMsg.length < 200) {
        userMessage = backendMsg;
      }
      // eslint-disable-next-line no-console
      console.warn('400 Error Details:', backendMsg || error);
    }
    return {
      message: userMessage,
      type: 'warning',
      code: '400',
      dismissible: true,
      retryable: true,
      timestamp: Date.now()
    };
  }

  if (message.includes("500") || message.includes("ApiError")) {
    return {
      message: "Server error occurred. Please try again in a moment.",
      type: 'error',
      code: '500',
      dismissible: true,
      retryable: true,
      timestamp: Date.now()
    };
  }

  if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("ECONNREFUSED")) {
    return {
      message: "Cannot connect to the server. Please check your internet connection and ensure the server is running.",
      type: 'error',
      code: 'NETWORK_ERROR',
      dismissible: true,
      retryable: true,
      timestamp: Date.now()
    };
  }

  if (message.includes("timeout") || message.includes("TIMEOUT")) {
    return {
      message: "Request timed out. The server took too long to respond. Please try again.",
      type: 'warning',
      code: 'TIMEOUT',
      dismissible: true,
      retryable: true,
      timestamp: Date.now()
    };
  }

  return {
    message,
    type: 'error',
    code,
    dismissible: true,
    retryable: true,
    timestamp: Date.now()
  };
};

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<'form' | 'loading' | 'dashboard'>('form');
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useState<KnowledgePackage | null>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFormInput, setLastFormInput] = useState<UserInput | null>(null);
  const MAX_RETRIES = 3;

  // Auto-dismiss non-critical errors after 8 seconds
  useEffect(() => {
    if (!errorState || !errorState.dismissible || errorState.type === 'error') {
      return;
    }

    const timer = setTimeout(() => {
      setErrorState(null);
    }, 8000);

    return () => clearTimeout(timer);
  }, [errorState]);

  const handleCreate = async (input: UserInput) => {
    setView('loading');
    setErrorState(null);
    setIsGenerating(true);
    setLastFormInput(input);
    setRetryCount(0);

    try {
      console.log(`🚀 Starting knowledge package generation for topic: "${input.topic}"`);
      const result = await generateKnowledgePackage(input);
      setData(result);
      setView('dashboard');
      setErrorState(null);
      console.log('✅ Knowledge package generated successfully');
    } catch (e: any) {
      console.error('❌ Error during generation:', e);
      const mappedError = mapErrorToMessage(e);
      setErrorState(mappedError);
      setView('form');
      setIsGenerating(false);
    }
  };

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      setErrorState({
        message: `Maximum retry attempts (${MAX_RETRIES}) reached. Please check your input and try again.`,
        type: 'error',
        code: 'MAX_RETRIES',
        dismissible: true,
        retryable: false,
        timestamp: Date.now()
      });
      return;
    }

    if (!lastFormInput) {
      return;
    }

    setRetryCount(prev => prev + 1);
    console.log(`🔄 Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
    await handleCreate(lastFormInput);
  };

  const handleDismissError = () => {
    setErrorState(null);
  };

  const handleReset = () => {
    setData(null);
    setView('form');
    setErrorState(null);
    setIsGenerating(false);
    setRetryCount(0);
    setLastFormInput(null);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
        
        {/* Simple Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xl cursor-pointer" onClick={handleReset}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              MeetCraft AI
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                 <CloudOff className="w-3 h-3" />
                 Local / Offline Mode Active
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                title="Settings & API Keys"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-8">
          
          {errorState && (
            <div className={`max-w-3xl mx-auto mb-6 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 border ${
              errorState.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
              errorState.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
               <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
               <div className="flex-1">
                 <p className="font-medium">{errorState.message}</p>
                 {errorState.code && <p className="text-xs opacity-75 mt-1">Error Code: {errorState.code}</p>}
               </div>
               <div className="flex gap-2 shrink-0">
                 {errorState.retryable && retryCount < MAX_RETRIES && (
                   <button
                     onClick={handleRetry}
                     className="px-3 py-1 bg-current opacity-20 hover:opacity-30 rounded transition-all text-sm font-medium flex items-center gap-1"
                   >
                     <RefreshCw className="w-3 h-3" /> Retry
                   </button>
                 )}
                 {errorState.dismissible && (
                   <button
                     onClick={handleDismissError}
                     className="p-1 opacity-50 hover:opacity-75 transition-opacity"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 )}
               </div>
            </div>
          )}

          {view === 'form' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-12">
                   <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">What do you want to learn?</h1>
                   <p className="text-lg text-slate-500">
                     Generate professional textbooks, slides, and quizzes instantly.
                   </p>
                </div>
                <Form onSubmit={handleCreate} isGenerating={isGenerating} onOpenSettings={() => setShowSettings(true)} />
             </div>
          )}

          {view === 'loading' && (
             <div className="animate-in zoom-in-95 duration-500">
                <GenerationProgress />
            </div>
          )}

          {view === 'dashboard' && data && (
            <div className="animate-in fade-in duration-500">
              <Dashboard 
                data={data} 
                onBack={handleReset} 
              />
            </div>
          )}

        </main>
      </div>

      {/* Global Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </ErrorBoundary>
  );
};


const App: React.FC = () => {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <ErrorAlert />
            <SuccessAlert />
            <WarningAlert />
            <InfoAlert />
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ErrorProvider>
  );
};

export default App;