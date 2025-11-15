import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React, { useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import TrendingCarousel from './TrendingCarousel';
import TrendingEmptyState from './TrendingEmptyState';
import TrendingLoadingState from './TrendingLoadingState';
import TrendingPagination from './TrendingPagination';

export default function TrendingList() {
  const { featuredContent, isLoading } = useFeaturedContent();
  const [currentPage, setCurrentPage] = useState(0);
  const progress = useSharedValue(0);
  const itemsPerPage = 5;
  const { width: windowWidth } = useWindowDimensions();
  const itemWidth = windowWidth - 32;

  // Update progress value when currentPage changes
  useEffect(() => {
    progress.value = currentPage;
  }, [currentPage, progress]);

  // Calculate content items and pages before conditional returns
  const trendingArticles = useMemo(() =>
    featuredContent?.mostread?.articles || [],
    [featuredContent?.mostread?.articles]
  );
  
  // Transform the articles data for the List
  const contentItems = useMemo(() =>
    trendingArticles.map((article: any, index: number) => ({
      id: article.pageid,
      title: article.title,
      normalizedTitle: article.titles.normalized,
      thumbnail: article.thumbnail?.source,
      description: article.description
    })), [trendingArticles]
  );

  // Calculate pagination values
  const totalPages = Math.ceil(contentItems.length / itemsPerPage);
  
  // Create pages array for carousel
  const memoizedPages = useMemo(() =>
    Array.from({ length: totalPages }, (_, pageIndex) => {
      const startIndex = pageIndex * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return contentItems.slice(startIndex, endIndex);
    }), [totalPages, contentItems, itemsPerPage]
  );

  const handlePageChange = (index: number) => {
    setCurrentPage(index);
  };

  // Handle loading state
  if (isLoading) {
    return <TrendingLoadingState />;
  }

  // Handle case where featured content is not available
  if (trendingArticles.length === 0) {
    return <TrendingEmptyState />;
  }

  return (
    <View style={{ flex: 1 }}>
      <TrendingCarousel
        memoizedPages={memoizedPages}
        itemWidth={itemWidth}
        progress={progress}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
      
      <TrendingPagination
        progress={progress}
        data={memoizedPages}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </View>
  );
}
