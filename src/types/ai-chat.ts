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

export interface UserIpRecord {
  ip: string;
  first_seen?: string | null;
  last_seen?: string | null;
  session_count?: number;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
}

export interface UserProfileDetails {
  // Identity
  user_id: string | null;
  visitor_id: string | null;
  is_authenticated: boolean;
  avatar_url: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  username: string | null;
  role: string | null;
  created_at: string | null;
  last_active_at: string | null;
  last_sign_in_at: string | null;

  // Network & IP
  current_ip: string | null;
  ip_history: UserIpRecord[];

  // Geolocation
  country: string | null;
  region: string | null;
  city: string | null;
  location_display: string | null;
  timezone: string | null;

  // Tech / Environment
  device_type: string | null;
  browser: string | null;
  os: string | null;
  screen_size: string | null;
  language: string | null;
  user_agent: string | null;

  // AI Activity Stats
  total_ai_conversations: number;
  total_ai_messages: number;
  latest_ai_conversation_at: string | null;

  // Additional Tracking
  visit_count?: number | null;
  page_views_count?: number | null;
  landing_page?: string | null;
  last_page?: string | null;
  initial_referrer?: string | null;
  initial_source?: string | null;
}

export interface AiConversationDetail extends AiConversation {
  messages: AiMessage[];
  user_profile?: UserProfileDetails | null;
}

export interface ConversationsListResponse {
  conversations: AiConversation[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

