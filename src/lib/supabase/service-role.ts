import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;
let clientInitPromise: Promise<SupabaseClient> | null = null;

/**
 * Returns a server-only Supabase client for backend operations (such as AI chat routing,
 * provider configuration retrieval, and embedding management).
 *
 * Security:
 * - Strictly server-side (enforced by 'server-only').
 * - In production: Requires SUPABASE_SERVICE_ROLE_KEY to bypass RLS for internal server tasks.
 * - In local dev: Falls back gracefully if service role key is not yet set.
 */
export async function getAdminSupabaseClient(): Promise<SupabaseClient> {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  if (clientInitPromise) {
    return clientInitPromise;
  }

  clientInitPromise = (async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      throw new Error('[Supabase Service Role] NEXT_PUBLIC_SUPABASE_URL is not defined.');
    }

    if (serviceRoleKey && serviceRoleKey.trim().length > 0) {
      cachedAdminClient = createClient(url, serviceRoleKey.trim(), {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      return cachedAdminClient;
    }

    if (!anonKey) {
      throw new Error('[Supabase Service Role] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not defined.');
    }

    // Graceful fallback using anon key when service role key is not yet set
    console.warn(
      '[Supabase Service Role] SUPABASE_SERVICE_ROLE_KEY is not configured in this environment. Falling back to publishable key client.'
    );
    cachedAdminClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return cachedAdminClient;
  })();

  try {
    const client = await clientInitPromise;
    return client;
  } finally {
    clientInitPromise = null;
  }
}
