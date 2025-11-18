import { useQuery } from '@tanstack/react-query';
import { fetchTrendingArticles } from '@/api';

/**
 * Hook for fetching trending articles with proper caching
 * Data only changes once per day, so we cache for 24 hours
 */
export default function useTrendingArticles() {
  const queryResult = useQuery({
    queryKey: ['trending-articles'],
    queryFn: async () => {
      try {
        return await fetchTrendingArticles();
      } catch (error) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Trending articles fetch failed:', error);
        }
        return [];
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - trending data changes daily
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for a day
    retry: 2, // Retry twice on failure
  });

  return queryResult;
}
