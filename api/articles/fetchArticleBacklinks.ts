import { actionAxiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';

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
  const results = await fetchArticleBacklinksBatch([articleTitle]);
  return results[articleTitle] || [];
};

/**
 * Fetches backlinks for multiple articles in a single API call using pipe character (|)
 * This follows Wikipedia's best practice of batching requests
 * 
 * @param articleTitles - Array of article titles to fetch backlinks for
 * @returns Map of article title to array of backlink titles
 */
export const fetchArticleBacklinksBatch = async (
  articleTitles: string[]
): Promise<Record<string, string[]>> => {
  if (articleTitles.length === 0) {
    return {};
  }

  try {
    // Batch multiple titles using pipe character (|) - Wikipedia best practice
    const titlesParam = articleTitles.join('|');

    const response = await actionAxiosInstance.get<BacklinkResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params: {
        action: 'query',
        prop: 'linkshere',
        titles: titlesParam,
        lhlimit: 50, // Get up to 50 backlinks per article
        lhnamespace: 0, // Only main namespace articles
        format: 'json',
        origin: '*',
      },
    });

    const pages = response.data.query?.pages;
    if (!pages) {
      return {};
    }

    // Process each page's backlinks
    const results: Record<string, string[]> = {};

    for (const page of Object.values(pages)) {
      const articleTitle = page.title;
      const backlinks = page.linkshere || [];

    // Filter out unwanted pages and return titles
      const filteredBacklinks = backlinks
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

      results[articleTitle] = filteredBacklinks;
    }

    return results;
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(
        `Failed to fetch backlinks batch:`,
        (error as { response?: { status?: number; data?: unknown } }).response?.status,
        (error as { response?: { data?: unknown } }).response?.data || error
      );
    }
    return {};
  }
};
