/**
 * ============================================================================
 * CENTRALIZED IN-MEMORY SERVER CACHE (AGGRESSIVE TTL FOR SUPABASE EGRESS SAVING)
 * File: backend/src/utils/serverCache.js
 * ============================================================================
 * Default TTL: 60 menit (1 jam) agar Express.js hanya menarik data dari Supabase
 * maksimal 24x per hari per resource (bahkan lebih sedikit jika tidak ada traffic).
 */

export const ONE_HOUR_MS = 60 * 60 * 1000;
export const THIRTY_MINUTES_MS = 30 * 60 * 1000;

class ServerCache {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value;
  }

  set(key, value, ttlMs = ONE_HOUR_MS) {
    this.store.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
    return true;
  }

  del(key) {
    return this.store.delete(key);
  }

  delByPrefix(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count += 1;
      }
    }
    return count;
  }

  flushAll() {
    this.store.clear();
  }

  getStats() {
    return {
      keys: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses > 0
          ? `${Math.round((this.hits / (this.hits + this.misses)) * 100)}%`
          : '0%',
    };
  }
}

export const serverCache = new ServerCache();

