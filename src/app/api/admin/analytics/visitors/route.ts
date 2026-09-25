import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getVisitorsList } from '@/lib/analytics/admin-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const device = searchParams.get('device') || undefined;
    const location = searchParams.get('location') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const sortBy = searchParams.get('sortBy') || 'last_active_at';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const result = await getVisitorsList({
      page,
      limit,
      search,
      device,
      location,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    }, auth.client);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[Admin Visitors List API Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve visitors list' }, { status: 500 });
  }
}
