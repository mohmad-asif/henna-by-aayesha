import { AIProvider, AIProviderKey } from '../types';
import { geminiProvider } from './gemini';
import { groqProvider } from './groq';
import { openRouterProvider } from './openrouter';
import { mistralProvider } from './mistral';
import { cohereProvider } from './cohere';
import { cloudflareProvider } from './cloudflare';

export const providersRegistry: Record<AIProviderKey, AIProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
  openrouter: openRouterProvider,
  mistral: mistralProvider,
  cohere: cohereProvider,
  cloudflare: cloudflareProvider,
};

export function getProvider(key: AIProviderKey): AIProvider | undefined {
  return providersRegistry[key];
}

export function getAllProviders(): AIProvider[] {
  return Object.values(providersRegistry);
}
