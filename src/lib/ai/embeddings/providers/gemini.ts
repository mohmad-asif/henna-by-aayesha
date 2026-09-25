import {
  EmbeddingProvider,
  EmbeddingOptions,
  SupportedEmbeddingModel,
} from '../types';
import { TestConnectionResult } from '../../types';

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly providerKey = 'gemini' as const;
  readonly displayName = 'Google Gemini';
  readonly defaultModel = 'gemini-embedding-2';
  readonly dimension = 768;
  readonly supportedModels: SupportedEmbeddingModel[] = [
    {
      model: 'gemini-embedding-2',
      dimension: 768,
      displayName: 'Gemini Embedding 2 (768d)',
    },
  ];

  private sanitizeModel(model?: string): string {
    const raw = (model || '').trim().replace(/^models\//, '');
    if (!raw || raw === 'text-embedding-004' || raw === 'embedding-001') {
      return this.defaultModel;
    }
    return raw;
  }

  async generateEmbedding(
    text: string,
    apiKey: string,
    options?: EmbeddingOptions
  ): Promise<number[]> {
    const activeModel = this.sanitizeModel(options?.model);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      activeModel
    )}:embedContent`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: text.trim() }],
        },
        outputDimensionality: options?.dimensions || this.dimension,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Gemini Embedding API error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.error?.message || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const values = data.embedding?.values;

    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Gemini returned an invalid or empty embedding vector.');
    }

    return values;
  }

  async generateEmbeddings(
    texts: string[],
    apiKey: string,
    options?: EmbeddingOptions
  ): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.length === 1) {
      const single = await this.generateEmbedding(texts[0], apiKey, options);
      return [single];
    }

    const activeModel = this.sanitizeModel(options?.model);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      activeModel
    )}:batchEmbedContents`;

    const requests = texts.map((t) => ({
      model: `models/${activeModel}`,
      content: {
        parts: [{ text: t.trim() }],
      },
      outputDimensionality: options?.dimensions || this.dimension,
    }));

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ requests }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Gemini Batch Embedding API error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.error?.message || errorMsg;
      } catch {
        // use default
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const embeddings = data.embeddings;

    if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
      throw new Error('Gemini batch embedding response count mismatch.');
    }

    return embeddings.map((e) => e.values);
  }

  async testConnection(apiKey: string, model?: string): Promise<TestConnectionResult> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const activeModel = this.sanitizeModel(model);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        activeModel
      )}:embedContent`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          content: { parts: [{ text: 'Henna by Aayesha' }] },
          outputDimensionality: this.dimension,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text();
        let errorMsg = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(errText);
          errorMsg = parsed.error?.message || errorMsg;
        } catch {
          // ignore
        }
        return {
          success: false,
          latencyMs,
          error: errorMsg,
        };
      }

      return {
        success: true,
        latencyMs,
        message: `Successfully connected to Google Gemini (${activeModel})`,
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

export const geminiEmbeddingProvider = new GeminiEmbeddingProvider();
