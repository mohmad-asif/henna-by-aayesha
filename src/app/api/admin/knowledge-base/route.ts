import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { syncKnowledgeBase } from '@/lib/ai/embeddings/knowledge';

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

    // 1. Fetch embedding settings
    const { data: embeddingSettings } = await supabase
      .from('ai_embedding_settings')
      .select('provider_key, model, dimensions, requires_reindex')
      .eq('id', 1)
      .maybeSingle();

    // 2. Fetch knowledge documents
    const { data: documents, error: docsErr } = await supabase
      .from('knowledge_documents')
      .select('id, source_type, source_id, title, content, indexing_status, indexing_error, embedding_provider, embedding_model, updated_at')
      .order('updated_at', { ascending: false });

    if (docsErr) {
      console.warn('[Admin Knowledge Base API] Error loading knowledge_documents table:', docsErr.message);
    }

    const docList = documents || [];

    const total = docList.length;
    const indexed = docList.filter((d) => d.indexing_status === 'indexed').length;
    const pending = docList.filter((d) => d.indexing_status === 'pending').length;
    const failed = docList.filter((d) => d.indexing_status === 'failed').length;

    const lastIndexed = docList.length > 0 ? docList[0].updated_at : null;

    return NextResponse.json({
      stats: {
        total,
        indexed,
        pending,
        failed,
        last_indexed: lastIndexed,
        embedding_provider: embeddingSettings?.provider_key || 'gemini',
        embedding_model: embeddingSettings?.model || 'text-embedding-004',
        dimensions: embeddingSettings?.dimensions || 768,
        requires_reindex: embeddingSettings?.requires_reindex || false,
      },
      documents: docList.map((d) => ({
        id: d.id,
        source_type: d.source_type,
        source_id: d.source_id,
        title: d.title,
        status: d.indexing_status,
        error: d.indexing_error,
        updated_at: d.updated_at,
        snippet: d.content ? d.content.slice(0, 140) + '...' : '',
      })),
    });
  } catch (error) {
    console.error('[Admin Knowledge Base API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve knowledge base information.' },
      { status: 500 }
    );
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
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'sync'; // 'sync' | 'reindex'
    const forceReindex = action === 'reindex';

    const result = await syncKnowledgeBase(forceReindex);

    return NextResponse.json({
      success: result.failed === 0,
      stats: result,
      message: forceReindex
        ? `Re-indexed knowledge base: ${result.indexed} indexed, ${result.skipped} skipped, ${result.failed} failed.`
        : `Knowledge base synced: ${result.indexed} indexed, ${result.skipped} skipped, ${result.failed} failed.`,
    });
  } catch (error) {
    console.error('[Admin Knowledge Base API] POST error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Knowledge base synchronization failed.',
      },
      { status: 500 }
    );
  }
}
