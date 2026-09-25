import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AiConversation,
  AiMessage,
  AiConversationDetail,
  ConversationsListResponse,
} from '@/types/ai-chat';
import type { ChatAction } from '@/lib/ai/types';
import type { RecommendedDesign } from '@/lib/ai/design/types';

/**
 * Finds an existing conversation by ID, or creates a new one.
 */
export async function getOrCreateConversation(params: {
  conversationId: string;
  visitorId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  initialMessage?: string;
  metadata?: Record<string, unknown>;
  clientOverride?: SupabaseClient;
}): Promise<AiConversation | null> {
  const supabase = params.clientOverride || (await getAdminSupabaseClient());

  // 1. Try to find existing conversation
  const { data: existing, error: findErr } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', params.conversationId)
    .maybeSingle();

  if (findErr) {
    console.error('[ChatService] Error finding conversation:', findErr);
  }

  if (existing) {
    // If visitor / user details have become available, update them
    const updates: Partial<AiConversation> = {};
    if (!existing.visitor_id && params.visitorId) updates.visitor_id = params.visitorId;
    if (!existing.session_id && params.sessionId) updates.session_id = params.sessionId;
    if (!existing.user_id && params.userId) updates.user_id = params.userId;
    if (!existing.user_name && params.userName) updates.user_name = params.userName;
    if (!existing.user_email && params.userEmail) updates.user_email = params.userEmail;

    if (Object.keys(updates).length > 0) {
      await supabase.from('ai_conversations').update(updates).eq('id', existing.id);
    }
    return existing as AiConversation;
  }

  // 2. Generate a meaningful title from initial message preview
  let title = 'Mehndi Consultation';
  if (params.initialMessage) {
    const cleaned = params.initialMessage.replace(/[\r\n]+/g, ' ').trim();
    if (cleaned.length > 0) {
      title = cleaned.length > 40 ? `${cleaned.slice(0, 37)}...` : cleaned;
    }
  }

  // 3. Create new conversation
  const newRow: AiConversation = {
    id: params.conversationId,
    visitor_id: params.visitorId || null,
    session_id: params.sessionId || null,
    user_id: params.userId || null,
    user_name: params.userName || null,
    user_email: params.userEmail || null,
    title,
    status: 'active',
    unread_by_admin: true,
    last_message_preview: params.initialMessage?.slice(0, 150) || null,
    last_message_at: new Date().toISOString(),
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: insertErr } = await supabase
    .from('ai_conversations')
    .insert(newRow);

  if (insertErr) {
    console.error('[ChatService] Error creating conversation:', {
      message: insertErr.message,
      code: insertErr.code,
      details: insertErr.details,
      hint: insertErr.hint,
    });

    // 1. If foreign key constraint failed (e.g. visitor_id, session_id, or user_id not yet created in table)
    if (insertErr.code === '23503') {
      console.warn('[ChatService] Foreign key constraint error on ai_conversations insert (code 23503). Retrying insert without foreign keys...');
      const fallbackRow: AiConversation = {
        ...newRow,
        visitor_id: null,
        session_id: null,
        user_id: null,
      };
      const { error: retryErr } = await supabase
        .from('ai_conversations')
        .insert(fallbackRow);

      if (!retryErr) {
        console.log('[ChatService] Conversation created successfully on foreign key fallback.');
        return fallbackRow;
      }
      console.error('[ChatService] Fallback conversation insert also failed:', {
        message: retryErr.message,
        code: retryErr.code,
        details: retryErr.details,
        hint: retryErr.hint,
      });
    }

    // 2. If conflict happened concurrently (code 23505), fetch existing
    const { data: fallback, error: fallbackErr } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', params.conversationId)
      .maybeSingle();

    if (fallback) {
      return fallback as AiConversation;
    }

    if (fallbackErr) {
      console.error('[ChatService] Error fetching fallback conversation:', {
        message: fallbackErr.message,
        code: fallbackErr.code,
        details: fallbackErr.details,
        hint: fallbackErr.hint,
      });
    }

    return null;
  }

  return newRow;
}

/**
 * Saves a message (user or assistant) to a conversation with idempotency protection.
 */
export async function saveMessage(params: {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  action?: ChatAction | null;
  recommendations?: RecommendedDesign[] | null;
  followUpQuestion?: string | null;
  provider?: string | null;
  clientMessageId?: string | null;
  clientOverride?: SupabaseClient;
}): Promise<AiMessage | null> {
  const supabase = params.clientOverride || (await getAdminSupabaseClient());

  // Idempotency check: if clientMessageId is provided, check if already recorded
  if (params.clientMessageId) {
    const { data: existing } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', params.conversationId)
      .eq('client_message_id', params.clientMessageId)
      .maybeSingle();

    if (existing) {
      return existing as AiMessage;
    }
  }

  const messageId = crypto.randomUUID();
  const messagePayload: AiMessage = {
    id: messageId,
    conversation_id: params.conversationId,
    role: params.role,
    content: params.content,
    action: params.action || null,
    recommendations: params.recommendations || null,
    follow_up_question: params.followUpQuestion || null,
    provider: params.provider || null,
    client_message_id: params.clientMessageId || null,
    created_at: new Date().toISOString(),
  };

  const { error: msgErr } = await supabase
    .from('ai_messages')
    .insert(messagePayload);

  if (msgErr) {
    console.error('[ChatService] Error saving message:', {
      message: msgErr.message,
      code: msgErr.code,
      details: msgErr.details,
      hint: msgErr.hint,
    });
    return null;
  }

  // Update conversation last message preview & timestamp
  const updates: Record<string, unknown> = {
    last_message_preview: params.content.slice(0, 150),
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (params.role === 'user') {
    updates.unread_by_admin = true;
  }

  const { error: updateErr } = await supabase
    .from('ai_conversations')
    .update(updates)
    .eq('id', params.conversationId);

  if (updateErr) {
    console.error('[ChatService] Error updating conversation preview:', {
      message: updateErr.message,
      code: updateErr.code,
      details: updateErr.details,
      hint: updateErr.hint,
    });
  }

  return messagePayload;
}

/**
 * Fetches conversation details and messages for client-side chat widget.
 */
export async function getConversationHistory(
  conversationId: string,
  clientOverride?: SupabaseClient
): Promise<AiConversationDetail | null> {
  const supabase = clientOverride || (await getAdminSupabaseClient());

  const { data: conv, error: convErr } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (convErr || !conv) {
    return null;
  }

  const { data: messages, error: msgErr } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (msgErr) {
    console.error('[ChatService] Error loading messages:', msgErr);
  }

  return {
    ...(conv as AiConversation),
    messages: (messages as AiMessage[]) || [],
  };
}

/**
 * Admin Panel: Fetches paginated conversations list with search and filters.
 */
export async function getAdminConversations(
  options: {
    search?: string;
    sort?: 'latest' | 'oldest' | 'unread' | 'messages';
    status?: 'all' | 'active' | 'archived' | 'resolved' | 'closed';
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  },
  clientOverride?: SupabaseClient
): Promise<ConversationsListResponse> {
  const supabase = clientOverride || (await getAdminSupabaseClient());
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 30));
  const offset = (page - 1) * limit;

  let query = supabase.from('ai_conversations').select('*', { count: 'exact' });

  // Filter by status
  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  // Filter by unreadOnly
  if (options.unreadOnly) {
    query = query.eq('unread_by_admin', true);
  }

  // Live search across title, user_name, user_email, visitor_id, or preview
  if (options.search && options.search.trim().length > 0) {
    const s = options.search.trim();
    query = query.or(
      `title.ilike.%${s}%,user_name.ilike.%${s}%,user_email.ilike.%${s}%,visitor_id.ilike.%${s}%,last_message_preview.ilike.%${s}%`
    );
  }

  // Sorting
  switch (options.sort) {
    case 'oldest':
      query = query.order('last_message_at', { ascending: true });
      break;
    case 'unread':
      query = query
        .order('unread_by_admin', { ascending: false })
        .order('last_message_at', { ascending: false });
      break;
    case 'messages':
      query = query
        .order('messages_count', { ascending: false })
        .order('last_message_at', { ascending: false });
      break;
    case 'latest':
    default:
      query = query.order('last_message_at', { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const [{ data, count, error }, { count: unreadCount, error: unreadErr }] = await Promise.all([
    query,
    supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('unread_by_admin', true),
  ]);

  if (error) {
    console.error('[ChatService] Error listing admin conversations:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  if (unreadErr) {
    console.error('[ChatService] Error counting unread conversations:', {
      message: unreadErr.message,
      code: unreadErr.code,
      details: unreadErr.details,
      hint: unreadErr.hint,
    });
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    conversations: (data as AiConversation[]) || [],
    total,
    unreadCount: unreadCount || 0,
    page,
    totalPages,
  };
}

/**
 * Admin Panel: Fetches full conversation detail with complete chronological message history.
 * Automatically marks conversation as read by admin.
 */
export async function getAdminConversationDetail(
  conversationId: string,
  clientOverride?: SupabaseClient
): Promise<AiConversationDetail | null> {
  const supabase = clientOverride || (await getAdminSupabaseClient());

  const { data: conv, error: convErr } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (convErr) {
    console.error('[ChatService] Error loading conversation detail:', {
      message: convErr.message,
      code: convErr.code,
      details: convErr.details,
      hint: convErr.hint,
    });
    return null;
  }

  if (!conv) {
    return null;
  }

  // Mark unread as false when admin views it
  if (conv.unread_by_admin) {
    const { error: markErr } = await supabase
      .from('ai_conversations')
      .update({ unread_by_admin: false })
      .eq('id', conversationId);
    if (markErr) {
      console.error('[ChatService] Error marking conversation as read:', {
        message: markErr.message,
        code: markErr.code,
        details: markErr.details,
        hint: markErr.hint,
      });
    }
    conv.unread_by_admin = false;
  }

  // Fetch complete history (up to 500 messages per conversation)
  const { data: messages, error: msgErr } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (msgErr) {
    console.error('[ChatService] Error loading admin conversation messages:', {
      message: msgErr.message,
      code: msgErr.code,
      details: msgErr.details,
      hint: msgErr.hint,
    });
  }

  return {
    ...(conv as AiConversation),
    messages: (messages as AiMessage[]) || [],
  };
}

/**
 * Admin Panel: Update status or title.
 */
export async function updateAdminConversation(
  conversationId: string,
  updates: {
    status?: 'active' | 'closed' | 'archived' | 'resolved';
    unread_by_admin?: boolean;
    title?: string;
  },
  clientOverride?: SupabaseClient
): Promise<boolean> {
  const supabase = clientOverride || (await getAdminSupabaseClient());

  const { error } = await supabase
    .from('ai_conversations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (error) {
    console.error('[ChatService] Error updating conversation:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return false;
  }
  return true;
}

/**
 * Admin Panel: Delete conversation and associated messages.
 */
export async function deleteAdminConversation(
  conversationId: string,
  clientOverride?: SupabaseClient
): Promise<boolean> {
  const supabase = clientOverride || (await getAdminSupabaseClient());

  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('[ChatService] Error deleting conversation:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return false;
  }
  return true;
}
