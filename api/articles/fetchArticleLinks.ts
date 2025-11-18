import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';

interface LinksResponse {
  query: {
    pages: {
      [pageId: string]: {
        pageid: number;
        ns: number;
        title: string;
        links?: {
          ns: number;
          title: string;
        }[];
      };
    };
  };
}

/**
 * Fetches articles that a given article links to (forward links)
 * This provides relevant recommendations based on article content relationships
 */
export const fetchArticleLinks = async (articleTitle: string): Promise<string[]> => {
  try {
    const response = await axiosInstance.get<LinksResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params: {
        action: 'query',
        prop: 'links',
        titles: articleTitle,
        pllimit: 50, // Get up to 50 forward links
        format: 'json',
        origin: '*',
      },
    });

    const pages = response.data.query?.pages;
    if (!pages) {
      return [];
    }

    // Extract link titles from the first page
    const page = Object.values(pages)[0];
    const links = page?.links || [];

    // Filter to only include main namespace articles (ns: 0) and exclude unwanted pages
    return links
      .filter((link) => {
        const title = link.title;
        return (
          link.ns === 0 && // Only main namespace articles
          !(
            title === 'Main_Page' ||
            title.startsWith('Special:') ||
            title.startsWith('File:') ||
            title.startsWith('Category:') ||
            title.startsWith('Template:') ||
            title.startsWith('Help:') ||
            title.startsWith('Portal:') ||
            title.startsWith('Wikipedia:')
          )
        );
      })
      .map((link) => link.title);
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(
        `Failed to fetch forward links for ${articleTitle}:`,
        (error as { response?: { status?: number; data?: unknown } }).response?.status,
        (error as { response?: { data?: unknown } }).response?.data || error
      );
    }
    return [];
  }
};
