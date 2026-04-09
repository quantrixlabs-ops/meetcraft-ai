import { AIProvider } from "./AIProvider";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL  = "claude-3-5-sonnet-20241022";
const FALLBACK_MODEL = "claude-3-haiku-20240307";
const TIMEOUT_MS     = 60_000;

function isModelError(status: number, msg: string): boolean {
  return status === 404 ||
    msg.toLowerCase().includes("model not found") ||
    msg.toLowerCase().includes("model_not_found") ||
    msg.toLowerCase().includes("model_decommissioned") ||
    msg.toLowerCase().includes("invalid_model") ||
    msg.toLowerCase().includes("deprecated") ||
    msg.toLowerCase().includes("does not exist");
}

export class AnthropicProvider implements AIProvider {

  constructor(private apiKey: string) {}

  async generateText(prompt: string, model = DEFAULT_MODEL, maxTokens = 2000): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }]
        }),
        signal: controller.signal
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        console.error(`[AnthropicProvider] Request timed out after ${TIMEOUT_MS / 1000}s`);
        throw new Error("Anthropic request timed out. Will try next provider.");
      }
      console.error("[AnthropicProvider] Network error:", err.message);
      throw new Error(`Anthropic network error: ${err.message}`);
    }
    clearTimeout(timeout);

    const data = await response.json() as any;

    if (!response.ok) {
      const errType: string = data?.error?.type || "unknown_error";
      const errMsg: string = data?.error?.message || "Anthropic API error";

      if (isModelError(response.status, errMsg) && model !== FALLBACK_MODEL) {
        console.warn(`[AnthropicProvider] Model ${model} unavailable, retrying with ${FALLBACK_MODEL}`);
        return this.generateText(prompt, FALLBACK_MODEL, maxTokens);
      }
      if (response.status === 401) {
        console.error("[AnthropicProvider] Invalid API key:", errMsg);
        throw new Error(`Invalid Anthropic API key. ${errMsg}`);
      }
      if (response.status === 403) {
        console.error("[AnthropicProvider] Billing / permission error:", errMsg);
        throw new Error(`Anthropic credit balance too low or billing not set up. ${errMsg}`);
      }
      if (response.status === 429) {
        console.error("[AnthropicProvider] Rate limit or credit exhausted:", errMsg);
        throw new Error(`Anthropic rate limit or credits exhausted. ${errMsg}`);
      }
      if (errType === "overloaded_error") {
        console.error("[AnthropicProvider] API overloaded:", errMsg);
        throw new Error(`Anthropic API overloaded. Please retry. ${errMsg}`);
      }

      console.error("[AnthropicProvider] API error:", data);
      throw new Error(errMsg);
    }

    const text: string = data?.content?.[0]?.text ?? "";
    if (!text) {
      console.error("[AnthropicProvider] Empty content in response:", data);
      throw new Error("Empty response from Anthropic API");
    }

    return text;
  }

  async generateJSON(prompt: string, model = DEFAULT_MODEL, maxTokens = 2000): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: "Return ONLY valid JSON. Do not include explanations, markdown formatting, code fences, or any text outside the JSON structure.",
          messages: [{ role: "user", content: prompt }]
        }),
        signal: controller.signal
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        console.error(`[AnthropicProvider] Request timed out after ${TIMEOUT_MS / 1000}s`);
        throw new Error("Anthropic request timed out. Will try next provider.");
      }
      console.error("[AnthropicProvider] Network error:", err.message);
      throw new Error(`Anthropic network error: ${err.message}`);
    }
    clearTimeout(timeout);

    const data = await response.json() as any;

    if (!response.ok) {
      const errType: string = data?.error?.type || "unknown_error";
      const errMsg: string = data?.error?.message || "Anthropic API error";

      if (isModelError(response.status, errMsg) && model !== FALLBACK_MODEL) {
        console.warn(`[AnthropicProvider] Model ${model} unavailable, retrying with ${FALLBACK_MODEL}`);
        return this.generateJSON(prompt, FALLBACK_MODEL, maxTokens);
      }
      if (response.status === 401) {
        console.error("[AnthropicProvider] Invalid API key:", errMsg);
        throw new Error(`Invalid Anthropic API key. ${errMsg}`);
      }
      if (response.status === 403) {
        console.error("[AnthropicProvider] Billing / permission error:", errMsg);
        throw new Error(`Anthropic credit balance too low or billing not set up. ${errMsg}`);
      }
      if (response.status === 429) {
        console.error("[AnthropicProvider] Rate limit or credit exhausted:", errMsg);
        throw new Error(`Anthropic rate limit or credits exhausted. ${errMsg}`);
      }
      if (errType === "overloaded_error") {
        console.error("[AnthropicProvider] API overloaded:", errMsg);
        throw new Error(`Anthropic API overloaded. Please retry. ${errMsg}`);
      }

      console.error("[AnthropicProvider] API error:", data);
      throw new Error(errMsg);
    }

    const text: string = data?.content?.[0]?.text ?? "";

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Anthropic API");
    }

    // 1. Try direct parse
    try {
      return JSON.parse(text);
    } catch {}

    // 2. Extract JSON block (handles any accidental markdown fence wrapping)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {}
    }

    // 3. Extract raw {...} block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {}
    }

    // 4. Log raw output for debugging and throw
    console.error("[AnthropicProvider] Could not parse JSON. Raw output:\n", text);
    throw new Error("Anthropic response did not contain valid JSON");
  }
}
