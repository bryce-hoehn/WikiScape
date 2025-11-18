import { useQueries } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { fetchArticleSummary } from '../../api';
import { VisitedArticle } from '../../hooks/storage/useVisitedArticles';
import { Article } from '../../types/api';
import BaseListWithHeader from './BaseListWithHeader';

interface RecentArticlesListProps {
  recentVisitedArticles: VisitedArticle[];
  onSuggestionClick: (title: string) => void;
}

interface ArticleWithData extends VisitedArticle {
  article?: Article | null;
}

export default function RecentArticlesList({
  recentVisitedArticles,
  onSuggestionClick,
}: RecentArticlesListProps) {
  // Fetch only visible articles initially, lazy load others
  const VISIBLE_ITEMS = 5;

  // Memoize queries array to prevent React 19 strict mode crashes
  // Only fetch the first VISIBLE_ITEMS to improve initial load performance
  const queries = useMemo(
    () =>
      recentVisitedArticles.slice(0, VISIBLE_ITEMS).map((visited) => ({
        queryKey: ['article', visited.title] as const,
        queryFn: async () => {
          const response = await fetchArticleSummary(visited.title);
          return response.article;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        enabled: !!visited.title,
        refetchOnWindowFocus: false, // Don't refetch on focus
      })),
    [recentVisitedArticles]
  );

  // Fetch article summaries for visible articles only
  const articleQueries = useQueries({
    queries,
  });

  // Combine visited articles with their fetched data
  // Items beyond VISIBLE_ITEMS will have null article data (will show title only)
  const articlesWithData = useMemo(() => {
    return recentVisitedArticles.map((visited, index) => ({
      ...visited,
      // Only include article data for the first VISIBLE_ITEMS
      article: index < VISIBLE_ITEMS ? (articleQueries[index]?.data ?? null) : null,
    })) as ArticleWithData[];
  }, [recentVisitedArticles, articleQueries]);

  return (
    <BaseListWithHeader
      data={articlesWithData}
      headerTitle="Recently Viewed"
      getTitle={(item) => item.title}
      getDescription={(item) =>
        item.article?.description || item.article?.extract?.substring(0, 150) || ''
      }
      getThumbnail={(item) => item.article?.thumbnail?.source || null}
      getThumbnailDimensions={(item) =>
        item.article?.thumbnail
          ? {
              width: item.article.thumbnail.width || 56,
              height: item.article.thumbnail.height || 56,
            }
          : null
      }
      fallbackIcon="file-document-outline"
      onItemPress={(item) => onSuggestionClick(item.title)}
      keyExtractor={(item) => `recent-${item.title}-${item.visitedAt}`}
      accessibilityLabel={(item) => `Open recently viewed article: ${item.title}`}
      accessibilityHint={(item) => `Opens the recently viewed article: ${item.title}`}
    />
  );
}
