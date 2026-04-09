import { AIProvider } from "./AIProvider";

export class OpenRouterProvider implements AIProvider {

  constructor(private apiKey: string) {}

  async generateText(prompt: string, model = "anthropic/claude-3.5-sonnet", maxTokens = 2000) {

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "MeetCraft AI"
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            {
              role: "system",
              content: "You are a precise AI that follows instructions exactly."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);
      throw new Error(data?.error?.message || "OpenRouter API error");
    }

    return data?.choices?.[0]?.message?.content || "";
  }

  async generateJSON(prompt: string, model?: string, maxTokens = 2000) {

    const text = await this.generateText(prompt, model, maxTokens);

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from AI");
    }

    // 1️⃣ Try direct JSON
    try {
      return JSON.parse(text);
    } catch {}

    // 2️⃣ Extract JSON block
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {}
    }

    // 3️⃣ Debug output
    console.error("AI RAW OUTPUT:\n", text);

    throw new Error("AI response did not contain valid JSON");
  }

}