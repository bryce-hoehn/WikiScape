import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedContent } from '../../api';

/**
 * Hook for fetching Wikipedia featured content (Today's Featured Article, Picture of the Day, etc.)
 * with enhanced data including categories for trending articles
 */
export default function useFeaturedContent() {
  const queryResult = useQuery({
    queryKey: ['featured-content'],
    queryFn: async () => {
      try {
        const content = await fetchFeaturedContent();
        return content;
      } catch (error) {
        console.error('Featured content fetch failed, returning null data:', error);
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Failed to fetch featured content',
        };
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour - featured content changes daily
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection time
    retry: 1, // Allow one retry for transient failures
    retryDelay: 1000, // 1 second delay between retries
  });

  return queryResult;
}
