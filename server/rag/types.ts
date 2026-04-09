export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    section?: string;
    startIndex: number;
    endIndex: number;
    tokenEstimate: number;
  };
}

export interface VectorRecord {
  id: string;
  chunk: DocumentChunk;
  embedding: number[];
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
}
