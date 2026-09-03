import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env } from '../../config/env';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static memoryCache = new Map<string, CacheEntry<any>>();

  /**
   * Set cache item with optional custom TTL in milliseconds
   */
  static async set<T>(key: string, data: T, ttl: number = Env.CACHE_TTL_MS): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Store in persistent AsyncStorage
    try {
      await AsyncStorage.setItem(`@ts_cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      if (Env.DEBUG_API) {
        console.warn(`[CacheManager] Failed to persist key ${key}:`, e);
      }
    }
  }

  /**
   * Get cache item. Returns data if fresh, or null if expired/missing.
   */
  static async get<T>(key: string, allowStale: boolean = false): Promise<T | null> {
    const now = Date.now();

    // 1. Check memory cache first
    const memoryEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memoryEntry) {
      const isFresh = now - memoryEntry.timestamp < memoryEntry.ttl;
      if (isFresh || allowStale) {
        return memoryEntry.data;
      }
    }

    // 2. Check persistent AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(`@ts_cache_${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      // Hydrate memory cache
      this.memoryCache.set(key, entry);

      const isFresh = now - entry.timestamp < entry.ttl;
      if (isFresh || allowStale) {
        return entry.data;
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Invalidate a single key
   */
  static async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(`@ts_cache_${key}`);
    } catch {}
  }

  /**
   * Clear all cached items matching our prefix
   */
  static async clearAll(): Promise<void> {
    this.memoryCache.clear();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => k.startsWith('@ts_cache_'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch {}
  }
}
