/**
 * In-memory GET cache with stale-while-revalidate.
 * Tab state is preserved by keeping visited tabs mounted in the dashboard layout.
 */

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const CACHE_TTL = {
  /** Lists that change often (history, reports) */
  short: 60_000,
  /** Dashboard, admin tables */
  medium: 120_000,
  /** Customers, vehicles, recipes, settings */
  long: 10 * 60_000,
  /** Subscription / plans */
  plans: 5 * 60_000,
} as const;

function cacheKey(url: string, init?: RequestInit): string {
  const method = (init?.method || 'GET').toUpperCase();
  return `${method}:${url}`;
}

export function peekCache<T>(url: string, init?: RequestInit): T | null {
  const hit = store.get(cacheKey(url, init));
  return hit ? (hit.data as T) : null;
}

/** Prime cache after a combined bootstrap response */
export function seedCache<T>(url: string, data: T, init?: RequestInit) {
  store.set(cacheKey(url, init), { data, fetchedAt: Date.now() });
}

export function invalidateCache(urlPrefix?: string) {
  if (!urlPrefix) {
    store.clear();
    inflight.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.includes(urlPrefix)) store.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.includes(urlPrefix)) inflight.delete(key);
  }
}

export function setupCacheInvalidationListener() {
  if (typeof window === 'undefined') return () => {};
  const onUpdate = () => {
    invalidateCache('/api/customers');
    invalidateCache('/api/vehicles');
    invalidateCache('/api/recipes');
    invalidateCache('/api/settings');
    invalidateCache('/api/reports');
    invalidateCache('/api/bootstrap');
    invalidateCache('/api/next-docket');
    invalidateCache('/api/session');
    invalidateCache('/api/dashboard');
  };
  window.addEventListener('bemsDataUpdated', onUpdate);
  return () => window.removeEventListener('bemsDataUpdated', onUpdate);
}

type CachedFetchOptions = RequestInit & {
  ttl?: number;
  /** Skip cache and replace stored value */
  force?: boolean;
  /** Return null instead of throwing on HTTP errors */
  optional?: boolean;
};

async function fetchAndStore<T>(url: string, options: CachedFetchOptions, key: string): Promise<T | null> {
  const { ttl: _ttl, force: _force, optional: _optional, ...init } = options;
  const res = await fetch(url, init);
  if (!res.ok) {
    if (options.optional) return null;
    let detail = '';
    try {
      const body = await res.json();
      if (body?.error) detail = `: ${body.error}`;
    } catch {
      /* ignore */
    }
    throw new Error(`Request failed: ${res.status} ${url}${detail}`);
  }
  const data = (await res.json()) as T;
  store.set(key, { data, fetchedAt: Date.now() });
  return data;
}

/**
 * Returns cached data when fresh; serves stale immediately and revalidates in the background.
 */
/** Like cachedFetch but returns null on failure (no console throw). */
export async function safeCachedFetch<T>(
  url: string,
  options: CachedFetchOptions = {},
): Promise<T | null> {
  try {
    return (await cachedFetch<T>(url, { ...options, optional: true })) ?? null;
  } catch {
    return null;
  }
}

export async function cachedFetch<T>(url: string, options: CachedFetchOptions = {}): Promise<T> {
  const ttl = options.ttl ?? CACHE_TTL.short;
  const key = cacheKey(url, options);
  const now = Date.now();

  if (!options.force) {
    const hit = store.get(key) as CacheEntry<T> | undefined;
    if (hit) {
      const age = now - hit.fetchedAt;
      if (age < ttl) {
        return hit.data;
      }
      // Stale: return immediately, refresh in background
      if (!inflight.has(key)) {
        const refresh = fetchAndStore<T>(url, options, key).catch(() => hit.data);
        inflight.set(key, refresh);
        void refresh.finally(() => inflight.delete(key));
      }
      return hit.data;
    }
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = fetchAndStore<T>(url, options, key).then((result) => {
    if (result === null) {
      if (options.optional) return null as T;
      throw new Error(`Request failed: ${url}`);
    }
    return result;
  });
  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}
