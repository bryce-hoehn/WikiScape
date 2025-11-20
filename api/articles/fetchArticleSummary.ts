import { restAxiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { Article, ArticleResponse } from '@/types/api';
import { isAxiosError } from '@/types/api/base';
import { normalizeWikipediaTitle } from '@/utils/titleNormalization';

/**
 * Fetch a Wikipedia article summary by title
 *
 * Used for recommendation cards, search results, and article previews.
 * Automatically normalizes the title and handles redirects.
 *
 * @param title - The Wikipedia article title (e.g., "Albert Einstein")
 * @returns Promise resolving to an ArticleResponse containing the article data or an error message
 *
 * @example
 * ```ts
 * const response = await fetchArticleSummary("Albert Einstein");
 * if (response.article) {
 *   console.log(response.article.title);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export const fetchArticleSummary = async (title: string): Promise<ArticleResponse> => {
  try {
    const cleanTitle = normalizeWikipediaTitle(title);

    const response = await restAxiosInstance.get<Article>(
      `/page/summary/${encodeURIComponent(cleanTitle)}`,
      {
        baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
        // Uses centralized 8s timeout from axiosInstance
      }
    );

    return { article: response.data };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        return { article: null, error: `Article "${title}" not found` };
      } else if (error.code === 'ECONNABORTED') {
        return { article: null, error: 'Request timeout' };
      } else if (error.response?.status && error.response.status >= 500) {
        return { article: null, error: 'Server error' };
      }
    }

    return { article: null, error: 'Failed to load article' };
  }
};
