import { AIProvider } from "./AIProvider";

const OPENAI_API_URL  = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL   = "gpt-4o-mini";
const FALLBACK_MODEL  = "gpt-4o";

function isModelError(status: number, msg: string): boolean {
  return status === 404 ||
    msg.toLowerCase().includes("model not found") ||
    msg.toLowerCase().includes("model_not_found") ||
    msg.toLowerCase().includes("model_decommissioned") ||
    msg.toLowerCase().includes("invalid_model") ||
    msg.toLowerCase().includes("deprecated") ||
    msg.toLowerCase().includes("does not exist");
}

export class OpenAIProvider implements AIProvider {

  constructor(private apiKey: string) {}

  async generateText(prompt: string, model = DEFAULT_MODEL, maxTokens = 2000): Promise<string> {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type":  "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: maxTokens,
        messages: [
          { role: "system",  content: "You are a precise AI that follows instructions exactly." },
          { role: "user",    content: prompt }
        ]
      })
    });

    const data = await response.json() as any;

    if (!response.ok) {
      const errMsg: string = data?.error?.message || "OpenAI API error";
      if (isModelError(response.status, errMsg) && model !== FALLBACK_MODEL) {
        console.warn(`[OpenAIProvider] Model ${model} unavailable, retrying with ${FALLBACK_MODEL}`);
        return this.generateText(prompt, FALLBACK_MODEL, maxTokens);
      }
      if (response.status === 401)              { console.error("[OpenAIProvider] Invalid API key:", errMsg);               throw new Error(`Invalid OpenAI API key. ${errMsg}`); }
      if (response.status === 429)              { console.error("[OpenAIProvider] Rate limit / quota:", errMsg);             throw new Error(`OpenAI rate limit or quota exceeded. ${errMsg}`); }
      if (data?.error?.code === "context_length_exceeded") { console.error("[OpenAIProvider] Context too long:", errMsg);   throw new Error(`Prompt too long for model. ${errMsg}`); }
      console.error("[OpenAIProvider] API error:", data);
      throw new Error(errMsg);
    }

    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text) { console.error("[OpenAIProvider] Empty content in response:", data); throw new Error("Empty response from OpenAI"); }
    return text;
  }

  async generateJSON(prompt: string, model = DEFAULT_MODEL, maxTokens = 2000): Promise<any> {
    // Use response_format to force JSON output when the model supports it
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type":  "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system",  content: "Return ONLY valid JSON. Do not include explanations, markdown, or any text outside the JSON structure." },
          { role: "user",    content: prompt }
        ]
      })
    });

    const data = await response.json() as any;

    if (!response.ok) {
      const errMsg: string = data?.error?.message || "OpenAI API error";
      if (isModelError(response.status, errMsg) && model !== FALLBACK_MODEL) {
        console.warn(`[OpenAIProvider] Model ${model} unavailable, retrying with ${FALLBACK_MODEL}`);
        return this.generateJSON(prompt, FALLBACK_MODEL, maxTokens);
      }
      if (response.status === 401) { console.error("[OpenAIProvider] Invalid API key:", errMsg); throw new Error(`Invalid OpenAI API key. ${errMsg}`); }
      if (response.status === 429) { console.error("[OpenAIProvider] Rate limit / quota:", errMsg); throw new Error(`OpenAI rate limit or quota exceeded. ${errMsg}`); }
      console.error("[OpenAIProvider] API error:", data);
      throw new Error(errMsg);
    }

    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text || text.trim().length === 0) throw new Error("Empty response from OpenAI");

    // 1. Direct parse
    try { return JSON.parse(text); } catch {}

    // 2. Strip markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()); } catch {} }

    // 3. Extract bare {...} block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) { try { return JSON.parse(braceMatch[0]); } catch {} }

    console.error("[OpenAIProvider] Could not parse JSON. Raw output:\n", text);
    throw new Error("OpenAI response did not contain valid JSON");
  }
}
