
type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private TTL_MS = 1000 * 60 * 60; // 1 Hour

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  public set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL_MS
    });
  }

  public generateKey(prefix: string, payload: any): string {
    return `${prefix}_${JSON.stringify(payload)}`;
  }
}

export const requestCache = new RequestCache();
