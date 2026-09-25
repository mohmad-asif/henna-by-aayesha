import fs from 'fs';
import path from 'path';
import { DbAIProvider } from './types';

const CACHE_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'ai', '.providers-cache.json');

declare global {
  // eslint-disable-next-line no-var
  var __aiProvidersCache: DbAIProvider[] | undefined;
}

/**
 * Saves providers to in-memory global state and persistent local cache file.
 */
export function saveProvidersCache(providers: DbAIProvider[]): void {
  try {
    globalThis.__aiProvidersCache = providers;
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(providers, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AI Provider Cache] Failed to write cache to file:', err);
  }
}

/**
 * Retrieves providers from in-memory global state or local cache file.
 */
export function getProvidersFromCache(): DbAIProvider[] {
  if (globalThis.__aiProvidersCache && globalThis.__aiProvidersCache.length > 0) {
    return globalThis.__aiProvidersCache;
  }

  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalThis.__aiProvidersCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AI Provider Cache] Failed to read cache from file:', err);
  }

  return [];
}

/**
 * Updates a single provider in the server cache.
 */
export function updateProviderInCache(provider: DbAIProvider): void {
  const current = getProvidersFromCache();
  const existingIdx = current.findIndex(p => p.provider_key === provider.provider_key);

  let updated: DbAIProvider[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...provider };
  } else {
    updated = [...current, provider];
  }

  saveProvidersCache(updated);
}
