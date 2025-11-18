import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchFeaturedContent } from '../../api';

/**
 * useFeaturedContent with in-memory fallback cache and background refresh.
 *
 * Behavior:
 * - Keeps an in-memory last-known-good featured content value as a fallback when network fetch fails.
 * - Performs background refresh on an interval (default 15 minutes).
 * - Uses react-query for caching, retries and stale-time semantics.
 */

// Simple in-memory cache (module-scoped)
let lastFeaturedCache: { data: any; fetchedAt: number } | null = null;

export function getLastFeaturedCache() {
  return lastFeaturedCache;
}

export default function useFeaturedContent() {
  const queryKey = ['featured-content'] as const;

  const queryFn = async () => {
    try {
      const content = await fetchFeaturedContent();
      try {
        // store last successful fetch in module cache
        lastFeaturedCache = { data: content, fetchedAt: Date.now() };
      } catch {
        // ignore cache errors
      }
      return content;
    } catch (error) {
      // If network fails, return in-memory cache if available so UI still shows something.
      if (lastFeaturedCache) {
        return lastFeaturedCache.data;
      }

      // Otherwise rethrow so react-query can surface error states and retries
      throw error;
    }
  };

  const queryResult = useQuery({
    queryKey,
    queryFn,
    // Featured content updates rarely; keep it fresh but allow background refresh
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours (replaced deprecated cacheTime)
    // react-query retry/backoff - still keep in addition to axios retries
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Background refresh every 15 minutes to keep cache fresh without blocking UI
    refetchInterval: 15 * 60 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Don't refetch on reconnect
    // Provide initialData from in-memory cache if present (fast UI)
    initialData: () => lastFeaturedCache?.data ?? undefined,
  } as any);

  // When query successfully fetches, ensure module cache is populated
  // Move to useEffect to prevent side effects during render (React 19 strict mode requirement)
  useEffect(() => {
  if (!queryResult.isFetching && queryResult.data) {
    try {
      lastFeaturedCache = { data: queryResult.data, fetchedAt: Date.now() };
    } catch {
      // ignore
    }
  }
  }, [queryResult.isFetching, queryResult.data]);

  return queryResult;
}
