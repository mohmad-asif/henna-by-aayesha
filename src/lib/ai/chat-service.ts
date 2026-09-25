import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AiConversation,
  AiMessage,
  AiConversationDetail,
  ConversationsListResponse,
  UserProfileDetails,
  UserIpRecord,
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

  // Gather complete User Profile & Tracking Details
  const userId = conv.user_id || null;
  const visitorId = conv.visitor_id || null;

  // 1. Fetch user profile if user_id is present
  let profile: Record<string, unknown> | null = null;
  if (userId) {
    const { data: profileData } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (profileData) {
      profile = profileData;
    }
  }

  // 2. Fetch visitor tracking record if visitor_id is present
  let visitor: Record<string, unknown> | null = null;
  let sessions: Array<Record<string, unknown>> = [];
  if (visitorId) {
    const [visitorRes, sessionsRes] = await Promise.all([
      supabase.from('visitors').select('*').eq('visitor_id', visitorId).maybeSingle(),
      supabase
        .from('visitor_sessions')
        .select('*')
        .eq('visitor_id', visitorId)
        .order('last_active_at', { ascending: false })
        .limit(50),
    ]);
    if (visitorRes.data) visitor = visitorRes.data;
    if (sessionsRes.data) sessions = sessionsRes.data;
  }

  // 3. Compute aggregate AI stats for this user or visitor
  let relatedConvsQuery = supabase
    .from('ai_conversations')
    .select('id, last_message_at, created_at');

  if (userId) {
    relatedConvsQuery = relatedConvsQuery.eq('user_id', userId);
  } else if (visitorId) {
    relatedConvsQuery = relatedConvsQuery.eq('visitor_id', visitorId);
  } else {
    relatedConvsQuery = relatedConvsQuery.eq('id', conversationId);
  }

  const { data: relatedConvs } = await relatedConvsQuery;
  const allRelatedConvs = relatedConvs && relatedConvs.length > 0 ? relatedConvs : [conv];
  const totalAiConvs = allRelatedConvs.length;

  let latestAiConvAt: string | null = null;
  for (const rc of allRelatedConvs) {
    const t = (rc.last_message_at as string) || (rc.created_at as string);
    if (!latestAiConvAt || (t && new Date(t) > new Date(latestAiConvAt))) {
      latestAiConvAt = t;
    }
  }

  const relatedConvIds = allRelatedConvs.map((c) => c.id);
  let totalAiMessages = messages?.length || 0;
  if (relatedConvIds.length > 1) {
    const { count: msgCount } = await supabase
      .from('ai_messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', relatedConvIds);
    if (typeof msgCount === 'number') {
      totalAiMessages = msgCount;
    }
  }

  // 4. Extract and Deduplicate IP Addresses to build IP History
  const ipMap = new Map<string, UserIpRecord>();

  if (sessions && sessions.length > 0) {
    for (const s of sessions) {
      const ip = (s.ip_address as string)?.trim();
      if (!ip || ip.toLowerCase() === 'unknown' || ip === 'null') continue;

      const existing = ipMap.get(ip);
      const sessionStarted = (s.started_at as string) || null;
      const sessionActive = (s.last_active_at as string) || sessionStarted;
      const browser = s.browser && s.browser !== 'Unknown' ? (s.browser as string) : null;
      const os = s.os && s.os !== 'Unknown' ? (s.os as string) : null;
      const deviceType = (s.device_type as string) || null;

      if (!existing) {
        ipMap.set(ip, {
          ip,
          first_seen: sessionStarted,
          last_seen: sessionActive,
          session_count: 1,
          browser,
          os,
          device_type: deviceType,
        });
      } else {
        existing.session_count = (existing.session_count || 1) + 1;
        if (sessionStarted && (!existing.first_seen || new Date(sessionStarted) < new Date(existing.first_seen))) {
          existing.first_seen = sessionStarted;
        }
        if (sessionActive && (!existing.last_seen || new Date(sessionActive) > new Date(existing.last_seen))) {
          existing.last_seen = sessionActive;
        }
        if (!existing.browser && browser) existing.browser = browser;
        if (!existing.os && os) existing.os = os;
        if (!existing.device_type && deviceType) existing.device_type = deviceType;
      }
    }
  }

  const visitorIp = (visitor?.ip_address as string)?.trim();
  if (visitorIp && visitorIp.toLowerCase() !== 'unknown' && visitorIp !== 'null') {
    const existing = ipMap.get(visitorIp);
    const firstSeen = (visitor?.first_visit_at as string) || null;
    const lastSeen = (visitor?.last_active_at as string) || (visitor?.last_visit_at as string) || null;
    const browser = visitor?.browser && visitor.browser !== 'Unknown' ? (visitor.browser as string) : null;
    const os = visitor?.os && visitor.os !== 'Unknown' ? (visitor.os as string) : null;
    const deviceType = (visitor?.device_type as string) || null;

    if (!existing) {
      ipMap.set(visitorIp, {
        ip: visitorIp,
        first_seen: firstSeen,
        last_seen: lastSeen,
        session_count: Number(visitor?.visit_count) || 1,
        browser,
        os,
        device_type: deviceType,
      });
    } else {
      if (firstSeen && (!existing.first_seen || new Date(firstSeen) < new Date(existing.first_seen))) {
        existing.first_seen = firstSeen;
      }
      if (lastSeen && (!existing.last_seen || new Date(lastSeen) > new Date(existing.last_seen))) {
        existing.last_seen = lastSeen;
      }
    }
  }

  const convIp = (conv.metadata?.ip as string)?.trim();
  if (convIp && convIp.toLowerCase() !== 'unknown' && convIp !== 'null') {
    const existing = ipMap.get(convIp);
    if (!existing) {
      ipMap.set(convIp, {
        ip: convIp,
        first_seen: conv.created_at || null,
        last_seen: conv.last_message_at || conv.created_at || null,
        session_count: 1,
        browser: (conv.metadata?.browser as string) || null,
        os: (conv.metadata?.os as string) || null,
        device_type: (conv.metadata?.device_type as string) || null,
      });
    }
  }

  const ipHistory: UserIpRecord[] = Array.from(ipMap.values()).sort((a, b) => {
    const timeA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
    const timeB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
    return timeB - timeA;
  });

  const currentIp = ipHistory[0]?.ip || visitorIp || convIp || null;

  // 5. Construct complete UserProfileDetails adhering strictly to actual database values
  const userProfile: UserProfileDetails = {
    user_id: userId,
    visitor_id: visitorId,
    is_authenticated: !!userId,
    avatar_url: (profile?.avatar_url as string) || null,
    full_name: (profile?.full_name as string) || conv.user_name || null,
    email: (profile?.email as string) || conv.user_email || null,
    phone: (profile?.phone as string) || (conv.metadata?.phone as string) || null,
    username: (profile?.username as string) || (profile?.email ? (profile.email as string).split('@')[0] : null) || null,
    role: (profile?.role as string) || (userId ? 'Authenticated User' : 'Website Visitor'),
    created_at: (profile?.created_at as string) || (visitor?.first_visit_at as string) || conv.created_at || null,
    last_active_at: (visitor?.last_active_at as string) || conv.last_message_at || null,
    last_sign_in_at: (profile?.last_sign_in_at as string) || null,

    current_ip: currentIp,
    ip_history: ipHistory,

    country: (visitor?.country as string) || (conv.metadata?.country as string) || null,
    region: (visitor?.region as string) || (conv.metadata?.region as string) || null,
    city: (visitor?.city as string) || (conv.metadata?.city as string) || null,
    location_display: (visitor?.location_display as string) || (conv.metadata?.location_display as string) || null,
    timezone: (visitor?.timezone as string) || (conv.metadata?.timezone as string) || null,

    device_type: (visitor?.device_type as string) || (conv.metadata?.device_type as string) || null,
    browser: (visitor?.browser as string) || (conv.metadata?.browser as string) || null,
    os: (visitor?.os as string) || (conv.metadata?.os as string) || null,
    screen_size: (visitor?.screen_size as string) || (conv.metadata?.screen_size as string) || null,
    language: (visitor?.language as string) || (conv.metadata?.language as string) || null,
    user_agent: (visitor?.user_agent as string) || (conv.metadata?.userAgent as string) || null,

    total_ai_conversations: totalAiConvs,
    total_ai_messages: totalAiMessages,
    latest_ai_conversation_at: latestAiConvAt || conv.last_message_at,

    visit_count: typeof visitor?.visit_count === 'number' ? visitor.visit_count : null,
    page_views_count: typeof visitor?.page_views_count === 'number' ? visitor.page_views_count : null,
    landing_page: (visitor?.landing_page as string) || null,
    last_page: (visitor?.last_page as string) || null,
    initial_referrer: (visitor?.initial_referrer as string) || null,
    initial_source: (visitor?.initial_source as string) || null,
  };

  return {
    ...(conv as AiConversation),
    messages: (messages as AiMessage[]) || [],
    user_profile: userProfile,
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
