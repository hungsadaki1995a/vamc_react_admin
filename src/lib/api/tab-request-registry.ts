/**
 * Registry of in-flight API requests per tab.
 *
 * Each request is registered under the active tab (key) at the time it is issued, and unregistered on response/error.
 * When a tab is closed, {@link abortTabRequests} aborts all pending requests for that tab →
 * prevents queries from a closed tab from waiting for server response and keeping the global loading bar spinning.
 *
 * Note: client-side abort only cancels browser waiting/loading bar; server-side queries continue executing
 * (stopping server work would require separate cooperative cancellation).
 */
const registry = new Map<string, Set<AbortController>>();

/** Register a request under its owning tab. */
export function registerTabRequest(tabKey: string, ctrl: AbortController): void {
  let set = registry.get(tabKey);
  if (!set) {
    set = new Set();
    registry.set(tabKey, set);
  }
  set.add(ctrl);
}

/** Unregister a request on completion (response/error/cancel). */
export function unregisterTabRequest(tabKey: string, ctrl: AbortController): void {
  const set = registry.get(tabKey);
  if (!set) return;
  set.delete(ctrl);
  if (set.size === 0) registry.delete(tabKey);
}

/** Abort all pending requests belonging to a tab when closed. */
export function abortTabRequests(tabKey: string): void {
  const set = registry.get(tabKey);
  if (!set) return;
  // Iterate over a copy because the abort handler (axios) may call unregister.
  for (const ctrl of [...set]) ctrl.abort();
  registry.delete(tabKey);
}
