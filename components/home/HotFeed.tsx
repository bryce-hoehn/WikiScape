import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Animated } from 'react-native';
import useHotArticles from '../../hooks/content/useHotArticles';
import useTrendingArticles from '../../hooks/content/useTrendingArticles';
import { RecommendationItem } from '../../types/components';
import StandardEmptyState from '../common/StandardEmptyState';
import Feed from './Feed';

interface HotFeedProps {
  scrollY?: Animated.Value;
}

export default function HotFeed({ scrollY }: HotFeedProps) {
  const { data: trendingArticles = [], isLoading, refetch } = useTrendingArticles();
  const { displayedArticles, loadingMore, loadMore } = useHotArticles(trendingArticles);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderEmptyState = useCallback(() => {
    if (!displayedArticles || displayedArticles.length === 0) {
      return (
        <StandardEmptyState
          icon="trending-up"
          title="No Popular Articles"
          description="Unable to load popular articles at the moment. Try refreshing or check your connection."
          suggestions={[
            {
              label: 'Refresh',
              action: () => refetch(),
              icon: 'refresh',
            },
            {
              label: 'Browse Categories',
              action: () => router.push('/(tabs)/categories'),
              icon: 'folder-outline',
            },
            {
              label: 'Try Random Article',
              action: () => router.push('/(tabs)'),
              icon: 'shuffle',
            },
          ]}
        />
      );
    }

    return null;
  }, [displayedArticles, refetch]);

  const keyExtractor = useCallback(
    (item: RecommendationItem) =>
      `${item?.title || 'unknown'}-${item?.thumbnail?.source || 'no-thumb'}`,
    []
  );

  // Show loading state if initial load or if we have no complete articles yet
  const isInitialLoading = isLoading || (displayedArticles.length === 0 && loadingMore);

  return (
    <Feed
      data={displayedArticles}
      feedKey="hot"
      loading={isInitialLoading || loadingMore}
      refreshing={isLoading}
      onRefresh={handleRefresh}
      loadMore={loadMore}
      renderEmptyState={renderEmptyState}
      keyExtractor={keyExtractor}
      scrollY={scrollY}
    />
  );
}
