import { AIProvider } from "./AIProvider";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const DEFAULT_MODEL      = "sonar-medium-online";
const FALLBACK_MODEL     = "sonar-small-online";

function isModelError(status: number, msg: string): boolean {
  return status === 404 ||
    msg.toLowerCase().includes("model not found") ||
    msg.toLowerCase().includes("model_not_found") ||
    msg.toLowerCase().includes("model_decommissioned") ||
    msg.toLowerCase().includes("invalid_model") ||
    msg.toLowerCase().includes("deprecated") ||
    msg.toLowerCase().includes("does not exist");
}

export class PerplexityProvider implements AIProvider {

  constructor(private apiKey: string) {}

  async generateText(prompt: string, model = DEFAULT_MODEL): Promise<string> {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type":  "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: "system",  content: "You are a precise AI that follows instructions exactly." },
          { role: "user",    content: prompt }
        ]
      })
    });

    const data = await response.json() as any;

    if (!response.ok) {
      const errMsg: string = data?.error?.message || data?.detail || "Perplexity API error";
      if (isModelError(response.status, errMsg) && model !== FALLBACK_MODEL) {
        console.warn(`[PerplexityProvider] Model ${model} unavailable, retrying with ${FALLBACK_MODEL}`);
        return this.generateText(prompt, FALLBACK_MODEL);
      }
      if (response.status === 401) { console.error("[PerplexityProvider] Invalid API key:", errMsg); throw new Error(`Invalid Perplexity API key. ${errMsg}`); }
      if (response.status === 429) { console.error("[PerplexityProvider] Rate limit:", errMsg);      throw new Error(`Perplexity rate limit exceeded. ${errMsg}`); }
      console.error("[PerplexityProvider] API error:", data);
      throw new Error(errMsg);
    }

    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text) { console.error("[PerplexityProvider] Empty response:", data); throw new Error("Empty response from Perplexity"); }
    return text;
  }

  async generateJSON(prompt: string, model = DEFAULT_MODEL): Promise<any> {
    const enrichedPrompt = `${prompt}\n\nReturn ONLY valid JSON. Do not include explanations, markdown formatting, or any text outside the JSON.`;
    const text = await this.generateText(enrichedPrompt, model);

    if (!text || text.trim().length === 0) throw new Error("Empty response from Perplexity");

    // 1. Direct parse
    try { return JSON.parse(text); } catch {}

    // 2. Strip markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()); } catch {} }

    // 3. Extract bare {...} block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) { try { return JSON.parse(braceMatch[0]); } catch {} }

    console.error("[PerplexityProvider] Could not parse JSON. Raw output:\n", text);
    throw new Error("Perplexity response did not contain valid JSON");
  }
}
