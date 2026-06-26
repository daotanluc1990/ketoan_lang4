type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getCacheEnv() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''
  };
}

function isFresh<T>(entry?: CacheEntry<T>) {
  return Boolean(entry && entry.expiresAt > Date.now());
}

export function hasExternalReportCache() {
  const env = getCacheEnv();
  return Boolean(env.url && env.token);
}

async function readExternalCache<T>(key: string): Promise<T | null> {
  const env = getCacheEnv();
  if (!env.url || !env.token) return null;
  try {
    const response = await fetch(`${env.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${env.token}` },
      cache: 'no-store'
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    const raw = payload?.result;
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeExternalCache<T>(key: string, value: T, ttlSeconds: number) {
  const env = getCacheEnv();
  if (!env.url || !env.token) return;
  try {
    await fetch(env.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', key, JSON.stringify(value), 'EX', ttlSeconds]),
      cache: 'no-store'
    });
  } catch {
    // External cache is optional. Memory cache remains the safe fallback.
  }
}

export async function setReportCache<T>(key: string, ttlSeconds: number, value: T) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  await writeExternalCache(key, value, ttlSeconds);
  return value;
}

export async function getOrSetReportCache<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
  const memoryEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (isFresh(memoryEntry)) return memoryEntry!.value;

  const externalValue = await readExternalCache<T>(key);
  if (externalValue) {
    memoryCache.set(key, { value: externalValue, expiresAt: Date.now() + ttlSeconds * 1000 });
    return externalValue;
  }

  const value = await producer();
  return setReportCache(key, ttlSeconds, value);
}

export function stableCacheKey(scope: string, input: unknown) {
  return `${scope}:${JSON.stringify(input, Object.keys(input as object).sort())}`;
}
