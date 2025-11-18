import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';

interface BacklinkResponse {
  query: {
    pages: {
      [pageId: string]: {
        pageid: number;
        ns: number;
        title: string;
        linkshere?: {
          pageid: number;
          ns: number;
          title: string;
        }[];
      };
    };
  };
}

/**
 * Fetches articles that link to a given article (backlinks)
 * This provides highly relevant recommendations based on article relationships
 */
export const fetchArticleBacklinks = async (articleTitle: string): Promise<string[]> => {
  try {
    const response = await axiosInstance.get<BacklinkResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params: {
        action: 'query',
        prop: 'linkshere',
        titles: articleTitle,
        lhlimit: 50, // Get up to 50 backlinks
        lhnamespace: 0, // Only main namespace articles
        format: 'json',
        origin: '*',
      },
    });

    const pages = response.data.query?.pages;
    if (!pages) {
      return [];
    }

    // Extract backlink titles from the first page
    const page = Object.values(pages)[0];
    const backlinks = page?.linkshere || [];

    // Filter out unwanted pages and return titles
    return backlinks
      .filter((backlink) => {
        const title = backlink.title;
        return !(
          title === 'Main_Page' ||
          title.startsWith('Special:') ||
          title.startsWith('File:') ||
          title.startsWith('Category:') ||
          title.startsWith('Template:') ||
          title.startsWith('Help:') ||
          title.startsWith('Portal:') ||
          title.startsWith('Wikipedia:')
        );
      })
      .map((backlink) => backlink.title);
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(
        `Failed to fetch backlinks for ${articleTitle}:`,
        (error as { response?: { status?: number; data?: unknown } }).response?.status,
        (error as { response?: { data?: unknown } }).response?.data || error
      );
    }
    return [];
  }
};
