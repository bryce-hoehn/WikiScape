/**
 * Type definitions for Wikipedia featured content APIs
 */

import { Article } from './articles';
import { ImageThumbnail, WikipediaPageBase } from './base';

/**
 * Featured picture for UI components
 */
export interface FeaturedPicture {
  title: string;
  image: {
    source: string;
    width: number;
    height: number;
  };
  description: {
    html: string;
    text: string;
    lang: string;
  };
}

/**
 * Most Read interfaces
 */
export interface MostReadArticle extends Article {
  rank: number;
  view_history: {
    date: string;
    views: number;
  }[];
}

export interface MostRead {
  date: string;
  articles: MostReadArticle[];
}

/**
 * News interfaces
 */
export interface NewsItem {
  links: WikipediaPageBase[];
  story?: string;
}

/**
 * Did You Know interface
 */
export interface DidYouKnowItem {
  html: string;
}

/**
 * Image of the Day interface
 */
export interface ImageOfTheDay {
  title: string;
  thumbnail: {
    source: string;
    width: number;
    height: number;
  };
  image: ImageThumbnail[];
  file_page: string;
  artist: {
    html: string;
    text: string;
  };
  credit: {
    html: string;
    text: string;
  };
  license: {
    type: string;
    code: string;
    url: string;
  };
  description: {
    html: string;
    text: string;
    lang: string;
  };
  wb_entity_id: string;
  structured?: {
    captions: Record<string, string>;
  };
}

/**
 * On This Day interfaces
 */
export interface OnThisDayItem {
  text: string;
  year: number;
  pages: WikipediaPageBase[];
}

export interface FeaturedContentContextType {
  featuredContent: FeaturedContent | null;
  isLoading: boolean;
  error: string | null;
  refreshFeaturedContent: () => Promise<void>;
}

/**
 * Represents the Wikimedia Featured Feed API response
 */
export interface FeaturedContent {
  tfa: Article;
  news: NewsItem[];
  dyk: DidYouKnowItem[];
  onthisday: OnThisDayItem[];
  image: FeaturedPicture;
  mostread?: {
    date: string;
    articles: Article[];
  };
}

/**
 * Response from fetchFeaturedContent API
 */
export interface FeaturedContentResponse {
  data: FeaturedContent | null;
  error?: string;
}

/**
 * Trending article from Wikipedia Pageviews API
 */
export interface TrendingArticle {
  article: string;
  rank: number;
  views: number;
  trendingRatio?: number;
  todayViews?: number;
  lastMonthAvg?: number;
}

/**
 * Page view response from Wikipedia Pageviews API
 */
export interface PageViewResponse {
  items: {
    access: string;
    articles: TrendingArticle[];
    day: string;
    month: string;
    project: string;
    year: string;
  }[];
}
