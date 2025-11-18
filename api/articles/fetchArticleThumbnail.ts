import type { ImageThumbnail } from '@/types/api/base';
import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';

export const fetchArticleThumbnail = async (title: string): Promise<ImageThumbnail | null> => {
  try {
    // Use Wikipedia REST API to fetch page summary including thumbnail
    const url = `/page/summary/${encodeURIComponent(title)}`;
    const response = await axiosInstance.get(url, {
      baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
    });

    const data = response.data;

    // Check if thumbnail exists in the response
    if (data.thumbnail && data.thumbnail.source) {
      return data.thumbnail; // Return ImageThumbnail
    }

    return null;
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(
        `Error fetching thumbnail for ${title}:`,
        (error as { response?: { status?: number; data?: unknown } }).response?.status,
        (error as { response?: { data?: unknown } }).response?.data || error
      );
    }
    return null;
  }
};
