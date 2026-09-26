export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, type NextRequest } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
  maskAccountId,
  isValidCloudflareAccountId,
} from '@/lib/ai/encryption';
import { ClientAIProvider, AIProviderKey, DbAIProvider } from '@/lib/ai/types';
import { getProvider } from '@/lib/ai/providers';
import { saveProvidersCache, updateProviderInCache } from '@/lib/ai/provider-cache';


const DEFAULT_PROVIDERS: {
  provider_key: AIProviderKey;
  display_name: string;
  default_model: string;
  supported_models: string[];
  priority: number;
}[] = [
  {
    provider_key: 'gemini',
    display_name: 'Google Gemini',
    default_model: 'gemini-3.5-flash',
    supported_models: ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash'],
    priority: 1,
  },
  {
    provider_key: 'groq',
    display_name: 'Groq',
    default_model: 'qwen/qwen3.8-27b',
    supported_models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    priority: 2,
  },
  {
    provider_key: 'openrouter',
    display_name: 'OpenRouter',
    default_model: 'meta-llama/llama-3.2-3b-instruct',
    supported_models: [
      'meta-llama/llama-3.2-3b-instruct',
      'google/gemini-2.5-flash',
      'mistralai/mistral-7b-instruct',
    ],
    priority: 3,
  },
  {
    provider_key: 'mistral',
    display_name: 'Mistral AI',
    default_model: 'mistral-small-latest',
    supported_models: ['mistral-small-latest', 'mistral-large-latest', 'open-mistral-7b', 'codestral-latest'],
    priority: 4,
  },
  {
    provider_key: 'cohere',
    display_name: 'Cohere',
    default_model: 'command-r-plus-08-2024',
    supported_models: ['command-r-plus-08-2024', 'command-r-08-2024'],
    priority: 5,
  },
  {
    provider_key: 'cloudflare',
    display_name: 'Cloudflare Workers AI',
    default_model: '@cf/meta/llama-3.1-8b-instruct',
    supported_models: [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/meta/llama-3.3-70b-instruct',
      '@cf/meta/llama-3-8b-instruct',
      '@cf/mistral/mistral-7b-instruct-v0.1',
      '@cf/qwen/qwen1.5-7b-chat-awq',
    ],
    priority: 6,
  },
];

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const supabase = auth.client;
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .order('priority', { ascending: true });

    let dbRows: DbAIProvider[] = [];

    if (!error && data && data.length > 0) {
      dbRows = data as DbAIProvider[];
      saveProvidersCache(dbRows);
    } else {
      if (error) {
        console.error('[Admin AI Providers API] GET error querying ai_providers:', error.message);
      }
      // If table is empty or unmigrated, seed/return defaults safely
      dbRows = DEFAULT_PROVIDERS.map((def, idx) => ({
        id: `mock-${def.provider_key}`,
        provider_key: def.provider_key,
        display_name: def.display_name,
        enabled: false,
        encrypted_api_key: null,
        encrypted_account_id: null,
        model: def.default_model,
        priority: idx + 1,
        last_tested_at: null,
        last_status: 'untested',
        last_error: null,
      }));
    }

    console.log('[Admin AI Providers API] GET fetched providers:', {
      totalCount: dbRows.length,
      enabledCount: dbRows.filter((r) => r.enabled).length,
      providers: dbRows.map((r) => ({
        provider_key: r.provider_key,
        enabled: r.enabled,
        priority: r.priority,
        model: r.model,
        hasKey: Boolean(r.encrypted_api_key),
        hasAccountId: Boolean(r.encrypted_account_id),
        status: r.last_status,
      })),
    });

    const clientProviders: ClientAIProvider[] = dbRows.map((row) => {
      const adapter = getProvider(row.provider_key);
      const defaultInfo = DEFAULT_PROVIDERS.find((p) => p.provider_key === row.provider_key);

      const hasEncryptedKey = Boolean(row.encrypted_api_key && row.encrypted_api_key.trim().length > 0);
      let maskedKey = '';
      let hasAccountId = false;
      let maskedAccountId = '';

      if (row.provider_key === 'cloudflare') {
        let accountId = '';
        let apiToken = '';

        if (row.encrypted_account_id) {
          accountId = decryptApiKey(row.encrypted_account_id);
        }

        if (hasEncryptedKey) {
          const decrypted = decryptApiKey(row.encrypted_api_key!);
          if (decrypted.startsWith('{')) {
            try {
              const parsed = JSON.parse(decrypted);
              accountId = accountId || parsed.accountId || '';
              apiToken = parsed.apiToken || '';
            } catch {
              apiToken = decrypted;
            }
          } else if (decrypted.includes(':') && !decrypted.startsWith('Bearer ')) {
            const parts = decrypted.split(':');
            accountId = accountId || parts[0].trim();
            apiToken = parts.slice(1).join(':').trim();
          } else {
            apiToken = decrypted;
          }
        }

        if (!accountId && process.env.CLOUDFLARE_ACCOUNT_ID) {
          accountId = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
        }

        hasAccountId = Boolean(accountId && accountId.trim().length > 0);
        maskedAccountId = maskAccountId(accountId);
        maskedKey = maskApiKey(apiToken);

        return {
          id: row.id,
          provider_key: row.provider_key,
          display_name: row.display_name || adapter?.displayName || row.provider_key,
          enabled: row.enabled,
          model: row.model || adapter?.defaultModel || 'default',
          priority: row.priority,
          last_tested_at: row.last_tested_at,
          last_status: row.last_status,
          last_error: row.last_error,
          has_api_key: Boolean(apiToken && apiToken.trim().length > 0),
          masked_key: maskedKey,
          has_account_id: hasAccountId,
          masked_account_id: maskedAccountId,
          supported_models: adapter?.supportedModels || defaultInfo?.supported_models || [row.model],
          default_model: adapter?.defaultModel || defaultInfo?.default_model || row.model,
        };
      }

      if (hasEncryptedKey) {
        const decrypted = decryptApiKey(row.encrypted_api_key!);
        maskedKey = maskApiKey(decrypted);
      }

      return {
        id: row.id,
        provider_key: row.provider_key,
        display_name: row.display_name || adapter?.displayName || row.provider_key,
        enabled: row.enabled,
        model: row.model || adapter?.defaultModel || 'default',
        priority: row.priority,
        last_tested_at: row.last_tested_at,
        last_status: row.last_status,
        last_error: row.last_error,
        has_api_key: hasEncryptedKey,
        masked_key: maskedKey,
        supported_models: adapter?.supportedModels || defaultInfo?.supported_models || [row.model],
        default_model: adapter?.defaultModel || defaultInfo?.default_model || row.model,
      };
    });

    return NextResponse.json(
      { providers: clientProviders },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[Admin AI Providers API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve AI providers.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      provider_key,
      enabled,
      model,
      priority,
      api_key,
      account_id,
    }: {
      provider_key: AIProviderKey;
      enabled?: boolean;
      model?: string;
      priority?: number;
      api_key?: string;
      account_id?: string;
    } = body;

    if (!provider_key) {
      return NextResponse.json(
        { error: 'provider_key is required.' },
        { status: 400 }
      );
    }

    const adapter = getProvider(provider_key);
    const displayName = adapter?.displayName || provider_key;

    const supabase = auth.client;

    // Check if provider row already exists
    const { data: existing, error: findError } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('provider_key', provider_key)
      .maybeSingle();

    if (findError) {
      console.error('[Admin AI Providers API] Error finding existing provider:', findError.message);
    }

    const updatePayload: Record<string, unknown> = {
      provider_key,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    };

    if (typeof enabled === 'boolean') {
      updatePayload.enabled = enabled;
    }

    if (model && model.trim().length > 0) {
      updatePayload.model = model.trim();
    } else if (!existing) {
      updatePayload.model = adapter?.defaultModel || 'default';
    }

    if (typeof priority === 'number') {
      updatePayload.priority = priority;
    }

    // Handle Cloudflare specific credentials (Account ID + API Token)
    if (provider_key === 'cloudflare') {
      const isAccountIdProvided = typeof account_id === 'string' && account_id.trim().length > 0;
      const isAccountIdMasked = isAccountIdProvided && (account_id.includes('...') || account_id.includes('••••'));
      const isApiKeyProvided = typeof api_key === 'string' && api_key.trim().length > 0;
      const isApiKeyMasked = isApiKeyProvided && api_key.includes('••••');

      if (isAccountIdProvided && !isAccountIdMasked) {
        const cleanAcc = account_id.trim();
        if (!isValidCloudflareAccountId(cleanAcc)) {
          return NextResponse.json(
            { error: 'Invalid Cloudflare Account ID. Expected standard 32-character hexadecimal Account ID.' },
            { status: 400 }
          );
        }
      }

      // Check if credentials are being updated
      if ((isAccountIdProvided && !isAccountIdMasked) || (isApiKeyProvided && !isApiKeyMasked)) {
        // Read existing credentials to preserve un-modified field
        let existingAccountId = '';
        let existingApiToken = '';

        if (existing?.encrypted_account_id) {
          existingAccountId = decryptApiKey(existing.encrypted_account_id);
        }

        if (existing?.encrypted_api_key) {
          const dec = decryptApiKey(existing.encrypted_api_key);
          if (dec.startsWith('{')) {
            try {
              const p = JSON.parse(dec);
              existingAccountId = existingAccountId || p.accountId || '';
              existingApiToken = p.apiToken || '';
            } catch {
              existingApiToken = dec;
            }
          } else if (dec.includes(':') && !dec.startsWith('Bearer ')) {
            const parts = dec.split(':');
            existingAccountId = existingAccountId || parts[0].trim();
            existingApiToken = parts.slice(1).join(':').trim();
          } else {
            existingApiToken = dec;
          }
        }

        const finalAccountId = (isAccountIdProvided && !isAccountIdMasked) ? account_id.trim() : existingAccountId;
        const finalApiToken = (isApiKeyProvided && !isApiKeyMasked) ? api_key.trim() : existingApiToken;

        if (finalAccountId) {
          updatePayload.encrypted_account_id = encryptApiKey(finalAccountId);
        }
        if (finalApiToken) {
          // Dual-layer format: bundle composite { accountId, apiToken } in encrypted_api_key
          const composite = finalAccountId
            ? JSON.stringify({ accountId: finalAccountId, apiToken: finalApiToken })
            : finalApiToken;
          updatePayload.encrypted_api_key = encryptApiKey(composite);
        }

        updatePayload.last_status = 'untested';
        updatePayload.last_error = null;
      }
    } else {
      // Standard provider API key update
      if (api_key && api_key.trim().length > 0 && !api_key.includes('••••')) {
        updatePayload.encrypted_api_key = encryptApiKey(api_key.trim());
        updatePayload.last_status = 'untested';
        updatePayload.last_error = null;
      }
    }

    let saved: DbAIProvider | null = null;
    let saveError: { message: string } | null = null;

    if (existing?.id) {
      // Safe UPDATE on existing record avoids PostgreSQL NOT NULL upsert evaluation errors
      let { data, error } = await supabase
        .from('ai_providers')
        .update(updatePayload)
        .eq('id', existing.id)
        .select('*')
        .single();

      // Graceful fallback if encrypted_account_id column does not exist yet in DB
      if (error && error.message.includes('encrypted_account_id')) {
        const fallbackPayload = { ...updatePayload };
        delete fallbackPayload.encrypted_account_id;
        const retry = await supabase
          .from('ai_providers')
          .update(fallbackPayload)
          .eq('id', existing.id)
          .select('*')
          .single();
        data = retry.data;
        error = retry.error;
      }

      saved = data as DbAIProvider;
      saveError = error;
    } else {
      // Safe INSERT on new record ensures all required fields are present
      const insertPayload: Record<string, unknown> = {
        provider_key,
        display_name: displayName,
        model: model || adapter?.defaultModel || 'default',
        priority: typeof priority === 'number' ? priority : 99,
        enabled: typeof enabled === 'boolean' ? enabled : false,
        last_status: 'untested',
        ...updatePayload,
      };
      let { data, error } = await supabase
        .from('ai_providers')
        .insert(insertPayload)
        .select('*')
        .single();

      // Graceful fallback if encrypted_account_id column does not exist yet in DB
      if (error && error.message.includes('encrypted_account_id')) {
        const fallbackInsert = { ...insertPayload };
        delete fallbackInsert.encrypted_account_id;
        const retry = await supabase
          .from('ai_providers')
          .insert(fallbackInsert)
          .select('*')
          .single();
        data = retry.data;
        error = retry.error;
      }

      saved = data as DbAIProvider;
      saveError = error;
    }

    if (saveError || !saved) {
      console.error('[Admin AI Providers API] Database save error for provider:', provider_key, saveError);
      return NextResponse.json(
        {
          error: `Database save error: ${saveError?.message || 'Failed to save provider to database'}.`,
        },
        { status: 500 }
      );
    }

    updateProviderInCache(saved);

    console.log('[Admin AI Providers API] Successfully updated provider in database:', {
      provider_key: saved.provider_key,
      enabled: saved.enabled,
      model: saved.model,
      priority: saved.priority,
      hasApiKey: Boolean(saved.encrypted_api_key),
      hasAccountId: Boolean(saved.encrypted_account_id),
      operation: existing?.id ? 'UPDATE' : 'INSERT',
    });

    let respMaskedKey = '';
    let respHasAccountId = false;
    let respMaskedAccountId = '';

    if (saved.provider_key === 'cloudflare') {
      let acc = '';
      let tok = '';
      if (saved.encrypted_account_id) {
        acc = decryptApiKey(saved.encrypted_account_id);
      }
      if (saved.encrypted_api_key) {
        const dec = decryptApiKey(saved.encrypted_api_key);
        if (dec.startsWith('{')) {
          try {
            const p = JSON.parse(dec);
            acc = acc || p.accountId || '';
            tok = p.apiToken || '';
          } catch {
            tok = dec;
          }
        } else if (dec.includes(':') && !dec.startsWith('Bearer ')) {
          const parts = dec.split(':');
          acc = acc || parts[0].trim();
          tok = parts.slice(1).join(':').trim();
        } else {
          tok = dec;
        }
      }
      respHasAccountId = Boolean(acc && acc.trim().length > 0);
      respMaskedAccountId = maskAccountId(acc);
      respMaskedKey = maskApiKey(tok);
    } else if (saved.encrypted_api_key) {
      respMaskedKey = maskApiKey(decryptApiKey(saved.encrypted_api_key));
    }

    return NextResponse.json(
      {
        success: true,
        provider: {
          id: saved.id,
          provider_key: saved.provider_key,
          display_name: saved.display_name,
          enabled: saved.enabled,
          model: saved.model,
          priority: saved.priority,
          last_tested_at: saved.last_tested_at,
          last_status: saved.last_status,
          last_error: saved.last_error,
          has_api_key: saved.provider_key === 'cloudflare' ? Boolean(respMaskedKey) : Boolean(saved.encrypted_api_key),
          masked_key: respMaskedKey,
          has_account_id: respHasAccountId,
          masked_account_id: respMaskedAccountId,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[Admin AI Providers API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI provider configuration.' },
      { status: 500 }
    );
  }
}
