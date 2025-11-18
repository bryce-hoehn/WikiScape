import { fetchArticleSummary } from '@/api/articles';
import { fetchDescription } from '@/api/articles/fetchDescription';
import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { CategoryArticle, CategoryPagesResponse, CategorySubcategory } from '@/types/api';
import { CategoryMember, WikipediaActionApiParams, WikipediaQueryResponse } from '@/types/api/base';

/**
 * Fetch category pages with Wikipedia API compliance
 *
 * This function demonstrates proper mixed API usage:
 * - Uses Action API for category members (no REST equivalent)
 * - Uses REST API for article summaries (preferred for performance)
 * - Falls back to alternative methods if primary API fails
 *
 */
export const fetchCategoryPages = async (categoryTitle: string): Promise<CategoryPagesResponse> => {
  try {
    // Category members still requires Action API as REST API doesn't have equivalent

    // Fetch both articles and subcategories
    const params: WikipediaActionApiParams = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${categoryTitle}`,
      cmtype: 'page|subcat',
      cmlimit: 50, // Fetch more items to provide better recommendations
      format: 'json',
      origin: '*',
    };

    const response = await axiosInstance.get<WikipediaQueryResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params,
    });
    const data = response.data;

    if (!data.query || !data.query.categorymembers || data.query.categorymembers.length === 0) {
      return { articles: [], subcategories: [] };
    }

    const articles: CategoryArticle[] = [];
    const subcategories: CategorySubcategory[] = [];
    const articlePromises: Promise<void>[] = [];

    // Separate articles and subcategories
    for (const member of data.query.categorymembers as CategoryMember[]) {
      if (member.ns === 14) {
        // Subcategory namespace
        subcategories.push({
          title: member.title.replace('Category:', ''),
          description: '',
        });
      } else if (member.ns === 0) {
        // Main namespace (articles)
        // Process articles in parallel for better performance
        const articlePromise = (async () => {
          try {
            // Use REST API summary endpoint for thumbnails and descriptions
            const summaryUrl = `/page/summary/${encodeURIComponent(member.title)}`;
            const summaryResponse = await axiosInstance.get(summaryUrl, {
              baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
            });
            const summaryData = summaryResponse.data;

            articles.push({
              title: summaryData.title,
              description: summaryData.description || summaryData.extract?.substring(0, 150) || '',
              thumbnail: summaryData.thumbnail?.source || '',
              pageid: summaryData.pageid || member.pageid,
            });
          } catch (error) {
            // Fallback to original methods
            try {
              const articleResponse = await fetchArticleSummary(member.title);
              const description = await fetchDescription(member.title);

              articles.push({
                title: member.title,
                description: description || articleResponse?.article?.description || '',
                thumbnail: articleResponse?.article?.thumbnail?.source || '',
                pageid: member.pageid,
              });
            } catch (fallbackError) {
              // Add basic article info without description/thumbnail
              articles.push({
                title: member.title,
                description: '',
                thumbnail: '',
                pageid: member.pageid,
              });
            }
          }
        })();

        articlePromises.push(articlePromise);
      }
    }

    // Wait for all article details to be fetched
    await Promise.allSettled(articlePromises);

    return { articles, subcategories };
  } catch (error: unknown) {
    // Silently handle errors - return empty arrays
    return { articles: [], subcategories: [] };
  }
};
