import { restAxiosInstance, WIKIPEDIA_API_CONFIG } from '../shared';

/**
 * Fetch full HTML content for a Wikipedia article using the Wikimedia Core API
 * Used for article detail pages where complete HTML with images is needed
 */
export const fetchArticleHtml = async (title: string): Promise<string | null> => {
  try {
    // Clean and normalize the title before encoding
    const cleanTitle = title
      .trim()
      .replace(/\s+/g, '_') // Replace spaces with underscores (Wikipedia format)
      .replace(/%20/g, '_') // Replace URL-encoded spaces with underscores
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    
    // Try Core API first (preferred for better HTML formatting)
    try {
      const response = await restAxiosInstance.get<string>(`/page/${encodeURIComponent(cleanTitle)}/html`, {
        baseURL: WIKIPEDIA_API_CONFIG.CORE_API_BASE_URL,
        headers: {
          'Accept': 'text/html'
        },
        timeout: 10000, // 10 second timeout
      });
      
      return response.data;
    } catch (coreError: any) {
      console.warn(`Core API failed for "${title}", trying REST API mobile-html fallback:`, coreError.response?.status);
      return null
    }
  } catch (error: any) {
    console.error('Failed to fetch article HTML:', title, error.response?.status, error.response?.data);
    
    // Provide more detailed error information
    if (error.response?.status === 404) {
      console.error(`Article not found: "${title}" - The page may not exist or the title format is incorrect`);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout while fetching article HTML');
    } else if (error.response?.status >= 500) {
      console.error('Server error while fetching article HTML');
    }
    
    return null;
  }
};