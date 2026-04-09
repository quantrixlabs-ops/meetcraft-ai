# MeetCraft AI — Architecture Reference

> This file locks the known-good configuration. Read before making changes.

## Ports (CRITICAL)

| Service        | Port | Notes |
|----------------|------|-------|
| Vite (frontend)| 3000 | `vite.config.ts` → `server.port` |
| Backend (API)  | 5001 | `server/index.ts` → `process.env.PORT \|\| 5001` |
| Vite proxy     | →5001| `vite.config.ts` → `proxy["/api"].target` |

**macOS AirPlay Receiver uses port 5000.** Never use port 5000.  
If ports change, update ALL THREE locations: `.env PORT`, `server/index.ts`, `vite.config.ts proxy target`.

## Start command

```bash
npm run dev   # runs both server + client via concurrently
```

Never run `npm run client` alone — the frontend needs the backend proxy.

## AI Provider Configuration

### Gemini (default, env fallback)
- **Models**: `gemini-2.5-flash` (default) → `gemini-2.5-pro` (fallback)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **JSON mode**: Uses `responseMimeType: "application/json"` (no markdown fences)
- **Min JSON tokens**: 4096 (thinking model overhead)
- **File**: `server/providers/GeminiProvider.ts`

### Groq
- **Models**: `llama-3.3-70b-versatile` → `llama-3.1-8b-instant`
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **File**: `server/providers/GroqProvider.ts`

### Anthropic (Claude)
- **Models**: `claude-3-5-sonnet-20241022` → `claude-3-haiku-20240307`
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Header**: `anthropic-version: 2023-06-01`
- **Claude Max subscription does NOT include API credits** — requires separate Anthropic API billing
- **File**: `server/providers/AnthropicProvider.ts`

### OpenRouter
- **Models**: `anthropic/claude-3.5-sonnet`
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **File**: `server/providers/OpenRouterProvider.ts`

## Provider Fallback Chain

```
User BYOK keys (priority order) → Environment Gemini key (always last)
```

Priority: `openrouter → anthropic → claude → openai → groq → perplexity → google`

Errors that trigger **immediate** provider switch (no retry):
- rate limit, quota, capacity
- timeout, network error, econnrefused
- credit balance, billing, payment
- invalid api key

Other errors: retry 3× with exponential backoff, then switch provider.

## Supabase / Mock Mode

- **Backend mock**: `server/lib/supabase.ts` — activated when URL contains `placeholder` (case-insensitive)
- **Frontend mock**: `services/supabaseClient.ts` — hardcoded `isSupabaseConfigured = false`
- Mock client is chainable: supports `select().eq().order()`, `update().eq()`, `delete().eq()` etc.
- `anon` and `local-dev-user` IDs bypass all Supabase calls in `keyManager` and `featureGate`

## Token Budget System

- Presets: 2000 (Quick) | 5000 (Standard) | 12000 (Detailed) | 20000 (Full)
- Default: 12000, Max: 20000
- Backend enforces in `server/routes.ts`: `Math.min(maxTokens ?? 12000, 20000)`
- Orchestrator scales chapter count and per-call tokens proportionally
- Defined in `types.ts`: `TOKEN_PRESETS`, `DEFAULT_MAX_TOKENS`, `MAX_TOKEN_LIMIT`

## File Map

```
server/
  index.ts              — Express + WebSocket setup, PORT config
  routes.ts             — /api/ai/* route handlers
  exportRoutes.ts       — /api/export/* (docx, pdf, pptx, xlsx)
  aiOrchestrator.ts     — Generation pipeline + provider fallback
  providers/
    AIProvider.ts       — Interface: generateText(prompt, model?, maxTokens?)
    GeminiProvider.ts   — Default provider (gemini-2.5-flash)
    GroqProvider.ts     — Fast inference
    AnthropicProvider.ts— Claude direct API
    OpenRouterProvider.ts— Universal gateway
    ProviderFactory.ts  — Provider instantiation
  lib/supabase.ts       — Backend Supabase client / mock
  services/keyManager.ts— BYOK key storage
  featureGate.ts        — Tier-based access control

components/
  Form.tsx              — Generation form + token preset selector
  Dashboard.tsx         — Content viewer + export dropdown
  SettingsModal.tsx     — API key management

services/
  geminiService.ts      — Frontend API client + export helpers
  pptxService.ts        — Client-side PowerPoint generation
  supabaseClient.ts     — Frontend Supabase mock

types.ts                — Shared interfaces + TOKEN_PRESETS
```

## Known Pitfalls

1. **Port 5000** — macOS AirPlay. Returns 403. Never use it.
2. **Gemini 1.5 models** — Deprecated and blocked for new API keys. Use 2.5.
3. **Gemini thinking models** — Consume output tokens for reasoning. Always set `responseMimeType: "application/json"` for JSON calls and min 4096 tokens.
4. **Supabase placeholder check** — Must be case-insensitive (`.toLowerCase().includes('placeholder')`).
5. **Claude Max** — Consumer subscription, no API access. Need Anthropic developer billing.
6. **`npm run client` alone** — Frontend can't reach backend. Always use `npm run dev`.

## Dark Mode

- `ThemeProvider` wraps entire app in `App.tsx`
- Persists to `localStorage` key `meetcraft-theme`
- Applies `dark` class to `<html>` element
- All Form.tsx inputs/cards/labels have `dark:` Tailwind variants
