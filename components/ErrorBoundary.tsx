import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorStack: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorStack: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorStack: error.stack || null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔴 CRITICAL ERROR CAUGHT:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    console.error("Full Error Details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorStack: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-500 max-w-md mb-4">
            Our systems encountered an unexpected error. This has been logged for investigation.
          </p>
          {this.state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mb-8 text-left">
              <p className="text-sm font-mono text-red-700 wrap-break-word">
                {this.state.error.message}
              </p>
            </div>
          )}
          <div className="flex gap-4">
            <button 
              onClick={this.handleReset}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Go Home
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;