import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone objects for better performance
});

export class CacheManager {
  private static instance: CacheManager;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Generic get/set methods
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return cache.set(key, value, ttl || 600);
  }

  del(key: string | string[]): number {
    return cache.del(key);
  }

  // --- UPDATED AND CORRECTED MENU METHODS ---

  /**
   * Gets menu items from cache using a specific key format.
   */
  getMenuItems(
    canteenId: string,
    category: string,
    available: string,
  ): any[] | undefined {
    const key = `menu:${canteenId}:${category}:${available}`;
    return this.get(key);
  }

  /**
   * Sets menu items in the cache using a specific key format.
   */
  setMenuItems(
    canteenId: string,
    category: string,
    available: string,
    items: any[],
    ttl = 300,
  ): boolean {
    const key = `menu:${canteenId}:${category}:${available}`;
    return this.set(key, items, ttl);
  }

  /**
   * Finds all cache keys for a given canteen and deletes them.
   */
  invalidateMenuCache(canteenId?: string): void {
    if (canteenId) {
      // Add a colon ":" to the end of the prefix for a more specific match
      const prefix = `menu:${canteenId}:`;
      const keysToDelete = cache.keys().filter((key) => key.startsWith(prefix));
      
      if (keysToDelete.length > 0) {
        this.del(keysToDelete);
        console.log(`Invalidated ${keysToDelete.length} cache entries for canteen ${canteenId}`);
      }
    } else {
      // Invalidate all menu-related cache
      const keysToDelete = cache.keys().filter((key) => key.startsWith("menu:"));
      if (keysToDelete.length > 0) {
          this.del(keysToDelete);
          console.log(`Invalidated all ${keysToDelete.length} menu cache entries.`);
      }
    }
  }

  // --- OTHER CACHE METHODS (UNCHANGED) ---

  getUserSession(userId: string): any | undefined {
    return this.get(`session:${userId}`);
  }

  setUserSession(userId: string, sessionData: any, ttl = 1800): boolean {
    return this.set(`session:${userId}`, sessionData, ttl);
  }

  getUserRecentOrders(userId: string): any[] | undefined {
    return this.get(`recent_orders:${userId}`);
  }

  setUserRecentOrders(userId: string, orders: any[], ttl = 900): boolean {
    return this.set(`recent_orders:${userId}`, orders, ttl);
  }

  invalidateUserOrderCache(userId: string): void {
    this.del(`recent_orders:${userId}`);
  }

  getCanteens(): any[] | undefined {
    return this.get("canteens");
  }

  setCanteens(canteens: any[], ttl = 1800): boolean {
    return this.set("canteens", canteens, ttl);
  }

  invalidateCanteenCache(): void {
    this.del("canteens");
  }

  getStats() {
    return cache.getStats();
  }

  flushAll(): void {
    cache.flushAll();
  }
}

export default CacheManager.getInstance();