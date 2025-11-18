import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';

export const fetchDescription = async (title: string): Promise<string | null> => {
  try {
    // Use the REST API summary endpoint to get the description
    const response = await axiosInstance.get(`/page/summary/${encodeURIComponent(title)}`, {
      baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
    });
    const summaryData = response.data;

    // Return the description or extract from the summary
    return summaryData.description || summaryData.extract || null;
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(
        `Failed to fetch description for "${title}":`,
        (error as { response?: { status?: number; data?: unknown } }).response?.status,
        (error as { response?: { data?: unknown } }).response?.data || error
      );
    }
    return null;
  }
};
