import crypto from 'crypto';
import { getAdminSupabaseClient } from '@/lib/supabase/service-role';
import {
  fetchDesigns,
  fetchServices,
  fetchSiteSettings,
  fetchTestimonials,
  fetchFaqs,
} from '@/lib/supabase/data';
import { SiteConfig } from '@/types';
import {
  KnowledgeSourceType,
} from './types';
import { generateEmbeddingBatch, getActiveEmbeddingConfig } from './router';

export interface RawKnowledgeDraft {
  source_type: KnowledgeSourceType;
  source_id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

/**
 * Builds semantic text representation for a Mehndi Design.
 */
function buildDesignKnowledge(design: {
  id: string;
  slug: string;
  title: string;
  categoryLabel?: string;
  category: string;
  shortDescription?: string;
  fullDescription?: string;
  coverage?: string;
  estimatedDuration?: string;
  idealFor?: string[];
  tags?: string[];
}): RawKnowledgeDraft {
  const idealForStr = design.idealFor ? design.idealFor.join(', ') : 'Bridal, Engagement, Festive, and Special Celebrations';
  const tagsStr = design.tags ? design.tags.join(', ') : '';
  const bodyPart = design.coverage?.toLowerCase().includes('feet') ? 'Feet and Ankles' : 'Hands, Palms and Wrists';
  const complexity = design.category.toLowerCase().includes('bridal')
    ? 'Heavy / Bridal Intricate'
    : design.category.toLowerCase().includes('minimal')
    ? 'Simple / Minimal Delicate'
    : 'Medium Intricate / Artistic';

  const content = `Design Name: ${design.title}
Category & Style: ${design.categoryLabel || design.category} Mehndi
Occasion & Celebrations: ${idealForStr}
Hand Coverage: ${design.coverage || 'Full palms, fingers, and wrist cuffs'}
Body Part: ${bodyPart}
Complexity Level: ${complexity}
Application Duration: ${design.estimatedDuration || '2 - 5 hours'}
Overview: ${design.shortDescription || design.fullDescription || ''}
Design Details: ${design.fullDescription || ''}
Keywords & Tags: ${tagsStr}, ${design.title}, ${design.category}
Artist & Origin: Handcrafted by Aayesha using 100% natural, certified organic Rajasthani Sojat henna. No synthetic chemicals, no black henna, no PPD.`;

  return {
    source_type: 'mehndi_design',
    source_id: design.slug || design.id,
    title: design.title,
    content: content.trim(),
    metadata: {
      slug: design.slug,
      category: design.category,
      categoryLabel: design.categoryLabel || design.category,
      coverage: design.coverage,
      duration: design.estimatedDuration,
      complexity,
      bodyPart,
      idealFor: design.idealFor,
      tags: design.tags,
    },
  };
}


/**
 * Builds semantic text representation for a Service Package.
 */
function buildServiceKnowledge(service: {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  priceText?: string;
  features?: string[];
  idealFor?: string;
  bangaloreTravel?: string;
}): RawKnowledgeDraft {
  const featuresList = service.features ? service.features.join('. ') : '';
  const priceStatement = service.priceText
    ? `Package Pricing: ${service.priceText}`
    : 'Package Pricing: Custom pricing available on inquiry via WhatsApp based on design intricacy and event scale.';

  const content = `Service Package: ${service.title}
Subtitle: ${service.subtitle || ''}
Description: ${service.description || ''}
Duration: ${service.duration || '3 - 6 hours'}
${priceStatement}
Ideal For: ${service.idealFor || 'Brides and wedding parties'}
Package Features: ${featuresList}
Service Area: ${service.bangaloreTravel || 'Direct on-location artist travel.'}
Booking Process: Appointments booked exclusively via WhatsApp with Aayesha. Prepared with 100% organic Sojat henna and soothing eucalyptus oil.`;

  return {
    source_type: 'service',
    source_id: service.slug || service.id,
    title: service.title,
    content: content.trim(),
    metadata: {
      slug: service.slug,
      category: 'service',
      priceText: service.priceText || null,
      duration: service.duration,
    },
  };
}

/**
 * Builds semantic text representation for an official FAQ.
 */
function buildFaqKnowledge(faq: {
  question: string;
  answer: string;
  category?: string;
}, index: number): RawKnowledgeDraft {
  const content = `Frequently Asked Question: ${faq.question}
Category: ${faq.category || 'General'}
Answer: ${faq.answer}
Context: Official studio policy for Henna by Aayesha. Appointments handled directly via WhatsApp.`;

  return {
    source_type: 'faq',
    source_id: `faq-${index + 1}`,
    title: faq.question,
    content: content.trim(),
    metadata: {
      category: faq.category || 'faq',
    },
  };
}

/**
 * Builds semantic text representation for Business Policies & Location.
 */
function buildBusinessInfoKnowledge(settings: SiteConfig): RawKnowledgeDraft {
  const city = settings.location?.city || settings.contact.city;
  const state = settings.location?.state || 'Karnataka';
  const country = settings.location?.country || 'India';
  const serviceArea = settings.location?.serviceArea || settings.contact.serviceNotice;
  const serviceAvailability = settings.location?.serviceAvailability || `Available in ${city}`;

  const content = `Business Profile: ${settings.name}
Tagline: ${settings.tagline}
Location & Service Area: ${city}, ${state}, ${country}. ${serviceArea}.
Availability Policy: ${serviceAvailability}.
Booking Channel: All appointments must be booked directly via WhatsApp at ${settings.contact.whatsappDisplayNumber}. No online instant checkout.
Email Contact: ${settings.contact.email}
Hours: ${settings.contact.operatingHours}
Henna Ingredients & Safety: 100% triple-sifted natural organic Sojat henna powder hand-mixed with pure eucalyptus essential oil. Absolutely zero synthetic dyes, zero PPD, zero chemical additives. Completely skin-safe for brides, sensitive skin, and festive guests.`;

  return {
    source_type: 'business_info',
    source_id: 'business-policies-studio',
    title: `${settings.name} - Studio Policies & Service Area`,
    content: content.trim(),
    metadata: {
      city,
      category: 'business_info',
    },
  };
}

/**
 * Gathers all public website knowledge drafts from database and static definitions.
 */
export async function collectAllKnowledgeDrafts(): Promise<RawKnowledgeDraft[]> {
  const [designs, services, settings, testimonials, dynamicFaqs] = await Promise.all([
    fetchDesigns(),
    fetchServices(),
    fetchSiteSettings(),
    fetchTestimonials(),
    fetchFaqs(),
  ]);

  const drafts: RawKnowledgeDraft[] = [];

  // 1. Business Info
  drafts.push(buildBusinessInfoKnowledge(settings));

  // 2. FAQs
  dynamicFaqs.forEach((faq, idx) => {
    drafts.push(buildFaqKnowledge(faq, idx));
  });

  // 3. Services
  services.forEach((s) => {
    drafts.push(buildServiceKnowledge(s));
  });

  // 4. Designs
  designs.forEach((d) => {
    drafts.push(buildDesignKnowledge(d));
  });

  // 5. Featured Testimonials
  testimonials.slice(0, 5).forEach((t, idx) => {
    drafts.push({
      source_type: 'testimonial',
      source_id: `testimonial-${idx + 1}`,
      title: `Client Experience - ${t.clientName}`,
      content: `Client Review: "${t.quote}" - ${t.clientName} for ${t.eventType} in ${t.bangaloreArea}. Rating: ${t.rating} out of 5 stars. Verified client of Henna by Aayesha in Bangalore.`,
      metadata: { clientName: t.clientName, rating: t.rating },
    });
  });

  return drafts;
}

export interface IndexingStats {
  total: number;
  indexed: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Indexes or re-indexes the entire knowledge base with change-detection and batching.
 */
export async function syncKnowledgeBase(forceReindex = false): Promise<IndexingStats> {
  const stats: IndexingStats = {
    total: 0,
    indexed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const config = await getActiveEmbeddingConfig();
  if (!config) {
    stats.errors.push('No active embedding provider configured. Please configure an embedding API key.');
    return stats;
  }

  const drafts = await collectAllKnowledgeDrafts();
  stats.total = drafts.length;

  const supabase = await getAdminSupabaseClient();

  // Load existing knowledge records to compare hashes
  const { data: existingRows } = await supabase
    .from('knowledge_documents')
    .select('id, source_type, source_id, content_hash, indexing_status, embedding_provider, embedding_model');

  const existingMap = new Map<string, {
    id: string;
    content_hash: string;
    indexing_status: string;
    embedding_provider: string;
    embedding_model: string;
  }>();

  if (existingRows) {
    existingRows.forEach((r) => {
      existingMap.set(`${r.source_type}:${r.source_id}`, r);
    });
  }

  // Determine which drafts need embedding generation
  const draftsToEmbed: { draft: RawKnowledgeDraft; hash: string }[] = [];

  for (const draft of drafts) {
    const key = `${draft.source_type}:${draft.source_id}`;
    const hash = computeContentHash(draft.content);
    const existing = existingMap.get(key);

    const isModelDifferent =
      existing &&
      (existing.embedding_provider !== config.settings.provider_key ||
        existing.embedding_model !== config.settings.model);

    if (
      !forceReindex &&
      existing &&
      existing.content_hash === hash &&
      existing.indexing_status === 'indexed' &&
      !isModelDifferent
    ) {
      stats.skipped++;
      continue;
    }

    draftsToEmbed.push({ draft, hash });
  }

  if (draftsToEmbed.length === 0) {
    // All up to date
    return stats;
  }

  // Batch embedding generation in chunks of 15
  const BATCH_SIZE = 15;
  for (let i = 0; i < draftsToEmbed.length; i += BATCH_SIZE) {
    const chunk = draftsToEmbed.slice(i, i + BATCH_SIZE);
    const texts = chunk.map((c) => c.draft.content);

    try {
      const vectors = await generateEmbeddingBatch(texts, {
        model: config.settings.model,
        dimensions: config.settings.dimensions,
      });

      if (!vectors || vectors.length !== chunk.length) {
        throw new Error('Batch embedding returned mismatched count or null.');
      }

      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j];
        const vector = vectors[j];

        const { error: upsertErr } = await supabase
          .from('knowledge_documents')
          .upsert({
            source_type: item.draft.source_type,
            source_id: item.draft.source_id,
            title: item.draft.title,
            content: item.draft.content,
            metadata: item.draft.metadata,
            content_hash: item.hash,
            embedding: vector,
            embedding_provider: config.settings.provider_key,
            embedding_model: config.settings.model,
            is_active: true,
            indexing_status: 'indexed',
            indexing_error: null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'source_type,source_id',
          });

        if (upsertErr) {
          stats.failed++;
          stats.errors.push(`DB save failed for ${item.draft.title}: ${upsertErr.message}`);
        } else {
          stats.indexed++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Batch embedding error';
      stats.failed += chunk.length;
      stats.errors.push(`Chunk embedding error: ${msg}`);

      // Mark these records as failed in database
      for (const item of chunk) {
        await supabase
          .from('knowledge_documents')
          .upsert({
            source_type: item.draft.source_type,
            source_id: item.draft.source_id,
            title: item.draft.title,
            content: item.draft.content,
            metadata: item.draft.metadata,
            content_hash: item.hash,
            embedding: null,
            embedding_provider: config.settings.provider_key,
            embedding_model: config.settings.model,
            is_active: true,
            indexing_status: 'failed',
            indexing_error: msg.slice(0, 300),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'source_type,source_id',
          });
      }
    }
  }

  // Clear requires_reindex flag if full reindex succeeded
  if (forceReindex && stats.failed === 0) {
    try {
      await supabase
        .from('ai_embedding_settings')
        .update({ requires_reindex: false, updated_at: new Date().toISOString() })
        .eq('id', 1);
    } catch {
      // non-blocking
    }
  }

  return stats;
}
