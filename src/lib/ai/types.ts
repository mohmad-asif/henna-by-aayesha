import { AIProviderKey, DbAIProvider } from '@/types/database';

export type { AIProviderKey, DbAIProvider };

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface GenerateTextParams {
  messages: ChatMessage[];
  systemPrompt?: string;
  model: string;
  apiKey: string;
  accountId?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface GenerateTextResult {
  text: string;
  providerKey: AIProviderKey;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  message?: string;
  error?: string;
}

export interface AIProvider {
  readonly providerKey: AIProviderKey;
  readonly displayName: string;
  readonly defaultModel: string;
  readonly supportedModels: string[];
  generateText(params: GenerateTextParams): Promise<GenerateTextResult>;
  testConnection(apiKey: string, model: string, explicitAccountId?: string): Promise<TestConnectionResult>;
}

/**
 * Safe representation of an AI provider sent to Admin UI.
 * Plaintext and encrypted API keys are NEVER exposed.
 */
export interface ClientAIProvider {
  id: string;
  provider_key: AIProviderKey;
  display_name: string;
  enabled: boolean;
  model: string;
  priority: number;
  last_tested_at?: string | null;
  last_status: 'connected' | 'error' | 'untested';
  last_error?: string | null;
  has_api_key: boolean;
  masked_key: string;
  has_account_id?: boolean;
  masked_account_id?: string;
  supported_models: string[];
  default_model: string;
}

export interface ChatAction {
  type: 'whatsapp' | 'service' | 'design';
  label: string;
  url: string;
}

export interface ChatSourceItem {
  sourceType: string;
  sourceId: string;
  title: string;
  similarity: number;
}

import type { DesignPreferences, RecommendedDesign } from './design/types';

export interface ChatApiResponse {
  message: string;
  action?: ChatAction;
  isFallback?: boolean;
  provider?: string;
  sources?: ChatSourceItem[];
  preferences?: DesignPreferences;
  recommendations?: RecommendedDesign[];
  followUpQuestion?: string | null;
  conversationId?: string;
}

