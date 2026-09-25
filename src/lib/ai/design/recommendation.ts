import { fetchDesigns } from '@/lib/supabase/data';
import { searchDesigns } from '@/lib/ai/embeddings/retrieval';
import { MehndiDesign } from '@/types';
import {
  DesignPreferences,
  RecommendedDesign,
  AIRecommendationSettings,
  DEFAULT_RECOMMENDATION_SETTINGS,
} from './types';

export interface RecommendDesignsOptions {
  query: string;
  preferences?: DesignPreferences;
  limit?: number;
  settings?: Partial<AIRecommendationSettings>;
}

export interface ScoredCandidate {
  design: MehndiDesign;
  totalScore: number;
  metadataScore: number;
  vectorSimilarity: number;
  matchedCriteria: string[];
}

/**
 * Builds a grounded, transparent explanation based ONLY on verified database attributes.
 */
export function generateVerifiedReason(
  design: MehndiDesign,
  matchedCriteria: string[],
  preferences?: DesignPreferences
): string {
  if (matchedCriteria.length > 0) {
    return `Matches your preference for ${matchedCriteria.join(', ')} with ${design.coverage.toLowerCase()} and estimated time of ${design.estimatedDuration}.`;
  }

  const styleContext = preferences?.style || design.categoryLabel;
  return `Features authentic ${styleContext} artistry handcrafted with ${design.coverage.toLowerCase()}.`;
}

/**
 * Reusable server-side hybrid recommendation engine.
 * Combines metadata filtering with Supabase pgvector semantic search.
 */
export async function recommendDesigns(
  options: RecommendDesignsOptions
): Promise<RecommendedDesign[]> {
  const { query, preferences } = options;
  const config: AIRecommendationSettings = {
    ...DEFAULT_RECOMMENDATION_SETTINGS,
    ...options.settings,
  };

  if (!config.enabled) {
    return [];
  }

  const limit = Math.max(1, Math.min(options.limit || config.maxRecommendations, 5));

  // 1. Fetch real active designs from Supabase (Source of Truth)
  const activeDesigns = await fetchDesigns();
  if (!activeDesigns || activeDesigns.length === 0) {
    return [];
  }

  // 2. Perform pgvector similarity search if semantic search is enabled
  const vectorScoreMap = new Map<string, number>();
  if (config.enableSemantic && query.trim().length > 0) {
    try {
      const vectorResults = await searchDesigns(query, {
        matchCount: 8,
      });

      for (const res of vectorResults) {
        // Map by source_id (slug or id)
        if (res.similarity >= config.minSimilarityThreshold) {
          vectorScoreMap.set(res.source_id, res.similarity);
          if (res.metadata?.slug && typeof res.metadata.slug === 'string') {
            vectorScoreMap.set(res.metadata.slug, res.similarity);
          }
        }
      }
    } catch (err) {
      console.warn('[AI Recommendation] Vector search failed or skipped:', err);
      // Gracefully continue with metadata filtering
    }
  }

  // 3. Compute hybrid scores for all active database designs
  const scoredCandidates: ScoredCandidate[] = [];

  for (const design of activeDesigns) {
    let metadataScore = 0;
    const matchedCriteria: string[] = [];

    const titleLower = design.title.toLowerCase();
    const descLower = (design.shortDescription + ' ' + design.fullDescription).toLowerCase();
    const coverageLower = design.coverage.toLowerCase();
    const catLower = design.category.toLowerCase();
    const idealForStr = design.idealFor.join(' ').toLowerCase();
    const tagsLower = design.tags.map((t) => t.toLowerCase());

    if (config.enableMetadata && preferences) {
      // Occasion Match
      if (preferences.occasion) {
        const occ = preferences.occasion.toLowerCase();
        if (idealForStr.includes(occ) || catLower.includes(occ) || titleLower.includes(occ)) {
          metadataScore += 30;
          matchedCriteria.push(`${preferences.occasion} celebration`);
        }
      }

      // Style Match
      if (preferences.style) {
        const sty = preferences.style.toLowerCase();
        if (catLower.includes(sty) || titleLower.includes(sty) || tagsLower.some((t) => t.includes(sty))) {
          metadataScore += 35;
          matchedCriteria.push(`${preferences.style} style`);
        } else if (descLower.includes(sty)) {
          metadataScore += 15;
          matchedCriteria.push(`${preferences.style} motifs`);
        }
      }

      // Coverage Match
      if (preferences.coverage) {
        const cov = preferences.coverage.toLowerCase();
        if (coverageLower.includes(cov)) {
          metadataScore += 25;
          matchedCriteria.push(`${preferences.coverage} coverage`);
        }
      }

      // Body Part Match
      if (preferences.bodyPart) {
        const bp = preferences.bodyPart.toLowerCase();
        if (coverageLower.includes(bp) || catLower.includes(bp) || titleLower.includes(bp)) {
          metadataScore += 25;
          matchedCriteria.push(`${preferences.bodyPart}`);
        }
      }

      // Complexity Match
      if (preferences.complexity) {
        const comp = preferences.complexity.toLowerCase();
        if (comp === 'simple' || comp === 'minimal') {
          if (catLower.includes('minimal') || descLower.includes('subtle') || descLower.includes('airy')) {
            metadataScore += 20;
            matchedCriteria.push('minimal complexity');
          }
        } else if (comp === 'heavy' || comp === 'bridal') {
          if (catLower.includes('bridal') || descLower.includes('full arm') || descLower.includes('intricate')) {
            metadataScore += 20;
            matchedCriteria.push('heavy detailing');
          }
        }
      }

      // Keywords Match
      if (preferences.keywords && preferences.keywords.length > 0) {
        for (const kw of preferences.keywords) {
          const kwLower = kw.toLowerCase();
          if (tagsLower.includes(kwLower) || titleLower.includes(kwLower) || descLower.includes(kwLower)) {
            metadataScore += 12;
            if (!matchedCriteria.some((m) => m.includes(kw))) {
              matchedCriteria.push(`${kw} accents`);
            }
          }
        }
      }
    }

    // Vector Similarity Match
    const vectorSimilarity =
      vectorScoreMap.get(design.slug) || vectorScoreMap.get(design.id) || 0;
    const vectorScore = vectorSimilarity * 50;

    // Direct Query Text Matching
    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3);
    let keywordScore = 0;
    for (const token of queryTokens) {
      if (titleLower.includes(token)) keywordScore += 10;
      if (catLower.includes(token)) keywordScore += 8;
      if (tagsLower.some((t) => t.includes(token))) keywordScore += 6;
    }

    const totalScore = metadataScore + vectorScore + keywordScore;

    scoredCandidates.push({
      design,
      totalScore,
      metadataScore,
      vectorSimilarity,
      matchedCriteria,
    });
  }

  // 4. Filter by minimum relevance threshold
  // A candidate must either match metadata criteria, have positive vector similarity, or match query keywords
  const validCandidates = scoredCandidates.filter((c) => c.totalScore > 15);

  // If no candidates meet threshold, return empty list (No Hallucination)
  if (validCandidates.length === 0) {
    return [];
  }

  // 5. Rank by total score descending
  validCandidates.sort((a, b) => b.totalScore - a.totalScore);

  // 6. Server-Side ID Validation & Slice Top N
  const topCandidates = validCandidates.slice(0, limit);

  return topCandidates.map((candidate) => {
    const d = candidate.design;
    const reason = generateVerifiedReason(d, candidate.matchedCriteria, preferences);

    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      category: d.category,
      categoryLabel: d.categoryLabel,
      image: d.image,
      shortDescription: d.shortDescription,
      coverage: d.coverage,
      estimatedDuration: d.estimatedDuration,
      reason,
      score: Math.round(candidate.totalScore),
      matchedCriteria: candidate.matchedCriteria,
      design: d,
    };
  });
}

/**
 * Validates candidate IDs returned by the AI against real database records.
 * Discards any hallucinated or inactive design IDs.
 */
export function validateAndEnrichAiRecommendations(
  aiSuggested: Array<{ designId: string; reason?: string }>,
  verifiedCandidates: RecommendedDesign[]
): RecommendedDesign[] {
  if (!Array.isArray(aiSuggested) || aiSuggested.length === 0) {
    return verifiedCandidates;
  }

  const validMap = new Map<string, RecommendedDesign>();
  for (const cand of verifiedCandidates) {
    validMap.set(cand.id, cand);
    validMap.set(cand.slug, cand);
  }

  const validated: RecommendedDesign[] = [];
  const seenIds = new Set<string>();

  for (const item of aiSuggested) {
    if (!item || !item.designId) continue;
    const match = validMap.get(item.designId);

    if (match && !seenIds.has(match.id)) {
      seenIds.add(match.id);
      validated.push({
        ...match,
        // Preserve AI explanation only if provided and not empty, otherwise keep verified fallback
        reason: item.reason?.trim() ? item.reason.trim() : match.reason,
      });
    }
  }

  // If AI returned zero valid IDs, fallback safely to the verified candidates
  return validated.length > 0 ? validated : verifiedCandidates;
}
