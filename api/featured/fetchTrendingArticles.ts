import { restAxiosInstance } from '../shared';

interface TrendingArticle {
  article: string;
  rank: number;
  views: number;
  trendingRatio?: number;
  todayViews?: number;
  lastMonthAvg?: number;
}

interface PageViewResponse {
  items: {
    access: string;
    articles: TrendingArticle[];
    day: string;
    month: string;
    project: string;
    year: string;
  }[];
}

/**
 * Fetches trending articles from Wikipedia using the Pageviews API
 */
export const fetchTrendingArticles = async (): Promise<TrendingArticle[]> => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const year = twoDaysAgo.getFullYear()
    const month = String(twoDaysAgo.getMonth() + 1).padStart(2, '0')
    const day = String(twoDaysAgo.getDate()).padStart(2, '0')

    const url = `/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`;

    // Use the rate-limited REST API instance
    const response = await restAxiosInstance.get<PageViewResponse>(url, {
      baseURL: 'https://wikimedia.org/api/rest_v1',
      headers: {
        'Accept': 'application/json'
      }
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
      .filter(article => article.trendingRatio > 0)
      .sort((a, b) => b.trendingRatio - a.trendingRatio)
  } catch (error: any) {
    console.error('Failed to fetch trending articles:', error.response?.status, error.response?.data || error);
    throw error;
  }
};