interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  priority: number;
}

interface CacheOptions {
  ttl?: number;
  persist?: boolean;
  priority?: number;
}

const DEFAULT_TTL = 10 * 60 * 1000;
const STABLE_TTL = 60 * 60 * 1000;
const STORAGE_KEY_PREFIX = 'tmdb_cache_';
const MAX_CACHE_SIZE = 500;
const MAX_STORAGE_ENTRIES = 100;

class TMDBCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private accessOrder: string[] = [];

  constructor() {
    this.loadFromStorage();
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.clearExpired();
      this.enforceMaxSize();
    }, 60000);
  }

  private loadFromStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      const entries: Array<{ key: string; entry: CacheEntry<any> }> = [];
      
      keys.forEach(key => {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          try {
            const entry: CacheEntry<any> = JSON.parse(rawData);
            if (entry.expiresAt > Date.now()) {
              entries.push({ key: key.replace(STORAGE_KEY_PREFIX, ''), entry });
            } else {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
      
      entries.sort((a, b) => (b.entry.priority || 0) - (a.entry.priority || 0));
      entries.slice(0, MAX_STORAGE_ENTRIES).forEach(({ key, entry }) => {
        this.cache.set(key, entry);
        this.accessOrder.push(key);
      });
    } catch {
    }
  }

  private saveToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      const storageKeys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      if (storageKeys.length >= MAX_STORAGE_ENTRIES) {
        const oldestKey = storageKeys[0];
        localStorage.removeItem(oldestKey);
      }
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(entry));
    } catch {
    }
  }

  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + key);
    } catch {
    }
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private enforceMaxSize(): void {
    while (this.cache.size > MAX_CACHE_SIZE && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.removeFromStorage(oldestKey);
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.removeFromStorage(key);
      return null;
    }
    
    this.updateAccessOrder(key);
    return entry.data as T;
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? DEFAULT_TTL;
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttl,
      priority: options.priority ?? 0,
    };
    
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.enforceMaxSize();
    
    if (options.persist) {
      this.saveToStorage(key, entry);
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const fetchPromise = fetchFn()
      .then(data => {
        this.set(key, data, options);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  async prefetchMultiple<T>(
    requests: Array<{ key: string; fetchFn: () => Promise<T>; options?: CacheOptions }>
  ): Promise<void> {
    const uncached = requests.filter(r => !this.has(r.key));
    await Promise.allSettled(
      uncached.map(r => this.getOrSet(r.key, r.fetchFn, r.options))
    );
  }

  preload<T>(key: string, data: T, options: CacheOptions = {}): void {
    this.set(key, data, options);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
    } catch {
    }
  }

  clearExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeFromStorage(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) this.accessOrder.splice(index, 1);
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.removeFromStorage(key);
      return false;
    }
    return true;
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    this.clearExpired();
    return Array.from(this.cache.keys());
  }

  getStats(): { size: number; pendingRequests: number; storageEntries: number } {
    let storageEntries = 0;
    try {
      storageEntries = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX)).length;
    } catch {}
    
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      storageEntries,
    };
  }
}

export const tmdbCache = new TMDBCache();
export const CACHE_TTL = {
  DYNAMIC: DEFAULT_TTL,
  STABLE: STABLE_TTL,
  SHORT: 5 * 60 * 1000,
  LONG: 2 * 60 * 60 * 1000,
  VERY_LONG: 24 * 60 * 60 * 1000,
  IMAGES: 60 * 60 * 1000,
};
