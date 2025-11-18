import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { PageViewResponse, TrendingArticle } from '@/types/api/featured';

/**
 * Fetches trending articles from Wikipedia using the Pageviews API
 */
export const fetchTrendingArticles = async (): Promise<TrendingArticle[]> => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const year = twoDaysAgo.getFullYear();
    const month = String(twoDaysAgo.getMonth() + 1).padStart(2, '0');
    const day = String(twoDaysAgo.getDate()).padStart(2, '0');

    const url = `/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`;

    const response = await axiosInstance.get<PageViewResponse>(url, {
      baseURL: WIKIPEDIA_API_CONFIG.WIKIMEDIA_PAGEVIEWS_BASE_URL,
      headers: {
        Accept: 'application/json',
      },
      params: {
        origin: '*',
      },
    });

    if (!response.data?.items?.[0]?.articles) {
      return [];
    }

    const articles = response.data.items[0].articles;

    const trendingArticles = articles.map((article, index) => {
      const rankScore = 100 - index; // Higher rank gets higher score
      const viewScore = Math.log(article.views + 1); // Log scale to normalize view counts
      const trendingRatio = rankScore * viewScore;

      return {
        ...article,
        trendingRatio,
        todayViews: article.views,
      };
    });

    // Sort by trending ratio (highest first) and return top articles
    return trendingArticles
      .filter((article) => article.trendingRatio > 0)
      .sort((a, b) => b.trendingRatio - a.trendingRatio);
  } catch (error: unknown) {
    // Re-throw error to be handled by caller
    throw error;
  }
};
