import { chunkingService } from './chunkingService';
import { embeddingService } from './embeddingService';
import { vectorStore } from './vectorStore';
import { supabaseAdmin } from '../lib/supabase';

export class RAGEngine {
  
  public async ingestDocument(text: string, filename: string, userId: string): Promise<string> {
    const docId = filename; 
    
    // 1. FAST PATH: If document fits in context (100k chars ~ 25k tokens), skip vector DB.
    // Gemini 2.0 Flash has 1M context, so this is very safe and much faster.
    if (text.length < 100000) {
        console.log(`[RAG] Fast Path: Document ${filename} is small (${text.length} chars). Skipping ingestion.`);
        return `raw:${filename}`;
    }

    // 2. DUPLICATE CHECK: Avoid re-embedding the same file
    if (userId !== 'anon' && !userId.includes('local')) {
        const { data } = await supabaseAdmin
            .from('documents')
            .select('id')
            .eq('user_id', userId)
            .eq('filename', filename)
            .limit(1)
            .single();
            
        if (data) {
            console.log(`[RAG] Cache Hit: Document ${filename} already exists. Skipping ingestion.`);
            return filename;
        }
    }
    
    // 3. Chunk
    console.log(`[RAG] Chunking ${filename} for user ${userId}...`);
    const chunks = chunkingService.chunkDocument(text, filename);

    // 4. Embed
    // Limit to 50 chunks for Phase 2/3 MVP to preserve tokens/latency
    const processingChunks = chunks.slice(0, 50); 
    const embeddings = await embeddingService.embedBatch(processingChunks.map(c => c.text));

    // 5. Store in Supabase (pgvector)
    await vectorStore.addChunks(userId, docId, processingChunks, embeddings);

    return docId;
  }

  public async getRelevantContext(docId: string, query: string, userId: string, topK: number = 8): Promise<string> {
    // Handle Fast Path (Raw Text)
    if (docId.startsWith('raw:')) {
        return ""; // The orchestrator handles the context injection for raw mode.
    }

    const queryEmbedding = await embeddingService.embedText(query);
    const results = await vectorStore.similaritySearch(userId, queryEmbedding, topK);

    console.log(`[RAG] Retrieved ${results.length} chunks for query (Target: ${topK}).`);
    
    // Sort by document position for coherence
    results.sort((a, b) => a.chunk.metadata.startIndex - b.chunk.metadata.startIndex);

    return results
      .map(r => `[SECTION: ${r.chunk.metadata.section}]\n${r.chunk.text}`)
      .join('\n\n---\n\n');
  }

  public async getSmartGlobalContext(docId: string, userId: string, rawTextFallback?: string, topK: number = 10): Promise<string> {
    if (docId.startsWith('raw:') && rawTextFallback) {
        return rawTextFallback.substring(0, 100000); // Return raw text truncated to safe limit (100k)
    }
    const query = "Executive summary main goals key takeaways conclusion";
    return this.getRelevantContext(docId, query, userId, topK);
  }
}

export const ragEngine = new RAGEngine();