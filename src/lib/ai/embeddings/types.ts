import { TestConnectionResult } from '../types';

export type EmbeddingProviderKey = 'gemini' | 'cohere' | 'mistral' | 'openrouter';

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
  signal?: AbortSignal;
}

export interface SupportedEmbeddingModel {
  model: string;
  dimension: number;
  displayName: string;
}

export interface EmbeddingProvider {
  readonly providerKey: EmbeddingProviderKey;
  readonly displayName: string;
  readonly defaultModel: string;
  readonly dimension: number;
  readonly supportedModels: SupportedEmbeddingModel[];
  generateEmbedding(text: string, apiKey: string, options?: EmbeddingOptions): Promise<number[]>;
  generateEmbeddings(texts: string[], apiKey: string, options?: EmbeddingOptions): Promise<number[][]>;
  testConnection(apiKey: string, model?: string): Promise<TestConnectionResult>;
}

export interface DbEmbeddingSettings {
  id: number;
  provider_key: EmbeddingProviderKey;
  model: string;
  dimensions: number;
  enabled: boolean;
  encrypted_api_key?: string | null;
  last_tested_at?: string | null;
  last_status: 'connected' | 'error' | 'untested';
  last_error?: string | null;
  requires_reindex: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClientEmbeddingSettings {
  provider_key: EmbeddingProviderKey;
  model: string;
  dimensions: number;
  enabled: boolean;
  has_api_key: boolean;
  masked_key: string;
  last_tested_at?: string | null;
  last_status: 'connected' | 'error' | 'untested';
  last_error?: string | null;
  requires_reindex: boolean;
  supported_models: SupportedEmbeddingModel[];
}

export type KnowledgeSourceType =
  | 'mehndi_design'
  | 'service'
  | 'faq'
  | 'business_info'
  | 'testimonial';

export interface KnowledgeDocument {
  id: string;
  source_type: KnowledgeSourceType;
  source_id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  content_hash: string;
  embedding?: number[];
  embedding_provider: string;
  embedding_model: string;
  is_active: boolean;
  indexing_status: 'indexed' | 'pending' | 'failed';
  indexing_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RetrievedDocument {
  id: string;
  source_type: KnowledgeSourceType;
  source_id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface RetrievalOptions {
  matchCount?: number;
  matchThreshold?: number;
  sourceType?: KnowledgeSourceType;
}

export interface DesignSearchOptions {
  matchCount?: number;
  category?: string;
}
