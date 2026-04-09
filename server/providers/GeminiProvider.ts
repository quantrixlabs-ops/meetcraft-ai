import { AIProvider } from "./AIProvider";

const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.5-pro";

export class GeminiProvider implements AIProvider {

  constructor(private apiKey: string) {}

  private async callGemini(
    prompt: string,
    model: string,
    maxTokens: number,
    jsonMode: boolean
  ): Promise<any> {
    const generationConfig: Record<string, any> = {
      maxOutputTokens: maxTokens,
      temperature: jsonMode ? 0.1 : 0.3,
    };

    // Force structured JSON output — Gemini returns only valid JSON, no fences
    if (jsonMode) {
      generationConfig.responseMimeType = "application/json";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      const errMsg: string = data?.error?.message || "Gemini API error";

      // Model deprecated / not found — retry with fallback
      if (
        (response.status === 404 || errMsg.includes("deprecated") ||
         errMsg.includes("not found") || errMsg.includes("no longer available")) &&
        model !== FALLBACK_MODEL
      ) {
        console.warn(`[GeminiProvider] Model ${model} unavailable, retrying with ${FALLBACK_MODEL}`);
        return this.callGemini(prompt, FALLBACK_MODEL, maxTokens, jsonMode);
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Invalid Gemini API key. ${errMsg}`);
      }
      if (response.status === 429) {
        throw new Error(`Gemini quota exceeded. ${errMsg}`);
      }

      console.error("[GeminiProvider] API error:", data);
      throw new Error(errMsg);
    }

    // Gemini 2.5 thinking models may return thinking parts first, then text parts.
    // Collect all text parts from the response.
    const parts: any[] = data.candidates?.[0]?.content?.parts || [];
    const textParts = parts.filter((p: any) => p.text !== undefined);
    const text = textParts.map((p: any) => p.text).join("") || "";

    return { text, data };
  }

  async generateText(prompt: string, model = DEFAULT_MODEL, maxTokens = 2000): Promise<string> {
    const { text } = await this.callGemini(prompt, model, maxTokens, false);
    return text;
  }

  async generateJSON(prompt: string, model = DEFAULT_MODEL, maxTokens = 2000): Promise<any> {
    // Ensure at least 4096 tokens for JSON calls to handle thinking model overhead
    const effectiveTokens = Math.max(maxTokens, 4096);

    const { text } = await this.callGemini(prompt, model, effectiveTokens, true);

    if (!text) throw new Error("Empty response from Gemini");

    // With responseMimeType:"application/json", output should be clean JSON
    try { return JSON.parse(text); } catch {}

    // Fallback: strip markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()); } catch {} }

    // Fallback: extract bare {...} block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch {} }

    console.error("[GeminiProvider] Could not parse JSON. Raw output:\n", text.slice(0, 500));
    throw new Error("Gemini did not return valid JSON");
  }
}
