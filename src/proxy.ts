import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Cookie auth session missing or failed
  }

  // Fallback: Check Authorization: Bearer token header for programmatic/API access
  if (!user) {
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const authClient = createSupabaseClient(
          supabaseUrl,
          supabaseKey,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        const { data: tokenData } = await authClient.auth.getUser();
        if (tokenData?.user) {
          user = tokenData.user;
        }
      }
    } catch {
      // Token check failed
    }
  }

  const pathname = request.nextUrl.pathname;
  const isAccessingAdminUi = pathname.startsWith('/admin');
  const isAccessingAdminApi = pathname.startsWith('/api/admin');
  const isLoginPage = pathname === '/admin/login';

  // 1. Protect Admin API routes: return JSON 401 Unauthorized for unauthenticated requests
  if (isAccessingAdminApi) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }
  }

  // 2. Protect Admin UI routes: redirect to login if unauthenticated
  if (isAccessingAdminUi && !isLoginPage) {
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Redirect authenticated user away from login page to dashboard
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - public files with extensions (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
