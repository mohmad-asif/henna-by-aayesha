import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getVisitorDetail } from '@/lib/analytics/admin-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const detail = await getVisitorDetail(id, auth.client);

    if (!detail.visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error: unknown) {
    console.error('[Admin Visitor Detail API Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve visitor details' }, { status: 500 });
  }
}
