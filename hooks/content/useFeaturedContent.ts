import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchFeaturedContent } from '../../api';

/**
 * useFeaturedContent - Fetches featured content with fallback to cache
 * 
 * Behavior:
 * 1. Try to fetch today's featured content
 * 2. Fallback to cached data if fetch fails
 * 3. Periodically refreshes to check for new data
 */

// Simple in-memory cache
let cachedData: any | null = null;

export default function useFeaturedContent() {
  const todayDateKey = useMemo(() => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const queryKey = ['featured-content', todayDateKey] as const;

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const content = await fetchFeaturedContent();
        cachedData = content;
        return content;
      } catch (error) {
        // If fetch fails, return cached data if available
        if (cachedData) {
          return cachedData;
        }
        // Otherwise rethrow so react-query can surface error states
        throw error;
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
