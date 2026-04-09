import { VectorRecord, DocumentChunk, RetrievalResult } from './types';
import { supabaseAdmin } from '../lib/supabase';

// Helper to check if we are using the real client
const isMockClient = (client: any) => !client.rpc; // Our mock client doesn't strictly implement rpc properly in types but does in runtime

export class SupabaseVectorStore {
  
  /**
   * Stores chunks and embeddings in Supabase
   */
  public async addChunks(userId: string, docId: string, chunks: DocumentChunk[], embeddings: number[][]): Promise<void> {
    
    // Skip if running with mock client
    if ((supabaseAdmin as any).auth?.getUser?.toString().includes('local-dev-user')) {
        console.warn("[VectorStore] Mock mode: Skipping vector storage.");
        return;
    }

    // 1. Create Document Record
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: userId,
        filename: docId, // Using docId as filename for MVP
        content: "Binary content not stored in DB to save space"
      })
      .select('id')
      .single();

    if (docError) {
      console.error("Error creating document:", docError);
      return; // Fail gracefully in dev
    }

    const documentId = doc.id;

    // 2. Prepare Payload
    const records = chunks.map((chunk, i) => ({
      document_id: documentId,
      user_id: userId,
      content: chunk.text,
      metadata: chunk.metadata,
      embedding: embeddings[i]
    }));

    // 3. Batch Insert
    const { error: chunkError } = await supabaseAdmin
      .from('document_chunks')
      .insert(records);

    if (chunkError) {
       console.error("Error inserting chunks:", chunkError);
    }
  }

  public async similaritySearch(userId: string, queryEmbedding: number[], topK: number = 5): Promise<RetrievalResult[]> {
    
    // Skip if running with mock client
    if ((supabaseAdmin as any).auth?.getUser?.toString().includes('local-dev-user')) {
        console.warn("[VectorStore] Mock mode: Skipping vector search.");
        return [];
    }

    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // Minimum similarity
      match_count: topK,
      filter_user_id: userId
    });

    if (error) {
      console.error("Vector search error:", error);
      return [];
    }

    return data.map((record: any) => ({
      chunk: {
        id: record.id,
        text: record.content,
        metadata: record.metadata
      },
      score: record.similarity
    }));
  }

  public async clear(userId: string, docId: string) {
    // Logic not implemented
  }
}

export const vectorStore = new SupabaseVectorStore();