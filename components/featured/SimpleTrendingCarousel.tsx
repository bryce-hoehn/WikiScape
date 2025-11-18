import { FlashList } from '@shopify/flash-list';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Card, List, useTheme } from 'react-native-paper';
import TrendingListItem from './TrendingListItem';

interface SimpleTrendingCarouselProps {
  memoizedPages: any[][];
  itemWidth: number;
  itemsPerPage: number;
  onPageChange: (index: number) => void;
  currentPage: number;
}

const SimpleTrendingCarousel = React.forwardRef<any, SimpleTrendingCarouselProps>(
  ({ memoizedPages, itemWidth, itemsPerPage, onPageChange, currentPage }, ref) => {
    const theme = useTheme();
    const flashListRef = useRef<any>(null);

    // Expose scrollToIndex method via ref
    React.useImperativeHandle(ref, () => ({
      scrollToIndex: (params: { index: number; animated?: boolean }) => {
        flashListRef.current?.scrollToIndex(params);
      },
    }));

    // Scroll to page when currentPage changes externally
    useEffect(() => {
      if (flashListRef.current && currentPage !== undefined) {
        flashListRef.current.scrollToIndex({ index: currentPage, animated: true });
      }
    }, [currentPage]);

    // Fixed height to match carousel cards (410px)
    const containerHeight = 410;

    const renderPage = ({ item: pageItems, index: pageIndex }: { item: any[]; index: number }) => {
      // Account for padding when calculating card width
      const cardWidth = itemWidth - 12; // 4px left + 8px right padding
      
      return (
        <View 
          style={{ width: itemWidth, height: containerHeight + 8, paddingLeft: 4, paddingRight: 8, paddingBottom: 4 }}
        >
          <Card
            elevation={2}
            style={{
              width: cardWidth,
              height: containerHeight + 8, // Slightly taller to accommodate padding (418px total)
              backgroundColor: theme.colors.elevation.level2,
              borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
              overflow: 'hidden',
            }}
            contentStyle={{
              padding: 0,
              paddingBottom: 0, // No padding, List.Section handles all spacing
              height: containerHeight + 8,
            }}
          >
          <List.Section
            style={{
              height: containerHeight + 8, // Match Card height to accommodate content + padding
              backgroundColor: 'transparent',
              paddingVertical: 0,
              paddingTop: 0, // Remove any default top padding
              paddingBottom: 10, // Padding to prevent last item from being cut off (418px - 10px = 408px for content)
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
    };

    return (
      <FlashList
        ref={flashListRef}
        data={memoizedPages}
        renderItem={renderPage}
        keyExtractor={(item, index) => `page-${index}`}
        {...({ estimatedItemSize: itemWidth } as any)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        pagingEnabled
        contentContainerStyle={{
          backgroundColor: theme.colors.background,
        }}
        style={{ backgroundColor: theme.colors.background }}
        onMomentumScrollEnd={(event) => {
          const pageIndex = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
          onPageChange(pageIndex);
        }}
      />
    );
  }
);

SimpleTrendingCarousel.displayName = 'SimpleTrendingCarousel';

export default SimpleTrendingCarousel;
