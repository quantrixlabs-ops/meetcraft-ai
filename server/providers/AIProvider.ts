export interface AIProvider {
  generateText(prompt: string, model?: string, maxTokens?: number): Promise<string>;
  generateJSON(prompt: string, model?: string, maxTokens?: number): Promise<any>;
}