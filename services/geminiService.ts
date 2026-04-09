// CLIENT-SIDE SERVICE
import { KnowledgePackage, UserInput, QuizData, Flashcard, VideoData, PodcastData, ApiKey } from "../types";
import { supabase, isSupabaseConfigured } from './supabaseClient';

const API_BASE = '/api/ai';
const apikey = import.meta.env.VITE_GEMINI_API_KEY || '';

// Token management utilities
const TOKEN_KEY = 'meetcraft_auth_token';
const TOKEN_EXPIRY_KEY = 'meetcraft_token_expiry';

function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string, expiresIn: number = 3600): void {
  const expiry = Date.now() + expiresIn * 1000;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
}

function isTokenExpired(): boolean {
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return false;
  return Date.now() > parseInt(expiry);
}

async function getAuthHeaders() {
  let token: string | null = null;

  if (isSupabaseConfigured) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || null;
  } else {
    // Local/Offline mode: Use mock token
    token = getStoredToken() || 'mock-token';
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      setStoredToken(token);
    }
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

async function handleResponse(response: Response) {
  // Handle different error status codes
  if (response.status === 401) {
    // Unauthorized - clear token and suggest login
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    throw new Error("Session expired or invalid. Please refresh the page and try again.");
  }
  if (response.status === 403) {
    throw new Error("Access denied: You don't have permission to perform this action.");
  }
  if (response.status === 429) {
    throw new Error("Rate limited: Too many requests. Please wait a moment and try again.");
  }
  if (!response.ok) {
    try {
      const errorData = await response.json();
      const message = errorData.error?.message || errorData.message || `API Error: ${response.statusText}`;
      const error = new Error(message);
      (error as any).status = response.status;
      throw error;
    } catch (e: any) {
      if (e instanceof Error && e.message.includes('Session expired')) throw e;
      throw new Error(`API Error (${response.status}): ${response.statusText}`);
    }
  }
  return response.json();
}

// --- AI GENERATION ---

export async function generateKnowledgePackage(input: UserInput): Promise<KnowledgePackage> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input)
  });
  return handleResponse(response);
}

export async function generateFromDocument(file: File): Promise<KnowledgePackage> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: formData
  });
  return handleResponse(response);
}

export async function generateAIImage(prompt: string): Promise<string> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt })
  });
  const result = await handleResponse(response);
  return result.imageUrl;
}

export async function generateAIVideo(prompt: string): Promise<VideoData> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/video`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt })
  });
  return handleResponse(response);
}

export async function generatePodcast(topic: string, content: string): Promise<PodcastData> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/podcast`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ topic, content })
  });
  return handleResponse(response);
}

export async function generateQuiz(data: KnowledgePackage): Promise<QuizData> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/quiz`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  return handleResponse(response);
}

export async function generateFlashcards(data: KnowledgePackage): Promise<Flashcard[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/flashcards`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  return handleResponse(response);
}

export function createChatSession(data: KnowledgePackage) {
  return {
    sendMessage: async (payload: { message: string }) => {
      const headers = await getAuthHeaders();
      const context = JSON.stringify(data.overview);
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: payload.message, context })
      });
      const result = await handleResponse(response);
      return { text: result.text };
    }
  };
}

export async function generateSpeech(text: string): Promise<string> {
  throw new Error("TTS implemented via browser API in this version.");
}

// --- API KEY MANAGEMENT ---

export async function listApiKeys(): Promise<ApiKey[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/keys`, {
    method: 'GET',
    headers
  });
  return handleResponse(response);
}

export async function saveApiKey(provider: string, key: string, label: string): Promise<ApiKey> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider, key, label })
  });
  return handleResponse(response);
}

export async function deleteApiKey(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/keys/${id}`, {
    method: 'DELETE',
    headers
  });
  return handleResponse(response);
}

// --- MULTI-FORMAT EXPORT ---

const EXPORT_BASE = '/api/export';

async function downloadExport(
  endpoint: string,
  data: KnowledgePackage,
  filename: string,
  mimeType: string
): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${EXPORT_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Export failed (${response.status}): ${errText}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function safeFilename(topic: string, ext: string): string {
  return (topic || 'document').replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '_').slice(0, 60) + '.' + ext;
}

export async function exportAsDocx(data: KnowledgePackage): Promise<void> {
  return downloadExport('docx', data, safeFilename(data.meta.topic, 'docx'),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

export async function exportAsPdf(data: KnowledgePackage): Promise<void> {
  return downloadExport('pdf', data, safeFilename(data.meta.topic, 'pdf'), 'application/pdf');
}

export async function exportAsPptxServer(data: KnowledgePackage): Promise<void> {
  return downloadExport('pptx', data, safeFilename(data.meta.topic, 'pptx'),
    'application/vnd.openxmlformats-officedocument.presentationml.presentation');
}

export async function exportAsXlsx(data: KnowledgePackage): Promise<void> {
  return downloadExport('xlsx', data, safeFilename(data.meta.topic, 'xlsx'),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function exportAll(data: KnowledgePackage): Promise<void> {
  return downloadExport('all', data, safeFilename(data.meta.topic, 'zip'), 'application/zip');
}