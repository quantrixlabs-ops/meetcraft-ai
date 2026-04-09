# MeetCraft AI — Architecture Documentation

**Version:** 1.3.0
**Last Updated:** 2026-04-02
**Status:** Production (Local-First Mode)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [AI Provider System](#6-ai-provider-system)
7. [Generation Pipeline](#7-generation-pipeline)
8. [Export System](#8-export-system)
9. [Authentication & Security](#9-authentication--security)
10. [State Management](#10-state-management)
11. [Type System](#11-type-system)
12. [Styling & Theming](#12-styling--theming)
13. [WebSocket / Real-Time](#13-websocket--real-time)
14. [Desktop Build (Electron)](#14-desktop-build-electron)
15. [Data Flow Diagrams](#15-data-flow-diagrams)
16. [API Reference](#16-api-reference)
17. [File Map](#17-file-map)
18. [Extension Points](#18-extension-points)
19. [Known Limitations](#19-known-limitations)
20. [Known Pitfalls](#20-known-pitfalls)

---

## 1. System Overview

MeetCraft AI is a comprehensive **AI-powered knowledge package generator** that produces professional educational content — textbooks, presentations, quizzes, flashcards, spreadsheets, and more — from a single topic input. It uses a multi-provider AI system with automatic fallback and supports Bring Your Own Key (BYOK) for seven AI providers.

**Core design principles:**
- **Local-first:** Runs entirely offline by default with mock Supabase and in-memory key storage.
- **Provider-agnostic:** Swappable AI backends with automatic failover.
- **Hybrid architecture:** React frontend handles UI only; Express backend owns AI orchestration, secrets, and exports.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 19.2 |
| Routing | React Router | 7.x |
| Bundler | Vite | 6.2 |
| CSS | Tailwind CSS | 4.2 |
| Backend | Express (Node.js) | 4.18 |
| Language | TypeScript (ES2022) | 5.x |
| Desktop | Electron | 40.8 |
| Database | Supabase (optional) | — |
| Export: DOCX | docx | — |
| Export: PDF | pdfkit | — |
| Export: PPTX | pptxgenjs | — |
| Export: XLSX | exceljs | — |
| Dev Runner | concurrently | — |

---

## 3. Architecture Diagram

```
                         +-----------------------+
                         |     User Browser      |
                         +-----------+-----------+
                                     |
                           Port 3000 (Vite Dev)
                                     |
                    +----------------+----------------+
                    |         React Frontend          |
                    |  App.tsx -> Form -> Dashboard    |
                    |  (UI only — no API keys)        |
                    +----------------+----------------+
                                     |
                           /api/* proxy (Vite)
                                     |
                    +----------------+----------------+
                    |         Express Backend          |
                    |          Port 5001               |
                    +--+----------+----------+--------+
                       |          |          |
              +--------+   +-----+-----+  +-+--------+
              | routes |   | exportRoutes| | ws/live  |
              | /api/ai|   | /api/export | | WebSocket|
              +---+----+   +-----+------+ +----+-----+
                  |              |              |
          +-------+-------+  Exporter     Gemini Live
          | aiOrchestrator|  Utilities    Audio API
          +-------+-------+
                  |
     +------------+------------+
     |   Provider Fallback     |
     |   Chain (7 providers)   |
     +---+---+---+---+---+----+
         |   |   |   |   |
      Gemini OpenAI Claude Groq ...
```

---

## 4. Frontend Architecture

### 4.1 Entry Point & Routing

**`index.tsx`** mounts the React app with:
- `ThemeProvider` (dark/light mode)
- `BrowserRouter` with two routes:
  - `/` → `App` (main application)
  - `/download` → `DownloadPage`

### 4.2 Application Shell (`App.tsx`)

Three-state view machine:

| State | View | Trigger |
|-------|------|---------|
| `form` | Input form | Initial / "Back" button |
| `loading` | Progress animation | Form submit |
| `dashboard` | Tabbed content viewer | Generation complete |

Header renders: theme toggle, settings button, "Local/Offline Mode" badge.
Error handling wraps everything in `ErrorBoundary` with max 3 retries.

### 4.3 Components

#### Input & Configuration

| Component | Purpose |
|-----------|---------|
| `Form.tsx` | Multi-tab generation form: topic input, document upload, audience/industry/depth/tone selectors, token budget presets, slide count, page count. Persists state to localStorage. Detects active provider from saved keys. |
| `FormValidation.tsx` | Input validation utilities for the form |
| `SettingsModal.tsx` | BYOK key management UI. Tabs: General + AI Providers. Supports 7 providers with auto-detection by key prefix. Displays masked keys (last 4 chars). |
| `GenerationProgress.tsx` | 4-step timed progress indicator during content generation |

#### Dashboard Views (9 tabs)

| Tab ID | Component | Description |
|--------|-----------|-------------|
| `doc` | `DocumentView.tsx` | Textbook chapters with markdown rendering, Mermaid diagrams, TOC sidebar, executive summary |
| `slides` | `PresentationView.tsx` | Slide deck preview with speaker notes |
| `spreadsheet` | `SpreadsheetView.tsx` | Tabular data view with metadata |
| `chat` | `ChatView.tsx` | Real-time AI tutor chat via `createChatSession()` |
| `quiz` | `QuizView.tsx` | Interactive MCQ quiz with scoring and progress tracking |
| `flashcards` | `FlashcardView.tsx` | Spaced repetition flashcards |
| `video` | `VideoGenerator.tsx` | Video generation UI (placeholder) |
| `podcast` | `PodcastStudio.tsx` | Podcast creation interface |
| `voice` | `VoiceTutor.tsx` | Live voice session via WebSocket to Gemini Native Audio |

#### Dashboard Shell

| Component | Purpose |
|-----------|---------|
| `Dashboard.tsx` | Tab navigation, export dropdown (PPTX/PDF/DOCX/XLSX), theme switcher, back button |
| `AudioPlayer.tsx` | Browser-based TTS playback using Web Speech API |

#### Shared UI

| Component | Purpose |
|-----------|---------|
| `ErrorBoundary.tsx` | React error boundary with fallback UI |
| `RetryButton.tsx` | Retry action handler |
| `ui/Shared.tsx` | Reusable primitives: Card, Badge, Button, Input |
| `Alerts/*.tsx` | Alert banners: Error, Success, Warning, Info |

#### Pages

| Page | Purpose |
|------|---------|
| `LoginPage.tsx` | Authentication interface |
| `LandingPage.tsx` | Marketing / intro page |
| `WorkspacePage.tsx` | Project management |
| `EditorPage.tsx` | Content editing |
| `DownloadPage.tsx` | File download handler |

---

## 5. Backend Architecture

### 5.1 Server Bootstrap (`server/index.ts`)

- **Port:** 5001 (`process.env.PORT || 5001`)
- **Middleware:** CORS, JSON body parser (10MB limit)
- **Health check:** `GET /health` → `{ status: 'ok', env }`
- **Route mounts:**
  - `/api/ai/*` → `routes.ts`
  - `/api/export/*` → `exportRoutes.ts`
- **WebSocket:** `wss://localhost:5001/ws/live` for Gemini Live Audio

### 5.2 Middleware

| File | Purpose |
|------|---------|
| `middleware/auth.ts` | Bearer token validation. Dev mode auto-assigns `local-dev-user`. Supabase mode verifies via `auth.getUser()`. Currently not enforced on routes. |
| `middleware/errorHandler.ts` | Global error handler. Maps errors to HTTP codes (400/401/403/500/503/504). Returns JSON `{ error: { message, code, timestamp } }`. |
| `middleware/upload.ts` | Multer file upload. 5MB limit. Allowed: PDF, TXT, MD. |

### 5.3 Services

| File | Purpose |
|------|---------|
| `services/keyManager.ts` | BYOK key storage. Encrypts with AES-256-CBC, masks display (last 4 chars). One active key per provider per user. Local mode uses in-memory Map; cloud mode uses Supabase `api_keys` table. |
| `featureGate.ts` | Tier-based access control (free/pro/enterprise). Free: 3 projects, Standard mode only. Pro: 50 projects, all modes. Enterprise: unlimited. Usage tracking is mocked. |
| `lib/supabase.ts` | Supabase client factory. Activates mock mode when URL contains `placeholder` (case-insensitive). Mock client is fully chainable. |

### 5.4 Utilities

| File | Purpose |
|------|---------|
| `utils/exporter.ts` | Multi-format export: DOCX (docx lib), PDF (pdfkit), XLSX (exceljs), PPTX (pptxgenjs). Each accepts KnowledgePackage and returns a binary buffer. |
| `utils/crypto.ts` | AES-256-CBC encryption for API keys. Key from `ENCRYPTION_KEY` env var (64-char hex) or ephemeral random. Format: `iv:ciphertext` (hex). |
| `utils/providerDetector.ts` | Auto-detect AI provider from key prefix: `AIza`→Google, `sk-ant-`→Anthropic, `sk-or-`→OpenRouter, `pplx-`→Perplexity, `gsk_`→Groq, `sk-`→OpenAI. |
| `utils/textExtractor.ts` | Extract text from uploaded files (PDF via `pdf-parse`, TXT/MD direct). Sanitizes whitespace. |

---

## 6. AI Provider System

### 6.1 Provider Interface

```typescript
interface AIProvider {
  generateText(prompt: string, model?: string, maxTokens?: number): Promise<string>
  generateJSON(prompt: string, model?: string, maxTokens?: number): Promise<any>
}
```

All providers implement both methods. `generateJSON` varies by provider (native JSON mode vs. prompt-instructed).

### 6.2 Supported Providers

| Provider | Default Model | Fallback Model | JSON Mode | File |
|----------|--------------|----------------|-----------|------|
| **Gemini** | `gemini-2.5-flash` | `gemini-2.5-pro` | `responseMimeType: "application/json"` | `GeminiProvider.ts` |
| **OpenAI** | `gpt-4o-mini` | `gpt-4o` | `response_format: { type: "json_object" }` | `OpenAIProvider.ts` |
| **Anthropic** | `claude-3-5-sonnet-20241022` | `claude-3-haiku-20240307` | Prompt-instructed | `AnthropicProvider.ts` |
| **OpenRouter** | `anthropic/claude-3.5-sonnet` | — | OpenAI-compatible | `OpenRouterProvider.ts` |
| **Groq** | `llama-3.3-70b-versatile` | `llama-3.1-8b-instant` | OpenAI-compatible | `GroqProvider.ts` |
| **Perplexity** | — | — | Chat API | `PerplexityProvider.ts` |
| **OpenAI (via key)** | `gpt-4o-mini` | `gpt-4o` | Native | `OpenAIProvider.ts` |

### 6.3 Provider Factory

`ProviderFactory.create(provider, apiKey?)` instantiates the correct provider. Supports `"auto"` detection from key prefix. Falls back to env-configured keys when no BYOK key is provided.

### 6.4 Fallback Chain

**Priority order:** OpenRouter → Anthropic → Claude → OpenAI → Groq → Perplexity → Google (env key, always last)

**Immediate switch errors (no retry):**
- Rate limit / quota exceeded
- Timeout / network error / ECONNREFUSED
- Credit balance / billing / payment
- Invalid API key

**Retryable errors:** 3 attempts with exponential backoff, then switch provider.

---

## 7. Generation Pipeline

### 7.1 Token Budget Scaling

| Budget | Chapters | Tokens/Chapter |
|--------|----------|----------------|
| 2,000 | 2 | ~800 |
| 5,000 | 4 | ~1,000 |
| 12,000 | 8 | ~1,200 |
| 20,000 | 15+ | ~1,067 |

20% of budget is reserved for metadata (outline, slides, overview, takeaways).

### 7.2 Pipeline Steps

```
Input (UserInput)
  │
  ├─ 1. Generate Outline (JSON)
  │     → chapterCount chapters, each with 5-8 subtopics
  │     → Falls back to template if JSON parse fails
  │
  ├─ 2. Generate Chapters (loop)
  │     → For each chapter: markdown content with subtopics
  │     → Provider fallback on per-chapter errors
  │
  ├─ 3. Generate Slides (JSON)
  │     → title, bullets[], speakerNotes, visualSuggestion
  │
  ├─ 4. Generate Overview (JSON)
  │     → explanation, purpose, definitions, relevance
  │
  ├─ 5. Generate Takeaways (JSON)
  │     → insights[], decisions[], nextSteps[], recommendations[]
  │
  ├─ 6. Generate Agenda (JSON)
  │     → section, talkingPoint, time, notes
  │
  └─ 7. Generate Sources (JSON)
        → title, uri references
        
  → Returns: KnowledgePackage
```

### 7.3 Error Recovery

- Invalid outline JSON → use template structure
- Provider error mid-chapter → switch to next provider, resume
- All providers exhausted → throw descriptive error with attempted providers list

---

## 8. Export System

### 8.1 Server-Side Exports

All export routes accept the full `KnowledgePackage` as JSON body and return binary file downloads.

| Format | Library | Route | Content |
|--------|---------|-------|---------|
| **DOCX** | `docx` | `POST /api/export/docx` | Title, overview, chapters (with page breaks), slides appendix, takeaways |
| **PDF** | `pdfkit` | `POST /api/export/pdf` | Cover page, overview, chapters, slides summary, takeaways. A4, 72pt margins. |
| **PPTX** | `pptxgenjs` | `POST /api/export/pptx` | Title slide, TOC, overview, chapter dividers, content slides, takeaways, closing |
| **XLSX** | `exceljs` | `POST /api/export/xlsx` | Sheets: Overview, Chapters, Slides, Takeaways, Agenda. Styled headers, alternating rows. |

### 8.2 Client-Side Export

`pptxService.ts` generates PPTX directly in the browser using `pptxgenjs`. Color palette: Navy, Indigo, Sky, Emerald, Amber. Includes footers, page numbers, and speaker notes.

### 8.3 Export Flow

```
User clicks Export → Frontend POSTs KnowledgePackage to /api/export/{format}
→ Backend exporter generates binary buffer → Returns blob with Content-Disposition
→ Browser triggers file download
```

---

## 9. Authentication & Security

### 9.1 Auth Modes

| Mode | Trigger | User ID | Token |
|------|---------|---------|-------|
| **Local/Offline** (default) | `isSupabaseConfigured = false` | `local-dev-user` | `mock-token` |
| **Supabase** | Valid Supabase URL + anon key | Supabase user UUID | JWT |

Auth state managed via `AuthContext`. Token stored in `sessionStorage` (`meetcraft_auth_token`, `meetcraft_token_expiry`). 1-hour default expiry.

### 9.2 API Key Security

- **Encryption:** AES-256-CBC. Key from `ENCRYPTION_KEY` env var or ephemeral random.
- **Storage format:** `iv:ciphertext` (hex-encoded).
- **Display:** Masked to last 4 characters only.
- **Policy:** One active key per provider per user.
- **Local mode:** Keys stored in-memory (ephemeral, lost on server restart).

### 9.3 Input Validation

- **Generation endpoint:** Requires `topic` (non-empty), `audience`, `industry`, `duration` (>=5). Depth must be Beginner/Intermediate/Advanced. Token budget clamped: 1000-20000.
- **File upload:** 5MB limit, whitelist: PDF/TXT/MD only.
- **Auth middleware:** Available but currently not enforced on routes.

### 9.4 Error Sanitization

- No sensitive data in error responses
- Rate limit errors trigger provider switch (not exposed to user)
- Global error handler maps to standard HTTP codes

---

## 10. State Management

### 10.1 React Contexts

| Context | File | Purpose | Consumer Hook |
|---------|------|---------|---------------|
| `ThemeContext` | `context/ThemeContext.tsx` | Light/dark theme toggle. Persists to `localStorage` (`meetcraft-theme`). Applies `dark` class to `<html>`. | `useTheme()` |
| `ErrorContext` | `context/ErrorContext.tsx` | Error/notification state machine: `setError()`, `setSuccess()`, `setWarning()`, `setInfo()`. Loading state, retry counter (max 3). | `useErrorContext()` |
| `AuthContext` | `contexts/AuthContext.tsx` | Auth state: user, token, loading. Auto-initializes on mount. Falls back to mock on Supabase error. | `useAuth()` |

### 10.2 Persistence

| Data | Storage | Scope |
|------|---------|-------|
| Theme preference | `localStorage` (`meetcraft-theme`) | Permanent |
| Form state | `localStorage` | Permanent |
| Auth token | `sessionStorage` (`meetcraft_auth_token`) | Session |
| API keys (local mode) | In-memory Map (server) | Server lifetime |
| API keys (cloud mode) | Supabase `api_keys` table | Permanent |
| Generated packages (local) | `localStorage` (`kp_history`) | Permanent |
| Generated packages (cloud) | Supabase `projects` table | Permanent |

### 10.3 Storage Service (`storageService.ts`)

Methods: `savePackage()`, `updatePackage()`, `getPackage()`, `getAllPackages()`, `deletePackage()`.
Local mode uses localStorage with manual UUIDs. Cloud mode uses Supabase.

---

## 11. Type System

### 11.1 Core Types (`types.ts`)

```typescript
interface UserInput {
  topic: string
  audience: string        // 11 options (General Professional, C-Suite, etc.)
  duration: number        // minutes
  industry: string        // 13 industry categories
  depth: 'Beginner' | 'Intermediate' | 'Advanced'
  tone: 'Professional' | 'Educational' | 'Executive' | 'Storytelling'
  mode?: 'Standard' | 'Executive' | 'Academic' | 'Debate'
  documentPages?: number  // 10-100
  slideCount?: number     // 10-50
  maxTokens?: number      // 2000-20000
}

interface KnowledgePackage {
  meta: UserInput
  overview: TopicOverview       // explanation, purpose, definitions, relevance
  agenda: AgendaItem[]          // section, talkingPoint, time, notes
  bookChapters: BookChapter[]   // title, content (markdown), diagram (mermaid)
  slides: Slide[]               // title, bullets[], speakerNotes, visualSuggestion
  takeaways: Takeaways          // insights[], decisions[], nextSteps[], recommendations[]
  sources: Source[]             // title, uri
}
```

### 11.2 Feature Types

```typescript
interface QuizQuestion    { question, options[], correctAnswer, explanation }
interface QuizData        { title, questions[] }
interface Flashcard       { term, definition, category }
interface ChatMessage     { id, role: 'user'|'model', text, timestamp }
interface VideoData       { id, url, prompt, createdAt, status }
interface PodcastData     { id, audioUrl, script, createdAt }
```

### 11.3 UI Types

```typescript
type ViewMode = 'form' | 'loading' | 'dashboard'
type DashboardTab = 'doc' | 'slides' | 'spreadsheet' | 'chat' |
                    'quiz' | 'flashcards' | 'video' | 'podcast' | 'voice'
```

### 11.4 Token Budget Constants

```typescript
const TOKEN_PRESETS = [
  { label: 'Quick Summary',   value: 2000  },
  { label: 'Standard',        value: 5000  },
  { label: 'Detailed Guide',  value: 12000 },
  { label: 'Full Textbook',   value: 20000 }
]
const DEFAULT_MAX_TOKENS  = 12_000
const ABSOLUTE_MAX_TOKENS = 20_000
```

---

## 12. Styling & Theming

### 12.1 CSS Framework

- **Tailwind CSS 4.2** with PostCSS
- **Dark mode:** `class` strategy — toggles `dark` on `<html>`
- **Responsive:** Mobile-first breakpoints (sm, md, lg, xl)
- **Custom animations:** fade-in, slide-in, zoom-in

### 12.2 Theme Presets (`themes.ts`)

| Theme | Primary | Style |
|-------|---------|-------|
| **Corporate Blue** (default) | Indigo 700 | Professional, Inter sans-serif |
| **Startup Minimal** | Black | No shadows, no border-radius |
| **Midnight Pro** | Indigo 400 | Dark mode, Slate 900 background |
| **Academic Serif** | Orange 900 | Warm paper, Merriweather serif |

Themes are selectable via Settings modal and affect the overall color scheme and typography.

---

## 13. WebSocket / Real-Time

### 13.1 Gemini Live Audio (`server/index.ts`)

- **Endpoint:** `wss://localhost:5001/ws/live`
- **Model:** `gemini-2.5-flash-native-audio-preview-12-2025`
- **Purpose:** Bidirectional audio streaming for VoiceTutor
- **Flow:** Client → WebSocket → Server → Gemini Live API → Server → Client
- **Error handling:** Connection errors relayed to client, auto-close on disconnect

### 13.2 Browser TTS (`ttsService.ts`)

- Uses Web Speech API (`SpeechSynthesisUtterance`)
- Features: play, pause, stop, next/prev chapter, auto-advance
- Voice preference: "Google US English" > "Samantha" > "Microsoft Zira"
- Strips markdown before speaking
- Observer pattern for state updates (`subscribe()`)

---

## 14. Desktop Build (Electron)

### 14.1 Configuration

- **Directory:** `electron/`
- **Script:** `npm run dev:desktop` (server + client + Electron)
- **Build:** `npm run build:desktop` (vite build + electron-builder)

### 14.2 Target Platforms

| Platform | Format |
|----------|--------|
| Windows | NSIS installer + portable |
| macOS | DMG |
| Linux | AppImage + .deb |

- **ASAR:** Enabled (app packaged into archive)
- **Extra resources:** Server directory bundled into .asar

---

## 15. Data Flow Diagrams

### 15.1 Content Generation

```
User → Form.tsx → generateKnowledgePackage(input)
  → POST /api/ai/generate
    → routes.ts: validate input, check feature gate
    → aiOrchestrator.generateKnowledgePackage(input, userId)
      → keyManager: fetch active BYOK keys
      → Build provider chain (BYOK priority + env Gemini fallback)
      → Generate outline → chapters → slides → overview → takeaways → agenda → sources
      → Provider fallback on errors
    → Return KnowledgePackage JSON
  → App.tsx: setView('dashboard')
  → Dashboard.tsx: render 9 tabs
```

### 15.2 BYOK Key Management

```
User → SettingsModal → Enter API key
  → Client-side prefix validation
  → POST /api/ai/keys { provider, key, label }
    → providerDetector: auto-detect if "Auto-Detect"
    → keyManager.saveKey(): encrypt (AES-256-CBC), mask, store
    → Deactivate other keys for same provider
  → Return { id, provider, mask, label }

On Generation:
  → aiOrchestrator: keyManager.getActiveKey(userId, provider) for each provider
  → Decrypt key → instantiate provider → try generation
```

### 15.3 Export

```
User → Dashboard → Export dropdown → Select format
  → POST /api/export/{format} with KnowledgePackage body
    → exporter.exportTo{Format}(data)
    → Generate binary buffer
    → Return blob (Content-Disposition: attachment)
  → Browser downloads file
```

---

## 16. API Reference

### 16.1 AI Routes (`/api/ai/*`)

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| `POST` | `/generate` | `UserInput` | `KnowledgePackage` | Main generation endpoint |
| `POST` | `/upload` | `multipart/form-data` (file) | `KnowledgePackage` | Upload document → extract text → generate |
| `POST` | `/chat` | `{ message, context }` | `{ reply }` | AI tutor chat |
| `GET` | `/keys` | — | `Key[]` (masked) | List saved API keys |
| `POST` | `/keys` | `{ provider, key, label }` | `Key` (masked) | Save new API key |
| `DELETE` | `/keys/:id` | — | `{ success }` | Delete API key |
| `GET` | `/quota` | — | `{ tier, limits, usage }` | User quota info |
| `POST` | `/quiz` | `KnowledgePackage` | `501` | Not implemented |
| `POST` | `/flashcards` | `KnowledgePackage` | `501` | Not implemented |
| `POST` | `/image` | `{ prompt }` | `501` | Not implemented |
| `POST` | `/video` | `{ prompt }` | `501` | Not implemented |
| `POST` | `/podcast` | `{ topic, content }` | `501` | Not implemented |

### 16.2 Export Routes (`/api/export/*`)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/docx` | `KnowledgePackage` | `.docx` binary |
| `POST` | `/pdf` | `KnowledgePackage` | `.pdf` binary |
| `POST` | `/pptx` | `KnowledgePackage` | `.pptx` binary |
| `POST` | `/xlsx` | `KnowledgePackage` | `.xlsx` binary |

### 16.3 System

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/health` | `{ status: 'ok', env }` |
| `WSS` | `/ws/live` | Gemini Live Audio bidirectional stream |

---

## 17. File Map

```
meetcraft-ai/
├── index.html                    — HTML shell
├── index.tsx                     — React DOM entry point
├── App.tsx                       — Main app shell (form → loading → dashboard)
├── types.ts                      — Shared interfaces, enums, constants
├── themes.ts                     — 4 theme presets (Corporate, Minimal, Midnight, Academic)
├── vite.config.ts                — Vite: port 3000, proxy /api → :5001
├── tailwind.config.ts            — Tailwind: dark mode class strategy
├── tsconfig.json                 — TS: ES2022, ESNext modules, @/* alias
├── package.json                  — Scripts: dev, server, client, build, build:desktop
│
├── components/
│   ├── Form.tsx                  — Generation form (topic, settings, upload, token budget)
│   ├── FormValidation.tsx        — Input validation
│   ├── Dashboard.tsx             — Tab navigation + export dropdown
│   ├── DocumentView.tsx          — Textbook viewer (markdown, Mermaid, TOC)
│   ├── PresentationView.tsx      — Slide deck preview
│   ├── SpreadsheetView.tsx       — Data table viewer
│   ├── ChatView.tsx              — AI tutor chat
│   ├── QuizView.tsx              — Interactive MCQ quiz
│   ├── FlashcardView.tsx         — Spaced repetition cards
│   ├── VideoGenerator.tsx        — Video generation UI (placeholder)
│   ├── PodcastStudio.tsx         — Podcast creation UI
│   ├── VoiceTutor.tsx            — Live voice session (WebSocket)
│   ├── AudioPlayer.tsx           — Browser TTS playback
│   ├── GenerationProgress.tsx    — 4-step progress indicator
│   ├── SettingsModal.tsx         — API key management
│   ├── ErrorBoundary.tsx         — React error boundary
│   ├── RetryButton.tsx           — Retry action handler
│   ├── ui/Shared.tsx             — Card, Badge, Button, Input primitives
│   └── Alerts/                   — Error, Success, Warning, Info banners
│
├── pages/
│   ├── LoginPage.tsx             — Authentication UI
│   ├── LandingPage.tsx           — Marketing page
│   ├── WorkspacePage.tsx         — Project management
│   ├── EditorPage.tsx            — Content editor
│   └── DownloadPage.tsx          — File download handler
│
├── context/
│   ├── ThemeContext.tsx           — Dark/light theme (localStorage)
│   └── ErrorContext.tsx           — Error/notification state machine
│
├── contexts/
│   └── AuthContext.tsx            — Auth provider (local mock / Supabase)
│
├── services/
│   ├── geminiService.ts          — Frontend API client (generate, chat, export)
│   ├── supabaseClient.ts         — Frontend Supabase mock client
│   ├── storageService.ts         — Project persistence (localStorage / Supabase)
│   ├── pptxService.ts            — Client-side PowerPoint generation
│   └── ttsService.ts             — Browser speech synthesis (Web Speech API)
│
├── utils/
│   └── apiErrorHandler.ts        — HTTP error → user-friendly message mapper
│
├── server/
│   ├── index.ts                  — Express + WebSocket bootstrap (port 5001)
│   ├── routes.ts                 — /api/ai/* route handlers
│   ├── exportRoutes.ts           — /api/export/* route handlers
│   ├── aiOrchestrator.ts         — Generation pipeline + provider fallback
│   ├── featureGate.ts            — Tier-based access control
│   │
│   ├── providers/
│   │   ├── AIProvider.ts         — Provider interface
│   │   ├── GeminiProvider.ts     — Google Gemini (default)
│   │   ├── OpenAIProvider.ts     — OpenAI GPT
│   │   ├── AnthropicProvider.ts  — Anthropic Claude
│   │   ├── OpenRouterProvider.ts — OpenRouter gateway
│   │   ├── GroqProvider.ts       — Groq fast inference
│   │   ├── PerplexityProvider.ts — Perplexity chat
│   │   └── ProviderFactory.ts    — Provider instantiation factory
│   │
│   ├── lib/
│   │   └── supabase.ts           — Backend Supabase client / mock
│   │
│   ├── services/
│   │   └── keyManager.ts         — BYOK key encryption & storage
│   │
│   ├── middleware/
│   │   ├── auth.ts               — Bearer token validation
│   │   ├── errorHandler.ts       — Global error handler
│   │   └── upload.ts             — Multer file upload (5MB, PDF/TXT/MD)
│   │
│   └── utils/
│       ├── exporter.ts           — DOCX, PDF, XLSX, PPTX generation
│       ├── crypto.ts             — AES-256-CBC encryption
│       ├── providerDetector.ts   — Key prefix → provider mapping
│       └── textExtractor.ts      — PDF/TXT/MD text extraction
│
└── electron/                     — Electron desktop build config
```

---

## 18. Extension Points

| Task | Steps |
|------|-------|
| **Add AI provider** | Implement `AIProvider` interface → register in `ProviderFactory` → add prefix to `providerDetector` → add to SettingsModal provider list |
| **Add export format** | Create exporter function in `utils/exporter.ts` → add route in `exportRoutes.ts` → add button in `Dashboard.tsx` |
| **Add dashboard tab** | Create view component → add to `DashboardTab` type in `types.ts` → wire into `Dashboard.tsx` tab list |
| **Add generation feature** | Add route in `routes.ts` → implement logic in `aiOrchestrator.ts` or custom handler → add frontend service method |
| **Add UI theme** | Add entry to `THEMES` in `themes.ts` → update theme selector in SettingsModal |

---

## 19. Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| Image generation | 501 | Route exists, not implemented |
| Video generation | 501 | Route exists, not implemented |
| Podcast generation | 501 | Route exists, not implemented |
| Quiz generation | 501 | Route exists, not implemented |
| Flashcard generation | 501 | Route exists, not implemented |
| Server-side TTS | Not available | Uses browser Web Speech API only |
| Feature gate usage tracking | Mocked | Always returns 0 usage |
| Multi-device sync | Not available | Requires Supabase configuration |
| Auth enforcement | Disabled | Middleware exists but not wired to routes |

---

## 20. Known Pitfalls

1. **Port 5000** — macOS AirPlay Receiver occupies this port and returns 403. Never use it.
2. **Port consistency** — If ports change, update ALL THREE: `.env PORT`, `server/index.ts`, `vite.config.ts` proxy target.
3. **Gemini 1.5 models** — Deprecated and blocked for new API keys. Use 2.5 series.
4. **Gemini thinking models** — Consume output tokens for reasoning. Always set `responseMimeType: "application/json"` and min 4096 tokens.
5. **Supabase placeholder check** — Must be case-insensitive (`.toLowerCase().includes('placeholder')`).
6. **Claude Max subscription** — Consumer subscription with no API access. Requires separate Anthropic developer billing.
7. **`npm run client` alone** — Frontend can't reach backend (proxy fails). Always use `npm run dev`.
8. **Ephemeral encryption key** — If `ENCRYPTION_KEY` not set in .env, API keys are encrypted with a random key and lost on server restart.
9. **In-memory key storage** — Local mode stores BYOK keys in a Map; all keys are lost when the server process ends.

---

## How to Run

### Development
```bash
npm run dev          # Runs both server (5001) + client (3000) via concurrently
```

### Desktop Development
```bash
npm run dev:desktop  # Server + client + Electron
```

### Production Build
```bash
npm run build        # Vite production build
node dist/server/index.js  # Start server (requires TS compilation)
```

### Desktop Build
```bash
npm run build:desktop  # Vite build + electron-builder
```
