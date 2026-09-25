import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getLiveVisitors } from '@/lib/analytics/admin-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const data = await getLiveVisitors(auth.client);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('[Admin Live Visitors API Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve live visitors' }, { status: 500 });
  }
}
