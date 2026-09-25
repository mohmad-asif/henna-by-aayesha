import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getEmbeddingProvider } from '@/lib/ai/embeddings/providers';
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/ai/encryption';
import {
  ClientEmbeddingSettings,
  DbEmbeddingSettings,
  EmbeddingProviderKey,
} from '@/lib/ai/embeddings/types';

async function verifyAdminAuth() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }
  return user;
}

const DEFAULT_SETTINGS: DbEmbeddingSettings = {
  id: 1,
  provider_key: 'gemini',
  model: 'gemini-embedding-2',
  dimensions: 768,
  enabled: true,
  encrypted_api_key: null,
  last_tested_at: null,
  last_status: 'untested',
  last_error: null,
  requires_reindex: false,
};

export async function GET() {
  const user = await verifyAdminAuth();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('ai_embedding_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const settings: DbEmbeddingSettings = data || DEFAULT_SETTINGS;
    const adapter = getEmbeddingProvider(settings.provider_key);

    let hasApiKey = Boolean(settings.encrypted_api_key && settings.encrypted_api_key.trim().length > 0);
    let maskedKey = '';

    if (hasApiKey) {
      const decrypted = decryptApiKey(settings.encrypted_api_key!);
      maskedKey = maskApiKey(decrypted);
    } else {
      // Check if fallback key is configured in ai_providers
      const { data: aiProviderRow } = await supabase
        .from('ai_providers')
        .select('encrypted_api_key')
        .eq('provider_key', settings.provider_key)
        .maybeSingle();

      if (aiProviderRow?.encrypted_api_key) {
        hasApiKey = true;
        maskedKey = `${maskApiKey(decryptApiKey(aiProviderRow.encrypted_api_key))} (Shared with Chat)`;
      }
    }

    const clientSettings: ClientEmbeddingSettings = {
      provider_key: settings.provider_key,
      model: settings.model,
      dimensions: settings.dimensions,
      enabled: settings.enabled,
      has_api_key: hasApiKey,
      masked_key: maskedKey,
      last_tested_at: settings.last_tested_at,
      last_status: settings.last_status,
      last_error: settings.last_error,
      requires_reindex: settings.requires_reindex || false,
      supported_models: adapter?.supportedModels || [
        { model: settings.model, dimension: settings.dimensions, displayName: settings.model },
      ],
    };

    return NextResponse.json({ settings: clientSettings });
  } catch (error) {
    console.error('[Admin Embedding Config API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve embedding settings.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAdminAuth();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      provider_key,
      model,
      dimensions,
      enabled,
      api_key,
    }: {
      provider_key?: EmbeddingProviderKey;
      model?: string;
      dimensions?: number;
      enabled?: boolean;
      api_key?: string;
    } = body;

    const supabase = await createServerClient();

    // Check existing configuration to detect model or provider change
    const { data: current } = await supabase
      .from('ai_embedding_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const updatePayload: Record<string, unknown> = {
      id: 1,
      updated_at: new Date().toISOString(),
    };

    if (provider_key) {
      updatePayload.provider_key = provider_key;
    }
    if (model) {
      updatePayload.model = model.trim();
    }
    if (typeof dimensions === 'number') {
      updatePayload.dimensions = dimensions;
    }
    if (typeof enabled === 'boolean') {
      updatePayload.enabled = enabled;
    }

    // Detect if provider or model changed -> flag requires_reindex
    if (
      current &&
      ((provider_key && provider_key !== current.provider_key) ||
        (model && model !== current.model) ||
        (dimensions && dimensions !== current.dimensions))
    ) {
      updatePayload.requires_reindex = true;
    }

    if (api_key && api_key.trim().length > 0 && !api_key.includes('••••')) {
      updatePayload.encrypted_api_key = encryptApiKey(api_key.trim());
      updatePayload.last_status = 'untested';
      updatePayload.last_error = null;
    }

    const { data: saved, error } = await supabase
      .from('ai_embedding_settings')
      .upsert(updatePayload)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      requires_reindex: saved.requires_reindex,
      message: 'Embedding settings updated successfully.',
    });
  } catch (error) {
    console.error('[Admin Embedding Config API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update embedding settings.' },
      { status: 500 }
    );
  }
}
