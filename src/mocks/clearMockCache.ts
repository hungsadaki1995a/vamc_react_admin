// Deletes IndexedDB cache before MSW starts.
// labelStore/comcdStore use 5-min TTL IDB cache — stale real-server data would bypass MSW handlers.
// DB_NAME must match src/lib/cache/idbCache.ts
const DB_NAME = 'ds-pms-cache';

export function clearMockCache(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();    // failure is non-critical
    // onblocked: other connections hold the DB open — wait briefly then continue
    req.onblocked = () => setTimeout(resolve, 300);
  });
}
