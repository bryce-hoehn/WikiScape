import { actionAxiosInstance, restAxiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { CategoryArticle, CategoryPagesResponse, CategorySubcategory } from '@/types/api';
import { CategoryMember, ImageThumbnail, WikipediaActionApiParams, WikipediaPage, WikipediaQueryResponse } from '@/types/api/base';

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

    const response = await actionAxiosInstance.get<WikipediaQueryResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params,
    });
    const data = response.data;

    if (!data.query || !data.query.categorymembers || data.query.categorymembers.length === 0) {
      return { articles: [], subcategories: [] };
    }

    const articles: CategoryArticle[] = [];
    const subcategories: CategorySubcategory[] = [];
    const articleMembers: CategoryMember[] = [];

    // Separate articles and subcategories
    for (const member of data.query.categorymembers as CategoryMember[]) {
      if (member.ns === 14) {
        // Subcategory namespace
        subcategories.push({
          title: member.title.replace('Category:', ''),
          description: '',
        });
      } else if (member.ns === 0) {
        // Main namespace (articles) - collect for parallel processing
        articleMembers.push(member);
      }
    }

    // Batch fetch article data using Action API (much faster than individual REST calls)
    if (articleMembers.length > 0) {
      const articleTitles = articleMembers.map((m) => m.title);
      // Wikipedia API allows up to 50 titles per request, so we may need to batch
      const BATCH_SIZE = 50;
      const batches: string[][] = [];
      
      for (let i = 0; i < articleTitles.length; i += BATCH_SIZE) {
        batches.push(articleTitles.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        try {
          const titlesParam = batch.join('|');
          const batchParams: WikipediaActionApiParams = {
            action: 'query',
            prop: 'pageimages|extracts',
            titles: titlesParam,
            piprop: 'thumbnail',
            pithumbsize: 300,
            pilimit: 50,
            exintro: true,
            explaintext: true,
            exlimit: 50,
            format: 'json',
            origin: '*',
          };

          const batchResponse = await actionAxiosInstance.get<WikipediaQueryResponse>('', {
            baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
            params: batchParams,
          });

          const pages = batchResponse.data.query?.pages;
          if (pages) {
            // Pages are keyed by pageid (as string) in the response
            for (const page of Object.values(pages)) {
              const pageData = page as WikipediaPage & { extract?: string; thumbnail?: ImageThumbnail };
              const member = articleMembers.find((m) => m.pageid === pageData.pageid || m.title === pageData.title);
              if (member) {
                articles.push({
                  title: pageData.title,
                  description: pageData.extract?.substring(0, 150) || '',
                  thumbnail: pageData.thumbnail?.source || '',
                  pageid: pageData.pageid || member.pageid,
                });
              }
            }
          }
        } catch (error) {
          // If batch fails, fall back to individual requests for this batch
          const batchMembers = articleMembers.filter((m) => batch.includes(m.title));
          for (const member of batchMembers) {
            try {
              const summaryUrl = `/page/summary/${encodeURIComponent(member.title)}`;
              const summaryResponse = await restAxiosInstance.get(summaryUrl, {
                baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
              });
              const summaryData = summaryResponse.data;

              articles.push({
                title: summaryData.title,
                description: summaryData.description || summaryData.extract?.substring(0, 150) || '',
                thumbnail: summaryData.thumbnail?.source || '',
                pageid: summaryData.pageid || member.pageid,
              });
            } catch (fallbackError) {
              // Return basic article info without description/thumbnail
              articles.push({
                title: member.title,
                description: '',
                thumbnail: '',
                pageid: member.pageid,
              });
            }
          }
        }
      }
    }

    return { articles, subcategories };
  } catch (error: unknown) {
    // Silently handle errors - return empty arrays
    return { articles: [], subcategories: [] };
  }
};
