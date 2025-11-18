import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';
import { RecommendationItem } from '../../types/components';
import { CardType, getCardComponent } from '../../utils/cardUtils';

interface SimpleFeaturedCarouselProps {
  items: RecommendationItem[];
  cardType?: CardType;
}

export default function SimpleFeaturedCarousel({
  items,
  cardType = 'generic',
}: SimpleFeaturedCarouselProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const flashListRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(windowWidth);

  // Measure container width to account for padding
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      if (width > 0 && width !== containerWidth) {
        setContainerWidth(width);
      }
    },
    [containerWidth]
  );

  // Calculate dimensions: use measured container width instead of full window width
  const horizontalPadding = 0;
  const cardWidth = containerWidth - horizontalPadding * 2;
  // Item width matches card width for proper snap interval
  const itemWidth = cardWidth;

  const scrollToIndex = (index: number) => {
    if (flashListRef.current) {
      flashListRef.current.scrollToIndex({ index, animated: true });
      setCurrentIndex(index);
    }
  };

  const handlePrevious = () => {
    if (items.length === 0) return;
    // Loop: if at first item, go to last item
    const newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    if (items.length === 0) return;
    // Loop: if at last item, go to first item
    const newIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    scrollToIndex(newIndex);
  };

  // Select the appropriate card component based on cardType
  const renderItem = useCallback(
    ({ item, index }: { item: RecommendationItem; index: number }) => {
      const currentCardType = cardType || 'generic';
      const CardComponent = getCardComponent(currentCardType);

      // For did-you-know cards, ensure html is present
      const cardItem =
        currentCardType === 'did-you-know' && !item.html
          ? ({ ...item, html: item.text || item.description || '' } as RecommendationItem)
          : item;

      // On This Day cards have a year header above the card, so need extra height
      const needsExtraHeight = currentCardType === 'on-this-day';
      const wrapperHeight = needsExtraHeight ? 458 : 410; // ~48px for year header (titleLarge ~32px) + margin (12px) + bottom padding (4px)
      
      return (
        <View style={{ width: itemWidth, height: wrapperHeight, paddingLeft: 4, paddingRight: 8, paddingBottom: needsExtraHeight ? 8 : 4 }}>
          <CardComponent item={cardItem as any} theme={theme} itemWidth={cardWidth - 12} />
        </View>
      );
    },
    [cardType, theme, itemWidth, cardWidth]
  );

  return (
    <View
      style={{
        position: 'relative'
      }}
      onLayout={handleLayout}
    >
      <FlashList
        ref={flashListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${cardType}-${index}`}
        {...({ estimatedItemSize: itemWidth } as any)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingRight: (horizontalPadding || 0) + 8,
        }}
        style={{ height: 455 }} // Increased to accommodate On This Day cards with year header
        onMomentumScrollEnd={(event) => {
          if (items.length === 0) return;
          const index = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
          // Clamp index to valid range
          const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
          setCurrentIndex(clampedIndex);
        }}
      />

      {/* Page indicators and navigation controls */}
      {items.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: SPACING.xs,
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
            accessibilityLabel="Previous item"
            accessibilityHint="Navigate to the previous featured item. Loops to the last item if at the beginning."
          />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {items.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: theme.roundness * 1, // 4dp equivalent (4dp * 1)
                  backgroundColor:
                    index === currentIndex ? theme.colors.primary : theme.colors.surfaceVariant,
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
            accessibilityLabel="Next item"
            accessibilityHint="Navigate to the next featured item. Loops to the first item if at the end."
          />
        </View>
      )}
    </View>
  );
}
