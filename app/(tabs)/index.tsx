import CollapsibleHeader, {
  useCollapsibleHeaderSpacing,
} from '@/components/common/CollapsibleHeader';
import ResponsiveContainer from '@/components/common/ResponsiveContainer';
import ForYouFeed from '@/components/home/ForYouFeed';
import HotFeed from '@/components/home/HotFeed';
import RandomFeed from '@/components/home/RandomFeed';
import { LAYOUT } from '@/constants/layout';
import { useScrollToTop } from '@/context/ScrollToTopContext';
import { useReducedMotion } from '@/hooks';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Platform, View, useWindowDimensions } from 'react-native';
import { Divider, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationState, Route, SceneRendererProps, TabView } from 'react-native-tab-view';

export default function HomeScreen() {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const { scrollToTop, registerScrollRef } = useScrollToTop();
  const layout = useWindowDimensions();
  const wasFocusedRef = useRef(false);
  // Use full window width for TabView initialLayout (required for proper rendering)
  const windowWidth = layout.width;
  // Constrain tab widths to the centered content container so tabs don't run under the sidebar.
  const containerWidth = Math.min(layout.width, LAYOUT.MAX_CONTENT_WIDTH);
  const isLargeScreen = layout.width >= LAYOUT.DESKTOP_BREAKPOINT;

  // Shared scroll value for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'for-you', title: 'For You' },
    { key: 'hot', title: 'Popular' },
    { key: 'random', title: 'Random' },
  ]);

  // Register a scroll ref for the home route that scrolls the currently active feed
  // Use ref to access current index without causing re-renders
  const currentIndexRef = React.useRef(index);
  React.useEffect(() => {
    currentIndexRef.current = index;
  }, [index]);

  const homeScrollToTop = React.useCallback(() => {
    const currentRouteKey = routes[currentIndexRef.current]?.key;
    if (currentRouteKey) {
      scrollToTop(currentRouteKey);
    }
  }, [routes, scrollToTop]);

  React.useEffect(() => {
    registerScrollRef('/(tabs)', {
      scrollToTop: homeScrollToTop,
    });
  }, [registerScrollRef, homeScrollToTop]);

  // Listen for tab press from bottom nav bar - scroll to top if already focused
  // Use ref to prevent infinite loops from scrollToTop changes
  const scrollToTopRef = React.useRef(scrollToTop);

  React.useEffect(() => {
    scrollToTopRef.current = scrollToTop;
  }, [scrollToTop]);

  useFocusEffect(
    useCallback(() => {
      // If we were already focused before, this means the user pressed the tab again
      if (wasFocusedRef.current) {
        scrollToTopRef.current('/(tabs)');
      }
      // Mark as focused for next time
      wasFocusedRef.current = true;
    }, [])
  );

  // Use ref to prevent stale closure in handleTabPress
  const indexRef = useRef(index);
  React.useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const handleTabPress = useCallback(
    (tabIndex: number, routeKey: string) => {
      if (tabIndex === indexRef.current) {
        // Already on this tab, scroll to top
        scrollToTop(routeKey);
      } else {
        // Switch to the tab
        setIndex(tabIndex);
      }
    },
    [scrollToTop]
  );

  // Memoize renderScene to prevent TabView from re-rendering all scenes
  const renderScene = useCallback(
    ({ route }: { route: { key: string } }) => {
      switch (route.key) {
        case 'for-you':
          return <ForYouFeed scrollY={scrollY} />;
        case 'hot':
          return <HotFeed scrollY={scrollY} />;
        case 'random':
          return <RandomFeed scrollY={scrollY} />;
        default:
          return null;
      }
    },
    [scrollY]
  );

  const HEADER_HEIGHT = 60;

  // Get animated spacing that moves up as header collapses
  // Call hook at component level, not inside renderTabBar
  const tabBarMarginTop = useCollapsibleHeaderSpacing(scrollY, HEADER_HEIGHT);

  // Memoize renderTabBar to prevent unnecessary re-renders
  const renderTabBar = useCallback(
    (
      props: SceneRendererProps & {
        navigationState: NavigationState<Route>;
        jumpTo: (key: string) => void;
      }
    ) => {
    const { routes, index } = props.navigationState;

    // Account for left gutter (88px) + drawer (360px) = 448px on large screens
    const leftOffset = isLargeScreen ? 448 : 0;
    const availableWidth = windowWidth - leftOffset - (isLargeScreen ? LAYOUT.SIDEBAR_WIDTH : 0);
    const centeredMaxWidth = Math.min(containerWidth, availableWidth);

    return (
      <Animated.View
        style={{
          width: '100%',
          zIndex: 10,
          backgroundColor: theme.colors.surface,
          marginTop: tabBarMarginTop,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            // No border - MD3 recommends using elevation for navigation bars
            // Separation is handled by background color contrast
            paddingHorizontal: isLargeScreen ? 0 : 0,
            ...(isLargeScreen && {
              maxWidth: centeredMaxWidth,
              alignSelf: 'center',
            }),
          }}
        >
          {routes.map((route: Route, i: number) => {
            const focused = i === index;
            // Bluesky style: active tab has white text, inactive has lighter grey
            const color = focused ? theme.colors.onSurface : theme.colors.onSurfaceVariant;
            const fontWeight = focused ? '700' : '400';
            const fontSize = focused ? 17 : 15;

            return (
              <TouchableRipple
                key={route.key}
                onPress={() => handleTabPress(i, route.key)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 16,
                  paddingBottom: 17,
                  paddingHorizontal: 16,
                  minWidth: 120,
                }}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Text
                    variant={focused ? 'titleMedium' : 'bodyMedium'}
                    style={{
                      // fontSize and fontWeight removed - using variant defaults
                      lineHeight: 20,
                      // Remove letterSpacing override - use MD3 typography defaults
                      color: color,
                      textAlign: 'center',
                    }}
                  >
                    {route.title}
                  </Text>
                  {focused && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: -17,
                        left: '20%',
                        right: '20%',
                        height: 2,
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.roundness * 1, // 4dp equivalent for small indicator (4dp * 1)
                      }}
                    />
                  )}
                </View>
              </TouchableRipple>
            );
          })}
        </View>
        {/* Divider between FeedBar and feed */}
        <Divider />
      </Animated.View>
    );
    },
    [index, routes, isLargeScreen, windowWidth, containerWidth, theme, tabBarMarginTop, handleTabPress]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top']}>
      <ResponsiveContainer maxWidth={LAYOUT.MAX_CONTENT_WIDTH}>
        <View style={{ flex: 1, position: 'relative', backgroundColor: theme.colors.surface }}>
          {/* Collapsible header with app icon */}
          <CollapsibleHeader
            scrollY={scrollY}
            headerHeight={HEADER_HEIGHT}
            backgroundColor={theme.colors.surface}
          />

          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: windowWidth }}
            renderTabBar={renderTabBar}
            style={{ backgroundColor: theme.colors.surface, width: '100%', flex: 1 }}
            animationEnabled={!reducedMotion}
            swipeEnabled={!reducedMotion}
            lazy={true}
            removeClippedSubviews={Platform.OS !== 'web'}
          />
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
