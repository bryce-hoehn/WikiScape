import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { ArticleResponse } from '@/types/api/articles';

export const fetchRandomArticle = async (maxRetries = 3): Promise<ArticleResponse> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use Wikipedia REST API to get a random page summary
      const url = '/page/random/summary';
      const response = await axiosInstance.get(url, {
        baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
        validateStatus: (status) => status === 200, // Only accept 200 OK
        // Uses centralized 8s timeout from axiosInstance
      });

      const data = response.data;

      // Validate that we got a proper article with required fields
      if (!data.title || !data.extract) {
        continue; // Try again
      }

      return {
        article: data,
      };
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number };
        code?: string;
        message?: string;
      };

      // If it's a 404 or network error, retry
      if (axiosError.response?.status === 404 || axiosError.code === 'NETWORK_ERROR') {
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          continue;
        }
      }

      // For other errors or final attempt, return error
      return {
        article: null,
        error: 'Failed to load random article',
      };
    }
  }

  return {
    article: null,
    error: 'All retry attempts failed',
  };
};
