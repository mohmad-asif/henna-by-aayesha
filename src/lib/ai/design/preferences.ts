import { ChatMessage } from '@/lib/ai/types';
import { DesignPreferences } from './types';

// ==============================================================================
// 1. Multi-lingual Vocabulary Dictionaries
// ==============================================================================

const OCCASIONS: Record<string, string[]> = {
  bridal: [
    'bridal', 'bride', 'dulhan', 'wedding', 'shaadi', 'shadi', 'marriage',
    'muhurtham', 'pheras', 'nikah', 'walima', 'barat', 'baraat', 'varmala'
  ],
  engagement: [
    'engagement', 'sagaai', 'sagai', 'roka', 'ring ceremony', 'cocktail',
    'bride-to-be', 'pre-wedding'
  ],
  sangeet: ['sangeet', 'mehendi night', 'ladies sangeet', 'haldi', 'sangeet party'],
  party: ['party', 'guest', 'bridesmaid', 'sister', 'family', 'relatives'],
  festival: [
    'festival', 'festive', 'eid', 'ramadan', 'karwa chauth', 'karwachauth',
    'diwali', 'deepavali', 'teej', 'rakhi', 'raksha bandhan', 'navratri', 'onam', 'pongal'
  ],
  'baby shower': ['baby shower', 'godh bharai', 'seemantham'],
};

const STYLES: Record<string, string[]> = {
  arabic: ['arabic', 'arabi', 'gulf', 'khaleeji', 'dubai', 'arab'],
  traditional: ['traditional', 'rajasthani', 'marwari', 'indian', 'desi', 'heritage', 'classic'],
  floral: ['floral', 'flower', 'flowers', 'fool', 'phool', 'petals', 'vines', 'leaves', 'botanical'],
  mandala: ['mandala', 'circle', 'medallion', 'sunburst', 'chakra', 'round'],
  minimal: ['minimal', 'minimalist', 'delicate', 'subtle', 'dainty', 'clean', 'light'],
  modern: ['modern', 'contemporary', 'chic', 'trendy', 'western', 'stylish'],
  'indo-western': ['indo-western', 'indo western', 'indo-arabic', 'fusion', 'indo arabic'],
  geometric: ['geometric', 'lines', 'checks', 'grids', 'jaal', 'mesh', 'net'],
  jewelry: ['jewelry', 'jewellery', 'bracelet', 'bangle', 'ring', 'anklet', 'payal', 'hathphool'],
};

const COVERAGE_OPTIONS: Record<string, string[]> = {
  'front hand': ['front hand', 'front', 'palms', 'palm', 'hatheli', 'hatheli'],
  'back hand': ['back hand', 'back', 'behind hand', 'ulta hath', 'ulta haath'],
  'both hands': ['both hands', 'both sides', 'dono hath', 'dono haath'],
  'full hand': ['full hand', 'full arm', 'elbow', 'elbow-length', 'elbows', 'pura hath', 'pura haath'],
  'half hand': ['half hand', 'half arm', 'forearm', 'wrist to elbow', 'aadha hath'],
  wrist: ['wrist', 'cuff', 'bracelet', 'wristlet', 'kalai'],
  finger: ['finger', 'fingers', 'fingertip', 'ungli', 'ungliyan'],
  feet: ['feet', 'foot', 'legs', 'ankle', 'ankles', 'payal', 'pair', 'pairon', 'toe', 'toes'],
  'full bridal': ['full bridal', 'full arms and feet', 'dono hath aur pair', 'bridal full'],
};

const COMPLEXITIES: Record<string, string[]> = {
  simple: ['simple', 'easy', 'basic', 'halka', 'halki', 'light', 'aasan', 'asan', 'casual'],
  minimal: ['minimal', 'understated', 'subtle', 'tiny', 'chota', 'small'],
  medium: ['medium', 'moderate', 'balanced', 'thoda', 'theek', 'neither too heavy nor light'],
  heavy: ['heavy', 'dense', 'bhari', 'bharwa', 'intricate', 'detailed', 'full', 'dark', 'royal', 'grand'],
  bridal: ['bridal', 'dulhan style', 'royal bridal'],
};

const BODY_PARTS: Record<string, string[]> = {
  'front hand': ['front hand', 'palm', 'palms', 'hatheli'],
  'back hand': ['back hand', 'back', 'ulta hath'],
  hands: ['hand', 'hands', 'hath', 'haath', 'arms', 'arm'],
  feet: ['feet', 'foot', 'pair', 'legs', 'ankles', 'ankle'],
  wrist: ['wrist', 'kalai'],
};

const KEYWORD_PATTERNS = [
  'floral', 'flower', 'lotus', 'peacock', 'mor', 'mandala', 'leaves',
  'jewellery', 'jewelry', 'negative space', 'dense', 'fine lines', 'bold',
  'shaded', 'jaal', 'mesh', 'bracelet', 'payal', 'anklet', 'elephant', 'haathi',
  'jharokha', 'arches', 'trailing', 'vines', 'roses', 'paisley', 'kairi'
];

// ==============================================================================
// 2. Language Detection
// ==============================================================================

/**
 * Detects whether query language is English, Hindi (Devanagari), or Hinglish (Roman Hindi).
 */
export function detectLanguage(text: string): 'en' | 'hi' | 'hinglish' {
  // Check Devanagari Unicode range
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }

  const hinglishMarkers = [
    'mujhe', 'chahiye', 'ke liye', 'dikhao', 'batao', 'wali', 'wala', 'thoda',
    'kya', 'hai', 'hain', 'mein', 'hath', 'haath', 'pair', 'bhari', 'halka',
    'shaadi', 'dulhan', 'aapka', 'aapse', 'sakte', 'ho', 'nahin', 'nahi',
    'sundar', 'achha', 'accha', 'banao', 'chota', 'ek', 'aur'
  ];

  const lower = text.toLowerCase();
  const tokens = lower.split(/\s+/);
  const matchCount = tokens.filter((t) => hinglishMarkers.includes(t)).length;

  if (matchCount >= 1 || /chahiye|dikhao|ke liye|mujhe/i.test(text)) {
    return 'hinglish';
  }

  return 'en';
}

// ==============================================================================
// 3. Word Matching & Negation Detection
// ==============================================================================

/**
 * Checks if a keyword matches as a distinct word or phrase, avoiding false substring
 * collisions (e.g. "design" matching "desi").
 */
export function matchesWord(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  return regex.test(text);
}

/**
 * Checks if a specific attribute keyword is being negated in the sentence.
 * E.g., "Arabic nahi", "not arabic", "no bridal", "instead of traditional".
 */
export function isNegated(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const negationRegexes = [
    new RegExp(`(?:not|no|don't want|dont want|never|instead of)\\s+(?:[\\w\\s]{0,10})\\b${escaped}\\b`, 'i'),
    new RegExp(`\\b${escaped}\\b\\s+(?:nahi|nahin|not|mat|chhod ke)`, 'i'),
    new RegExp(`(?:nahi|nahin)\\s+(?:[\\w\\s]{0,10})\\b${escaped}\\b`, 'i'),
    new RegExp(`\\b${escaped}\\b.*\\bnahi\\b`, 'i'),
  ];

  return negationRegexes.some((regex) => regex.test(lower));
}

// ==============================================================================
// 4. Single-Turn Preference Extraction
// ==============================================================================

export function extractPreferencesFromText(text: string): {
  preferences: DesignPreferences;
  negations: Partial<Record<keyof DesignPreferences, string>>;
} {
  const lower = text.toLowerCase();
  const language = detectLanguage(text);

  let occasion: string | null = null;
  let style: string | null = null;
  let coverage: string | null = null;
  let complexity: string | null = null;
  let bodyPart: string | null = null;
  const keywords: string[] = [];
  const negations: Partial<Record<keyof DesignPreferences, string>> = {};

  // 1. Occasion
  for (const [key, variants] of Object.entries(OCCASIONS)) {
    for (const v of variants) {
      if (matchesWord(lower, v)) {
        if (isNegated(lower, v)) {
          negations.occasion = key;
        } else if (!occasion) {
          occasion = key;
        }
      }
    }
  }

  // 2. Style
  for (const [key, variants] of Object.entries(STYLES)) {
    for (const v of variants) {
      if (matchesWord(lower, v)) {
        if (isNegated(lower, v)) {
          negations.style = key;
        } else if (!style) {
          style = key;
        }
      }
    }
  }

  // 3. Coverage
  for (const [key, variants] of Object.entries(COVERAGE_OPTIONS)) {
    for (const v of variants) {
      if (matchesWord(lower, v)) {
        if (isNegated(lower, v)) {
          negations.coverage = key;
        } else if (!coverage) {
          coverage = key;
        }
      }
    }
  }

  // 4. Complexity
  for (const [key, variants] of Object.entries(COMPLEXITIES)) {
    for (const v of variants) {
      if (matchesWord(lower, v)) {
        if (isNegated(lower, v)) {
          negations.complexity = key;
        } else if (!complexity) {
          complexity = key;
        }
      }
    }
  }

  // 5. Body Part
  for (const [key, variants] of Object.entries(BODY_PARTS)) {
    for (const v of variants) {
      if (matchesWord(lower, v)) {
        if (isNegated(lower, v)) {
          negations.bodyPart = key;
        } else if (!bodyPart) {
          bodyPart = key;
        }
      }
    }
  }

  // 6. Keywords
  for (const kw of KEYWORD_PATTERNS) {
    if (matchesWord(lower, kw) && !isNegated(lower, kw)) {
      if (!keywords.includes(kw)) {
        keywords.push(kw);
      }
    }
  }


  return {
    preferences: {
      occasion,
      style,
      coverage,
      complexity,
      keywords: keywords.length > 0 ? keywords : undefined,
      bodyPart,
      language,
    },
    negations,
  };
}

// ==============================================================================
// 5. Multi-Turn Conversational Memory Merger
// ==============================================================================

/**
 * Reconstructs continuous preferences across all user messages in the session,
 * accurately handling refinement ("simple one") and modifications ("actually traditional").
 */
export function extractConversationalPreferences(
  messages: ChatMessage[]
): DesignPreferences {
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) {
    return { language: 'en' };
  }

  const merged: DesignPreferences = {
    occasion: null,
    style: null,
    coverage: null,
    complexity: null,
    keywords: [],
    bodyPart: null,
    language: 'en',
  };

  for (const msg of userMessages) {
    const { preferences, negations } = extractPreferencesFromText(msg.content);

    // Apply language from latest turn
    if (preferences.language) {
      merged.language = preferences.language;
    }

    // Handle negations / overrides
    if (negations.style && merged.style === negations.style) {
      merged.style = null;
    }
    if (negations.occasion && merged.occasion === negations.occasion) {
      merged.occasion = null;
    }
    if (negations.coverage && merged.coverage === negations.coverage) {
      merged.coverage = null;
    }
    if (negations.complexity && merged.complexity === negations.complexity) {
      merged.complexity = null;
    }

    // Apply new preferences (latest overrides previous)
    if (preferences.occasion) merged.occasion = preferences.occasion;
    if (preferences.style) merged.style = preferences.style;
    if (preferences.coverage) merged.coverage = preferences.coverage;
    if (preferences.complexity) merged.complexity = preferences.complexity;
    if (preferences.bodyPart) merged.bodyPart = preferences.bodyPart;

    // Merge keywords uniquely
    if (preferences.keywords && preferences.keywords.length > 0) {
      const existing = new Set(merged.keywords || []);
      for (const kw of preferences.keywords) {
        existing.add(kw);
      }
      merged.keywords = Array.from(existing);
    }
  }

  return {
    occasion: merged.occasion || null,
    style: merged.style || null,
    coverage: merged.coverage || null,
    complexity: merged.complexity || null,
    keywords: merged.keywords && merged.keywords.length > 0 ? merged.keywords : undefined,
    bodyPart: merged.bodyPart || null,
    language: merged.language || 'en',
  };
}

// ==============================================================================
// 6. Design Recommendation Intent Detection
// ==============================================================================

/**
 * Determines whether the latest message is requesting design exploration or style discovery.
 */
export function hasDesignDiscoveryIntent(text: string): boolean {
  const lower = text.toLowerCase();
  const designTokens = [
    'design', 'designs', 'pattern', 'patterns', 'style', 'styles', 'photo', 'photos',
    'picture', 'image', 'recommend', 'suggestion', 'suggest', 'show', 'dikhao',
    'dekhna', 'chahiye', 'floral', 'bridal', 'arabic', 'traditional', 'mandala',
    'minimal', 'heavy', 'halka', 'front hand', 'back hand', 'feet', 'wedding', 'engagement'
  ];

  return designTokens.some((token) => lower.includes(token));
}
