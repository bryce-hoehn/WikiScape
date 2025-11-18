import { useQuery } from '@tanstack/react-query';
import { fetchArticleSummary } from '../../api';
import { useBookmarks } from '../../context/BookmarksContext';
import { Article } from '../../types/api';

/**
 * Hook for fetching Wikipedia article summaries by title
 *
 * Checks offline cache first, then falls back to network request.
 * Used for recommendation cards, search results, and article previews.
 *
 * @param title - The Wikipedia article title (e.g., "Albert Einstein")
 * @returns React Query result object with:
 *   - `data`: The Article object or null
 *   - `isLoading`: Whether the request is in progress
 *   - `error`: Any error that occurred
 *   - `refetch`: Function to manually refetch the article
 *
 * @example
 * ```tsx
 * const { data: article, isLoading } = useArticle("Albert Einstein");
 * if (isLoading) return <Loading />;
 * if (article) return <ArticleCard article={article} />;
 * ```
 */
export default function useArticle(title: string) {
  const { getOfflineArticle } = useBookmarks();

  return useQuery({
    queryKey: ['article', title],
    queryFn: async (): Promise<Article | null> => {
      // Check if article is available offline first
      const offlineArticle = getOfflineArticle(title);
      if (offlineArticle) {
        return offlineArticle;
      }

      // Fall back to network request
      const articleResponse = await fetchArticleSummary(title);
      return articleResponse.article;
    },
    enabled: !!title,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - explicit cache time
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}
