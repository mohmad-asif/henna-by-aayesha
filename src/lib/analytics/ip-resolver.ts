import { NextRequest } from 'next/server';

/**
 * Resolves the visitor's real public IP address from trusted request headers.
 *
 * Header evaluation order:
 * 1. cf-connecting-ip (Cloudflare proxy)
 * 2. x-real-ip (Nginx / Cloud proxies)
 * 3. x-vercel-forwarded-for (Vercel edge network)
 * 4. x-forwarded-for (Standard multi-hop proxy header; takes first / client IP)
 * 5. x-client-ip (Alternative proxy)
 * 6. fastly-client-ip (Fastly CDN)
 * 7. true-client-ip (Akamai / Cloudflare Enterprise)
 * 8. request.ip (NextRequest runtime metadata)
 *
 * Sanitization & Validation:
 * - Strips trailing port numbers (e.g. 103.45.67.89:54321 -> 103.45.67.89)
 * - Strips IPv4-mapped IPv6 prefixes (e.g. ::ffff:103.45.67.89 -> 103.45.67.89)
 * - Rejects fake placeholders, loopback (127.0.0.1, ::1, localhost, unknown, null, undefined)
 * - Validates strict IPv4 and IPv6 format
 * - Returns null when a valid public IP cannot be resolved
 */
export function resolveClientIp(request: NextRequest): string | null {
  const candidateHeaders = [
    'cf-connecting-ip',
    'x-real-ip',
    'x-vercel-forwarded-for',
    'x-forwarded-for',
    'x-client-ip',
    'fastly-client-ip',
    'true-client-ip',
  ];

  let rawIp: string | null = null;

  for (const headerName of candidateHeaders) {
    const val = request.headers.get(headerName);
    if (val && typeof val === 'string' && val.trim().length > 0) {
      // Split on commas if multi-hop proxy forwarded chain
      const parts = val.split(',');
      const candidate = parts[0]?.trim();
      if (candidate && candidate.length > 0) {
        rawIp = candidate;
        break;
      }
    }
  }

  // Fallback to NextRequest.ip if supported by the server runtime
  if (!rawIp) {
    const nextIp = (request as unknown as { ip?: string }).ip;
    if (nextIp && typeof nextIp === 'string' && nextIp.trim().length > 0) {
      rawIp = nextIp.trim();
    }
  }

  if (!rawIp) {
    return null;
  }

  let cleaned = rawIp.trim();

  // Strip port from IPv4 if present (e.g. 103.45.67.89:12345)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(cleaned)) {
    cleaned = cleaned.split(':')[0];
  }

  // Strip IPv4-mapped IPv6 prefix (e.g. ::ffff:103.45.67.89)
  if (cleaned.startsWith('::ffff:')) {
    cleaned = cleaned.substring(7);
  }

  // Check for fake, placeholder, or loopback addresses
  const lower = cleaned.toLowerCase();
  if (
    lower === 'unknown' ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower === '127.0.0.1' ||
    lower === '::1' ||
    lower === 'localhost'
  ) {
    return null;
  }

  // Validate either IPv4 or IPv6
  const isIpv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(cleaned);
  const isIpv6 = /^[0-9a-fA-F:]+$/.test(cleaned) && cleaned.includes(':');

  if (isIpv4 || isIpv6) {
    return cleaned;
  }

  return null;
}
