/**
 * IndexedDB key-value cache with TTL support.
 * Stores data as { data, ts } internally so callers can check freshness.
 */

const DB_NAME = 'ds-pms-cache';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

export interface CachedEntry<T> {
  data: T;
  /** Unix timestamp (ms) when this entry was stored */
  ts: number;
}

/** Returns { data, ts } so callers can determine freshness. */
export async function idbGet<T>(key: string): Promise<CachedEntry<T> | undefined> {
  if (import.meta.env.DEV) return undefined;
  try {
    const db = await getDB();
    return new Promise<CachedEntry<T> | undefined>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result as CachedEntry<T> | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

/** Store value with current timestamp. */
export async function idbSet<T>(key: string, data: T): Promise<void> {
  if (import.meta.env.DEV) return;
  try {
    const db = await getDB();
    const entry: CachedEntry<T> = { data, ts: Date.now() };
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(entry, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Cache write failure is non-critical
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Non-critical
  }
}
