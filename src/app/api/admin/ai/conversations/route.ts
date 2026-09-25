import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getAdminConversations } from '@/lib/ai/chat-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const sort =
      ((searchParams.get('sort') || searchParams.get('sortBy')) as 'latest' | 'oldest' | 'unread') ||
      'latest';
    const status =
      (searchParams.get('status') as 'all' | 'active' | 'resolved' | 'closed' | 'archived') || 'all';
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const result = await getAdminConversations(
      {
        search,
        sort,
        status,
        unreadOnly,
        page,
        limit,
      },
      auth.client
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[Admin AI Conversations API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve AI conversations list' },
      { status: 500 }
    );
  }
}
