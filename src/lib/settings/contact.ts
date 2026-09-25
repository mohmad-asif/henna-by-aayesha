/**
 * Centralized Contact & Social Normalization Utilities
 *
 * Single Source of Truth for:
 * - WhatsApp phone normalization (raw digits for wa.me and formatted display)
 * - Instagram handle and profile URL normalization
 * - Click-to-chat WhatsApp URL generation
 * - Mailto URL generation
 *
 * Rules:
 * 1. NEVER fallback to a hardcoded or dummy phone number if unconfigured.
 * 2. NEVER double-prepend country code (+91).
 * 3. Safely normalize all variations (+91 98765 43210, 919876543210, 9876543210, 09876543210).
 * 4. Instagram handles must safely generate valid URLs without malformed @ in path.
 */

export interface NormalizedPhone {
  raw: string;
  display: string;
  isValid: boolean;
}

export interface NormalizedInstagram {
  handle: string;
  displayHandle: string;
  url: string;
  isValid: boolean;
}

/**
 * Normalizes any phone number input into safe raw digits (for wa.me) and formatted display.
 * Designed primarily for India (+91) but supports international E.164 formats.
 */
export function normalizeWhatsAppPhone(input?: string | null): NormalizedPhone {
  if (!input || typeof input !== 'string') {
    return { raw: '', display: '', isValid: false };
  }

  const trimmed = input.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { raw: '', display: '', isValid: false };
  }

  let raw = digitsOnly;

  // 10 digits: Standard Indian mobile number (e.g. 9876543210) -> prepend 91
  if (digitsOnly.length === 10) {
    raw = `91${digitsOnly}`;
  }
  // 11 digits starting with 0: Leading trunk zero (e.g. 09876543210) -> strip 0 and prepend 91
  else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    raw = `91${digitsOnly.slice(1)}`;
  }
  // 12 digits starting with 91: Standard Indian with country code (e.g. 919876543210) -> keep as is
  else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    raw = digitsOnly;
  }

  // Format clean display representation
  let display = `+${raw}`;
  if (raw.startsWith('91') && raw.length === 12) {
    const num = raw.slice(2);
    display = `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }

  return { raw, display, isValid: true };
}

/**
 * Normalizes an Instagram handle or profile URL into canonical handle, @handle, and URL.
 * Accepts:
 * - 'aayesha_mehndi'
 * - '@aayesha_mehndi'
 * - 'https://instagram.com/aayesha_mehndi/'
 * - 'https://www.instagram.com/@aayesha_mehndi'
 */
export function normalizeInstagram(input?: string | null): NormalizedInstagram {
  if (!input || typeof input !== 'string') {
    return { handle: '', displayHandle: '', url: '', isValid: false };
  }

  let str = input.trim();

  // Strip protocol and domain if full URL was provided
  str = str.replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, '');

  // Strip query parameters and hashes
  str = str.split('?')[0].split('#')[0];

  // Strip leading and trailing slashes
  str = str.replace(/^\/+|\/+$/g, '');

  // Strip leading @
  if (str.startsWith('@')) {
    str = str.slice(1);
  }

  str = str.trim();

  // Instagram handle validation: letters, numbers, periods, underscores, 1-30 characters
  if (!str || !/^[a-zA-Z0-9._]{1,30}$/.test(str)) {
    return { handle: '', displayHandle: '', url: '', isValid: false };
  }

  return {
    handle: str,
    displayHandle: `@${str}`,
    url: `https://www.instagram.com/${str}/`,
    isValid: true,
  };
}

/**
 * Dynamically builds a verified WhatsApp click-to-chat URL.
 * If phoneRaw is missing, unconfigured, or invalid, returns empty string.
 * NEVER falls back to an old hardcoded number.
 */
export function buildWhatsAppUrl(
  customMessage?: string,
  phoneRaw?: string | null
): string {
  if (!phoneRaw) {
    return '';
  }

  const normalized = normalizeWhatsAppPhone(phoneRaw);
  if (!normalized.isValid || !normalized.raw) {
    return '';
  }

  const defaultMsg =
    'Hi Aayesha, I would like to book a mehndi appointment. Please share your availability and details.';
  const text =
    customMessage && customMessage.trim().length > 0
      ? customMessage.trim()
      : defaultMsg;

  return `https://wa.me/${normalized.raw}?text=${encodeURIComponent(text)}`;
}

/**
 * Dynamically builds a normalized Instagram profile URL.
 */
export function buildInstagramUrl(handleOrUrl?: string | null): string {
  const normalized = normalizeInstagram(handleOrUrl);
  return normalized.url;
}

/**
 * Dynamically builds a mailto: URL.
 */
export function buildEmailUrl(
  subject?: string,
  body?: string,
  emailAddress?: string | null
): string {
  const email = (emailAddress || '').trim();
  if (!email) {
    return '';
  }

  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);

  const query = params.toString();
  return query ? `mailto:${email}?${query}` : `mailto:${email}`;
}
