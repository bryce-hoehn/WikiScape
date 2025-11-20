import { fetchTrendingArticles } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * useTrendingArticles - Fetches trending articles with fallback logic
 * 
 * Behavior:
 * 1. Try to fetch yesterday's page views
 * 2. Fallback to cached data or fetch from 2 days ago if cache doesn't exist yet
 * 3. Periodically refreshes to check for new data
 */

// Simple in-memory cache
let cachedData: any[] | null = null;

export default function useTrendingArticles() {
  const yesterday = useMemo(() => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 1);
    return date;
  }, []);
  const twoDaysAgo = useMemo(() => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 2);
    return date;
  }, []);

  const queryKey = ['trending-articles', yesterday.toISOString().split('T')[0]] as const;

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Try yesterday's data first
      try {
        const content = await fetchTrendingArticles(yesterday);
        cachedData = content;
        return content;
      } catch (error) {
        // If yesterday fails, check if we have cached data
        if (cachedData) {
          return cachedData;
        }
        // If no cache, try 2 days ago
        const content = await fetchTrendingArticles(twoDaysAgo);
        cachedData = content;
        return content;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - data updates daily
    gcTime: 2 * 24 * 60 * 60 * 1000, // 2 days
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    refetchIntervalInBackground: true, // Continue refreshing in background
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Provide cached data as initial data if available
    initialData: cachedData ? () => cachedData : undefined,
  });
}
