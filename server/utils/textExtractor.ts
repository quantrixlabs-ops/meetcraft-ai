import pdf from 'pdf-parse';
import { Buffer } from 'buffer';

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdf(buffer);
      return data.text;
    } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      return buffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error("File parsing error:", error);
    throw new Error("Failed to parse document content.");
  }
}

// Replaced by Semantic Chunker
export function sanitizeContext(text: string): string {
  return text.trim();
}