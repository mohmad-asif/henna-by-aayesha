import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getEmbeddingProvider } from '@/lib/ai/embeddings/providers';
import { decryptApiKey } from '@/lib/ai/encryption';
import { EmbeddingProviderKey } from '@/lib/ai/embeddings/types';

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
      api_key,
    }: {
      provider_key?: EmbeddingProviderKey;
      model?: string;
      api_key?: string;
    } = body;

    const supabase = await createServerClient();
    const { data: dbSettings } = await supabase
      .from('ai_embedding_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const targetProviderKey = provider_key || dbSettings?.provider_key || 'gemini';
    const targetModel = model || dbSettings?.model;

    const adapter = getEmbeddingProvider(targetProviderKey);
    if (!adapter) {
      return NextResponse.json(
        { error: `Unsupported embedding provider: ${targetProviderKey}` },
        { status: 400 }
      );
    }

    let keyToTest = '';

    // If an unsaved key was explicitly passed
    if (api_key && api_key.trim().length > 0 && !api_key.includes('••••')) {
      keyToTest = api_key.trim();
    } else if (dbSettings?.encrypted_api_key) {
      keyToTest = decryptApiKey(dbSettings.encrypted_api_key);
    } else {
      // Check corresponding provider key in ai_providers
      const { data: aiProviderRow } = await supabase
        .from('ai_providers')
        .select('encrypted_api_key')
        .eq('provider_key', targetProviderKey)
        .maybeSingle();

      if (aiProviderRow?.encrypted_api_key) {
        keyToTest = decryptApiKey(aiProviderRow.encrypted_api_key);
      }
    }

    if (!keyToTest) {
      return NextResponse.json(
        {
          success: false,
          latencyMs: 0,
          error: `No API key configured for embedding provider ${targetProviderKey}. Please enter a valid API key.`,
        },
        { status: 400 }
      );
    }

    const testResult = await adapter.testConnection(keyToTest, targetModel);

    // Save test result in database
    try {
      await supabase
        .from('ai_embedding_settings')
        .update({
          last_tested_at: new Date().toISOString(),
          last_status: testResult.success ? 'connected' : 'error',
          last_error: testResult.error ? testResult.error.slice(0, 300) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
    } catch {
      // non-blocking
    }

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('[Admin Embedding Test API] error:', error);
    return NextResponse.json(
      {
        success: false,
        latencyMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error during embedding test.',
      },
      { status: 500 }
    );
  }
}
