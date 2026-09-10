/**
 * AMIT ONLINE SERVICES - CLIENT-SIDE ORDER CACHE & OFFLINE ENGINE
 * Provides persistent, resilient client-side caching using IndexedDB with localStorage fallback.
 * Ensures seamless order lookup and tracking history even during intermittent network drops.
 */

const DB_NAME = "AOS_Order_Tracking_Cache_DB";
const DB_VERSION = 1;
const STORE_ORDERS = "orders_history";
const STORE_SEARCHES = "search_history";
const LOCAL_STORAGE_KEY_ORDERS = "aos_cached_orders_v1";
const LOCAL_STORAGE_KEY_SEARCHES = "aos_cached_searches_v1";

interface CachedOrderRecord {
  orderId: string;
  data: any;
  cachedAt: number;
  lastVerifiedAt: number;
}

interface CachedSearchQuery {
  query: string;
  timestamp: number;
  resultSummary?: {
    orderId?: string;
    status?: string;
    customerName?: string;
    amount?: number;
  };
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes IndexedDB storage connection
 */
const initIndexedDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_ORDERS)) {
          db.createObjectStore(STORE_ORDERS, { keyPath: "orderId" });
        }
        if (!db.objectStoreNames.contains(STORE_SEARCHES)) {
          const searchStore = db.createObjectStore(STORE_SEARCHES, { keyPath: "query" });
          searchStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };

      request.onsuccess = (event: Event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn("IndexedDB initialization failed, falling back to LocalStorage:", err);
        resolve(null);
      };
    } catch (e) {
      console.warn("IndexedDB Exception, fallback to LocalStorage:", e);
      resolve(null);
    }
  });
};

/**
 * Saves or updates an order in client-side persistent cache
 */
export async function saveOrderToCache(orderId: string, orderData: any): Promise<void> {
  if (!orderId || !orderData) return;
  const cleanId = String(orderId).trim();
  const record: CachedOrderRecord = {
    orderId: cleanId,
    data: orderData,
    cachedAt: Date.now(),
    lastVerifiedAt: Date.now()
  };

  // 1. Try IndexedDB
  const db = await initIndexedDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_ORDERS, "readwrite");
      const store = tx.objectStore(STORE_ORDERS);
      store.put(record);
    } catch (err) {
      console.warn("IndexedDB put order error:", err);
    }
  }

  // 2. Always maintain localStorage mirror as instant fallback
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
    const map: Record<string, CachedOrderRecord> = raw ? JSON.parse(raw) : {};
    map[cleanId] = record;
    // Cap localStorage store to most recent 50 orders
    const keys = Object.keys(map);
    if (keys.length > 50) {
      const oldestKey = keys.sort((a, b) => (map[a].cachedAt || 0) - (map[b].cachedAt || 0))[0];
      delete map[oldestKey];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(map));
  } catch (lsErr) {
    console.warn("LocalStorage save order cache error:", lsErr);
  }
}

/**
 * Retrieves a cached order by ID
 */
export async function getCachedOrder(orderId: string): Promise<any | null> {
  if (!orderId) return null;
  const cleanId = String(orderId).trim();

  // 1. Try IndexedDB
  const db = await initIndexedDB();
  if (db) {
    try {
      const result = await new Promise<CachedOrderRecord | null>((resolve) => {
        const tx = db.transaction(STORE_ORDERS, "readonly");
        const store = tx.objectStore(STORE_ORDERS);
        const req = store.get(cleanId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (result && result.data) {
        return result.data;
      }
    } catch (e) {
      console.warn("IndexedDB read error:", e);
    }
  }

  // 2. LocalStorage fallback
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
    if (raw) {
      const map: Record<string, CachedOrderRecord> = JSON.parse(raw);
      if (map[cleanId] && map[cleanId].data) {
        return map[cleanId].data;
      }
    }
  } catch (e) {
    console.warn("LocalStorage read error:", e);
  }

  return null;
}

/**
 * Returns all cached order records sorted by last update
 */
export async function getAllCachedOrders(): Promise<any[]> {
  const db = await initIndexedDB();
  if (db) {
    try {
      const records = await new Promise<CachedOrderRecord[]>((resolve) => {
        const tx = db.transaction(STORE_ORDERS, "readonly");
        const store = tx.objectStore(STORE_ORDERS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      if (records && records.length > 0) {
        return records
          .sort((a, b) => b.cachedAt - a.cachedAt)
          .map((r) => r.data);
      }
    } catch (e) {
      console.warn("IndexedDB getAll error:", e);
    }
  }

  // Fallback to LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
    if (raw) {
      const map: Record<string, CachedOrderRecord> = JSON.parse(raw);
      return Object.values(map)
        .sort((a, b) => b.cachedAt - a.cachedAt)
        .map((r) => r.data);
    }
  } catch (e) {
    console.warn("LocalStorage getAll error:", e);
  }

  return [];
}

/**
 * Records a search query into tracking search history
 */
export async function recordTrackingSearch(query: string, resultSummary?: any): Promise<void> {
  if (!query) return;
  const clean = query.trim().toUpperCase();
  const entry: CachedSearchQuery = {
    query: clean,
    timestamp: Date.now(),
    resultSummary: resultSummary
      ? {
          orderId: resultSummary.orderId || resultSummary.OrderID,
          status: resultSummary.status || resultSummary.Status,
          customerName: resultSummary.customerName || resultSummary.CustomerName,
          amount: resultSummary.amount || resultSummary.Amount
        }
      : undefined
  };

  const db = await initIndexedDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_SEARCHES, "readwrite");
      const store = tx.objectStore(STORE_SEARCHES);
      store.put(entry);
    } catch (e) {
      console.warn("IndexedDB search log error:", e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SEARCHES);
    let list: CachedSearchQuery[] = raw ? JSON.parse(raw) : [];
    list = [entry, ...list.filter((x) => x.query !== clean)].slice(0, 20);
    localStorage.setItem(LOCAL_STORAGE_KEY_SEARCHES, JSON.stringify(list));
  } catch (e) {
    console.warn("LocalStorage search log error:", e);
  }
}

/**
 * Retrieves past tracking search queries
 */
export async function getRecentTrackingSearches(): Promise<CachedSearchQuery[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SEARCHES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("LocalStorage get recent searches error:", e);
  }
  return [];
}
