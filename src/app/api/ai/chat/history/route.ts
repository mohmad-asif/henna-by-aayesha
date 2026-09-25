import { NextRequest, NextResponse } from 'next/server';
import { getConversationHistory } from '@/lib/ai/chat-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json({ error: 'conversationId parameter is required' }, { status: 400 });
    }

    const history = await getConversationHistory(conversationId.trim());

    if (!history) {
      return NextResponse.json({ conversation: null, messages: [] });
    }

    return NextResponse.json({
      conversation: {
        id: history.id,
        title: history.title,
        status: history.status,
        created_at: history.created_at,
      },
      messages: history.messages,
    });
  } catch (error: unknown) {
    console.error('[AI Chat History API Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve conversation history' }, { status: 500 });
  }
}
