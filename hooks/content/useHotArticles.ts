import { fetchArticleSummary } from '@/api';
import { RecommendationItem } from '@/types/components';
import { useQueries } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface TrendingArticle {
  article: string;
}

const ITEMS_PER_PAGE = 50;

function filterUnwantedArticles(articles: TrendingArticle[]): TrendingArticle[] {
  return articles.filter((article) => {
    const title = article.article;
    return !(
      title === 'Main_Page' ||
      title.startsWith('Special:') ||
      title.startsWith('File:') ||
      title.startsWith('Category:') ||
      title.startsWith('Template:') ||
      title.startsWith('Help:') ||
      title.startsWith('Portal:') ||
      title.startsWith('Wikipedia:')
    );
  });
}

export default function useHotArticles(trendingArticles: TrendingArticle[]) {
  const [allTrendingArticles, setAllTrendingArticles] = useState<RecommendationItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayedTitles = useMemo(() => {
    const endIndex = (currentPage + 1) * ITEMS_PER_PAGE;
    return allTrendingArticles.slice(0, endIndex).map((a) => a.title);
  }, [allTrendingArticles, currentPage]);

  const articleQueries = useQueries({
    queries: displayedTitles.map((title) => ({
      queryKey: ['article', title],
      queryFn: async () => {
        const response = await fetchArticleSummary(title);
        if (response.article) {
          return {
            title: response.article.title,
            description: response.article.description,
            extract: response.article.extract,
            thumbnail: response.article.thumbnail,
            pageid: response.article.pageid,
          } as RecommendationItem;
        }
        return null;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      enabled: !!title,
      refetchOnWindowFocus: false, // Don't refetch on focus
    })),
  });

  const isArticleComplete = useCallback((article: RecommendationItem | null): boolean => {
    return !!(
      article &&
      article.title &&
      article.title !== '' &&
      (article.description !== undefined || article.extract !== undefined)
    );
  }, []);

  const displayedArticles = useMemo(() => {
    return articleQueries
      .map((query) => query.data ?? null)
      .filter((article): article is RecommendationItem => isArticleComplete(article));
  }, [articleQueries, isArticleComplete]);

  useEffect(() => {
    if (trendingArticles.length > 0 && allTrendingArticles.length === 0) {
      const filteredArticles = filterUnwantedArticles(trendingArticles);
      const basicArticles: RecommendationItem[] = filteredArticles.map((article) => ({
        title: article.article,
      }));

      setAllTrendingArticles(basicArticles);
      setCurrentPage(1);
    }
  }, [trendingArticles, allTrendingArticles.length]);

  const loadMore = useCallback(async () => {
    if (allTrendingArticles.length === 0 || loadingMore) return;

    const nextPage = currentPage + 1;
    const startIndex = nextPage * ITEMS_PER_PAGE;

    if (startIndex >= allTrendingArticles.length) {
      return;
    }

    setLoadingMore(true);
    setCurrentPage(nextPage);

    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }

    loadMoreTimeoutRef.current = setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 100);
  }, [allTrendingArticles.length, currentPage, loadingMore]);

  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  const isLoadingInitial = allTrendingArticles.length > 0 && displayedArticles.length === 0;
  const isLoading = articleQueries.some((query) => query.isLoading);

  return {
    displayedArticles,
    loadingMore: loadingMore || isLoadingInitial || isLoading,
    loadMore,
    hasMore: currentPage * ITEMS_PER_PAGE < allTrendingArticles.length,
  };
}
