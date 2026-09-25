import {
  EmbeddingProvider,
  EmbeddingOptions,
  SupportedEmbeddingModel,
} from '../types';
import { TestConnectionResult } from '../../types';

export class CohereEmbeddingProvider implements EmbeddingProvider {
  readonly providerKey = 'cohere' as const;
  readonly displayName = 'Cohere';
  readonly defaultModel = 'embed-english-v3.0';
  readonly dimension = 1024;
  readonly supportedModels: SupportedEmbeddingModel[] = [
    {
      model: 'embed-english-v3.0',
      dimension: 1024,
      displayName: 'Cohere Embed English v3.0 (1024d)',
    },
    {
      model: 'embed-multilingual-v3.0',
      dimension: 1024,
      displayName: 'Cohere Embed Multilingual v3.0 (1024d)',
    },
  ];

  async generateEmbedding(
    text: string,
    apiKey: string,
    options?: EmbeddingOptions
  ): Promise<number[]> {
    const list = await this.generateEmbeddings([text], apiKey, options);
    return list[0];
  }

  async generateEmbeddings(
    texts: string[],
    apiKey: string,
    options?: EmbeddingOptions
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    const model = options?.model || this.defaultModel;
    const endpoint = 'https://api.cohere.com/v2/embed';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        texts: texts.map((t) => t.trim()),
        model,
        input_type: 'search_document',
        embedding_types: ['float'],
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Cohere Embedding API error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.message || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const floatEmbeddings = data.embeddings?.float;

    if (!Array.isArray(floatEmbeddings) || floatEmbeddings.length !== texts.length) {
      throw new Error('Cohere returned an unexpected embedding structure.');
    }

    return floatEmbeddings;
  }

  async testConnection(apiKey: string, model?: string): Promise<TestConnectionResult> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const targetModel = model || this.defaultModel;
      const res = await fetch('https://api.cohere.com/v2/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          texts: ['Hello'],
          model: targetModel,
          input_type: 'search_query',
          embedding_types: ['float'],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(errText);
          message = parsed.message || message;
        } catch {
          // ignore
        }
        return {
          success: false,
          latencyMs,
          error: message,
        };
      }

      return {
        success: true,
        latencyMs,
        message: 'Successfully connected to Cohere Embed',
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        error: err instanceof Error ? err.message : 'Unknown connection error',
      };
    }
  }
}

export const cohereEmbeddingProvider = new CohereEmbeddingProvider();
