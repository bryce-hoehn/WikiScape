import { actionAxiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';

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
  const results = await fetchArticleLinksBatch([articleTitle]);
  return results[articleTitle] || [];
};

/**
 * Fetches forward links for multiple articles in a single API call using pipe character (|)
 * This follows Wikipedia's best practice of batching requests
 * 
 * @param articleTitles - Array of article titles to fetch links for
 * @returns Map of article title to array of link titles
 */
export const fetchArticleLinksBatch = async (
  articleTitles: string[]
): Promise<Record<string, string[]>> => {
  if (articleTitles.length === 0) {
    return {};
  }

  try {
    // Batch multiple titles using pipe character (|) - Wikipedia best practice
    const titlesParam = articleTitles.join('|');

    const response = await actionAxiosInstance.get<LinksResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params: {
        action: 'query',
        prop: 'links',
        titles: titlesParam,
        pllimit: 50, // Get up to 50 forward links per article
        format: 'json',
        origin: '*',
      },
    });

    const pages = response.data.query?.pages;
    if (!pages) {
      return {};
    }

    // Process each page's links
    const results: Record<string, string[]> = {};
    
    for (const page of Object.values(pages)) {
      const articleTitle = page.title;
      const links = page.links || [];

    // Filter to only include main namespace articles (ns: 0) and exclude unwanted pages
      const filteredLinks = links
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

      results[articleTitle] = filteredLinks;
    }

    return results;
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(
        `Failed to fetch forward links batch:`,
        (error as { response?: { status?: number; data?: unknown } }).response?.status,
        (error as { response?: { data?: unknown } }).response?.data || error
      );
    }
    return {};
  }
};
