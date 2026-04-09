import { DocumentChunk } from './types';
import crypto from 'crypto';

export class SemanticChunker {
  private MAX_CHUNK_SIZE = 1500; // ~350-400 tokens
  private MIN_CHUNK_SIZE = 200;
  private OVERLAP = 200;

  /**
   * Semantically splits text by headers, paragraphs, and sentences.
   */
  public chunkDocument(text: string, source: string): DocumentChunk[] {
    // 1. Normalize
    const cleanText = text.replace(/\r\n/g, '\n');
    
    // 2. Split by major sections (Headers or double newlines)
    // Heuristic: Lines starting with # or fully capitalized lines are headers
    const sections = this.splitByHeuristic(cleanText);

    const chunks: DocumentChunk[] = [];
    let currentChunkText = '';
    let currentSectionTitle = 'Introduction';
    let startIndex = 0;

    for (const section of sections) {
      // Check if this section is a header
      if (this.isHeader(section)) {
        currentSectionTitle = section.trim();
        // If we have accumulation, push it before starting new section
        if (currentChunkText.length > this.MIN_CHUNK_SIZE) {
          chunks.push(this.createChunk(currentChunkText, source, currentSectionTitle, startIndex));
          currentChunkText = '';
          startIndex += currentChunkText.length;
        }
        continue;
      }

      // 3. Density Control: Accumulate paragraphs
      if (currentChunkText.length + section.length > this.MAX_CHUNK_SIZE) {
        // Push current
        chunks.push(this.createChunk(currentChunkText, source, currentSectionTitle, startIndex));
        
        // Start new with overlap (last N chars)
        const overlapText = currentChunkText.slice(-this.OVERLAP);
        currentChunkText = overlapText + '\n' + section;
        startIndex += (currentChunkText.length - overlapText.length); // approx tracking
      } else {
        currentChunkText += (currentChunkText ? '\n\n' : '') + section;
      }
    }

    // Final chunk
    if (currentChunkText.length > 50) {
       chunks.push(this.createChunk(currentChunkText, source, currentSectionTitle, startIndex));
    }

    return chunks;
  }

  private splitByHeuristic(text: string): string[] {
    // Split by double newline (paragraphs) first
    return text.split(/\n\s*\n/);
  }

  private isHeader(text: string): boolean {
    const t = text.trim();
    return t.startsWith('#') || (t.length < 100 && t === t.toUpperCase() && t.length > 3);
  }

  private createChunk(text: string, source: string, section: string, startIdx: number): DocumentChunk {
    return {
      id: crypto.createHash('md5').update(text).digest('hex'),
      text: text.trim(),
      metadata: {
        source,
        section,
        startIndex: startIdx,
        endIndex: startIdx + text.length,
        tokenEstimate: Math.ceil(text.length / 4)
      }
    };
  }
}

export const chunkingService = new SemanticChunker();