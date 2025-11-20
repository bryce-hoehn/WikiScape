import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { fetchArticleSummariesBatch } from '../../api';
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

  // Batch fetch visible article summaries (much faster)
  const visibleTitles = useMemo(
    () => recentVisitedArticles.slice(0, VISIBLE_ITEMS).map((visited) => visited.title),
    [recentVisitedArticles]
  );

  const { data: summariesMap } = useQuery({
    queryKey: ['article-summaries-batch', visibleTitles.sort().join('|')],
    queryFn: () => fetchArticleSummariesBatch(visibleTitles),
    enabled: visibleTitles.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus
  });

  // Combine visited articles with their fetched data
  // Items beyond VISIBLE_ITEMS will have null article data (will show title only)
  const articlesWithData = useMemo(() => {
    return recentVisitedArticles.map((visited, index) => ({
      ...visited,
      // Only include article data for the first VISIBLE_ITEMS
      article: index < VISIBLE_ITEMS ? (summariesMap?.[visited.title] ?? null) : null,
    })) as ArticleWithData[];
  }, [recentVisitedArticles, summariesMap]);

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
