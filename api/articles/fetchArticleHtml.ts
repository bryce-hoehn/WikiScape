import { restAxiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { isAxiosError } from '@/types/api/base';
import { normalizeWikipediaTitle } from '@/utils/titleNormalization';

/**
 * Fetch full HTML content for a Wikipedia article using the REST API
 *
 * Used for article detail pages where complete HTML with images is needed.
 * The REST API automatically handles redirects, so no redirect resolution is needed.
 *
 * @param title - The Wikipedia article title (e.g., "Albert Einstein")
 * @returns Promise resolving to the HTML string, or null if the article cannot be fetched
 *
 * @example
 * ```ts
 * const html = await fetchArticleHtml("Albert Einstein");
 * if (html) {
 *   // Render the HTML content
 * }
 * ```
 */
export const fetchArticleHtml = async (title: string): Promise<string | null> => {
  try {
    const cleanTitle = normalizeWikipediaTitle(title);

    // REST API automatically handles redirects, so we only need a single request
    const response = await restAxiosInstance.get<string>(
      `/page/html/${encodeURIComponent(cleanTitle)}`,
      {
        baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
        headers: {
          Accept: 'text/html',
        },
        // Uses centralized timeout from axiosInstance
      }
    );

    return response.data;
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      if (isAxiosError(error)) {
        console.error(
          'Failed to fetch article HTML:',
          title,
          error.response?.status,
          error.response?.data
        );

        if (error.response?.status === 404) {
          console.error(
            `Article not found: "${title}" - The page may not exist or the title format is incorrect`
          );
        } else if (error.code === 'ECONNABORTED') {
          console.error('Request timeout while fetching article HTML');
        } else if (error.response?.status && error.response.status >= 500) {
          console.error('Server error while fetching article HTML');
        }
      } else {
        console.error('Failed to fetch article HTML:', title, error);
      }
    }

    return null;
  }
};
