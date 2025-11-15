import React, { useCallback, useEffect, useState } from 'react';
import { useBacklinkRecommendations, useVisitedArticles } from '../../hooks';
import EmptyState from './EmptyState';
import Feed from './Feed';

export default function ForYouFeed() {
  const { getRecommendations } = useBacklinkRecommendations();
  const { visitedArticles, loading: visitedArticlesLoading } = useVisitedArticles();
  
  const [recommendations, setRecommendations] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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


  const loadRecommendations = useCallback(async (isRefresh = false) => {
    // Don't load if no visited articles or still loading
    if (visitedArticlesLoading || visitedArticles.length === 0) {
      return;
    }
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Request fewer recommendations initially for faster loading
      const recs = await getRecommendations(10);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getRecommendations, visitedArticles.length, visitedArticlesLoading]);

  const handleRefresh = useCallback(() => {
    loadRecommendations(true);
  }, [loadRecommendations]);

  const loadMore = useCallback(async () => {
    if (!loading && visitedArticles.length > 0) {
      setLoading(true);
      try {
        // Load fewer additional recommendations for faster response
        const newRecs = await getRecommendations(5);
        setRecommendations((prev: any[]) => {
          const combined = [...prev, ...newRecs];
          // Remove duplicates
          return combined.filter((rec, index, self) =>
            index === self.findIndex(r => r.title === rec.title)
          );
        });
      } catch (error) {
        console.error('Failed to load more recommendations:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [loading, getRecommendations, visitedArticles.length]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Show loading state while fetching recommendations
  if (loading && recommendations.length === 0) {
    return (
      <EmptyState
        icon="account-heart"
        title="Finding Recommendations"
        description="We're analyzing your reading history to find the perfect articles for you."
        showSpinner={true}
      />
    );
  }

  // Show welcome screen if no recommendations found (same as welcome for now)
  if (recommendations.length === 0 && !loading && visitedArticles.length > 0) {
    return <EmptyState />;
  }

  // Always render Feed component to ensure FAB is available
  return (
    <Feed
      data={recommendations}
      loading={loading}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      loadMore={loadMore}
      renderEmptyState={renderEmptyState}
      keyExtractor={(item: any) => `${item.title}-${item.thumbnail || 'no-thumb'}`}
    />
  );
}
