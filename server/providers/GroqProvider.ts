import { AIProvider } from "./AIProvider";

const GROQ_API_URL   = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL  = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";
const TIMEOUT_MS     = 30_000;

function isModelError(status: number, msg: string): boolean {
  return status === 404 ||
    msg.toLowerCase().includes("model not found") ||
    msg.toLowerCase().includes("model_not_found") ||
    msg.toLowerCase().includes("model_decommissioned") ||
    msg.toLowerCase().includes("invalid_model") ||
    msg.toLowerCase().includes("deprecated") ||
    msg.toLowerCase().includes("does not exist");
}

export class GroqProvider implements AIProvider {

  constructor(private apiKey: string) {}

  async generateText(prompt: string, model = DEFAULT_MODEL, maxTokens = 2000): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: "You are a precise AI that follows instructions exactly." },
            { role: "user",   content: prompt }
          ]
        }),
        signal: controller.signal
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        console.error(`[GroqProvider] Request timed out after ${TIMEOUT_MS / 1000}s`);
        throw new Error("Groq request timed out. Please try again.");
      }
      console.error("[GroqProvider] Network error:", err.message);
      throw new Error(`Groq network error: ${err.message}`);
    }
    clearTimeout(timeout);

    const data = await response.json() as any;

    if (!response.ok) {
      const errMsg: string = data?.error?.message || "Groq API error";
      if (isModelError(response.status, errMsg) && model !== FALLBACK_MODEL) {
        console.warn(`[GroqProvider] Model ${model} unavailable, retrying with ${FALLBACK_MODEL}`);
        console.log("[GroqProvider] Retrying request...");
        return this.generateText(prompt, FALLBACK_MODEL, maxTokens);
      }
      if (response.status === 401) { console.error("[GroqProvider] Invalid API key:", errMsg);      throw new Error(`Invalid Groq API key. ${errMsg}`); }
      if (response.status === 429) { console.error("[GroqProvider] Rate limit exceeded:", errMsg);  throw new Error(`Groq rate limit exceeded. ${errMsg}`); }
      console.error("[GroqProvider] API error:", data);
      throw new Error(errMsg);
    }

    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text) { console.error("[GroqProvider] Empty response:", data); throw new Error("Empty response from Groq"); }
    return text;
  }

  async generateJSON(prompt: string, model = DEFAULT_MODEL, maxTokens = 2000): Promise<any> {
    const text = await this.generateText(
      `${prompt}\n\nReturn ONLY valid JSON. Do not include explanations, markdown formatting, or any text outside the JSON structure.`,
      model,
      maxTokens
    );

    if (!text || text.trim().length === 0) throw new Error("Empty response from Groq");

    // 1. Direct parse
    try { return JSON.parse(text); } catch {}

    // 2. Strip markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()); } catch {} }

    // 3. Extract bare {...} block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) { try { return JSON.parse(braceMatch[0]); } catch {} }

    console.error("[GroqProvider] Could not parse JSON. Raw output:\n", text);
    throw new Error("Groq response did not contain valid JSON");
  }
}
