import { MehndiDesign } from '@/types';

/**
 * Structured visitor preferences extracted from conversational messages.
 */
export interface DesignPreferences {
  occasion?: string | null;
  style?: string | null;
  coverage?: string | null;
  complexity?: string | null;
  keywords?: string[];
  bodyPart?: string | null;
  language?: 'en' | 'hi' | 'hinglish' | null;
}

/**
 * Verified recommendation item returned to the client and rendered as a card.
 */
export interface RecommendedDesign {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  image: string;
  shortDescription: string;
  coverage?: string;
  estimatedDuration?: string;
  reason: string;
  score?: number;
  matchedCriteria?: string[];
  // Full real database record reference if needed
  design?: MehndiDesign;
}

/**
 * Structured AI output format expected from the LLM.
 */
export interface DesignRecommendationOutput {
  answer: string;
  recommendations: Array<{
    designId: string;
    reason: string;
  }>;
  followUpQuestion?: string | null;
}

/**
 * Admin-configurable recommendation settings.
 */
export interface AIRecommendationSettings {
  enabled: boolean;
  maxRecommendations: number;
  minSimilarityThreshold: number;
  enableSemantic: boolean;
  enableMetadata: boolean;
}

export const DEFAULT_RECOMMENDATION_SETTINGS: AIRecommendationSettings = {
  enabled: true,
  maxRecommendations: 3,
  minSimilarityThreshold: 0.35,
  enableSemantic: true,
  enableMetadata: true,
};
