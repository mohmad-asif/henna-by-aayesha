import { EmbeddingProvider, EmbeddingProviderKey } from '../types';
import { geminiEmbeddingProvider } from './gemini';
import { cohereEmbeddingProvider } from './cohere';
import { mistralEmbeddingProvider } from './mistral';
import { openRouterEmbeddingProvider } from './openrouter';

export const embeddingProvidersRegistry: Record<EmbeddingProviderKey, EmbeddingProvider> = {
  gemini: geminiEmbeddingProvider,
  cohere: cohereEmbeddingProvider,
  mistral: mistralEmbeddingProvider,
  openrouter: openRouterEmbeddingProvider,
};

export function getEmbeddingProvider(key: EmbeddingProviderKey): EmbeddingProvider | undefined {
  return embeddingProvidersRegistry[key];
}

export function getAllEmbeddingProviders(): EmbeddingProvider[] {
  return Object.values(embeddingProvidersRegistry);
}
