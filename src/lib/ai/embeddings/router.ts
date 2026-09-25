import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import { getEmbeddingProvider } from './providers';
import { decryptApiKey } from '../encryption';
import {
  DbEmbeddingSettings,
  EmbeddingProvider,
  EmbeddingOptions,
} from './types';

export interface ResolvedEmbeddingConfig {
  settings: DbEmbeddingSettings;
  adapter: EmbeddingProvider;
  apiKey: string;
}

const DEFAULT_EMBEDDING_SETTINGS: DbEmbeddingSettings = {
  id: 1,
  provider_key: 'gemini',
  model: 'gemini-embedding-2',
  dimensions: 768,
  enabled: true,
  encrypted_api_key: null,
  last_status: 'untested',
  requires_reindex: false,
};

/**
 * Resolves the active embedding configuration, adapter, and decrypted API key.
 */
export async function getActiveEmbeddingConfig(): Promise<ResolvedEmbeddingConfig | null> {
  let settings: DbEmbeddingSettings = DEFAULT_EMBEDDING_SETTINGS;

  try {
    const supabase = await getAdminSupabaseClient();
    const { data } = await supabase
      .from('ai_embedding_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (data) {
      settings = data as DbEmbeddingSettings;
      // Sanitize deprecated models if still stored in db
      if (settings.model === 'text-embedding-004' || settings.model === 'embedding-001') {
        settings.model = 'gemini-embedding-2';
      }
    }
  } catch (err) {
    console.warn('[Embedding Router] Could not read ai_embedding_settings from DB:', err);
  }

  if (!settings.enabled) {
    return null;
  }

  const adapter = getEmbeddingProvider(settings.provider_key);
  if (!adapter) {
    console.error(`[Embedding Router] No adapter for provider: ${settings.provider_key}`);
    return null;
  }

  let decryptedKey = '';

  // 1. Try dedicated embedding key
  if (settings.encrypted_api_key) {
    decryptedKey = decryptApiKey(settings.encrypted_api_key);
  }

  // 2. If no dedicated key, fallback to corresponding provider key in ai_providers
  if (!decryptedKey) {
    try {
      const supabase = await getAdminSupabaseClient();
      const { data: aiProviderRow } = await supabase
        .from('ai_providers')
        .select('encrypted_api_key')
        .eq('provider_key', settings.provider_key)
        .maybeSingle();

      if (aiProviderRow?.encrypted_api_key) {
        decryptedKey = decryptApiKey(aiProviderRow.encrypted_api_key);
      }
    } catch {
      // ignore
    }
  }

  if (!decryptedKey) {
    console.warn(
      `[Embedding Router] No API key available for embedding provider ${settings.provider_key}. Category: EMBEDDING_KEY_MISSING.`
    );
    return null;
  }

  console.log('[Embedding Router] Safe diagnostics:', {
    provider: settings.provider_key,
    model: settings.model,
    dimensions: settings.dimensions,
    apiKeyConfigured: true,
    apiKeyDecrypted: true,
  });

  return { settings, adapter, apiKey: decryptedKey };
}

/**
 * Generates an embedding vector for a single text using the active configured provider.
 */
export async function generateEmbeddingVector(
  text: string,
  options?: EmbeddingOptions
): Promise<number[] | null> {
  const config = await getActiveEmbeddingConfig();
  if (!config) return null;

  try {
    const vector = await config.adapter.generateEmbedding(text, config.apiKey, {
      model: config.settings.model,
      dimensions: config.settings.dimensions,
      ...options,
    });
    return vector;
  } catch (err) {
    console.error(
      `[Embedding Router] Embedding generation failed for ${config.adapter.displayName}:`,
      err
    );
    return null;
  }
}

/**
 * Generates embeddings for multiple texts in batch using the active configured provider.
 */
export async function generateEmbeddingBatch(
  texts: string[],
  options?: EmbeddingOptions
): Promise<number[][] | null> {
  if (texts.length === 0) return [];
  const config = await getActiveEmbeddingConfig();
  if (!config) return null;

  try {
    const vectors = await config.adapter.generateEmbeddings(texts, config.apiKey, {
      model: config.settings.model,
      dimensions: config.settings.dimensions,
      ...options,
    });
    return vectors;
  } catch (err) {
    console.error(
      `[Embedding Router] Batch embedding generation failed for ${config.adapter.displayName}:`,
      err
    );
    return null;
  }
}
