import { GoogleGenAI } from "@google/genai";

const VITE_GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
const EMBEDDING_MODEL = "text-embedding-004";

export class EmbeddingService {
  private client: GoogleGenAI | null = null;

  constructor() {
    // Defer client initialization until it's actually needed
    if (VITE_GEMINI_API_KEY) {
      this.client = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });
    }
  }

  private getClient(): GoogleGenAI {
    if (!this.client) {
      if (!VITE_GEMINI_API_KEY) {
        throw new Error("API_KEY not configured. Set API_KEY in .env file");
      }
      this.client = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });
    }
    return this.client;
  }

  public async embedText(text: string): Promise<number[]> {
    try {
      const client = this.getClient();
      const result = await client.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: {
          parts: [{ text }]
        }
      });
      return result.embeddings?.[0]?.values || [];
    } catch (e) {
      console.error("Embedding Error:", e);
      return []; // Fail gracefully
    }
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    const BATCH_SIZE = 5; // Concurrency limit
    const results: number[][] = new Array(texts.length);
    
    // Process in chunks to avoid hitting rate limits too hard while maximizing throughput
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((text, idx) => 
            this.embedText(text).then(res => ({ idx: i + idx, res }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ idx, res }) => {
            results[idx] = res;
        });
    }
    
    return results;
  }
}

export const embeddingService = new EmbeddingService();