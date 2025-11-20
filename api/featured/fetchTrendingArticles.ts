import { restAxiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { PageViewResponse, TrendingArticle } from '@/types/api/featured';

/**
 * Fetches trending articles from Wikipedia using the Pageviews API
 * 
 * @param date - Optional date to fetch data for (defaults to today). 
 *               Pageviews API typically has complete data 2 days after the date.
 */
export const fetchTrendingArticles = async (date?: Date): Promise<TrendingArticle[]> => {
  try {
    const targetDate = date || new Date();
    const year = targetDate.getUTCFullYear();
    const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getUTCDate()).padStart(2, '0');

    const url = `/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`;

    const response = await restAxiosInstance.get<PageViewResponse>(url, {
      baseURL: WIKIPEDIA_API_CONFIG.WIKIMEDIA_PAGEVIEWS_BASE_URL,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.data?.items?.[0]?.articles) {
      return [];
    }

    const articles = response.data.items[0].articles;

    const trendingArticles = articles.map((article, index) => {
      const rankScore = 100 - index;
      const viewScore = Math.log(article.views + 1);
      const trendingRatio = rankScore * viewScore;

      return {
        ...article,
        trendingRatio,
        todayViews: article.views,
      };
    });

    return trendingArticles
      .filter((article) => article.trendingRatio > 0)
      .sort((a, b) => b.trendingRatio - a.trendingRatio);
  } catch (error: unknown) {
    throw error;
  }
};
