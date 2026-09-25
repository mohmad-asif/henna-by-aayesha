import type { ChatAction } from '@/lib/ai/types';
import type { RecommendedDesign } from '@/lib/ai/design/types';

export interface AiConversation {
  id: string;
  visitor_id?: string | null;
  session_id?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  title: string;
  status: 'active' | 'resolved' | 'closed' | 'archived';
  unread_by_admin: boolean;
  last_message_preview?: string | null;
  last_message_at: string;
  metadata: {
    device_type?: string;
    browser?: string;
    os?: string;
    city?: string;
    country?: string;
    ip?: string;
    location_display?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  action?: ChatAction | null;
  recommendations?: RecommendedDesign[] | null;
  follow_up_question?: string | null;
  provider?: string | null;
  client_message_id?: string | null;
  created_at: string;
}

export interface AiConversationDetail extends AiConversation {
  messages: AiMessage[];
}

export interface ConversationsListResponse {
  conversations: AiConversation[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}
