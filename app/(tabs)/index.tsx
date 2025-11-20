import CollapsibleHeader, {
  useCollapsibleHeaderSpacing,
} from '@/components/common/CollapsibleHeader';
import ResponsiveContainer from '@/components/common/ResponsiveContainer';
import ForYouFeed from '@/components/home/ForYouFeed';
import HotFeed from '@/components/home/HotFeed';
import RandomFeed from '@/components/home/RandomFeed';
import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import { TYPOGRAPHY } from '@/constants/typography';
import { useScrollToTop } from '@/context/ScrollToTopContext';
import { useReducedMotion } from '@/hooks';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, View, useWindowDimensions } from 'react-native';
import { Divider, TouchableRipple, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationState, Route, SceneRendererProps, TabView } from 'react-native-tab-view';

export default function HomeScreen() {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const { scrollToTop, registerScrollRef } = useScrollToTop();
  const layout = useWindowDimensions();
  const wasFocusedRef = useRef(false);
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  // Use full window width for TabView initialLayout (required for proper rendering)
  const windowWidth = layout.width;
  // Constrain tab widths to the centered content container so tabs don't run under the sidebar.
  const containerWidth = Math.min(layout.width, LAYOUT.MAX_CONTENT_WIDTH);
  const isLargeScreen = layout.width >= LAYOUT.DESKTOP_BREAKPOINT;

  // Shared scroll value for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;

  const [routes] = useState([
    { key: 'for-you', title: 'For You' },
    { key: 'hot', title: 'Popular' },
    { key: 'random', title: 'Random' },
  ]);

  // Determine initial index from query parameter or default to 0
  const getInitialIndex = () => {
    if (tab) {
      const tabIndex = routes.findIndex((route) => route.key === tab);
      return tabIndex >= 0 ? tabIndex : 0;
    }
    return 0;
  };

  const [index, setIndex] = useState(() => getInitialIndex());

  // Update index when tab query parameter changes
  useEffect(() => {
    const newIndex = getInitialIndex();
    setIndex((currentIndex) => {
      // Only update if the new index is different
      return newIndex !== currentIndex ? newIndex : currentIndex;
    });
  }, [tab, routes]);

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

  // Lazy loading placeholder - shows while tab is being loaded
  const renderLazyPlaceholder = useCallback(
    ({ route }: { route: Route }) => {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Simple loading indicator - Feed components will show their own skeletons when loaded */}
        </View>
      );
    },
    [theme.colors.background]
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
    const { position } = props;

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
          // MD3 Accessibility: Tab list role for screen readers
          // Reference: https://m3.material.io/components/tabs/accessibility
          accessibilityRole="tablist"
          accessibilityLabel="Feed tabs"
        >
          {routes.map((route: Route, i: number) => {
            const focused = i === index;
            // MD3: Active tab uses onSurface, inactive uses onSurfaceVariant
            // Reference: https://m3.material.io/components/tabs/specs
            const color = focused ? theme.colors.onSurface : theme.colors.onSurfaceVariant;
            // MD3: Active tab uses Medium weight (500), inactive uses Regular (400)
            // Reference: https://m3.material.io/components/tabs/specs
            const fontWeight = focused ? '500' : '400';

            // Animate text color and weight based on position for smooth transitions
            const inputRange = routes.map((_, j) => j);
            const opacity = position.interpolate({
              inputRange,
              outputRange: routes.map((_, j) => (j === i ? 1 : 0.6)),
              extrapolate: 'clamp',
            });

            return (
              <TouchableRipple
                key={route.key}
                onPress={() => handleTabPress(i, route.key)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // MD3: Tab height must be exactly 48dp for text-only tabs
                  // Reference: https://m3.material.io/components/tabs/specs
                  height: SPACING.xxl, // 48dp
                  minHeight: SPACING.xxl, // 48dp - ensures minimum touch target
                  paddingHorizontal: SPACING.base, // 16dp horizontal padding
                  minWidth: 120, // Ensure minimum width for touch target
                }}
                // MD3 Accessibility: Proper tab role and state
                // Reference: https://m3.material.io/components/tabs/accessibility
                accessibilityRole="tab"
                accessibilityLabel={route.title || `Tab ${i + 1}`}
                accessibilityState={{ selected: focused }}
                accessibilityHint={focused ? `${route.title} tab, currently selected` : `Switch to ${route.title} tab`}
                testID={`tab-${route.key}`}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <Animated.Text
                    // MD3: Use titleSmall (14sp) for tab labels
                    // Reference: https://m3.material.io/components/tabs/specs
                    style={{
                      fontSize: TYPOGRAPHY.tabLabel,
                      fontWeight: fontWeight,
                      lineHeight: 20, // Standard line height for 14sp
                      color: color,
                      opacity: opacity,
                      textAlign: 'center',
                    }}
                  >
                    {route.title}
                  </Animated.Text>
                </View>
              </TouchableRipple>
            );
          })}
          
          {/* Animated indicator that moves between tabs */}
          {(() => {
            const tabBarWidth = centeredMaxWidth || windowWidth;
            const tabWidth = tabBarWidth / routes.length;
            const indicatorWidth = tabWidth * 0.6; // 60% of tab width (20% margin on each side)
            
            return (
              <Animated.View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: 2, // 2dp per MD3 specification
                  width: indicatorWidth,
                  backgroundColor: theme.colors.primary,
                  borderRadius: 1, // 1dp radius for 2dp height indicator
                  transform: [
                    {
                      translateX: position.interpolate({
                        inputRange: routes.map((_, i) => i),
                        outputRange: routes.map((_, i) => {
                          const margin = (tabWidth - indicatorWidth) / 2; // Center the indicator
                          return i * tabWidth + margin;
                        }),
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                }}
              />
            );
          })()}
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
            renderLazyPlaceholder={renderLazyPlaceholder}
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
