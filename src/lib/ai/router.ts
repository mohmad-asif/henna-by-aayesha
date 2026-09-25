import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import { getProvider } from './providers';
import { decryptApiKey } from './encryption';
import {
  ChatMessage,
  GenerateTextResult,
  DbAIProvider,
} from './types';

export interface RouteChatOptions {
  messages: ChatMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RouterResponse {
  text: string;
  providerKey?: string;
  model?: string;
  isFallback: boolean;
  attemptsCount: number;
}

const FALLBACK_MESSAGE =
  "Sorry, I'm having trouble responding right now. You can contact Aayesha directly on WhatsApp for help with your mehndi requirements.";

/**
 * Executes chat generation across configured AI providers with controlled priority failover.
 */
export async function routeChat(options: RouteChatOptions): Promise<RouterResponse> {
  const { messages, systemPrompt, temperature = 0.7, maxTokens = 1500 } = options;

  let enabledProviders: DbAIProvider[] = [];

  try {
    const supabase = await getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('[AI Router] Database error querying ai_providers:', error.message);
    } else if (data && data.length > 0) {
      enabledProviders = data as DbAIProvider[];
    }
  } catch (err) {
    console.error('[AI Router] Could not load ai_providers from Supabase:', err);
  }

  // Filter providers that have an encrypted key
  const validProviders = enabledProviders.filter(
    (p) => p.encrypted_api_key && p.encrypted_api_key.trim().length > 0
  );

  console.log('[AI Router] Safe diagnostics:', {
    enabledProvidersCount: enabledProviders.length,
    validConfiguredCount: validProviders.length,
    candidateProviders: validProviders.map((p) => ({
      provider: p.provider_key,
      model: p.model,
      priority: p.priority,
      apiKeyConfigured: true,
    })),
  });

  if (validProviders.length === 0) {
    console.warn('[AI Router] No enabled AI providers with configured API keys found.');
    return {
      text: FALLBACK_MESSAGE,
      isFallback: true,
      attemptsCount: 0,
    };
  }

  let attemptsCount = 0;

  // Iterate in priority order (1 is highest priority)
  for (const dbProvider of validProviders) {
    attemptsCount++;
    const adapter = getProvider(dbProvider.provider_key);

    if (!adapter) {
      console.warn(`[AI Router] No adapter found for provider key: ${dbProvider.provider_key}`);
      continue;
    }

    const decryptedKey = decryptApiKey(dbProvider.encrypted_api_key || '');
    if (!decryptedKey) {
      console.error(
        `[AI Router] Failed to decrypt API key for provider ${dbProvider.display_name}. Category: API_KEY_DECRYPTION_FAILED. Skipping.`
      );
      continue;
    }

    let finalKey = decryptedKey;
    let explicitAccountId: string | undefined = undefined;

    if (dbProvider.provider_key === 'cloudflare') {
      let acc = '';
      if (dbProvider.encrypted_account_id) {
        acc = decryptApiKey(dbProvider.encrypted_account_id);
      }
      if (decryptedKey.startsWith('{')) {
        try {
          const parsed = JSON.parse(decryptedKey);
          acc = acc || parsed.accountId || '';
          finalKey = parsed.apiToken || decryptedKey;
        } catch {
          // continue
        }
      } else if (decryptedKey.includes(':') && !decryptedKey.startsWith('Bearer ')) {
        const parts = decryptedKey.split(':');
        acc = acc || parts[0].trim();
        finalKey = parts.slice(1).join(':').trim();
      }
      if (!acc && process.env.CLOUDFLARE_ACCOUNT_ID) {
        acc = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
      }
      explicitAccountId = acc || undefined;
    }

    console.log(
      `[AI Router] Attempting provider: ${adapter.displayName} (${dbProvider.model || adapter.defaultModel}) [Priority: ${dbProvider.priority}] | apiKeyConfigured: true | decrypted: true`
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45-second per-provider timeout

    try {
      const result: GenerateTextResult = await adapter.generateText({
        messages,
        systemPrompt,
        model: dbProvider.model || adapter.defaultModel,
        apiKey: finalKey,
        accountId: explicitAccountId,
        temperature,
        maxTokens,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Async update success status in background
      try {
        const supabase = await getAdminSupabaseClient();
        await supabase
          .from('ai_providers')
          .update({
            last_tested_at: new Date().toISOString(),
            last_status: 'connected',
            last_error: null,
          })
          .eq('id', dbProvider.id);
      } catch {
        // non-blocking
      }

      console.log(
        `[AI Router] Provider ${adapter.displayName} responded successfully with model ${result.model}.`
      );

      return {
        text: result.text,
        providerKey: result.providerKey,
        model: result.model,
        isFallback: false,
        attemptsCount,
      };
    } catch (err: unknown) {
      clearTimeout(timeout);
      const errorMsg = err instanceof Error ? err.message : 'Unknown provider error';
      console.warn(
        `[AI Router] Provider ${adapter.displayName} failed: ${errorMsg}. Category: PROVIDER_CALL_FAILED. Failing over to next priority provider...`
      );

      // Async mark error status in background
      try {
        const supabase = await getAdminSupabaseClient();
        await supabase
          .from('ai_providers')
          .update({
            last_tested_at: new Date().toISOString(),
            last_status: 'error',
            last_error: errorMsg.slice(0, 300),
          })
          .eq('id', dbProvider.id);
      } catch {
        // non-blocking
      }
    }
  }

  // All providers failed
  console.error('[AI Router] All configured AI providers failed. Returning fallback message. Category: ALL_PROVIDERS_FAILED.');
  return {
    text: FALLBACK_MESSAGE,
    isFallback: true,
    attemptsCount,
  };
}

