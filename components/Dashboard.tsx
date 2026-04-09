import React, { useState } from 'react';
import { KnowledgePackage, DashboardTab } from '../types';
import { THEMES, ThemeId } from '../themes';
import DocumentView from './DocumentView';
import SpreadsheetView from './SpreadsheetView';
import PresentationView from './PresentationView';
import ChatView from './ChatView';
import QuizView from './QuizView';
import FlashcardView from './FlashcardView';
import AudioPlayer from './AudioPlayer';
import VoiceTutor from './VoiceTutor';
import VideoGenerator from './VideoGenerator';
import PodcastStudio from './PodcastStudio';
import SettingsModal from './SettingsModal';
import { generatePowerPoint } from '../services/pptxService';
import { exportAsDocx, exportAsPdf, exportAsXlsx, exportAsPptxServer, exportAll } from '../services/geminiService';
import { Monitor, Table, ArrowLeft, BookOpen, Download, Headphones, Printer, MessageCircle, Mic, Video, Radio, Palette, Settings, FileText, Sheet, AlertTriangle, X, Moon, Sun, Archive } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  data: KnowledgePackage;
  onBack: () => void;
  onUpdate?: (data: KnowledgePackage) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onBack }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardTab>('doc');
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>('corporate');
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState<null | 'export' | 'theme'>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const currentTheme = THEMES[currentThemeId];

  const handleExport = async (format: 'pptx' | 'pptx-server' | 'pdf-print' | 'pdf-server' | 'docx' | 'xlsx' | 'all') => {
    if (isExporting) return;
    setActiveMenu(null);
    setIsExporting(true);
    setExportingFormat(format);
    setExportError(null);
    console.log('Exporting:', format);
    try {
      switch (format) {
        case 'pptx':        await generatePowerPoint(data); break;
        case 'pptx-server': await exportAsPptxServer(data); break;
        case 'pdf-server':  await exportAsPdf(data); break;
        case 'pdf-print':   setActiveTab('doc'); setTimeout(() => window.print(), 500); break;
        case 'docx':        await exportAsDocx(data); break;
        case 'xlsx':        await exportAsXlsx(data); break;
        case 'all':         await exportAll(data); break;
      }
      console.log('Export completed:', format);
    } catch (e: any) {
      console.error(`Export (${format}) failed:`, e);
      setExportError(e.message || 'Export failed. Check backend export API.');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">New Topic</span>
              </button>
              <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
              <h1 className="text-lg font-bold text-slate-800 truncate max-w-xs md:max-w-md hidden md:block">
                {data.meta.topic}
              </h1>
            </div>
            
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mr-4 shrink-0">
                <button
                  onClick={() => setActiveTab('doc')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'doc' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden lg:inline">Textbook</span>
                </button>
                <button
                  onClick={() => setActiveTab('slides')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'slides' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden lg:inline">Slides</span>
                </button>
                <button
                  onClick={() => setActiveTab('spreadsheet')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'spreadsheet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span className="hidden lg:inline">Data</span>
                </button>
              </div>

              {/* Interactive Tools */}
              <div className="flex space-x-1 bg-indigo-50 p-1 rounded-lg mr-4 shrink-0">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-600/70 hover:text-indigo-800'
                  }`}
                  title="AI Tutor Chat"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('voice')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'voice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-600/70 hover:text-indigo-800'
                  }`}
                  title="Live Voice Mode"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('podcast')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'podcast' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-600/70 hover:text-indigo-800'
                  }`}
                  title="Podcast Studio"
                >
                  <Radio className="w-4 h-4" />
                </button>
                 <button
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'video' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-600/70 hover:text-indigo-800'
                  }`}
                  title="Video Studio"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </nav>

              {/* Actions — outside nav to prevent overflow clipping on dropdowns */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4 hidden sm:flex shrink-0">
                 
                 {/* Theme Selector */}
                 <div className="relative mr-2">
                    <button
                      onClick={() => { console.log('Theme menu opened'); setActiveMenu(prev => prev === 'theme' ? null : 'theme'); }}
                      className={`p-2 rounded-full transition-colors ${activeMenu === 'theme' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                      title="Change Theme"
                    >
                       <Palette className="w-5 h-5" />
                    </button>
                    {activeMenu === 'theme' && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 p-1 z-50">
                       {Object.values(THEMES).map((theme) => (
                         <button
                           key={theme.id}
                           onClick={() => { setCurrentThemeId(theme.id); setActiveMenu(null); }}
                           className={`w-full text-left px-4 py-2 text-sm rounded-lg flex items-center justify-between ${
                             currentThemeId === theme.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                           }`}
                         >
                           {theme.name}
                           <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: theme.colors.primary }}></div>
                         </button>
                       ))}
                    </div>
                    )}
                 </div>

                 <button
                  onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                  className={`p-2 rounded-full transition-colors ${showAudioPlayer ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}
                  title="Audiobook Mode"
                 >
                   <Headphones className="w-5 h-5" />
                 </button>

                 {/* Dark Mode Toggle */}
                 <button
                   onClick={toggleTheme}
                   className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                   title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                 >
                   {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                 </button>

                 {/* Settings Button */}
                 <button
                   onClick={() => setShowSettings(true)}
                   className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                   title="Settings & API Keys"
                 >
                   <Settings className="w-5 h-5" />
                 </button>

                 <div className="relative">
                    <button
                      onClick={() => { console.log('Export menu opened'); setActiveMenu(prev => prev === 'export' ? null : 'export'); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        activeMenu === 'export' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden lg:inline">Export</span>
                    </button>
                    {activeMenu === 'export' && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 p-1 z-50">
                      {/* Export All as ZIP */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport('all');
                        }}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 mb-1"
                      >
                        <Archive className="w-4 h-4" />
                        {exportingFormat === 'all' ? 'Bundling…' : 'Export All (.zip)'}
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      {/* PPTX - client side */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport('pptx');
                        }}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2"
                      >
                        <Monitor className="w-4 h-4 text-orange-500" />
                        {exportingFormat === 'pptx' ? 'Generating…' : 'PowerPoint (.pptx)'}
                      </button>
                      {/* PPTX - server side */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport('pptx-server');
                        }}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2"
                      >
                        <Monitor className="w-4 h-4 text-orange-400" />
                        {exportingFormat === 'pptx-server' ? 'Generating…' : 'PowerPoint via Server'}
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      {/* DOCX */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport('docx');
                        }}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        {exportingFormat === 'docx' ? 'Generating…' : 'Word Document (.docx)'}
                      </button>

                      {/* PDF via server */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport('pdf-server');
                        }}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        {exportingFormat === 'pdf-server' ? 'Generating…' : 'PDF Document'}
                      </button>

                      {/* PDF via print */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport('pdf-print');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4 text-slate-500" />
                        Print / Save as PDF
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      {/* XLSX */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport('xlsx');
                        }}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2"
                      >
                        <Sheet className="w-4 h-4 text-green-500" />
                        {exportingFormat === 'xlsx' ? 'Generating…' : 'Excel Spreadsheet (.xlsx)'}
                      </button>
                    </div>
                    )}
                 </div>
              </div>
          </div>
        </div>
      </header>

      {/* Export Error Banner */}
      {exportError && (
        <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 px-6 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">{exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {activeTab === 'doc' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DocumentView data={data} theme={currentTheme} />
          </div>
        )}
        
        {activeTab === 'slides' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PresentationView data={data} />
          </div>
        )}

        {activeTab === 'spreadsheet' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SpreadsheetView data={data} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-10rem)]">
            <ChatView data={data} />
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <VoiceTutor data={data} />
          </div>
        )}

        {activeTab === 'podcast' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <PodcastStudio data={data} />
          </div>
        )}
        
        {activeTab === 'video' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <VideoGenerator data={data} />
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QuizView data={data} />
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FlashcardView data={data} />
          </div>
        )}
      </main>

      {/* Audio Player Dock */}
      {showAudioPlayer && (
        <AudioPlayer 
          chapters={data.bookChapters} 
          onClose={() => setShowAudioPlayer(false)} 
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default Dashboard;