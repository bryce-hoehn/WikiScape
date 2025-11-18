import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { FeaturedContent, FeaturedContentResponse } from '@/types/api/featured';

/**
 * Fetches featured content from Wikipedia using the Featured Feed API
 *
 * Retrieves today's featured article, picture of the day, "On This Day", news, and "Did You Know?" content.
 * Automatically falls back to the previous day's content if today's content is not available.
 *
 * @returns Promise resolving to a FeaturedContentResponse containing the featured content
 * @throws Error if content is not available for the current or previous day
 *
 * @example
 * ```ts
 * try {
 *   const response = await fetchFeaturedContent();
 *   console.log(response.data.tfa.title);
 * } catch (error) {
 *   console.error('Failed to fetch featured content');
 * }
 * ```
 */
export const fetchFeaturedContent = async (): Promise<FeaturedContentResponse> => {
  const tryFetchForDate = async (date: Date): Promise<FeaturedContent | null> => {
    // Use UTC date components to match Wikipedia API (which uses UTC dates)
    const formattedDate = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('/');

    const url = `/feed/v1/wikipedia/en/featured/${formattedDate}`;

    try {
      const response = await axiosInstance.get(url, {
        baseURL: WIKIPEDIA_API_CONFIG.WIKIMEDIA_BASE_URL,
        // Uses centralized 8s timeout from axiosInstance
        // origin=* is automatically added by axiosInstance interceptor
      });

      // Normalize the response: convert null arrays to empty arrays
      // The API sometimes returns null for news/dyk when they're not available
      const data = response.data;
      if (data) {
        // Handle both null and undefined (missing fields)
        // The API sometimes omits news/dyk entirely, or returns null
        const normalized = {
          ...data,
          news: data.news != null && Array.isArray(data.news) ? data.news : [],
          dyk: data.dyk != null && Array.isArray(data.dyk) ? data.dyk : [],
          onthisday: data.onthisday != null && Array.isArray(data.onthisday) ? data.onthisday : [],
        };
        return normalized;
      }

      return null;
    } catch (error: unknown) {
      if (
        (error as { response?: { status?: number }; code?: string }).response?.status === 504 ||
        (error as { code?: string }).code === 'ECONNABORTED'
      ) {
        return null;
      }
      throw error;
    }
  };

  try {
    // Use UTC date to avoid timezone issues - Wikipedia API uses UTC dates
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    let data = await tryFetchForDate(today);

    // If current day fails, try previous day
    if (!data) {
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      data = await tryFetchForDate(yesterday);
    }

    // If both fail, throw the original error
    if (!data) {
      throw new Error('Featured content not available for current or previous day');
    }

    return {
      data,
    };
  } catch (error: unknown) {
    // Re-throw error to be handled by caller
    throw error;
  }
};
