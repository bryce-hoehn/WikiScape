import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useSnackbar } from '../../context/SnackbarContext';
import { useBacklinkRecommendations, useVisitedArticles } from '../../hooks';
import EmptyState from './EmptyState';
import Feed from './Feed';

interface ForYouFeedProps {
  scrollY?: Animated.Value;
}

function ForYouFeed({ scrollY }: ForYouFeedProps) {
  const { getRecommendations } = useBacklinkRecommendations();
  const { visitedArticles, loading: visitedArticlesLoading } = useVisitedArticles();
  const { showError } = useSnackbar();

  const [recommendations, setRecommendations] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false); // Track loading state with ref to prevent infinite loops

  const renderEmptyState = useCallback(() => {
    if (recommendations.length === 0 && !loading) {
      return (
        <EmptyState
          icon="account-heart"
          title="No Recommendations Yet"
          description="Read some articles to get personalized recommendations."
        />
      );
    }
    return null;
  }, [recommendations.length, loading]);

  // Single consolidated loading function - use refs to prevent infinite loops
  const getRecommendationsRef = React.useRef(getRecommendations);
  const showErrorRef = React.useRef(showError);
  const visitedArticlesRef = React.useRef(visitedArticles);
  const visitedArticlesLoadingRef = React.useRef(visitedArticlesLoading);

  React.useEffect(() => {
    getRecommendationsRef.current = getRecommendations;
    showErrorRef.current = showError;
    visitedArticlesRef.current = visitedArticles;
    visitedArticlesLoadingRef.current = visitedArticlesLoading;
  }, [getRecommendations, showError, visitedArticles, visitedArticlesLoading]);

  const loadRecommendations = useCallback(
    async (isRefresh = false, isLoadMore = false) => {
      // Don't load if no visited articles or still loading (use ref to avoid dependency issues)
      if (
        visitedArticlesLoadingRef.current ||
        visitedArticlesRef.current.length === 0 ||
        isLoadingRef.current
      ) {
        return;
      }

      isLoadingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
        hasLoadedRef.current = false; // Allow reload on refresh
      } else {
        setLoading(true);
      }

      try {
        // Request 30 for initial load, 20 for load more
        const limit = isLoadMore ? 20 : 30;
        const recs = await getRecommendationsRef.current(limit);

        if (isLoadMore) {
          // Append and deduplicate for load more (optimized single-pass)
          setRecommendations((prev: any[]) => {
            const seen = new Set(prev.map((rec) => rec?.title).filter(Boolean));
            const newRecs = recs.filter((rec) => {
              if (!rec?.title) return false;
              if (seen.has(rec.title)) return false;
              seen.add(rec.title);
              return true;
            });
            return [...prev, ...newRecs];
          });
        } else {
          // Replace for initial load or refresh
          setRecommendations(recs);
        }

        hasLoadedRef.current = true;
      } catch (error) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Failed to load recommendations:', error);
        }
        showErrorRef.current('Failed to load recommendations. Please try again.');
        // Reset ref on error so it can retry
        if (!isRefresh && !isLoadMore) {
          hasLoadedRef.current = false;
        }
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [] // Empty dependencies - all values accessed via refs
  );

  const handleRefresh = useCallback(() => {
    loadRecommendations(true, false);
  }, [loadRecommendations]);

  const loadMore = useCallback(() => {
    loadRecommendations(false, true);
  }, [loadRecommendations]);

  // Single useEffect for initial load
  useEffect(() => {
    // Only load once when visited articles are ready
    if (!visitedArticlesLoading && visitedArticles.length > 0 && !hasLoadedRef.current) {
      loadRecommendations(false, false);
    }
    // Reset hasLoadedRef when visited articles change significantly
    if (visitedArticles.length === 0) {
      hasLoadedRef.current = false;
    }
  }, [visitedArticlesLoading, visitedArticles.length, loadRecommendations]);

  // Show welcome screen if no recommendations found and not loading
  // Feed component will handle skeleton loading when loading && data.length === 0
  return (
    <Feed
      data={recommendations}
      loading={loading || visitedArticlesLoading}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      loadMore={loadMore}
      renderEmptyState={renderEmptyState}
      keyExtractor={(item: any) => `${item.title}-${item.thumbnail || 'no-thumb'}`}
      feedKey="for-you"
      scrollY={scrollY}
    />
  );
}

export default React.memo(ForYouFeed);
