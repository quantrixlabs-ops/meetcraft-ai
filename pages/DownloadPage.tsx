import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Monitor, Apple, Terminal, Download, ArrowRight, CheckCircle } from 'lucide-react';

// ─── OS Detection ──────────────────────────────────────────────────────────────
type DetectedOS = 'windows' | 'mac' | 'linux' | 'unknown';

function detectOS(): DetectedOS {
  const platform = navigator.platform.toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (platform.startsWith('win') || ua.includes('windows')) return 'windows';
  if (platform.startsWith('mac') || ua.includes('macintosh') || ua.includes('mac os')) return 'mac';
  if (platform.startsWith('linux') || ua.includes('linux')) return 'linux';
  return 'unknown';
}

// ─── Release info ──────────────────────────────────────────────────────────────
interface ReleaseOption {
  os: DetectedOS;
  label: string;
  ext: string;
  icon: React.ReactNode;
  description: string;
  filename: string;
  color: string;
}

const RELEASES: ReleaseOption[] = [
  {
    os: 'windows',
    label: 'Windows',
    ext: '.exe',
    icon: <Monitor className="w-8 h-8" />,
    description: 'Windows 10 / 11 — 64-bit installer',
    filename: 'MeetCraft-AI-Setup.exe',
    color: 'from-blue-600 to-blue-700',
  },
  {
    os: 'mac',
    label: 'macOS',
    ext: '.dmg',
    icon: <Apple className="w-8 h-8" />,
    description: 'macOS 12 Monterey and later — Universal (Intel + Apple Silicon)',
    filename: 'MeetCraft-AI.dmg',
    color: 'from-slate-700 to-slate-800',
  },
  {
    os: 'linux',
    label: 'Linux',
    ext: '.AppImage',
    icon: <Terminal className="w-8 h-8" />,
    description: 'Linux — AppImage (any distribution)',
    filename: 'MeetCraft-AI.AppImage',
    color: 'from-orange-500 to-orange-600',
  },
];

// ─── Features list ─────────────────────────────────────────────────────────────
const FEATURES = [
  'Works fully offline after first setup',
  'Automatic AI provider key management',
  'Export to PDF, DOCX, PPTX, and Excel',
  'All web features available in the desktop app',
  'Auto-updates when new releases ship',
];

// ─── Component ─────────────────────────────────────────────────────────────────
const DownloadPage: React.FC = () => {
  const detectedOS = useMemo(() => detectOS(), []);

  const primary = RELEASES.find(r => r.os === detectedOS) ?? RELEASES[0];
  const others = RELEASES.filter(r => r.os !== primary.os);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-900 text-xl">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            MeetCraft AI
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Back to App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-indigo-200/25 rounded-full blur-3xl -z-10" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
            <Download className="w-3 h-3" /> Desktop Application
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            Download{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              MeetCraft AI
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
            Get the full desktop experience. Runs locally, works offline, and supports all AI providers out of the box.
          </p>
        </div>
      </section>

      {/* Primary Download */}
      <section className="max-w-4xl mx-auto px-6 pb-8 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${primary.color} p-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              {primary.icon}
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wide">
                  {detectedOS !== 'unknown' ? 'Recommended for your system' : 'Most popular'}
                </p>
                <h2 className="text-2xl font-bold">{primary.label} Download</h2>
              </div>
            </div>
            <p className="text-white/80 mb-6">{primary.description}</p>
            <a
              href={`/releases/${primary.filename}`}
              download={primary.filename}
              className="inline-flex items-center gap-3 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-lg"
            >
              <Download className="w-5 h-5 text-indigo-600" />
              Download for {primary.label}
              <span className="text-slate-400 text-sm font-normal">{primary.ext}</span>
            </a>
          </div>

          {/* Features */}
          <div className="p-8">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">What's included</h3>
            <ul className="space-y-3">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Other Platforms */}
      <section className="max-w-4xl mx-auto px-6 pb-16 w-full">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Other platforms</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {others.map(r => (
            <div key={r.os} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${r.color} text-white`}>
                  {r.icon}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{r.label}</p>
                  <p className="text-xs text-slate-500">{r.ext}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4">{r.description}</p>
              <a
                href={`/releases/${r.filename}`}
                download={r.filename}
                className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:text-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download {r.ext}
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Use web version CTA */}
      <section className="bg-indigo-600 py-12 mt-auto">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Prefer the browser?</h2>
          <p className="text-indigo-200 mb-6">
            MeetCraft AI is fully functional in any modern browser — no installation required.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Open Web App <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DownloadPage;
