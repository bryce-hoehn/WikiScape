import { actionAxiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { WikipediaPage, WikipediaQueryResponse } from '@/types/api/base';

/**
 * Fetch categories for a specific article using Wikipedia API
 */
export async function fetchArticleCategories(articleTitle: string): Promise<string[]> {
  try {
    const params = {
      action: 'query',
      prop: 'categories',
      titles: articleTitle,
      cllimit: 10, // Limit to 10 categories per article
      format: 'json',
      origin: '*',
    };

    const response = await actionAxiosInstance.get<WikipediaQueryResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params,
    });
    const data = response.data;

    if (!data.query || !data.query.pages) {
      return [];
    }

    const categories: string[] = [];
    const page = Object.values(data.query.pages)[0] as WikipediaPage | undefined;

    if (page?.categories) {
      page.categories.forEach((category: { title: string }) => {
        // Remove "Category:" prefix and add to list
        const categoryName = category.title.replace('Category:', '');
        categories.push(categoryName);
      });
    }

    return categories;
  } catch (error) {
    return [];
  }
}
