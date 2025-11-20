import { actionAxiosInstance, restAxiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { Article, ArticleResponse } from '@/types/api';
import { ImageThumbnail, WikipediaActionApiParams, WikipediaPage, WikipediaQueryResponse } from '@/types/api/base';
import { normalizeWikipediaTitle } from '@/utils/titleNormalization';

/**
 * Fetch a Wikipedia article summary by title
 *
 * Used for recommendation cards, search results, and article previews.
 * Automatically normalizes the title and handles redirects.
 *
 * @param title - The Wikipedia article title (e.g., "Albert Einstein")
 * @returns Promise resolving to an ArticleResponse containing the article data or an error message
 *
 * @example
 * ```ts
 * const response = await fetchArticleSummary("Albert Einstein");
 * if (response.article) {
 *   console.log(response.article.title);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export const fetchArticleSummary = async (title: string): Promise<ArticleResponse> => {
  try {
    const cleanTitle = normalizeWikipediaTitle(title);

    const response = await restAxiosInstance.get<Article>(
      `/page/summary/${encodeURIComponent(cleanTitle)}`,
      {
        baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
        // Uses centralized 8s timeout from axiosInstance
      }
    );

    return { article: response.data };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        return { article: null, error: `Article "${title}" not found` };
      } else if (error.code === 'ECONNABORTED') {
        return { article: null, error: 'Request timeout' };
      } else if (error.response?.status && error.response.status >= 500) {
        return { article: null, error: 'Server error' };
      }
    }

    return { article: null, error: 'Failed to load article' };
  }
};

/**
 * Batch fetch article summaries using Wikipedia Action API
 * Much faster than individual REST API calls
 * 
 * @param titles - Array of article titles to fetch summaries for
 * @returns Map of article title to Article object
 */
export const fetchArticleSummariesBatch = async (
  titles: string[]
): Promise<Record<string, Article | null>> => {
  if (titles.length === 0) {
    return {};
  }

  const results: Record<string, Article | null> = {};
  
  // Wikipedia API allows up to 50 titles per request
  const BATCH_SIZE = 50;
  const batches: string[][] = [];
  
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    batches.push(titles.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    try {
      const titlesParam = batch.map(t => normalizeWikipediaTitle(t)).join('|');
      const batchParams: WikipediaActionApiParams = {
        action: 'query',
        prop: 'pageimages|extracts|info',
        titles: titlesParam,
        piprop: 'thumbnail',
        pithumbsize: 300,
        pilimit: 50,
        exintro: true,
        explaintext: true,
        exlimit: 50,
        inprop: 'url',
        format: 'json',
        origin: '*',
      };

      const batchResponse = await actionAxiosInstance.get<WikipediaQueryResponse>('', {
        baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
        params: batchParams,
      });

      const pages = batchResponse.data.query?.pages;
      if (pages) {
        for (const page of Object.values(pages)) {
          const pageData = page as WikipediaPage & { 
            extract?: string; 
            thumbnail?: ImageThumbnail;
            canonicalurl?: string;
            fullurl?: string;
          };
          
          // Match by title (case-insensitive)
          const originalTitle = batch.find(
            t => normalizeWikipediaTitle(t) === pageData.title || t === pageData.title
          );
          
          if (originalTitle) {
            results[originalTitle] = {
              title: pageData.title,
              displaytitle: pageData.title,
              pageid: pageData.pageid,
              extract: pageData.extract,
              thumbnail: pageData.thumbnail,
              description: pageData.extract?.substring(0, 200),
              content_urls: pageData.canonicalurl || pageData.fullurl ? {
                desktop: { page: pageData.canonicalurl || pageData.fullurl || '' },
                mobile: { page: pageData.canonicalurl || pageData.fullurl || '' },
              } : undefined,
            };
          }
        }
      }
    } catch (error) {
      // If batch fails, mark all titles in this batch as failed
      for (const title of batch) {
        if (!(title in results)) {
          results[title] = null;
        }
      }
    }
  }

  return results;
};
