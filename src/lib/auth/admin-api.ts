import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function verifyAdminAuth(
  request?: NextRequest
): Promise<{ user: { id: string; email?: string }; client: SupabaseClient } | null> {
  // 1. Check Bearer token header (for programmatic / API testing access)
  if (request) {
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const client = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        const {
          data: { user: tokenUser },
        } = await client.auth.getUser();
        if (tokenUser) {
          return { user: tokenUser, client };
        }
      }
    } catch {
      // Continue to cookie check
    }
  }

  // 2. Check cookie-based session (standard browser admin panel)
  try {
    const supabase = (await createServerClient()) as unknown as SupabaseClient;
    const {
      data: { user: cookieUser },
    } = await supabase.auth.getUser();

    if (cookieUser) {
      return { user: cookieUser, client: supabase };
    }
  } catch {
    // Cookie session not available or invalid
  }

  return null;
}
