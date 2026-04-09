/**
 * Detects the AI provider from an API key based on well-known key prefixes.
 * Order matters — more specific prefixes must be checked before shorter ones
 * (e.g. "sk-ant-" before "sk-", "sk-or-" before "sk-").
 */
export function detectProvider(apiKey: string): string {
  const key = apiKey.trim();

  if (key.startsWith("AIza"))    return "google";
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("sk-or-"))  return "openrouter";
  if (key.startsWith("pplx-"))   return "perplexity";
  if (key.startsWith("gsk_"))    return "groq";
  if (key.startsWith("sk-"))     return "openai";

  // Fallback: cannot determine — default to google so callers get a clear error
  console.warn(`[providerDetector] Unrecognised API key format (first 6 chars: "${key.slice(0, 6)}"). Defaulting to google.`);
  return "google";
}

/**
 * Returns a human-readable label for a provider id.
 */
export function providerDisplayName(provider: string): string {
  const MAP: Record<string, string> = {
    google:     "Google Gemini",
    openrouter: "OpenRouter",
    anthropic:  "Anthropic Claude",
    claude:     "Anthropic Claude",
    openai:     "OpenAI",
    perplexity: "Perplexity",
  };
  return MAP[provider] ?? provider;
}
