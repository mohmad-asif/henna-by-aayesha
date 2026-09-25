import { NextResponse, type NextRequest } from 'next/server';
import { routeChat } from '@/lib/ai/router';
import {
  buildSystemPrompt,
  detectBookingIntent,
  buildContextualWhatsAppUrl,
} from '@/lib/ai/prompts';
import {
  fetchSiteSettings,
  fetchDesigns,
  fetchServices,
} from '@/lib/supabase/data';
import { executeRAGPipeline } from '@/lib/ai/embeddings/retrieval';
import { ChatMessage, ChatApiResponse, ChatAction } from '@/lib/ai/types';

// In-memory sliding window rate limiter backed by globalThis: max 15 requests per 60 seconds per IP
const globalForRateLimit = globalThis as unknown as {
  chatRateLimitMap?: Map<string, { count: number; resetTime: number }>;
};
const rateLimitMap =
  globalForRateLimit.chatRateLimitMap ||
  new Map<string, { count: number; resetTime: number }>();
globalForRateLimit.chatRateLimitMap = rateLimitMap;

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();

  // Periodic pruning of expired entries to avoid memory leaks
  if (rateLimitMap.size > 200) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetInSec: 60 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetInSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, remaining: 0, resetInSec };
  }

  record.count++;
  const remaining = MAX_REQUESTS_PER_WINDOW - record.count;
  const resetInSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
  return { allowed: true, remaining, resetInSec };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';

    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message:
            'You are sending messages too quickly. Please wait a moment before sending another message, or contact Aayesha directly on WhatsApp.',
          isFallback: true,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetInSec),
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 2. Payload size & Body Validation
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 32768) {
      return NextResponse.json(
        { error: 'Payload too large. Maximum request size is 32KB.' },
        { status: 413 }
      );
    }

    let body: {
      messages?: unknown;
      conversationId?: string;
      visitorId?: string;
      sessionId?: string;
      clientMessageId?: string;
      userName?: string;
      userEmail?: string;
      clientInfo?: Record<string, unknown>;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Request must include a non-empty messages array.' },
        { status: 400 }
      );
    }

    if (body.messages.length > 50) {
      return NextResponse.json(
        { error: 'Conversation history exceeds maximum permitted length (50 messages).' },
        { status: 400 }
      );
    }

    // Limit conversation history to latest 15 messages to prevent token abuse
    const rawMessages = body.messages.slice(-15);
    const validatedMessages: ChatMessage[] = [];

    for (const item of rawMessages) {
      if (
        typeof item === 'object' &&
        item !== null &&
        ('role' in item) &&
        ('content' in item) &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
      ) {
        // Enforce maximum length of 1000 characters per message
        const cleaned = item.content.slice(0, 1000).trim();
        if (cleaned.length > 0) {
          validatedMessages.push({
            role: item.role,
            content: cleaned,
          });
        }
      }
    }

    if (validatedMessages.length === 0) {
      return NextResponse.json(
        { error: 'No valid messages provided. Message cannot be empty.' },
        { status: 400 }
      );
    }

    const lastUserMessage =
      validatedMessages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';

    // Generate or use existing conversation ID
    const conversationId =
      body.conversationId && body.conversationId.length > 10
        ? body.conversationId
        : crypto.randomUUID();

    // Persist conversation and user message in Supabase
    let activeConversationId: string | null = null;
    try {
      const { getOrCreateConversation, saveMessage } = await import('@/lib/ai/chat-service');
      const conv = await getOrCreateConversation({
        conversationId,
        visitorId: body.visitorId || null,
        sessionId: body.sessionId || null,
        userName: body.userName || null,
        userEmail: body.userEmail || null,
        initialMessage: lastUserMessage,
        metadata: {
          ...(body.clientInfo || {}),
          ip,
        },
      });

      if (conv) {
        activeConversationId = conv.id;
        await saveMessage({
          conversationId: conv.id,
          role: 'user',
          content: lastUserMessage,
          clientMessageId: body.clientMessageId || null,
        });
      }
    } catch (persistErr) {
      console.error('[Chat API] Failed to persist user message:', persistErr);
    }

    console.log('[Chat API] Request received | conversationId:', conversationId, '| messagesCount:', validatedMessages.length, '| queryLength:', lastUserMessage.length);

    // 3. Extract multi-lingual conversational preferences & detect design intent
    const { extractConversationalPreferences, hasDesignDiscoveryIntent } = await import(
      '@/lib/ai/design/preferences'
    );
    const { recommendDesigns, validateAndEnrichAiRecommendations } = await import(
      '@/lib/ai/design/recommendation'
    );

    const preferences = extractConversationalPreferences(validatedMessages);
    const hasDesignIntent =
      hasDesignDiscoveryIntent(lastUserMessage) ||
      !!preferences.occasion ||
      !!preferences.style ||
      !!preferences.coverage ||
      !!preferences.complexity;

    console.log('[Chat API] Intent analysis | hasDesignIntent:', hasDesignIntent, '| preferences:', preferences);

    // 4. Load dynamic business context, RAG vector similarity search, and candidate designs
    const [settings, designs, services, ragResult, candidateDesigns] = await Promise.all([
      fetchSiteSettings(),
      fetchDesigns(),
      fetchServices(),
      executeRAGPipeline(lastUserMessage),
      hasDesignIntent
        ? recommendDesigns({
            query: lastUserMessage,
            preferences,
            limit: 3,
          })
        : Promise.resolve([]),
    ]);

    console.log('[Chat API] Context assembled | ragSources:', ragResult.sources.length, '| candidates:', candidateDesigns.length);

    const systemPrompt = buildSystemPrompt({
      settings,
      designs,
      services,
      retrievedContext: ragResult.contextText,
      candidateDesigns,
      preferences,
    });

    // 5. Run AI Provider Router
    const routerResult = await routeChat({
      messages: validatedMessages,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1500,
    });

    // 6. Parse and validate AI structured response & server-side validate design IDs
    let finalAnswer = routerResult.text;
    let followUpQuestion: string | null = null;
    let validatedRecommendations: import('@/lib/ai/design/types').RecommendedDesign[] = [];

    // Attempt JSON extraction
    const trimmedRaw = routerResult.text.trim();
    let jsonStr = '';
    const jsonBlockMatch = trimmedRaw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonStr = jsonBlockMatch[1].trim();
    } else if (trimmedRaw.startsWith('{') && trimmedRaw.endsWith('}')) {
      jsonStr = trimmedRaw;
    }

    let parsedSuccessfully = false;

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.answer === 'string' && parsed.answer.trim()) {
            finalAnswer = parsed.answer.trim();
            parsedSuccessfully = true;
          }
          if (typeof parsed.followUpQuestion === 'string' && parsed.followUpQuestion.trim()) {
            followUpQuestion = parsed.followUpQuestion.trim();
          }
          if (Array.isArray(parsed.recommendations) && candidateDesigns.length > 0) {
            validatedRecommendations = validateAndEnrichAiRecommendations(
              parsed.recommendations,
              candidateDesigns
            );
          }
        }
      } catch {
        // Handled below by resilient partial extraction
      }
    }

    if (!parsedSuccessfully) {
      // Resilient partial regex extraction if JSON was partially truncated by token limits
      const answerMatch = trimmedRaw.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (answerMatch && answerMatch[1]) {
        try {
          finalAnswer = JSON.parse(`"${answerMatch[1]}"`);
        } catch {
          finalAnswer = answerMatch[1];
        }
      } else if (trimmedRaw.startsWith('```json')) {
        // Clean out markdown code fence if present
        finalAnswer = trimmedRaw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      }
    }

    // Fallback: If AI did not emit JSON recommendations but candidate designs were retrieved
    if (validatedRecommendations.length === 0 && candidateDesigns.length > 0 && hasDesignIntent) {
      validatedRecommendations = candidateDesigns;
    }

    // 7. Determine if contextual action (WhatsApp booking) should be appended
    let action: ChatAction | undefined;
    const hasBookingIntent = detectBookingIntent(lastUserMessage);

    if ((hasBookingIntent || routerResult.isFallback) && settings?.contact?.whatsappPhoneRaw) {
      const waUrl = buildContextualWhatsAppUrl(lastUserMessage, settings);
      if (waUrl) {
        action = {
          type: 'whatsapp',
          label: routerResult.isFallback ? 'Contact on WhatsApp' : 'Book via WhatsApp',
          url: waUrl,
        };
      }
    }

    console.log('[Chat API] Final response prepared | provider:', routerResult.providerKey, '| isFallback:', routerResult.isFallback, '| recommendationsCount:', validatedRecommendations.length);

    const responsePayload = {
      message: finalAnswer,
      action,
      isFallback: routerResult.isFallback,
      provider: routerResult.providerKey,
      preferences,
      recommendations: validatedRecommendations.length > 0 ? validatedRecommendations : undefined,
      followUpQuestion: followUpQuestion || undefined,
      sources: ragResult.sources.map((s) => ({
        sourceType: s.source_type,
        sourceId: s.source_id,
        title: s.title,
        similarity: s.similarity,
      })),
      conversationId: activeConversationId || conversationId,
    };

    // Save AI response to Supabase
    if (activeConversationId) {
      try {
        const { saveMessage } = await import('@/lib/ai/chat-service');
        await saveMessage({
          conversationId: activeConversationId,
          role: 'assistant',
          content: finalAnswer,
          action,
          recommendations: validatedRecommendations.length > 0 ? validatedRecommendations : null,
          followUpQuestion,
          provider: routerResult.providerKey,
        });
      } catch (saveErr) {
        console.error('[Chat API] Failed to persist assistant response:', saveErr);
      }
    }

    return NextResponse.json(responsePayload);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown internal error';
    console.error('[Chat API] Internal server error Category: UNKNOWN_AI_ERROR | details:', errorMsg);
    // Never expose stack trace or internal details
    let fallbackAction: ChatAction | undefined = undefined;
    try {
      const fallbackSettings = await fetchSiteSettings();
      if (fallbackSettings?.contact?.whatsappPhoneRaw) {
        const url = buildContextualWhatsAppUrl('Inquiry', fallbackSettings);
        if (url) {
          fallbackAction = {
            type: 'whatsapp',
            label: 'Contact on WhatsApp',
            url,
          };
        }
      }
    } catch {
      // safe fallback
    }

    const fallbackPayload: ChatApiResponse = {
      message:
        "Sorry, I'm having trouble responding right now. You can contact Aayesha directly on WhatsApp for help with your mehndi requirements.",
      isFallback: true,
      action: fallbackAction,
    };
    return NextResponse.json(fallbackPayload, { status: 200 });
  }
}
