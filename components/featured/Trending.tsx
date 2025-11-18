import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';
import CardSkeleton from '../common/CardSkeleton';
import StandardEmptyState from '../common/StandardEmptyState';
import SimpleTrendingCarousel from './SimpleTrendingCarousel';

interface TrendingListProps {
  maxItemsPerPage?: number;
}

export default function TrendingList({ maxItemsPerPage = 6 }: TrendingListProps) {
  const { featuredContent, isLoading } = useFeaturedContent();
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const carouselRef = useRef<any>(null);
  const itemsPerPage = maxItemsPerPage;

  // Measure container width to adapt to grid layout
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      if (width > 0 && width !== containerWidth) {
        setContainerWidth(width);
      }
    },
    [containerWidth]
  );

  const itemWidth = containerWidth || 400; // Fallback width until measured

  // Calculate content items and pages before conditional returns
  const trendingArticles = useMemo(
    () => featuredContent?.mostread?.articles || [],
    [featuredContent?.mostread?.articles]
  );

  // Transform the articles data for the List
  const contentItems = useMemo(
    () =>
      trendingArticles.map((article: any, index: number) => ({
        id: article.pageid,
        title: article.title,
        normalizedTitle: article.titles.normalized,
        thumbnail: article.thumbnail?.source,
        description: article.description,
      })),
    [trendingArticles]
  );

  // Calculate pagination values
  const totalPages = Math.ceil(contentItems.length / itemsPerPage);

  // Create pages array for carousel
  const memoizedPages = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, pageIndex) => {
        const startIndex = pageIndex * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return contentItems.slice(startIndex, endIndex);
      }),
    [totalPages, contentItems, itemsPerPage]
  );

  const handlePageChange = (index: number) => {
    setCurrentPage(index);
  };

  const handlePrevious = () => {
    if (memoizedPages.length === 0) return;
    // Loop: if at first page, go to last page
    const newPage = currentPage === 0 ? memoizedPages.length - 1 : currentPage - 1;
    setCurrentPage(newPage);
    carouselRef.current?.scrollToIndex({ index: newPage, animated: true });
  };

  const handleNext = () => {
    if (memoizedPages.length === 0) return;
    // Loop: if at last page, go to first page
    const newPage = currentPage === memoizedPages.length - 1 ? 0 : currentPage + 1;
    setCurrentPage(newPage);
    carouselRef.current?.scrollToIndex({ index: newPage, animated: true });
  };

  // Handle loading state with skeletons
  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 8 }}>
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <View key={`skeleton-${index}`} style={{ marginBottom: 16 }}>
            <CardSkeleton index={index} />
          </View>
        ))}
      </View>
    );
  }

  // Handle case where featured content is not available
  if (trendingArticles.length === 0) {
    return (
      <StandardEmptyState
        icon="trending-up"
        title="No Trending Articles"
        description="No trending articles are available at this time."
      />
    );
  }

  // Calculate marginTop to match year header height + marginBottom
  // titleLarge typically has ~28px line height, plus SPACING.md (12px) marginBottom = ~40px
  const yearHeaderHeight = 28; // Approximate titleLarge line height
  const yearHeaderMargin = SPACING.md; // marginBottom from BaseFeaturedCard
  const marginTop = yearHeaderHeight + yearHeaderMargin;

  return (
    <View
      style={{
        position: 'relative',
        backgroundColor: theme.colors.background,
        width: '100%',
        marginTop: marginTop,
      }}
      onLayout={handleLayout}
    >
      <SimpleTrendingCarousel
        ref={carouselRef}
        memoizedPages={memoizedPages}
        itemWidth={itemWidth}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        currentPage={currentPage}
      />
      {memoizedPages.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: SPACING.xs, // Add margin to create gap between card and pagination
            paddingTop: SPACING.sm, // Increased to match On This Day spacing
            paddingBottom: 0,
            gap: SPACING.md,
          }}
        >
          <IconButton
            icon="chevron-left"
            iconColor={theme.colors.onSurfaceVariant}
            size={24}
            onPress={handlePrevious}
            style={{ margin: 0 }}
            accessibilityLabel="Previous page"
            accessibilityHint="Navigate to the previous page of trending articles. Loops to the last page if at the beginning."
          />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {memoizedPages.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: theme.roundness * 1, // 4dp equivalent (4dp * 1)
                  backgroundColor:
                    index === currentPage ? theme.colors.primary : theme.colors.surfaceVariant,
                }}
              />
            ))}
          </View>

          <IconButton
            icon="chevron-right"
            iconColor={theme.colors.onSurfaceVariant}
            size={24}
            onPress={handleNext}
            style={{ margin: 0 }}
            accessibilityLabel="Next page"
            accessibilityHint="Navigate to the next page of trending articles. Loops to the first page if at the end."
          />
        </View>
      )}
    </View>
  );
}
