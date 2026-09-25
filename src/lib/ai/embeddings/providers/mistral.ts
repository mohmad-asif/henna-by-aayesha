import {
  EmbeddingProvider,
  EmbeddingOptions,
  SupportedEmbeddingModel,
} from '../types';
import { TestConnectionResult } from '../../types';

export class MistralEmbeddingProvider implements EmbeddingProvider {
  readonly providerKey = 'mistral' as const;
  readonly displayName = 'Mistral AI';
  readonly defaultModel = 'mistral-embed';
  readonly dimension = 1024;
  readonly supportedModels: SupportedEmbeddingModel[] = [
    {
      model: 'mistral-embed',
      dimension: 1024,
      displayName: 'Mistral Embed (1024d)',
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
    const endpoint = 'https://api.mistral.ai/v1/embeddings';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: texts.map((t) => t.trim()),
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Mistral Embedding API error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.message || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length !== texts.length) {
      throw new Error('Mistral returned an invalid embedding response array.');
    }

    return data.data.map((item: { embedding: number[] }) => item.embedding);
  }

  async testConnection(apiKey: string, model?: string): Promise<TestConnectionResult> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const targetModel = model || this.defaultModel;
      const res = await fetch('https://api.mistral.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          input: ['Hello'],
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
        message: 'Successfully connected to Mistral Embed',
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

export const mistralEmbeddingProvider = new MistralEmbeddingProvider();
