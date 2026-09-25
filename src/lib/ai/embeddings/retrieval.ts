import { createClient as createServerClient } from '@/lib/supabase/server';
import { generateEmbeddingVector } from './router';
import {
  RetrievedDocument,
  RetrievalOptions,
  DesignSearchOptions,
  KnowledgeSourceType,
} from './types';

/**
 * Searches the Supabase pgvector knowledge base using cosine similarity.
 */
export async function searchKnowledge(
  query: string,
  options?: RetrievalOptions
): Promise<RetrievedDocument[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const matchThreshold = options?.matchThreshold ?? 0.38;
  const matchCount = options?.matchCount ?? 5;
  const filterSourceType = options?.sourceType ?? null;

  // 1. Generate query embedding vector
  const queryEmbedding = await generateEmbeddingVector(cleanQuery);
  if (!queryEmbedding) {
    console.warn('[RAG Retrieval] Could not generate query embedding. Skipping vector search.');
    return [];
  }

  // Dimension safety: Database pgvector column is vector(768).
  // If active embedding provider outputs incompatible dimensions (e.g. 1024), skip RPC safely.
  if (queryEmbedding.length !== 768) {
    console.warn(
      `[RAG Retrieval] Query embedding dimension (${queryEmbedding.length}) does not match pgvector column dimension (768). Skipping vector RPC to avoid dimension mismatch.`
    );
    return [];
  }

  // 2. Perform pgvector similarity search via RPC
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc('match_knowledge_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_source_type: filterSourceType,
    });

    if (error) {
      console.error('[RAG Retrieval] pgvector RPC error:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((row: {
      id: string;
      source_type: KnowledgeSourceType;
      source_id: string;
      title: string;
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }) => ({
      id: row.id,
      source_type: row.source_type,
      source_id: row.source_id,
      title: row.title,
      content: row.content,
      metadata: row.metadata || {},
      similarity: row.similarity,
    }));
  } catch (err) {
    console.error('[RAG Retrieval] Vector similarity search failed:', err);
    return [];
  }
}

/**
 * Dedicated design search function (Prompt 3 compatibility).
 */
export async function searchDesigns(
  query: string,
  options?: DesignSearchOptions
): Promise<RetrievedDocument[]> {
  return searchKnowledge(query, {
    sourceType: 'mehndi_design',
    matchCount: options?.matchCount ?? 4,
    matchThreshold: 0.35,
  });
}

/**
 * Executes full RAG retrieval and formats compact context for the system prompt.
 */
export async function executeRAGPipeline(
  query: string
): Promise<{ contextText: string; sources: RetrievedDocument[] }> {
  const startTime = Date.now();
  const retrievedDocs = await searchKnowledge(query, {
    matchCount: 4,
    matchThreshold: 0.35,
  });

  const durationMs = Date.now() - startTime;
  console.log(
    `[RAG Pipeline] Retrieved ${retrievedDocs.length} knowledge documents in ${durationMs}ms for query: "${query.slice(
      0,
      60
    )}"`
  );

  if (retrievedDocs.length === 0) {
    return {
      contextText: '',
      sources: [],
    };
  }

  // Build compact, structured context
  const contextBlocks = retrievedDocs.map((doc, idx) => {
    return `[RECORD #${idx + 1} | Source: ${doc.source_type} | ID: ${doc.source_id} | Title: "${doc.title}"]
${doc.content}`;
  });

  const contextText = `\n--- VERIFIED WEBSITE KNOWLEDGE (SOURCE OF TRUTH) ---\n${contextBlocks.join(
    '\n\n'
  )}\n--- END OF VERIFIED KNOWLEDGE ---\n`;

  return {
    contextText,
    sources: retrievedDocs,
  };
}
