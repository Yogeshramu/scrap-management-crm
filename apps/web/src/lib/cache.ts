const TTL_MS = 60_000;
interface Entry { data: any; ts: number; }
const store = new Map<string, Entry>();

export const dataCache = {
  get(key: string, ttl = TTL_MS): any | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > ttl) { store.delete(key); return null; }
    return entry.data;
  },
  set(key: string, data: any) {
    store.set(key, { data, ts: Date.now() });
  },
  invalidate(...keys: string[]) {
    keys.forEach(k => store.delete(k));
  },
  invalidatePrefix(prefix: string) {
    for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
  },
};
