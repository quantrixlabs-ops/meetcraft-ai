
import React from 'react';
import { Sparkles, LayoutGrid, Settings, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import { Button } from '../ui/Shared';

interface AppShellProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  onGoHome: () => void;
  onOpenSettings: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  sidebarContent, 
  headerContent, 
  onGoHome,
  onOpenSettings
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 font-bold text-slate-900" onClick={onGoHome}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span>MeetCraft</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 cursor-pointer" onClick={onGoHome}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-white tracking-tight">MeetCraft AI</span>
        </div>

        {/* Navigation Content (Injected) */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {sidebarContent || (
            <>
              <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workspace</div>
              <button onClick={onGoHome} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white">
                <LayoutGrid className="w-4 h-4 text-indigo-400" />
                Project Hub
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Header (Contextual) */}
        {headerContent && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
            {headerContent}
          </header>
        )}

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 scroll-smooth">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AppShell;
