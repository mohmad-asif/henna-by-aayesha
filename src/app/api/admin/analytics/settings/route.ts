import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import { runRetentionCleanup } from '@/lib/analytics/admin-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await getAdminSupabaseClient();
    const { data: settings } = await supabase
      .from('analytics_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // 1. Manual Cleanup Trigger
    if (body.action === 'cleanup') {
      const days = body.daysToKeep ? parseInt(body.daysToKeep, 10) : undefined;
      const stats = await runRetentionCleanup(days);
      return NextResponse.json({ success: true, cleanupStats: stats });
    }

    // 2. Settings Update
    const supabase = await getAdminSupabaseClient();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.retention_days !== undefined) {
      const days = parseInt(body.retention_days, 10);
      if ([30, 60, 90, 180, 365].includes(days)) {
        updatePayload.retention_days = days;
      }
    }

    if (body.tracking_enabled !== undefined) {
      updatePayload.tracking_enabled = Boolean(body.tracking_enabled);
    }

    if (body.require_consent !== undefined) {
      updatePayload.require_consent = Boolean(body.require_consent);
    }

    if (body.anonymize_ip !== undefined) {
      updatePayload.anonymize_ip = Boolean(body.anonymize_ip);
    }

    const { data, error } = await supabase
      .from('analytics_settings')
      .upsert({ id: 1, ...updatePayload })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: data });
  } catch (error: unknown) {
    console.error('[Admin Analytics Settings POST Error]:', error);
    return NextResponse.json({ error: 'Failed to update analytics settings' }, { status: 500 });
  }
}
