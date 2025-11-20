import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Card, List, useTheme } from 'react-native-paper';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { useReducedMotion } from '../../hooks';
import TrendingListItem from './TrendingListItem';

interface TrendingCarouselProps {
  ref?: React.Ref<any>;
  memoizedPages: any[][];
  itemWidth: number;
  itemsPerPage: number;
  onPageChange: (index: number) => void;
  currentPage: number;
}

// React 19: ref is now a regular prop, no need for forwardRef
function TrendingCarousel({
  ref,
  memoizedPages,
  itemWidth,
  itemsPerPage,
  onPageChange,
  currentPage,
}: TrendingCarouselProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const carouselRef = useRef<ICarouselInstance>(null);
  const actualCarouselIndexRef = useRef<number>(0);
  const previousPageRef = useRef<number>(currentPage);

  // Expose scrollToIndex method via ref with looping support
  React.useImperativeHandle(ref, () => ({
    scrollToIndex: (params: { index: number; animated?: boolean }) => {
      if (carouselRef.current && memoizedPages.length > 0) {
        const normalizedIndex = ((params.index % memoizedPages.length) + memoizedPages.length) % memoizedPages.length;
        const currentActualIndex = actualCarouselIndexRef.current;
        const targetIndex = normalizedIndex;
        
        // Calculate relative offset to ensure consistent scroll distance
        let offset = targetIndex - (currentActualIndex % memoizedPages.length);
        if (offset > memoizedPages.length / 2) {
          offset -= memoizedPages.length;
        } else if (offset < -memoizedPages.length / 2) {
          offset += memoizedPages.length;
        }
        
        const newIndex = currentActualIndex + offset;
        carouselRef.current.scrollTo({ index: newIndex, animated: params.animated ?? true });
      }
    },
  }));

    // Scroll to page when currentPage changes externally
    useEffect(() => {
      if (carouselRef.current && currentPage !== undefined && memoizedPages.length > 0) {
      const previousPage = previousPageRef.current;
      const pageDiff = currentPage - previousPage;
      
      // Use relative scrolling (next/prev) to maintain consistent animation speed
      // This ensures we always scroll by exactly 1 position, avoiding the carousel
      // choosing a closer copy of the target index in looped mode
      if (pageDiff === 1 || (pageDiff === -(memoizedPages.length - 1))) {
        // Moving forward (including wrap-around from last to first)
        carouselRef.current.next({ animated: true });
      } else if (pageDiff === -1 || (pageDiff === memoizedPages.length - 1)) {
        // Moving backward (including wrap-around from first to last)
        carouselRef.current.prev({ animated: true });
      } else if (pageDiff !== 0) {
        // For larger jumps (shouldn't happen with pagination buttons, but handle gracefully)
        const normalizedIndex = ((currentPage % memoizedPages.length) + memoizedPages.length) % memoizedPages.length;
        carouselRef.current.scrollTo({ index: normalizedIndex, animated: true });
      }
      
      previousPageRef.current = currentPage;
      }
    }, [currentPage, memoizedPages.length]);

    const containerHeight = 410;

    const renderPage = useCallback(
      ({ item: pageItems, index: pageIndex }: { item: any[]; index: number }) => {
        const cardWidth = itemWidth - 12;

        return (
          <View
            style={{
              width: itemWidth,
              height: containerHeight + 8,
              paddingLeft: 4,
              paddingRight: 8,
              paddingBottom: 4,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Card
              elevation={1} // M3: Default elevation 1dp
              style={{
                width: cardWidth,
                height: containerHeight + 8,
                backgroundColor: theme.colors.elevation.level2,
                borderRadius: theme.roundness * 3, // M3: 12dp corner radius (4dp * 3)
                overflow: 'hidden',
              }}
              contentStyle={{
                padding: 0,
                paddingBottom: 0,
                height: containerHeight + 8,
              }}
            >
              <List.Section
                style={{
                  height: containerHeight + 8,
                  backgroundColor: 'transparent',
                  paddingVertical: 0,
                  paddingTop: 0,
                  paddingBottom: 10,
                  marginTop: 0,
                  marginBottom: 0,
                }}
              >
                {pageItems.map((item: any, itemIndex: number) => {
                  const isFirst = itemIndex === 0;
                  const isLast = itemIndex === pageItems.length - 1;

                  return (
                    <TrendingListItem
                      key={item.id}
                      item={item}
                      itemIndex={itemIndex}
                      pageIndex={pageIndex}
                      itemsPerPage={itemsPerPage}
                      isFirst={isFirst}
                      isLast={isLast}
                    />
                  );
                })}
              </List.Section>
            </Card>
          </View>
        );
      },
      [itemWidth, containerHeight, itemsPerPage, theme]
    );

    return (
      <Carousel
        ref={carouselRef}
        width={itemWidth}
        height={containerHeight + 8}
        data={memoizedPages}
        renderItem={renderPage}
        loop={true}
        enabled={!reducedMotion}
        autoPlay={false}
        scrollAnimationDuration={reducedMotion ? 0 : 300}
        style={{ backgroundColor: theme.colors.background }}
        onSnapToItem={(index) => {
          actualCarouselIndexRef.current = index;
          const normalizedIndex = ((index % memoizedPages.length) + memoizedPages.length) % memoizedPages.length;
          onPageChange(normalizedIndex);
        }}
      />
    );
}

export default TrendingCarousel;
