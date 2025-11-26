import { useFocusEffect } from '@react-navigation/native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, View, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { LAYOUT } from '../../constants/layout';
import { SPACING } from '../../constants/spacing';
import { useFeedScroll } from '../../context/FeedScrollContext';
import { useScrollToTop } from '../../context/ScrollToTopContext';
import { useBookmarkToggle, useImagePrefetching } from '../../hooks';
import { FeedProps, RecommendationItem } from '../../types/components';
import RecommendationCard from '../article/RecommendationCard';
import CardSkeleton from '../common/CardSkeleton';
import ScrollToTopMiniFAB from '../common/ScrollToTopMiniFAB';
import SearchFAB from '../common/SearchFAB';
import LoadingFooter from './LoadingFooter';

export default function Feed({
  data,
  loading,
  refreshing,
  onRefresh,
  loadMore,
  renderEmptyState,
  keyExtractor,
  renderItem,
  feedKey,
  scrollY,
}: FeedProps & { feedKey?: string; scrollY?: Animated.Value }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const flashListRef = useRef<FlashListRef<RecommendationItem>>(null);
  const { handleBookmarkToggle, isBookmarked } = useBookmarkToggle();
  const { saveScrollPosition, getScrollPosition } = useFeedScroll();
  const { registerScrollRef, shouldScrollOnFocus, markFocused } = useScrollToTop();
  const [fabVisible, setFabVisible] = useState(false);
  const hasRestoredScrollRef = useRef(false);
  
  // Image prefetching: Prefetch images for items about to become visible
  const { onViewableItemsChanged } = useImagePrefetching({
    data,
    getImageUrl: (item: RecommendationItem) => item?.thumbnail?.source,
    preferredWidth: 800, // Standard width for feed images
  });

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50, // Item is considered visible when 50% is shown
    minimumViewTime: 100, // Minimum time item must be visible (ms)
  }).current;
  
  // Use refs to prevent infinite loops from context function changes
  const saveScrollPositionRef = React.useRef(saveScrollPosition);
  
  React.useEffect(() => {
    saveScrollPositionRef.current = saveScrollPosition;
  }, [saveScrollPosition]);

  // Create a stable fallback Animated.Value to prevent creating new values on every render
  // This is critical for preventing crashes on web
  const fallbackScrollY = React.useRef<Animated.Value>(new Animated.Value(0));
  const scrollYValue = scrollY || fallbackScrollY.current;

  // Create a stable scroll handler to prevent crashes on web
  // On web, use direct handler instead of Animated.event to avoid issues
  const handleScroll = React.useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      try {
        const yOffset = event.nativeEvent.contentOffset.y;
        setFabVisible(yOffset > 300);
        
        // Update animated value if provided
        if (scrollYValue) {
          scrollYValue.setValue(yOffset);
        }
        
        // Save scroll position on web - use ref to prevent stale closures
        if (Platform.OS === 'web' && feedKey) {
          saveScrollPositionRef.current(feedKey, yOffset);
        }
      } catch (error) {
        // Silently handle errors to prevent crashes
        if (__DEV__) {
          console.error('Error in scroll handler:', error);
        }
      }
    },
    [feedKey, scrollYValue]
  );

  // Calculate content width - centered on large screens, but narrower for cards
  // Account for left gutter (88px) + drawer (360px) = 448px and right sidebar (480px) on large screens
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT; // Use MD3 desktop breakpoint
  const leftOffset = isLargeScreen ? 448 : 0; // gutter + drawer
  const rightOffset = isLargeScreen ? 480 : 0; // sidebar
  const availableWidth = width - leftOffset - rightOffset;

  const maxCardWidth = 650; // Reduced from 800 to 650 for tighter, more focused feed (Bluesky-like)
  const contentWidth = Math.min(availableWidth, maxCardWidth);
  const horizontalPadding =
    availableWidth > maxCardWidth ? (availableWidth - maxCardWidth) / 2 : SPACING.base;
  // Card width: on large screens use maxCardWidth, on small screens use availableWidth minus padding
  const cardWidth =
    availableWidth > maxCardWidth ? maxCardWidth : availableWidth - SPACING.base * 2; // SPACING.base padding on each side

  const defaultRenderItem = useCallback(
    ({ item, index }: { item: RecommendationItem; index: number }) => (
      <View
        style={{
          marginBottom: SPACING.lg, // Increased from SPACING.base (16dp) to SPACING.lg (24dp) for more breathing room
          width: cardWidth,
          alignSelf: 'center',
        }}
      >
        <RecommendationCard
          item={item}
          index={index}
          isBookmarked={isBookmarked}
          onBookmarkToggle={handleBookmarkToggle}
        />
      </View>
    ),
    [isBookmarked, handleBookmarkToggle, cardWidth]
  );

  const renderFooter = useCallback(
    () => <LoadingFooter loading={loading && data.length > 0} />,
    [loading, data.length]
  );

  // Render skeleton loaders when initial loading
  const renderSkeletonItem = useCallback(
    ({ index }: { index: number }) => (
      <View
        style={{
          marginBottom: SPACING.lg, // Increased from SPACING.base (16dp) to SPACING.lg (24dp)
          width: cardWidth,
          alignSelf: 'center',
        }}
      >
        <CardSkeleton index={index} />
      </View>
    ),
    [cardWidth]
  );

  // Register scroll ref for scroll-to-top functionality
  // Use refs to prevent infinite loops from context function changes
  const feedKeyRef = React.useRef(feedKey);
  const registerScrollRefRef = React.useRef(registerScrollRef);
  const shouldScrollOnFocusRef = React.useRef(shouldScrollOnFocus);
  const markFocusedRef = React.useRef(markFocused);
  const getScrollPositionRef = React.useRef(getScrollPosition);

  React.useEffect(() => {
    feedKeyRef.current = feedKey;
    registerScrollRefRef.current = registerScrollRef;
    shouldScrollOnFocusRef.current = shouldScrollOnFocus;
    markFocusedRef.current = markFocused;
    getScrollPositionRef.current = getScrollPosition;
  }, [feedKey, registerScrollRef, shouldScrollOnFocus, markFocused, getScrollPosition]);

  useEffect(() => {
    if (feedKeyRef.current) {
      registerScrollRefRef.current(feedKeyRef.current, {
        scrollToTop: () => {
          if (flashListRef.current) {
            flashListRef.current.scrollToOffset({ offset: 0, animated: true });
          }
        },
      });
    }
  }, []); // Empty dependencies - only run once per component mount

  useFocusEffect(
    useCallback(() => {
      if (feedKeyRef.current) {
        // Check if this route was already focused before (user is returning to it)
        const wasAlreadyFocused = shouldScrollOnFocusRef.current(feedKeyRef.current);

        // Mark this route as focused for future checks
        markFocusedRef.current(feedKeyRef.current);

        // If this route was already focused before, scroll to top
        // This handles the case where user navigates to the same tab again
        if (wasAlreadyFocused && flashListRef.current) {
          // Small delay to ensure the list is ready
          setTimeout(() => {
            flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        }
      }
    }, [])
  );

  // Restore scroll position when component mounts (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && feedKeyRef.current && !hasRestoredScrollRef.current && data.length > 0) {
      const savedPosition = getScrollPositionRef.current(feedKeyRef.current);
      if (savedPosition !== undefined && flashListRef.current) {
        // Use setTimeout to ensure FlashList is ready
        setTimeout(() => {
          flashListRef.current?.scrollToOffset({ offset: savedPosition, animated: false });
          hasRestoredScrollRef.current = true;
        }, 100);
      } else {
        hasRestoredScrollRef.current = true;
      }
    }
  }, [data.length]);

  // Show skeletons when loading and no data
  if (loading && data.length === 0) {
    return (
      <View
        style={{ flex: 1 }}
        // @ts-expect-error - main role is valid for React Native Web but not in TypeScript types
        accessibilityRole="main"
        {...(Platform.OS === 'web' && feedKey === 'for-you' && { id: 'main-content' })}
      >
        <FlashList
          ref={flashListRef}
          data={Array(15).fill(null)} // Show 15 skeleton cards for better perceived performance
          renderItem={renderSkeletonItem}
          keyExtractor={(_, index) => `skeleton-${index}`}
          {...({ estimatedItemSize: 280 } as any)}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: SPACING.md, // Increased from SPACING.sm (8dp) to SPACING.md (12dp)
            paddingBottom: SPACING.lg, // Increased from SPACING.base (16dp) to SPACING.lg (24dp)
            paddingHorizontal: horizontalPadding,
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
          onScroll={Platform.OS === 'web' ? handleScroll : Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollYValue } } }],
            {
              useNativeDriver: false, // Required for scroll position tracking
              listener: handleScroll,
            }
          )}
          scrollEventThrottle={16}
        />
        <ScrollToTopMiniFAB scrollRef={flashListRef} visible={fabVisible} />
        <SearchFAB />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1 }}
      // @ts-expect-error - main role is valid for React Native Web but not in TypeScript types
      accessibilityRole="main"
      {...(Platform.OS === 'web' &&
        feedKey === 'for-you' && {
          id: 'main-content',
          tabIndex: -1,
        })}
    >
      <FlashList
        ref={flashListRef}
        data={data}
        renderItem={renderItem || defaultRenderItem}
        keyExtractor={keyExtractor}
        {...({
          estimatedItemSize: 280,
          initialNumToRender: 15, // Preload 15 items initially
          windowSize: 10, // Render 10 screens worth of items
          drawDistance: 500, // Start rendering items 500px before they're visible
        } as any)}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: SPACING.md, // Increased from SPACING.sm (8dp) to SPACING.md (12dp)
          paddingBottom: SPACING.lg, // Increased from SPACING.base (16dp) to SPACING.lg (24dp)
          paddingHorizontal: horizontalPadding,
          alignItems: 'center',
          ...(data.length === 0 && {
            justifyContent: 'center',
          }),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Platform.OS === 'web' ? handleScroll : Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollYValue } } }],
          {
            useNativeDriver: false, // Required for scroll position tracking
            listener: handleScroll,
          }
        )}
        scrollEventThrottle={16}
      />
      <ScrollToTopMiniFAB scrollRef={flashListRef} visible={fabVisible} />
      <SearchFAB />
    </View>
  );
}
