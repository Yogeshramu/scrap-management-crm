'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataCache } from './cache';
import { apiFetch } from './apiFetch';

interface Options {
  ttl?: number;
  skip?: boolean;
}

export function useCachedFetch<T>(url: string, options: Options = {}) {
  const { ttl, skip = false } = options;
  const [data, setData] = useState<T | null>(() => dataCache.get(url, ttl) ?? null);
  const [loading, setLoading] = useState<boolean>(!data && !skip);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch_ = useCallback(async (force = false) => {
    if (skip) return;
    const cached = dataCache.get(url, ttl);
    if (!force && cached !== null) { setData(cached); setLoading(false); return; }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      // apiFetch handles 401 → refresh → retry internally
      const res = await apiFetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        // Try to extract a meaningful error message from the JSON body
        let msg = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      const json = await res.json();
      dataCache.set(url, json);
      setData(json);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url, ttl, skip]);

  useEffect(() => {
    fetch_();
    return () => abortRef.current?.abort();
  }, [fetch_]);

  const refresh = useCallback(() => {
    dataCache.invalidate(url);
    fetch_(true);
  }, [url, fetch_]);

  return { data, loading, error, refresh };
}
