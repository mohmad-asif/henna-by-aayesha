import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getAnalyticsOverview } from '@/lib/analytics/admin-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await getAnalyticsOverview({ range, startDate, endDate });
    return NextResponse.json({
      topPages: data.topPages,
      topLandingPages: data.topLandingPages,
      topExitPages: data.topExitPages,
      totalPageViews: data.totalPageViews,
    });
  } catch (error: unknown) {
    console.error('[Admin Pages Analytics API Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve pages analytics' }, { status: 500 });
  }
}
