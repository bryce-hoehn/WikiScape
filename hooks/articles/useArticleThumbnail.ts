import { useQuery } from '@tanstack/react-query';
import { fetchArticleThumbnail } from '../../api';
import { useBookmarks } from '../../context/BookmarksContext';

/**
 * Hook for fetching Wikipedia articles by title
 * Checks offline cache first, then falls back to network
 */
export default function useArticleThumbnail(title: string) {
  const { getOfflineArticle } = useBookmarks();

  return useQuery({
    queryKey: ['article-thumbnail', title],
    queryFn: async () => {
      // Check if article is available offline first
      const offlineArticle = getOfflineArticle(title);
      if (offlineArticle && offlineArticle.thumbnail) {
        return offlineArticle.thumbnail;
      }

      // Fall back to network request
      const thumbnail = await fetchArticleThumbnail(title);
      return thumbnail;
    },
    enabled: !!title,
    staleTime: 60 * 60 * 1000, // 1 hour - thumbnails rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch on focus
  });
}
