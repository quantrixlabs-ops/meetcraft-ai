import { GeminiProvider } from "./GeminiProvider";
import { OpenRouterProvider } from "./OpenRouterProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { PerplexityProvider } from "./PerplexityProvider";
import { GroqProvider } from "./GroqProvider";
import { AIProvider } from "./AIProvider";
import { detectProvider } from "../utils/providerDetector";

export class ProviderFactory {

  static create(provider: string, apiKey?: string): AIProvider {
    // If caller passes a raw key as provider (shouldn't happen, but safe guard)
    const resolvedProvider = provider === "auto" && apiKey ? detectProvider(apiKey) : provider;

    switch (resolvedProvider) {

      case "google": {
        const key = apiKey || process.env.VITE_GEMINI_API_KEY;
        if (!key) throw new Error("Gemini API key missing");
        return new GeminiProvider(key);
      }

      case "openrouter": {
        const key = apiKey || process.env.OPENROUTER_API_KEY;
        if (!key) throw new Error("OpenRouter API key missing");
        return new OpenRouterProvider(key);
      }

      case "openai": {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key) throw new Error("OpenAI API key missing. Set OPENAI_API_KEY in .env or save a key via Settings.");
        return new OpenAIProvider(key);
      }

      // "claude" (legacy alias) — routes to Anthropic direct API
      case "claude":
      case "anthropic": {
        const key = apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
        if (!key) throw new Error("Anthropic API key missing. Set ANTHROPIC_API_KEY in .env or save a key via Settings.");
        return new AnthropicProvider(key);
      }

      case "perplexity": {
        const key = apiKey || process.env.PERPLEXITY_API_KEY;
        if (!key) throw new Error("Perplexity API key missing. Set PERPLEXITY_API_KEY in .env or save a key via Settings.");
        return new PerplexityProvider(key);
      }

      case "groq": {
        const key = apiKey || process.env.GROQ_API_KEY;
        if (!key) throw new Error("Groq API key missing. Set GROQ_API_KEY in .env or save a key via Settings.");
        return new GroqProvider(key);
      }

      default:
        throw new Error(`Unsupported AI provider: ${resolvedProvider}`);
    }

  }

}