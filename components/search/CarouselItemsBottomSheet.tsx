import { SPACING } from '@/constants/spacing';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, View, useWindowDimensions } from 'react-native';
import { Portal, Text, useTheme } from 'react-native-paper';
import { RecommendationItem } from '../../types/components';
import { CardType } from '../../utils/cardUtils';
import HorizontalFeaturedCard from '../featured/HorizontalFeaturedCard';

interface CarouselItemsBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  items: RecommendationItem[];
  cardType?: CardType;
}

/**
 * Bottom sheet that displays all carousel items
 * Per MD3 accessibility: allows users to view all items at once
 */
export default function CarouselItemsBottomSheet({
  visible,
  onDismiss,
  title,
  items,
  cardType = 'generic',
}: CarouselItemsBottomSheetProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<any>(null);
  const firstCardRef = useRef<View>(null);
  const lastCardRef = useRef<View>(null);
  const [firstCardCenter, setFirstCardCenter] = useState<number | null>(null);
  const [lastCardCenter, setLastCardCenter] = useState<number | null>(null);
  
  // Snap points for the bottom sheet (50% initial, 90% expanded)
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  const renderItem = useCallback(
    ({ item, index }: { item: RecommendationItem; index: number }) => {
      // For did-you-know cards, ensure html is present
      const cardItem =
        cardType === 'did-you-know' && !item.html
          ? ({ ...item, html: item.text || item.description || '' } as RecommendationItem)
          : item;

      return (
        <View
          style={{
            width: '100%',
            marginBottom: SPACING.lg,
          }}
        >
          <HorizontalFeaturedCard
            item={cardItem}
            index={index}
            cardType={cardType}
          />
        </View>
      );
    },
    [cardType]
  );

  const keyExtractor = useCallback((item: RecommendationItem, index: number) => {
    return item.title || `item-${index}`;
  }, []);

  // Backdrop component that closes the sheet when pressed
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      // Sheet is closed
      onDismiss();
    }
  }, [onDismiss]);

  // Open/close sheet based on visible prop
  React.useEffect(() => {
    if (!visible) {
      return;
    }
    
    // Use a small delay to ensure the bottom sheet is mounted and ready
    const timeoutId = setTimeout(() => {
      // Start at 50% (index 0), not fully expanded
      bottomSheetRef.current?.snapToIndex(0);
      // Reset scroll position to top when opening
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }, 100);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [visible]);

  // Handle Android back button - close bottom sheet instead of navigating back
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        // Close the bottom sheet when back button is pressed
        onDismiss();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [visible, onDismiss]);

  // Don't render the bottom sheet at all when not visible to prevent blocking touches
  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChanges}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.outlineVariant,
        }}
        backdropComponent={renderBackdrop}
        accessibilityViewIsModal={true}
      >
        <BottomSheetScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            paddingTop: SPACING.md, // Match Feed spacing
            paddingBottom: SPACING.lg, // Match Feed spacing
            paddingHorizontal: SPACING.base,
          }}
          accessibilityLabel={`${title} bottom sheet`}
        >
          {/* Title - placed under the handle indicator, left-aligned */}
          <View
            style={{
              paddingBottom: SPACING.base,
              alignItems: 'flex-start',
            }}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel={title}
            accessibilityLiveRegion="polite"
          >
            <Text
              variant="headlineSmall"
              style={{
                fontWeight: '700',
                color: theme.colors.onSurface,
                textAlign: 'left',
              }}
            >
              {title}
            </Text>
          </View>

          {/* Content */}
          {cardType === 'on-this-day' ? (
            (() => {
              const timelineLeft = SPACING.md; // Line position from container left
              const containerPadding = SPACING.base + 20; // Card container padding
              const dotRadius = 6; // Dot radius (12px / 2)
              const dotLeft = -(containerPadding - timelineLeft + dotRadius); // Position dot center on line
              
              return (
                <View style={{ position: 'relative', paddingLeft: containerPadding }}>
                  {/* Vertical timeline line - positioned between first and last dots */}
                  {firstCardCenter !== null && lastCardCenter !== null && (
                    <View
                      style={{
                        position: 'absolute',
                        left: timelineLeft,
                        top: firstCardCenter,
                        height: lastCardCenter - firstCardCenter,
                        width: 1,
                        backgroundColor: theme.colors.outlineVariant,
                        zIndex: 0, // Behind dots
                      }}
                    />
                  )}
                  
                  {/* Cards with timeline dots */}
                  {items.map((item, index) => {
                    const year = 'year' in item ? item.year : undefined;
                    const showYearHeader = year && (index === 0 || items[index - 1]?.year !== year);
                    const isFirst = index === 0;
                    const isLast = index === items.length - 1;

                    const handleYearPress = () => {
                      if (year) {
                        router.push(`/article/${encodeURIComponent(year)}`);
                      }
                    };

                    const handleCardLayout = (event: any) => {
                      const { y, height } = event.nativeEvent.layout;
                      const centerY = y + height / 2;
                      
                      if (isFirst) {
                        setFirstCardCenter(centerY);
                      }
                      if (isLast) {
                        setLastCardCenter(centerY);
                      }
                    };

                    return (
                      <React.Fragment key={keyExtractor(item, index)}>
                        {showYearHeader && (
                          <View
                            style={{
                              marginTop: index === 0 ? 0 : SPACING.lg,
                              marginBottom: SPACING.md,
                              paddingLeft: SPACING.base,
                            }}
                          >
                            <Text
                              variant="titleLarge"
                              onPress={handleYearPress}
                              style={{
                                fontWeight: 'bold',
                                color: theme.colors.primary,
                              }}
                            >
                              {year}
                            </Text>
                          </View>
                        )}
                        <View 
                          ref={isFirst ? firstCardRef : isLast ? lastCardRef : null}
                          onLayout={handleCardLayout}
                          style={{ position: 'relative', marginBottom: SPACING.lg }}
                        >
                          {/* Timeline dot - centered on the line */}
                          <View
                            style={{
                              position: 'absolute',
                              left: dotLeft,
                              top: '50%',
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: theme.colors.primary,
                              borderWidth: 2,
                              borderColor: theme.colors.surface,
                              zIndex: 2, // Above line
                              transform: [{ translateY: -6 }],
                            }}
                          />
                          {renderItem({ item, index })}
                        </View>
                      </React.Fragment>
                    );
                  })}
                </View>
              );
            })()
          ) : (
            items.map((item, index) => {
              return (
                <React.Fragment key={keyExtractor(item, index)}>
                  {renderItem({ item, index })}
                </React.Fragment>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </Portal>
  );
}

