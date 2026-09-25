'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SiteConfig } from '@/types';
import { siteConfig, buildWhatsAppUrl } from '@/config/site';
import { HennaFloralMotif, XIcon, WhatsAppIcon } from '@/components/ui/icons';
import { ChatAction, ChatApiResponse } from '@/lib/ai/types';
import type { RecommendedDesign } from '@/lib/ai/design/types';
import { RecommendedDesignCard } from './recommended-design-card';
import { trackAiAssistantOpen, trackAiAssistantMessage } from '@/lib/analytics/events';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: ChatAction;
  recommendations?: RecommendedDesign[];
  followUpQuestion?: string | null;
  timestamp: string;
}

function getWelcomeText(city: string = 'Bengaluru') {
  return `Hi! 🌿 I'm Aayesha's AI Design Assistant.\n\nI can help you find a mehndi style, explore services, or guide you toward booking an appointment in ${city}.`;
}

const QUICK_PROMPTS = [
  'Bridal Mehndi',
  'Arabic Design',
  'Minimal Design',
  'Custom Design',
  'Services',
  'Book Appointment',
];

let messageCounter = 0;

function createChatMessage(
  role: 'user' | 'assistant',
  content: string,
  action?: ChatAction,
  recommendations?: RecommendedDesign[],
  followUpQuestion?: string | null
): MessageItem {
  messageCounter += 1;
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return {
    id: `msg-${messageCounter}`,
    role,
    content,
    action,
    recommendations,
    followUpQuestion,
    timestamp: `${hours}:${minutes}`,
  };
}


export function AiAssistantWidget({ settings }: { settings?: SiteConfig }) {
  const pathname = usePathname();
  const currentConfig = settings || siteConfig;
  const city = currentConfig.location?.city || currentConfig.contact.city || 'Bengaluru';
  const serviceAvailability = currentConfig.location?.serviceAvailability || `Serving in ${city}`;

  // Do not render floating chatbot inside the Admin Panel
  const isAdmin = pathname.startsWith('/admin');

  const STORAGE_CONV_KEY = 'hba_ai_conversation_id';
  const [conversationId, setConversationId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: getWelcomeText(city),
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Restore active conversation from Supabase across page reloads
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let activeId = localStorage.getItem(STORAGE_CONV_KEY);
    if (!activeId) {
      activeId = crypto.randomUUID();
      try {
        localStorage.setItem(STORAGE_CONV_KEY, activeId);
      } catch {
        // storage restricted
      }
    }
    setConversationId(activeId);

    // Fetch existing messages from Supabase
    fetch(`/api/ai/chat/history?conversationId=${encodeURIComponent(activeId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          const restored: MessageItem[] = data.messages.map((m: {
            id?: string;
            role: 'user' | 'assistant';
            content: string;
            action?: ChatAction;
            recommendations?: RecommendedDesign[];
            follow_up_question?: string | null;
            created_at?: string;
          }, idx: number) => {
            const date = m.created_at ? new Date(m.created_at) : new Date();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return {
              id: m.id || `restored-${idx}`,
              role: m.role,
              content: m.content,
              action: m.action,
              recommendations: m.recommendations,
              followUpQuestion: m.follow_up_question,
              timestamp: `${hours}:${minutes}`,
            };
          });

          setMessages(restored);
          setHasInteracted(true);
        }
      })
      .catch((err) => {
        console.error('[AI Assistant] History load error:', err);
      });
  }, []);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  // Lock body scroll on mobile when chat drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isAdmin) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setHasInteracted(true);
    trackAiAssistantMessage();
    const userMsg = createChatMessage('user', text);

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    const currentConvId =
      conversationId ||
      localStorage.getItem(STORAGE_CONV_KEY) ||
      crypto.randomUUID();

    if (!conversationId) {
      setConversationId(currentConvId);
      try {
        localStorage.setItem(STORAGE_CONV_KEY, currentConvId);
      } catch {
        // storage restricted
      }
    }

    // Get visitor identifiers for analytics & conversation linking
    let visitorId: string | undefined;
    let sessionId: string | undefined;
    try {
      const { getOrCreateVisitorId, getOrCreateSessionId } = await import('@/lib/analytics/tracker');
      const v = getOrCreateVisitorId();
      visitorId = v.visitorId;
      const s = getOrCreateSessionId(visitorId);
      sessionId = s.sessionId;
    } catch {
      // safe fallback
    }

    const clientMessageId = crypto.randomUUID();

    try {
      // Send chat request to /api/ai/chat with conversationId and visitorId
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConvId,
          visitorId,
          sessionId,
          clientMessageId,
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data: ChatApiResponse = await res.json();

      if (data.conversationId && data.conversationId !== currentConvId) {
        setConversationId(data.conversationId);
        try {
          localStorage.setItem(STORAGE_CONV_KEY, data.conversationId);
        } catch {
          // ignore
        }
      }

      const assistantMsg = createChatMessage(
        'assistant',
        data.message || `I am here to help you with your mehndi journey in ${city}.`,
        data.action,
        data.recommendations,
        data.followUpQuestion
      );

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Graceful fallback error message
      const fallbackUrl = buildWhatsAppUrl(
        `Hi Aayesha, I tried reaching out through your website AI assistant and would like to ask about your mehndi services in ${city}.`,
        currentConfig.contact.whatsappPhoneRaw
      );

      const errorMsg = createChatMessage(
        'assistant',
        "Sorry, I'm having trouble responding right now. You can contact Aayesha directly on WhatsApp for help with your mehndi requirements.",
        fallbackUrl
          ? {
              type: 'whatsapp',
              label: 'Contact on WhatsApp',
              url: fallbackUrl,
            }
          : undefined
      );

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    messageCounter += 1;
    const newConvId = crypto.randomUUID();
    setConversationId(newConvId);
    try {
      localStorage.setItem(STORAGE_CONV_KEY, newConvId);
    } catch {
      // storage restricted
    }
    setMessages([
      {
        id: `welcome-${messageCounter}`,
        role: 'assistant',
        content: getWelcomeText(city),
        timestamp: 'Just now',
      },
    ]);
    setHasInteracted(false);
  };

  return (
    <>
      {/* Floating Action Button: AI Assistant Trigger Only */}
      {!isOpen && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end select-none pointer-events-auto">
          {/* AI Assistant Floating Trigger Button */}
          <button
            onClick={() => {
              setIsOpen(true);
              trackAiAssistantOpen();
            }}
            className="min-h-[44px] flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-full bg-[#4E2714] text-[#FAF3EE] shadow-xl hover:bg-[#381A0E] hover:scale-105 active:scale-95 transition-all duration-300 border border-[#C29B4D]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C29B4D] group cursor-pointer"
            aria-label="Open Aayesha AI Design Assistant"
            id="open-aayesha-ai-btn"
          >
            <div className="w-6 h-6 rounded-full bg-[#C29B4D]/25 flex items-center justify-center text-[#C29B4D] group-hover:rotate-12 transition-transform flex-shrink-0">
              <HennaFloralMotif size={16} />
            </div>
            <span className="font-semibold text-xs sm:text-sm tracking-wide">
              ✨ Ask Aayesha AI
            </span>
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
            </span>
          </button>
        </div>
      )}

      {/* Chatbot Floating Window / Fullscreen Mobile Drawer */}
      {isOpen && (
        <div
          ref={widgetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Aayesha AI Design Assistant Chat"
          className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex flex-col bg-[#FCF9F4] sm:rounded-3xl sm:w-[410px] h-[100dvh] sm:h-[590px] sm:max-h-[85vh] shadow-2xl border border-[#EADBCE] overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="bg-[#4E2714] text-[#FAF3EE] p-4 flex items-center justify-between border-b border-[#381A0E] flex-shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#381A0E] border border-[#C29B4D]/40 flex items-center justify-center text-[#C29B4D]">
                <HennaFloralMotif size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif-heading text-lg font-bold text-white tracking-wide leading-none">
                    ✨ Aayesha AI
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-[#D4C3B3] font-medium mt-0.5">
                  Find the right mehndi design for you
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {hasInteracted && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="p-1.5 text-[#D4C3B3] hover:text-white rounded-lg hover:bg-[#381A0E] transition-colors text-xs"
                >
                  ↻ Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat (Escape)"
                aria-label="Close chat"
                className="p-1.5 text-[#D4C3B3] hover:text-white rounded-lg hover:bg-[#381A0E] transition-colors"
                id="close-aayesha-ai-btn"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>

          {/* Notice Micro-Bar */}
          <div className="bg-[#F5ECE4] text-[#703D24] px-4 py-1 text-[11px] font-medium border-b border-[#EADBCE] flex items-center justify-between">
            <span>{serviceAvailability}</span>
            <span className="text-[#B95945]">100% Organic Henna</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#B95945] text-white rounded-br-xs'
                      : 'bg-white text-[#261B16] border border-[#EADBCE] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Contextual WhatsApp Action Button */}
                  {msg.action && (
                    <div className="mt-3 pt-2.5 border-t border-[#EADBCE]/80">
                      <a
                        href={msg.action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs shadow-xs transition-colors"
                        aria-label={`${msg.action.label} (opens WhatsApp chat)`}
                      >
                        <WhatsAppIcon size={16} />
                        <span>{msg.action.label}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Recommended Designs Section */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2">
                    <span className="text-[11px] font-bold text-[#703D24] uppercase tracking-wider block px-1">
                      Recommended Designs ({msg.recommendations.length})
                    </span>
                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scroll-smooth snap-x snap-mandatory">
                      {msg.recommendations.map((rec) => (
                        <div key={rec.id} className="snap-start flex-shrink-0 w-[270px]">
                          <RecommendedDesignCard
                            item={rec}
                            whatsappRaw={currentConfig.contact.whatsappPhoneRaw}
                            isCompact
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Question Bubble */}
                {msg.followUpQuestion && (
                  <div className="mt-2 px-3.5 py-2 rounded-xl bg-[#F5ECE4] border border-[#E4D2C3] text-xs text-[#703D24] italic max-w-[85%]">
                    💬 {msg.followUpQuestion}
                  </div>
                )}

                <span className="text-[10px] text-[#A39184] px-1 mt-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}


            {/* Typing Loader Indicator */}
            {isLoading && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white border border-[#EADBCE] w-fit shadow-xs">
                <div className="w-2 h-2 rounded-full bg-[#B95945] animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-[#B95945] animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-[#B95945] animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="text-[11px] text-[#847269] ml-1">
                  Aayesha AI is thinking...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          {!hasInteracted && (
            <div className="px-4 py-2 bg-[#FAF6F0] border-t border-[#EADBCE]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#847269] block mb-1.5">
                Suggested questions:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-white hover:bg-[#F5ECE4] text-[#4E2714] border border-[#EADBCE] shadow-2xs hover:border-[#B95945] transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-white border-t border-[#EADBCE] flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about bridal, Arabic, pricing, or booking..."
                disabled={isLoading}
                aria-label="Your message to Aayesha AI"
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#FCF9F4] border border-[#EADBCE] rounded-full text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#B95945] placeholder-[#A39184] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-2.5 rounded-full bg-[#4E2714] hover:bg-[#381A0E] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex-shrink-0"
                aria-label="Send message"
              >
                <svg
                  className="w-4 h-4 transform rotate-90"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
