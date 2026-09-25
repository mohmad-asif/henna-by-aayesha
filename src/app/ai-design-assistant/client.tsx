'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SiteConfig } from '@/types';
import { siteConfig, buildWhatsAppUrl } from '@/config/site';
import { HennaFloralMotif, WhatsAppIcon } from '@/components/ui/icons';
import { ChatAction, ChatApiResponse } from '@/lib/ai/types';
import type { RecommendedDesign } from '@/lib/ai/design/types';
import { RecommendedDesignCard } from '@/components/ai-assistant/recommended-design-card';

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

function getPromptCategories(city: string = 'Bengaluru') {
  return [
    { label: 'Bridal Mehndi', query: 'What bridal mehndi styles does Aayesha specialize in?' },
    { label: 'Arabic Design', query: 'Tell me about modern Arabic mehndi designs available.' },
    { label: 'Minimalist & Mandalas', query: 'I want a delicate minimal mandala design for palms and wrists.' },
    { label: 'Pricing & Packages', query: 'How does pricing work for bridal and event mehndi packages?' },
    { label: `${city} Travel`, query: `Does Aayesha travel to locations across ${city}?` },
    { label: 'Book Appointment', query: 'How can I book an appointment with Aayesha?' },
  ];
}

let clientMessageSeq = 0;

function createClientChatMessage(
  role: 'user' | 'assistant',
  content: string,
  action?: ChatAction,
  recommendations?: RecommendedDesign[],
  followUpQuestion?: string | null
): MessageItem {
  clientMessageSeq += 1;
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return {
    id: `page-msg-${clientMessageSeq}`,
    role,
    content,
    action,
    recommendations,
    followUpQuestion,
    timestamp: `${hours}:${minutes}`,
  };
}


export function AIDesignAssistantClient({ settings }: { settings?: SiteConfig }) {
  const currentConfig = settings || siteConfig;
  const city = currentConfig.location?.city || currentConfig.contact.city || 'Bengaluru';
  const promptCategories = useMemo(() => getPromptCategories(city), [city]);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg = createClientChatMessage('user', text);

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data: ChatApiResponse = await res.json();

      const assistantMsg = createClientChatMessage(
        'assistant',
        data.message || 'I am here to guide your mehndi design journey in Bangalore.',
        data.action,
        data.recommendations,
        data.followUpQuestion
      );

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const fallbackUrl = buildWhatsAppUrl(
        `Hi Aayesha, I would like to inquire about booking a mehndi appointment in ${city}.`,
        currentConfig.contact.whatsappPhoneRaw
      );

      const errorMsg = createClientChatMessage(
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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5ECE4] border border-[#E4D2C3] text-[#4E2714] text-xs font-semibold">
          <HennaFloralMotif size={16} className="text-[#C29B4D]" />
          <span>Interactive Mehndi Consultation</span>
        </div>
        <h1 className="font-serif-heading text-4xl sm:text-5xl font-bold text-[#261B16]">
          AI Design Assistant
        </h1>
        <p className="text-sm sm:text-base text-[#58463D]">
          Explore custom bridal motifs, Arabic floral trails, package details, and {city}
          availability with Aayesha’s multi-provider AI assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Topic Prompts & Studio Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-3xl border border-[#EADBCE] p-6 shadow-xs space-y-4">
            <h2 className="font-serif-heading text-xl font-bold text-[#261B16]">
              Explore Design Topics
            </h2>
            <p className="text-xs text-[#703D24]">
              Click any question below to immediately ask Aayesha AI:
            </p>

            <div className="space-y-2">
              {promptCategories.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => handleSendMessage(cat.query)}
                  className="w-full text-left p-3 rounded-2xl bg-[#FCF9F4] hover:bg-[#F5ECE4] border border-[#EADBCE] hover:border-[#B95945] transition-all text-xs font-medium text-[#4E2714] group"
                >
                  <span className="block font-bold text-[#261B16] group-hover:text-[#B95945]">
                    {cat.label}
                  </span>
                  <span className="block text-[11px] text-[#847269] mt-0.5 truncate">
                    {cat.query}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#FAF6F0] rounded-3xl border border-[#E4D2C3] p-6 space-y-3 text-xs text-[#58463D]">
            <h3 className="font-bold text-sm text-[#4E2714]">About Our Henna Artistry</h3>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>100% triple-sifted organic Rajasthani henna</li>
              <li>Pure therapeutic eucalyptus essential oil mix</li>
              <li>Direct on-location travel across Bangalore</li>
              <li>Appointments strictly booked via WhatsApp</li>
            </ul>
            <div className="pt-2">
              <Link
                href="/mehndi-designs"
                className="text-xs font-semibold text-[#B95945] hover:underline"
              >
                Browse Design Gallery →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Main Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#EADBCE] shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Chat Window Header */}
          <div className="p-4 bg-[#4E2714] text-[#FAF3EE] flex items-center justify-between border-b border-[#381A0E]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#381A0E] border border-[#C29B4D]/40 flex items-center justify-center text-[#C29B4D]">
                <HennaFloralMotif size={22} />
              </div>
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-white leading-none">
                  ✨ Aayesha AI Assistant
                </h3>
                <span className="text-[11px] text-[#D4C3B3]">
                  Serving Bangalore / Bengaluru Exclusively
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome-reset',
                    role: 'assistant',
                    content: getWelcomeText(city),
                    timestamp: 'Just now',
                  },
                ])
              }
              className="text-xs text-[#D4C3B3] hover:text-white px-2.5 py-1 rounded-lg hover:bg-[#381A0E] transition-colors"
            >
              ↻ Clear Chat
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FCF9F4]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[#B95945] text-white rounded-br-xs'
                      : 'bg-white text-[#261B16] border border-[#EADBCE] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {msg.action && (
                    <div className="mt-3 pt-3 border-t border-[#EADBCE]">
                      <a
                        href={msg.action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs shadow-xs transition-colors"
                      >
                        <WhatsAppIcon size={16} />
                        <span>{msg.action.label}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Recommended Designs Section */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="w-full mt-3 space-y-2 max-w-2xl">
                    <span className="text-xs font-bold text-[#703D24] uppercase tracking-wider block px-1">
                      Recommended Mehndi Designs ({msg.recommendations.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {msg.recommendations.map((rec) => (
                        <RecommendedDesignCard
                          key={rec.id}
                          item={rec}
                          whatsappRaw={currentConfig.contact.whatsappPhoneRaw}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Question */}
                {msg.followUpQuestion && (
                  <div className="mt-2 px-4 py-2.5 rounded-xl bg-[#F5ECE4] border border-[#E4D2C3] text-xs sm:text-sm text-[#703D24] italic max-w-[80%]">
                    💬 {msg.followUpQuestion}
                  </div>
                )}

                <span className="text-[10px] text-[#A39184] px-1 mt-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}


            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#EADBCE] w-fit shadow-xs">
                <div className="w-2 h-2 rounded-full bg-[#B95945] animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-[#B95945] animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-[#B95945] animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="text-xs text-[#847269] ml-1">
                  Consulting mehndi database...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-[#EADBCE]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about designs, bridal coverage, organic henna, or booking..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-sm bg-[#FCF9F4] border border-[#EADBCE] rounded-full text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#B95945] placeholder-[#A39184] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-3 rounded-full bg-[#4E2714] hover:bg-[#381A0E] text-white font-semibold text-xs disabled:opacity-40 transition-colors shadow-xs"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
