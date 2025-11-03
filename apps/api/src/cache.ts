import { LRUCache } from 'lru-cache';

import { env } from './env.js';

export const cache = new LRUCache<string, {}>({
  max: 500,
  ttl: env.CACHE_TTL_MS
});

export function cacheGet<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function cacheSet<T extends {}>(key: string, value: T): void {
  cache.set(key, value);
}
