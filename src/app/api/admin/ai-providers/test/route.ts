export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import { getProvider } from '@/lib/ai/providers';
import { decryptApiKey } from '@/lib/ai/encryption';
import { AIProviderKey } from '@/lib/ai/types';

async function verifyAdminAuth(request?: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user: cookieUser },
    } = await supabase.auth.getUser();

    if (cookieUser) return cookieUser;

    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const adminClient = await getAdminSupabaseClient();
        const {
          data: { user: tokenUser },
        } = await adminClient.auth.getUser(token);
        if (tokenUser) return tokenUser;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAdminAuth(request);
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
      account_id,
    }: {
      provider_key: AIProviderKey;
      model?: string;
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
    if (!adapter) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider_key}` },
        { status: 400 }
      );
    }

    let testResult: { success: boolean; latencyMs: number; message?: string; error?: string };
    const targetModel = model || adapter.defaultModel;

    if (provider_key === 'cloudflare') {
      let targetAccountId = '';
      let targetApiToken = '';

      const isExplicitAcc =
        typeof account_id === 'string' &&
        account_id.trim().length > 0 &&
        !account_id.includes('...') &&
        !account_id.includes('••••');
      const isExplicitKey =
        typeof api_key === 'string' &&
        api_key.trim().length > 0 &&
        !api_key.includes('••••');

      if (isExplicitAcc) {
        targetAccountId = account_id.trim();
      }
      if (isExplicitKey) {
        targetApiToken = api_key.trim();
      }

      // If either credential was omitted, retrieve saved credential from database
      if (!targetAccountId || !targetApiToken) {
        const dbClient = await getAdminSupabaseClient();
        const { data: dbRow } = await dbClient
          .from('ai_providers')
          .select('*')
          .eq('provider_key', 'cloudflare')
          .maybeSingle();

        if (dbRow) {
          if (!targetAccountId && dbRow.encrypted_account_id) {
            targetAccountId = decryptApiKey(dbRow.encrypted_account_id);
          }
          if (dbRow.encrypted_api_key) {
            const dec = decryptApiKey(dbRow.encrypted_api_key);
            if (dec.startsWith('{')) {
              try {
                const p = JSON.parse(dec);
                targetAccountId = targetAccountId || p.accountId || '';
                targetApiToken = targetApiToken || p.apiToken || '';
              } catch {
                targetApiToken = targetApiToken || dec;
              }
            } else if (dec.includes(':') && !dec.startsWith('Bearer ')) {
              const parts = dec.split(':');
              targetAccountId = targetAccountId || parts[0].trim();
              targetApiToken = targetApiToken || parts.slice(1).join(':').trim();
            } else {
              targetApiToken = targetApiToken || dec;
            }
          }
        }
      }

      if (!targetAccountId && process.env.CLOUDFLARE_ACCOUNT_ID) {
        targetAccountId = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
      }

      if (!targetAccountId) {
        return NextResponse.json(
          {
            success: false,
            latencyMs: 0,
            error: 'Cloudflare Account ID is required. Please provide your Account ID.',
          },
          { status: 400 }
        );
      }

      if (!targetApiToken) {
        return NextResponse.json(
          {
            success: false,
            latencyMs: 0,
            error: 'Cloudflare API Token is required. Please provide your API Token.',
          },
          { status: 400 }
        );
      }

      testResult = await adapter.testConnection(targetApiToken, targetModel, targetAccountId);
    } else {
      let keyToTest = '';

      // If an unsaved key was explicitly provided to test
      if (api_key && api_key.trim().length > 0 && !api_key.includes('••••')) {
        keyToTest = api_key.trim();
      } else {
        // Fetch saved key from Supabase using admin client
        const dbClient = await getAdminSupabaseClient();
        const { data: dbRow } = await dbClient
          .from('ai_providers')
          .select('*')
          .eq('provider_key', provider_key)
          .maybeSingle();

        if (dbRow?.encrypted_api_key) {
          keyToTest = decryptApiKey(dbRow.encrypted_api_key);
        }
      }

      if (!keyToTest) {
        return NextResponse.json(
          {
            success: false,
            latencyMs: 0,
            error: 'No API key provided or configured. Please enter a valid API key to test connection.',
          },
          { status: 400 }
        );
      }

      testResult = await adapter.testConnection(keyToTest, targetModel);
    }

    // Save test result to database asynchronously
    try {
      const dbClient = await getAdminSupabaseClient();
      await dbClient
        .from('ai_providers')
        .update({
          last_tested_at: new Date().toISOString(),
          last_status: testResult.success ? 'connected' : 'error',
          last_error: testResult.error ? testResult.error.slice(0, 300) : null,
        })
        .eq('provider_key', provider_key);
    } catch {
      // Ignore background update failure
    }

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('[Admin AI Providers API] Test route error:', error);
    return NextResponse.json(
      {
        success: false,
        latencyMs: 0,
        error: error instanceof Error ? error.message : 'Unknown test error',
      },
      { status: 500 }
    );
  }
}
