
export interface UserInput {
  topic: string;
  audience: string;
  duration: number;
  industry: string;
  depth: 'Beginner' | 'Intermediate' | 'Advanced';
  tone: 'Professional' | 'Educational' | 'Executive' | 'Storytelling';
  mode?: 'Standard' | 'Executive' | 'Academic' | 'Debate'; // Phase 4
  documentPages?: number;  // Feature 1: Page Control
  slideCount?: number;     // Feature 1: Slide Control
  maxTokens?: number;      // Token budget: 2000 | 5000 | 12000 | 20000
}

export const TOKEN_PRESETS = [
  { label: 'Quick Summary',  value: 2000  },
  { label: 'Standard',       value: 5000  },
  { label: 'Detailed Guide', value: 12000 },
  { label: 'Full Textbook',  value: 20000 },
] as const;

export const DEFAULT_MAX_TOKENS  = 12_000;
export const ABSOLUTE_MAX_TOKENS = 20_000;

export interface AgendaItem {
  section: string;
  talkingPoint: string;
  time: number;
  notes: string;
}

export interface Slide {
  title: string;
  bullets: string[];
  speakerNotes: string;
  visualSuggestion: string;
  type?: string;
}

export interface BookChapter {
  title: string;
  content: string; // Long-form Markdown
  diagram?: string; // Mermaid syntax
}

export interface TopicOverview {
  explanation: string;
  purpose: string;
  definitions: string;
  relevance: string;
}

export interface Takeaways {
  insights: string[];
  decisions: string[];
  nextSteps: string[];
  recommendations: string[];
}

export interface Source {
  title: string;
  uri: string;
}

export interface KnowledgePackage {
  meta: UserInput;
  overview: TopicOverview;
  agenda: AgendaItem[];
  bookChapters: BookChapter[];
  slides: Slide[];
  takeaways: Takeaways;
  sources: Source[];
}

// --- NEW INTERFACES PHASE 4 ---

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  term: string;
  definition: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface VideoData {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface PodcastData {
  id: string;
  audioUrl: string; // Base64 or Blob URL
  script: string;
  createdAt: number;
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface UsageQuota {
  tier: SubscriptionTier;
  projectsUsed: number;
  projectsLimit: number;
  videoUsed: number;
  videoLimit: number;
  podcastUsed: number;
  podcastLimit: number;
}

export type ViewMode = 'form' | 'loading' | 'dashboard';
export type DashboardTab = 'doc' | 'slides' | 'spreadsheet' | 'chat' | 'quiz' | 'flashcards' | 'video' | 'podcast' | 'voice';

// --- BYOK INTERFACES ---
export interface ApiKey {
  id: string;
  provider: string;
  keyMask: string;
  label: string;
  isActive: boolean;
  createdAt: string;
}
