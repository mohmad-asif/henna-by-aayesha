import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import { getDateCutoff } from '@/lib/analytics/admin-service';

export const dynamic = 'force-dynamic';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'visitors';
    const range = searchParams.get('range') || '30d';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const { start, end } = getDateCutoff({ range, startDate, endDate });
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const supabase = await getAdminSupabaseClient();
    let csvContent = '';
    const filename = `henna_analytics_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'visitors') {
      const { data: visitors } = await supabase
        .from('visitors')
        .select('*')
        .gte('last_active_at', startIso)
        .lte('last_active_at', endIso)
        .order('last_active_at', { ascending: false })
        .limit(5000);

      const headers = [
        'Visitor ID',
        'First Visit',
        'Last Active',
        'Visit Count',
        'Page Views',
        'Device',
        'Browser',
        'OS',
        'Approximate Location',
        'Referrer',
        'Landing Page',
        'Last Page',
      ];
      csvContent = headers.join(',') + '\n';

      (visitors || []).forEach((v) => {
        const row = [
          escapeCsvField(v.visitor_id),
          escapeCsvField(v.first_visit_at),
          escapeCsvField(v.last_active_at),
          v.visit_count,
          v.page_views_count,
          escapeCsvField(v.device_type),
          escapeCsvField(v.browser),
          escapeCsvField(v.os),
          escapeCsvField(v.location_display || v.city || 'Bangalore, Karnataka, India'),
          escapeCsvField(v.initial_referrer || 'Direct'),
          escapeCsvField(v.landing_page),
          escapeCsvField(v.last_page),
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (type === 'events') {
      const { data: events } = await supabase
        .from('visitor_events')
        .select('*')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(5000);

      const headers = ['Timestamp', 'Event Name', 'URL Path', 'Visitor ID', 'Details'];
      csvContent = headers.join(',') + '\n';

      (events || []).forEach((ev) => {
        const row = [
          escapeCsvField(ev.created_at),
          escapeCsvField(ev.event_name),
          escapeCsvField(ev.url_path),
          escapeCsvField(ev.visitor_id),
          escapeCsvField(JSON.stringify(ev.properties || {})),
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (type === 'pageviews') {
      const { data: pageViews } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(5000);

      const headers = ['Timestamp', 'Page Path', 'Page Title', 'Device', 'Time Spent (s)', 'Visitor ID'];
      csvContent = headers.join(',') + '\n';

      (pageViews || []).forEach((pv) => {
        const row = [
          escapeCsvField(pv.created_at),
          escapeCsvField(pv.url_path),
          escapeCsvField(pv.page_title || ''),
          escapeCsvField(pv.device_type),
          pv.time_spent_seconds || 0,
          escapeCsvField(pv.visitor_id),
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error('[Admin CSV Export Error]:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
