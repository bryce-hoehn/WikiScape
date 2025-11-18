import CollapsibleHeader from '@/components/common/CollapsibleHeader';
import SearchBar from '@/components/common/SearchBar';
import FeaturedArticleSection from '@/components/search/FeaturedArticleSection';
import FeaturedCarouselSection from '@/components/search/FeaturedCarouselSection';
import FeaturedContentError from '@/components/search/FeaturedContentError';
import FeaturedPictureSection from '@/components/search/FeaturedPictureSection';
import TrendingSection from '@/components/search/TrendingSection';
import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import { useFeaturedContent } from '@/context/FeaturedContentContext';
import { useScrollToTop } from '@/context/ScrollToTopContext';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_HEIGHT = 60;

export default function SearchScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { featuredContent, isLoading, error } = useFeaturedContent();
  const { registerScrollRef, scrollToTop } = useScrollToTop();
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const flashListRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const totalHeaderHeight = HEADER_HEIGHT + insets.top;
  const wasFocusedRef = useRef(false);

  // Register scroll ref for scroll-to-top functionality
  useEffect(() => {
    registerScrollRef('/(tabs)/search', {
      scrollToTop: () => {
        if (flashListRef.current) {
          flashListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      },
    });
  }, [registerScrollRef]);

  // Listen for tab press from bottom nav bar - scroll to top if already focused
  useFocusEffect(
    useCallback(() => {
      // If we were already focused before, this means the user pressed the tab again
      if (wasFocusedRef.current) {
        scrollToTop('/(tabs)/search');
      }
      // Mark as focused for next time
      wasFocusedRef.current = true;
    }, [scrollToTop])
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/article/${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery]);

  // Calculate responsive grid columns - max 2 columns due to larger content sections
  const numColumns = useMemo(() => (width >= LAYOUT.DESKTOP_BREAKPOINT ? 2 : 1), [width]);
  const discoverMaxWidth = useMemo(() => Math.max(LAYOUT.MAX_GRID_WIDTH, 1600), []);
  const maxContentWidth = useMemo(
    () => Math.min(width - SPACING.xl, discoverMaxWidth),
    [width, discoverMaxWidth]
  );
  const horizontalPadding = useMemo(
    () => (width > discoverMaxWidth ? (width - discoverMaxWidth) / 2 + SPACING.sm : SPACING.sm),
    [width, discoverMaxWidth]
  );

  // Memoize contentItems to prevent recreation on every render
  const contentItems = useMemo(
    () =>
      [
        {
          key: 'featured-article',
          content: <FeaturedArticleSection />,
        },
        {
          key: 'in-the-news',
          content: (
            <FeaturedCarouselSection
              title="In The News"
              items={featuredContent?.news?.map((newsItem, index) => {
                // Use the first link for navigation and thumbnail
                const firstLink = newsItem.links[0];
                return {
                  title: firstLink?.title || 'News Story',
                  description:
                    newsItem.story || firstLink?.description || firstLink?.title || 'Latest news',
                  thumbnail: firstLink?.thumbnail,
                  pageid: firstLink?.pageid,
                  // Add the full article title for navigation
                  articleTitle: firstLink?.title,
                  // Add links array for the carousel item to handle multiple articles
                  links: newsItem.links,
                };
              })}
              cardType="news"
            />
          ),
        },
        {
          key: 'did-you-know',
          content: (
            <FeaturedCarouselSection
              title="Did You Know?"
              items={featuredContent?.dyk?.map((item) => {
                const titleMatch = item.html.match(/title="([^"]*)"/);
                const title = titleMatch?.[1] || 'Did You Know?';

                return {
                  title,
                  description: item.html, // Keep HTML for proper rendering
                  html: item.html, // Add explicit html field for Did You Know items
                };
              })}
              cardType="did-you-know"
            />
          ),
        },
        {
          key: 'featured-picture',
          content: <FeaturedPictureSection />,
        },
        {
          key: 'trending',
          content: <TrendingSection />,
        },
        {
          key: 'on-this-day',
          content: (
            <FeaturedCarouselSection
              title="On This Day"
              items={featuredContent?.onthisday?.map((item) => ({
                title: item.text.substring(0, 100) + '...',
                description: item.text,
                html: item.text, // Add HTML field for proper rendering with links
                thumbnail: item.pages?.[0]?.thumbnail,
                year: item.year, // Add the year from the OnThisDayItem
                page: item.pages?.[0],
                articleTitle: item.pages?.[0]?.title,
              }))}
              cardType="on-this-day"
            />
          ),
        },
      ].filter((item) => {
        // Filter out sections that don't have content (except during loading)
        if (isLoading) return true;

        // Check if the section has actual content
        switch (item.key) {
          case 'featured-article':
            return !!featuredContent?.tfa;
          case 'in-the-news':
            return !!featuredContent?.news?.length;
          case 'did-you-know':
            return !!featuredContent?.dyk?.length;
          case 'featured-picture':
            return !!featuredContent?.image;
          case 'trending':
            return !!featuredContent?.mostread;
          case 'on-this-day':
            return !!featuredContent?.onthisday?.length;
          default:
            return false;
        }
      }),
    [featuredContent, isLoading]
  );

  // Memoize renderItem to prevent recreation on every render
  const renderItem = useCallback(
    ({ item }: { item: { key: string; content: React.ReactNode } }) => (
      <View style={{ flex: 1, margin: SPACING.sm, minWidth: 0, alignSelf: 'stretch' }}>
        {item.content}
      </View>
    ),
    []
  );

  // Memoize keyExtractor to prevent recreation on every render
  const keyExtractor = useCallback(
    (item: { key: string; content: React.ReactNode }) => item.key,
    []
  );

  // Show error state if there's an error and no content
  if (error && !featuredContent && !isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <CollapsibleHeader scrollY={scrollY} headerHeight={totalHeaderHeight}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: SPACING.base,
              paddingTop: insets.top,
              minHeight: HEADER_HEIGHT,
              width: '100%',
            }}
          >
            <SearchBar
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              onIconPress={handleSearchSubmit}
              headerStyle
              style={{ width: '100%' }}
            />
          </View>
        </CollapsibleHeader>

        <View style={{ paddingTop: totalHeaderHeight }}>
          <FeaturedContentError />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CollapsibleHeader scrollY={scrollY} headerHeight={totalHeaderHeight}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: SPACING.base,
            paddingTop: insets.top,
            minHeight: HEADER_HEIGHT,
            width: '100%',
          }}
        >
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            onIconPress={handleSearchSubmit}
            headerStyle
            style={{ width: '100%' }}
          />
        </View>
      </CollapsibleHeader>

      <FlashList
        ref={flashListRef}
        data={contentItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        style={{ backgroundColor: theme.colors.background }}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: totalHeaderHeight + SPACING.base,
          paddingHorizontal: horizontalPadding,
          paddingBottom: SPACING.base,
          flexGrow: 1,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%',
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      />
    </View>
  );
}
