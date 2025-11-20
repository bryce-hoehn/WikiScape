import { PageInfo, RawSearchResult, SearchSuggestion } from '../../types/api';
import { actionAxiosInstance, WIKIPEDIA_API_CONFIG } from '../shared';

interface CombinedSearchResponse {
  query?: {
    search?: RawSearchResult[];
    pages?: Record<string, PageInfo>;
  };
}

/**
 * Fetch search suggestions from Wikipedia based on a query string
 *
 * Returns up to 10 search suggestions with titles, descriptions, and thumbnails.
 * Returns an empty array if the query is empty or if the request fails.
 *
 * @param query - The search query string
 * @returns Promise resolving to an array of SearchSuggestion objects
 *
 * @example
 * ```ts
 * const suggestions = await fetchSearchSuggestions("Einstein");
 * suggestions.forEach(s => console.log(s.title));
 * ```
 */
export const fetchSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  if (!query.trim()) return [];

  try {
    // Use Wikipedia Action API for search with page info in single request
    const params = {
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: 10,
      prop: 'pageimages|description',
      piprop: 'thumbnail',
      pithumbsize: 200,
      format: 'json',
      origin: '*',
    };

    const searchResponse = await actionAxiosInstance.get<CombinedSearchResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params,
    });
    const searchData = searchResponse.data;
    const results = searchData.query?.search || [];

    const pages = searchData.query?.pages || {};

    if (results.length === 0) return [];

    return results.map((result: RawSearchResult) => {
      const pageInfo = pages[result.pageid] || {};
      return {
        title: result.title,
        description: pageInfo.description || result.snippet?.replace(/<[^>]*>/g, '') || '',
        image: pageInfo.thumbnail?.source,
      };
    });
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to fetch search suggestions:', error);
    }
    return [];
  }
};
