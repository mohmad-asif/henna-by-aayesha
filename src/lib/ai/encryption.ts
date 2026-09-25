import 'server-only';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte encryption key from the environment variable.
 * Enforces strictly in production that AI_SETTINGS_ENCRYPTION_KEY is defined.
 */
function getDerivedKey(): Buffer {
  const secret = process.env.AI_SETTINGS_ENCRYPTION_KEY;

  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[AI Encryption] Security Violation: AI_SETTINGS_ENCRYPTION_KEY must be configured in production.'
      );
    }
    // Development-only fallback
    return crypto
      .createHash('sha256')
      .update('henna-by-aayesha-secret-dev-key-change-in-prod')
      .digest();
  }

  // SHA-256 guarantees exactly 32 bytes (256 bits) for AES-256
  return crypto.createHash('sha256').update(secret.trim()).digest();
}

/**
 * Encrypts an API key string using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex encoded)
 */
export function encryptApiKey(plainText: string): string {
  if (!plainText || plainText.trim().length === 0) {
    return '';
  }

  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText.trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted API key string using AES-256-GCM.
 */
export function decryptApiKey(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) {
    return '';
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      return '';
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getDerivedKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      return '';
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[AI Encryption] Failed to decrypt API key:', error);
    return '';
  }
}

/**
 * Creates a safe masked preview of an API key for the Admin UI.
 * Plaintext keys are NEVER sent to the client.
 */
export function maskApiKey(plainOrDecryptedKey?: string | null): string {
  if (!plainOrDecryptedKey || plainOrDecryptedKey.trim().length === 0) {
    return '';
  }

  const clean = plainOrDecryptedKey.trim();
  if (clean.length <= 8) {
    return '••••••••••••';
  }

  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-3);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Creates a safe masked preview of a Cloudflare Account ID for the Admin UI.
 * e.g. 12345678...abcd
 */
export function maskAccountId(accountId?: string | null): string {
  if (!accountId || accountId.trim().length === 0) {
    return '';
  }

  const clean = accountId.trim();
  if (clean.length <= 12) {
    return '••••••••••••';
  }

  const prefix = clean.slice(0, 8);
  const suffix = clean.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Validates Cloudflare Account ID format (standard 32-character hex/alphanumeric string).
 */
export function isValidCloudflareAccountId(id?: string | null): boolean {
  if (!id) return false;
  const clean = id.trim();
  return (
    /^[a-f0-9]{32}$/i.test(clean) ||
    (clean.length >= 16 && clean.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(clean))
  );
}
