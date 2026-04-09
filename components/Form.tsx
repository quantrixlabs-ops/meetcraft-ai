import React, { useState, useEffect, useRef } from 'react';
import { useErrorContext } from '../context/ErrorContext';
import FormValidation from './FormValidation';
import RetryButton from './RetryButton';
import { handleApiError } from '../utils/apiErrorHandler';
import { listApiKeys } from '../services/geminiService';
import { UserInput, TOKEN_PRESETS, DEFAULT_MAX_TOKENS } from '../types';
import { Sparkles, Clock, Users, Briefcase, Mic, UploadCloud, AlertCircle, Zap, Shield, Rocket, Cpu, Coins, Layers, Loader2, HelpCircle, Settings, FileText, Monitor, Key } from 'lucide-react';
import { Card, Badge } from './ui/Shared';

interface FormProps {
  onSubmit: (input: any) => void;
  isGenerating: boolean;
  onOpenSettings?: () => void;
}

const AUDIENCE_OPTIONS = [
  "General Professional",
  "C-Suite Executives",
  "Mid-Level Management",
  "Entry-Level Employees",
  "Technical / Engineering Teams",
  "Sales & Marketing Teams",
  "Investors / Board Members",
  "Students / Academic Researchers",
  "General Public / Consumer",
  "Healthcare Professionals",
  "Government / Policy Makers"
];

const INDUSTRY_OPTIONS = [
  "General Business",
  "Technology & Software (SaaS)",
  "Finance & Banking",
  "Healthcare & Life Sciences",
  "Education & EdTech",
  "Retail & E-commerce",
  "Manufacturing & Industrial",
  "Marketing, Media & Design",
  "Real Estate & Construction",
  "Legal & Compliance",
  "Government & Public Sector",
  "Non-Profit & Social Impact",
  "Energy & Sustainability"
];

const ESTIMATES = {
  Beginner:     { tokens: '~2,500',  time: '~15s', cost: 'Low',    model: 'Gemini Flash' },
  Intermediate: { tokens: '~8,000',  time: '~45s', cost: 'Medium', model: 'Gemini Pro'   },
  Advanced:     { tokens: '~25,000+', time: '~2m',  cost: 'High',  model: 'Gemini Pro + Search' }
};

// Map active provider → display model name
const PROVIDER_MODEL_LABEL: Record<string, string> = {
  google:     'Gemini Flash',
  anthropic:  'Claude Sonnet',
  claude:     'Claude Sonnet',
  openai:     'GPT-4o',
  openrouter: 'Claude / Mixtral',
  perplexity: 'Sonar Pro',
  groq:       'Llama3 70B',
};

const PROVIDER_DISPLAY: Record<string, { label: string; color: string }> = {
  google:     { label: 'Google Gemini',   color: 'bg-blue-100 text-blue-700'     },
  anthropic:  { label: 'Anthropic Claude', color: 'bg-orange-100 text-orange-700' },
  claude:     { label: 'Anthropic Claude', color: 'bg-orange-100 text-orange-700' },
  openai:     { label: 'OpenAI',           color: 'bg-green-100 text-green-700'   },
  openrouter: { label: 'OpenRouter',       color: 'bg-purple-100 text-purple-700' },
  perplexity: { label: 'Perplexity',       color: 'bg-teal-100 text-teal-700'    },
  groq:       { label: 'Groq',             color: 'bg-yellow-100 text-yellow-700' },
};

// Tooltip component
const Tooltip: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <div 
        className="cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-10 left-0 top-6 bg-slate-900 text-white text-xs rounded-lg p-2 w-48 whitespace-normal shadow-lg">
          {text}
          <div className="absolute top-0 left-2 w-2 h-2 bg-slate-900 transform -translate-y-1 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

const DOCUMENT_PAGE_OPTIONS = [10, 20, 30, 50, 100];
const SLIDE_COUNT_OPTIONS  = [10, 20, 30, 50];

const Form: React.FC<FormProps> = ({ onSubmit, isGenerating, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'topic' | 'document'>('topic');
  const [hasUserKey, setHasUserKey] = useState<boolean | null>(null); // null = loading
  const [activeProvider, setActiveProvider] = useState<string>('google');
  const [file, setFile] = useState<File | null>(null);
  const {
    error,
    setError,
    clearError,
    isLoading,
    setLoading,
    retryCount,
    incrementRetry,
    resetRetry,
    maxRetries,
    setSuccess
  } = useErrorContext();

  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Constants for file validation
  const MAX_FILE_SIZE = 5242880; // 5MB in bytes
  const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];
  
  // Topic Form State with localStorage persistence
  const [formData, setFormData] = useState<UserInput>({
    topic: '',
    audience: 'General Professional',
    duration: 30,
    industry: 'General Business',
    depth: 'Beginner',
    tone: 'Professional',
    mode: 'Standard',
    documentPages: 20,
    slideCount: 20,
    maxTokens: DEFAULT_MAX_TOKENS,
  });

  // Load form data from localStorage + check for user API keys
  useEffect(() => {
    const savedFormData = localStorage.getItem('meetcraft_form_data');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        // Ensure new fields have defaults if not present in saved data
        setFormData({ documentPages: 20, slideCount: 20, maxTokens: DEFAULT_MAX_TOKENS, ...parsedData });
        console.log('💾 Form data restored from localStorage');
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }

    // Check if user has their own API key configured
    listApiKeys()
      .then(keys => {
        const activeKey = keys.find(k => k.isActive);
        if (activeKey) {
          setHasUserKey(true);
          setActiveProvider(activeKey.provider);
        } else {
          setHasUserKey(false);
          setActiveProvider('google');
        }
      })
      .catch(() => setHasUserKey(false));
  }, []);

  // Auto-save form data to localStorage (debounced by 3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('meetcraft_form_data', JSON.stringify(formData));
      console.log('📝 Form data auto-saved to localStorage');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    clearError();
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Enhanced dropdown change handler with explicit event handling
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    clearError();
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!formData.topic || formData.topic.trim().length < 3) {
      errors.topic = 'Please enter a research topic (min 3 characters)';
    } else if (formData.topic.length > 500) {
      errors.topic = 'Topic cannot exceed 500 characters';
    }
    if (!formData.audience || !AUDIENCE_OPTIONS.includes(formData.audience)) {
      errors.audience = 'Please select a valid target audience';
    }
    if (!formData.industry || !INDUSTRY_OPTIONS.includes(formData.industry)) {
      errors.industry = 'Please select a valid industry/context';
    }
    if (!formData.tone || !['Professional', 'Educational', 'Executive', 'Storytelling'].includes(formData.tone)) {
      errors.tone = 'Please select a valid tone';
    }
    // Validate duration
    if (typeof formData.duration !== 'number' || isNaN(formData.duration) || formData.duration < 5) {
      errors.duration = 'Duration must be a number (minutes) and at least 5.';
    }
    // Validate depth
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(formData.depth)) {
      errors.depth = 'Please select a valid depth (Beginner, Intermediate, Advanced).';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (selectedFile: File | null) => {
    setError(null);
    setUploadProgress(0);
    setUploadSuccess(false);

    if (!selectedFile) return;

    // Validate file type
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      setError(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      const sizeInMB = (selectedFile.size / 1024 / 1024).toFixed(2);
      setError(`File too large (${sizeInMB} MB). Maximum size is 5 MB.`);
      return;
    }

    console.log(`📁 File selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`);
    setFile(selectedFile);
    uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
          console.log(`📤 Upload progress: ${percentComplete}%`);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          console.log('✅ File uploaded successfully');
          setUploadProgress(100);
          setUploadSuccess(true);
          setIsUploading(false);
        } else {
          const errorMsg = `Upload failed: ${xhr.status}`;
          console.error(errorMsg);
          setError(errorMsg);
          setIsUploading(false);
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('Upload error:', xhr.statusText);
        setError('Upload failed. Please try again.');
        setIsUploading(false);
      });

      // Send request
      xhr.open('POST', '/api/ai/upload-document');
      xhr.send(formData);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'File upload failed');
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearError();
    setLoading(true);
    resetRetry();
    if (!validateForm()) {
      setLoading(false);
      setError('Please fix the errors above and try again.');
      return;
    }
    try {
      await onSubmit(formData);
      setSuccess('Research session started successfully!');
      localStorage.removeItem('meetcraft_form_data');
    } catch (err) {
      const apiErr = handleApiError(err, 'FormSubmit');
      setError(apiErr.userMessage);
      if (apiErr.isRetryable && retryCount < maxRetries) {
        incrementRetry();
        setTimeout(() => handleSubmit(), 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper for Depth Card selection
  const DepthCard = ({ 
    value, 
    title, 
    icon: Icon, 
    desc 
  }: { 
    value: 'Beginner' | 'Intermediate' | 'Advanced'; 
    title: string; 
    icon: any; 
    desc: string; 
  }) => (
    <div 
      onClick={() => setFormData(prev => ({ ...prev, depth: value }))}
      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:scale-[1.02] ${
        formData.depth === value
          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 shadow-md ring-1 ring-indigo-600'
          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-indigo-300'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
         <div className={`p-2 rounded-lg ${formData.depth === value ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
            <Icon className="w-5 h-5" />
         </div>
         {formData.depth === value && <div className="absolute top-4 right-4 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>}
      </div>
      <h3 className={`font-bold text-sm mb-1 ${formData.depth === value ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
        {title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );

  const currentEstimate = ESTIMATES[formData.depth];
  const activeModel = PROVIDER_MODEL_LABEL[activeProvider] ?? currentEstimate.model;
  const providerDisplay = PROVIDER_DISPLAY[activeProvider] ?? PROVIDER_DISPLAY['google'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      
      {/* LEFT COLUMN - FORM */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('topic')}
              className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'topic' ? 'bg-white dark:bg-slate-800 text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <Sparkles className="w-4 h-4" />
              Generate from Topic
            </button>
            <button
              onClick={() => setActiveTab('document')}
              className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'document' ? 'bg-white dark:bg-slate-800 text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload Document
            </button>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {activeTab === 'topic' ? (
                <>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Research Topic
                      <Tooltip text="Enter what you want to learn about. Be specific for better results (e.g., 'Quantum computing in finance' rather than 'computers')">
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      name="topic"
                      required
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-lg shadow-sm bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 ${
                        validationErrors.topic && touched.topic
                          ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                          : 'border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      }`}
                      placeholder="e.g. The Future of Quantum Computing in Finance"
                      value={formData.topic}
                      onChange={handleChange}
                      onBlur={() => setTouched((prev) => ({ ...prev, topic: true }))}
                    />
                    <FormValidation fieldName="topic" errorMessage={validationErrors.topic} touched={!!touched.topic} required={true} />
                  </div>

                  <div className="space-y-3">
                     <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <Layers className="w-4 h-4 text-indigo-500" /> Research Depth
                        <Tooltip text="Beginner: Quick overview (~15s). Intermediate: Comprehensive guide (~45s). Advanced: Deep analysis with web search (~2min).">
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </Tooltip>
                     </label>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <DepthCard 
                          value="Beginner" 
                          title="⚡ Beginner" 
                          icon={Zap} 
                          desc="Instant Single-Pass. Overview only."
                        />
                        <DepthCard 
                          value="Intermediate" 
                          title="🚀 Intermediate" 
                          icon={Rocket} 
                          desc="Balanced depth. 6 chapters."
                        />
                        <DepthCard 
                          value="Advanced" 
                          title="🧠 Advanced" 
                          icon={Shield} 
                          desc="Deep reasoning + Web Search."
                        />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Users className="w-4 h-4" /> Target Audience
                        <Tooltip text="Select who will be reading your content. This shapes the complexity and terminology used.">
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </Tooltip>
                      </label>
                      <select
                        name="audience"
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                          validationErrors.audience && touched.audience
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                            : 'border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium cursor-pointer hover:border-indigo-400 appearance-auto pointer-events-auto`}
                        value={formData.audience}
                        onChange={handleDropdownChange}
                        onBlur={() => setTouched((prev) => ({ ...prev, audience: true }))}
                        disabled={false}
                      >
                        {AUDIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <FormValidation fieldName="audience" errorMessage={validationErrors.audience} touched={!!touched.audience} required={true} />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Briefcase className="w-4 h-4" /> Industry / Context
                        <Tooltip text="Choose the industry or field relevant to your topic. This helps tailor examples and insights.">
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </Tooltip>
                      </label>
                      <select
                        name="industry"
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                          validationErrors.industry && touched.industry
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                            : 'border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium cursor-pointer hover:border-indigo-400 appearance-auto pointer-events-auto`}
                        value={formData.industry}
                        onChange={handleDropdownChange}
                        onBlur={() => setTouched((prev) => ({ ...prev, industry: true }))}
                        disabled={false}
                      >
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <FormValidation fieldName="industry" errorMessage={validationErrors.industry} touched={!!touched.industry} required={true} />
                    </div>
                  </div>

                  <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Mic className="w-4 h-4" /> Tone
                        <Tooltip text="Select the writing style. Professional for business, Educational for learning, Executive for high-level overview, Storytelling for engaging narratives.">
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </Tooltip>
                      </label>
                      <select
                        name="tone"
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                          validationErrors.tone && touched.tone
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                            : 'border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium cursor-pointer hover:border-indigo-400 appearance-auto pointer-events-auto`}
                        value={formData.tone}
                        onChange={handleDropdownChange}
                        onBlur={() => setTouched((prev) => ({ ...prev, tone: true }))}
                        disabled={false}
                      >
                        <option value="Professional">Professional (Corporate)</option>
                        <option value="Educational">Educational (Instructional)</option>
                        <option value="Executive">Executive (High-level Strategic)</option>
                        <option value="Storytelling">Storytelling (Engaging Narrative)</option>
                      </select>
                      <FormValidation fieldName="tone" errorMessage={validationErrors.tone} touched={!!touched.tone} required={true} />
                  </div>

                  {/* ── Output Size Control ─────────────────────────────────── */}
                  <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Output Size Control
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Document Pages */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <FileText className="w-4 h-4" /> Document Pages
                          <Tooltip text="Select how long the generated textbook should be. More pages = more detail and longer generation time.">
                            <HelpCircle className="w-4 h-4 text-slate-400" />
                          </Tooltip>
                        </label>
                        <select
                          name="documentPages"
                          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium cursor-pointer hover:border-indigo-400"
                          value={formData.documentPages ?? 20}
                          onChange={(e) => setFormData(prev => ({ ...prev, documentPages: Number(e.target.value) }))}
                        >
                          {DOCUMENT_PAGE_OPTIONS.map(p => (
                            <option key={p} value={p}>{p} pages</option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-400 dark:text-slate-500">~{formData.documentPages ?? 20} pages ≈ {Math.ceil((formData.documentPages ?? 20) * 250 / 1000)}k words</p>
                      </div>

                      {/* Slide Count */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <Monitor className="w-4 h-4" /> Presentation Slides
                          <Tooltip text="Number of slides to generate for the presentation view.">
                            <HelpCircle className="w-4 h-4 text-slate-400" />
                          </Tooltip>
                        </label>
                        <select
                          name="slideCount"
                          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium cursor-pointer hover:border-indigo-400"
                          value={formData.slideCount ?? 20}
                          onChange={(e) => setFormData(prev => ({ ...prev, slideCount: Number(e.target.value) }))}
                        >
                          {SLIDE_COUNT_OPTIONS.map(s => (
                            <option key={s} value={s}>{s} slides</option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{formData.slideCount ?? 20} individual presentation slides</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDragOver 
                      ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' 
                      : 'border-slate-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                  onClick={handleUploadAreaClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    accept=".pdf,.txt,.md"
                    onChange={handleFileInputChange}
                    className="hidden" 
                    id="file-upload"
                    ref={fileInputRef}
                    disabled={isUploading}
                  />
                  {!file ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <span className="font-bold text-slate-700 text-lg">
                        {isDragOver ? '📁 Drop file here' : "Click to Upload Document"}
                      </span>
                      <span className="text-slate-500 text-sm mt-2">
                        PDF, TXT, or MD (Max 5MB)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <span className="font-bold text-slate-700 text-lg">
                        {file.name}
                      </span>
                      <span className="text-slate-500 text-sm mt-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                </div>

                  {error && activeTab === 'document' && (
                    <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-red-700">
                        <p className="font-semibold">Upload Error</p>
                        <p>{error}</p>
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 flex items-start gap-3">
                      <Loader2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-800 mb-2">Uploading...</p>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-700 mt-1">{uploadProgress}% complete</p>
                      </div>
                    </div>
                  )}

                  {uploadSuccess && file && (
                    <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-start gap-3">
                      <div className="w-5 h-5 text-green-600 shrink-0 mt-0.5">✓</div>
                      <div className="text-sm text-green-700 flex-1">
                        <p className="font-semibold mb-2">Upload Successful</p>
                        <p className="mb-3">{file.name} has been uploaded and ready for analysis</p>
                        <button
                          onClick={handleRemoveFile}
                          className="text-green-600 hover:text-green-800 font-medium text-xs underline"
                        >
                          Upload different file
                        </button>
                      </div>
                    </div>
                  )}

                  {file && !isUploading && uploadSuccess && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                       <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                       <div className="text-sm text-blue-800">
                         <p className="font-bold">RAG Analysis Ready</p>
                         <p>AI will extract text and analyze the document structure. Defaulting to Intermediate Research depth.</p>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - RESEARCH CONTROL PANEL */}
      <div className="lg:col-span-1 space-y-6">
         <Card className="p-6 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg sticky top-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
               <Cpu className="w-5 h-5 text-indigo-600" />
               Research Control Panel
            </h3>

            {/* API Key notice */}
            {hasUserKey === false && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <Key className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">No personal API key configured.</p>
                  <p>Using system key as fallback.{' '}
                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={onOpenSettings}
                        className="underline font-bold hover:text-amber-900"
                      >
                        Add your key in Settings
                      </button>
                    )} for maximum performance.
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-4 mb-6">
               <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                     <Clock className="w-4 h-4" /> Est. Time
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{currentEstimate.time}</span>
               </div>
               
               <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                     <Coins className="w-4 h-4" /> Est. Tokens
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{currentEstimate.tokens}</span>
               </div>

               <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                     <Cpu className="w-4 h-4" /> Model
                  </span>
                  <Badge variant="ai">{activeModel}</Badge>
               </div>
            </div>

            {/* Active provider badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500">Active Provider:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${providerDisplay.color}`}>
                {providerDisplay.label}
              </span>
            </div>

            {/* Token Budget Presets */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Coins className="w-3 h-3" /> Token Budget
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {TOKEN_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, maxTokens: preset.value }))}
                    className={`text-xs px-2 py-1.5 rounded-lg border font-medium transition-all ${
                      formData.maxTokens === preset.value
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {preset.label}
                    <span className="block text-[10px] opacity-70">{(preset.value / 1000).toFixed(0)}k tokens</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500 mb-6">
               <p className="mb-2"><strong className="text-slate-600 dark:text-slate-400">Output Manifest:</strong></p>
               <ul className="list-disc pl-4 space-y-1">
                  <li>Textbook — {formData.documentPages ?? 20} pages ({Math.ceil((formData.documentPages ?? 20) * 250 / 1000)}k words)</li>
                  <li>Slides — {formData.slideCount ?? 20} presentation slides</li>
                  <li>Excel structured outline</li>
                  <li>Quiz & Flashcard Set</li>
               </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-semibold">Validation Error</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading || isUploading || (activeTab === 'topic' && !formData.topic) || (activeTab === 'document' && !file) || (activeTab === 'document' && !uploadSuccess)}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2
                ${isLoading || isUploading
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Processing... (~{currentEstimate.time})
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Uploading...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Start Research Session
                </>
              )}
            </button>
            <RetryButton onRetry={handleSubmit} retryCount={retryCount} maxRetries={maxRetries} isLoading={isLoading} />
         </Card>
      </div>

    </div>
  );
};

export default Form;