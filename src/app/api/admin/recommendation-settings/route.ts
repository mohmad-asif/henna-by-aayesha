import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  AIRecommendationSettings,
  DEFAULT_RECOMMENDATION_SETTINGS,
} from '@/lib/ai/design/types';

async function verifyAdminAuth() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }
  return user;
}

export async function GET() {
  const user = await verifyAdminAuth();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('ai_recommendation_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ settings: DEFAULT_RECOMMENDATION_SETTINGS });
    }

    const settings: AIRecommendationSettings = {
      enabled: data.enabled ?? true,
      maxRecommendations: data.max_recommendations ?? 3,
      minSimilarityThreshold: data.min_similarity_threshold ?? 0.35,
      enableSemantic: data.enable_semantic ?? true,
      enableMetadata: data.enable_metadata ?? true,
    };

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[Admin Recommendation Settings API] GET error:', err);
    return NextResponse.json({ settings: DEFAULT_RECOMMENDATION_SETTINGS });
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAdminAuth();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
    const maxRecommendations = Math.min(
      8,
      Math.max(1, Number(body.maxRecommendations) || 3)
    );
    const minSimilarityThreshold = Math.min(
      0.9,
      Math.max(0.1, Number(body.minSimilarityThreshold) || 0.35)
    );
    const enableSemantic = typeof body.enableSemantic === 'boolean' ? body.enableSemantic : true;
    const enableMetadata = typeof body.enableMetadata === 'boolean' ? body.enableMetadata : true;

    const supabase = await createServerClient();
    const { error } = await supabase
      .from('ai_recommendation_settings')
      .upsert({
        id: 1,
        enabled,
        max_recommendations: maxRecommendations,
        min_similarity_threshold: minSimilarityThreshold,
        enable_semantic: enableSemantic,
        enable_metadata: enableMetadata,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      settings: {
        enabled,
        maxRecommendations,
        minSimilarityThreshold,
        enableSemantic,
        enableMetadata,
      },
    });
  } catch (err) {
    console.error('[Admin Recommendation Settings API] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update recommendation settings.' },
      { status: 500 }
    );
  }
}
