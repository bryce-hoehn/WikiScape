import React, { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { SPACING } from '../../constants/spacing';
import { useReducedMotion } from '../../hooks';
import { RecommendationItem } from '../../types/components';
import { CardType, getCardComponent } from '../../utils/cardUtils';

interface FeaturedCarouselProps {
  items: RecommendationItem[];
  cardType?: CardType;
}

export default function FeaturedCarousel({
  items,
  cardType = 'generic',
}: FeaturedCarouselProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const carouselRef = useRef<ICarouselInstance>(null);
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

  const cardWidth = containerWidth;

  const handlePrevious = () => {
    if (items.length === 0 || !carouselRef.current) return;
    carouselRef.current.prev({ animated: true });
  };

  const handleNext = () => {
    if (items.length === 0 || !carouselRef.current) return;
    carouselRef.current.next({ animated: true });
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

      const isOnThisDay = currentCardType === 'on-this-day';
      const cardHeight = isOnThisDay ? 460 : 420;
      const itemWidth = cardWidth - SPACING.sm; // Account for card shadows
      const totalHeight = cardHeight + SPACING.xs + (isOnThisDay ? SPACING.md : SPACING.sm);

      return (
        <View style={{ width: cardWidth, height: totalHeight, alignItems: 'center' }}>
          <CardComponent item={cardItem as any} theme={theme} itemWidth={itemWidth} />
        </View>
      );
    },
    [cardType, theme, cardWidth]
  );

  // Calculate carousel height based on card type
  // Regular: 420 + 4 + 8 = 432px, On-this-day: 460 + 4 + 12 = 476px
  const isOnThisDay = cardType === 'on-this-day';
  const maxCardHeight = isOnThisDay ? 460 : 420;
  const maxTotalHeight = maxCardHeight + SPACING.xs + (isOnThisDay ? SPACING.md : SPACING.sm);
  const carouselHeight = maxTotalHeight; // Match exact card height

  return (
    <View style={{ position: 'relative' }} onLayout={handleLayout}>
      <Carousel
        ref={carouselRef}
        width={cardWidth}
        height={carouselHeight}
        data={items}
        renderItem={renderItem}
        loop={true}
        enabled={!reducedMotion}
        autoPlay={false}
        scrollAnimationDuration={reducedMotion ? 0 : 300}
        onSnapToItem={setCurrentIndex}
      />

      {items.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm }}>
          <IconButton
            icon="chevron-left"
            iconColor={theme.colors.onSurfaceVariant}
            size={24}
            onPress={handlePrevious}
            style={{ margin: 0 }}
            accessibilityLabel="Previous item"
            accessibilityHint="Navigate to the previous featured item. Loops to the last item if at the beginning."
          />
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            {items.map((_, index) => (
              <View
                key={index}
                style={{
                  width: SPACING.sm,
                  height: SPACING.sm,
                  borderRadius: theme.roundness,
                  backgroundColor: index === currentIndex ? theme.colors.primary : theme.colors.surfaceVariant,
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
