import { PageInfo, RawSearchResult, SearchSuggestion } from '../../types/api';
import { actionAxiosInstance } from '../shared';

interface CombinedSearchResponse {
  query?: {
    search?: RawSearchResult[];
    pages?: Record<string, PageInfo>;
  };
}

export const fetchSearchSuggestions = async (
  query: string
): Promise<SearchSuggestion[]> => {
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
      origin: '*'
    };

    const searchResponse = await actionAxiosInstance.get<CombinedSearchResponse>('', { params });
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
    console.error('Failed to fetch search suggestions:', error);
    return [];
  }
};
