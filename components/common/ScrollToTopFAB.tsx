import React from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { AnimatedFAB, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/layout';
import { useReducedMotion } from '../../hooks';

interface ScrollToTopFABProps {
  scrollRef: React.RefObject<any>;
  visible?: boolean;
  hasBottomTabBar?: boolean; // Whether the page has a bottom tab bar
}

export default function ScrollToTopFAB({ scrollRef, visible = true, hasBottomTabBar = true }: ScrollToTopFABProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;

  const scrollToTop = () => {
    if (!scrollRef.current) {
      return;
    }

    // For FlashList, we need to use scrollToOffset instead of scrollTo
    if (scrollRef.current.scrollToOffset) {
      // FlashList
      scrollRef.current.scrollToOffset({ offset: 0, animated: !reducedMotion });
      return;
    }

    // For ScrollView
    if (Platform.OS === 'web') {
      // On web, React Native Web ScrollView wraps a DOM element
      const element = scrollRef.current as any;
      
      // Try to get the actual scrollable DOM node
      let scrollNode: any = null;
      
      // Method 1: getScrollableNode (React Native Web method)
      if (element.getScrollableNode) {
        scrollNode = element.getScrollableNode();
      }
      // Method 2: getNode (older React Native Web)
      else if (element.getNode) {
        const node = element.getNode();
        if (node && node.getScrollableNode) {
          scrollNode = node.getScrollableNode();
        } else {
          scrollNode = node;
        }
      }
      // Method 3: Direct access to _component or _nativeNode
      else if (element._component) {
        const comp = element._component;
        if (comp.getScrollableNode) {
          scrollNode = comp.getScrollableNode();
        } else {
          scrollNode = comp;
        }
      }
      // Method 4: Try the ref itself
      else {
        scrollNode = element;
      }
      
      // Now try to scroll the DOM node
      if (scrollNode) {
        // Check if it's a DOM element with scrollTo
        if (typeof scrollNode.scrollTo === 'function') {
          scrollNode.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
          return;
        }
        // Check if it has scrollTop property
        if (typeof scrollNode.scrollTop === 'number') {
          scrollNode.scrollTop = 0;
          return;
        }
      }
      
      // Fallback: Try React Native's scrollTo method
      if (element.scrollTo) {
        element.scrollTo({ y: 0, animated: !reducedMotion });
      }
    } else {
      // Native platforms
      if (scrollRef.current.scrollTo) {
        scrollRef.current.scrollTo({ y: 0, animated: !reducedMotion });
      }
    }
  };

  // MD3 FAB positioning:
  // - 16dp from bottom navigation bar when present (mobile)
  // - 24dp from bottom edge on desktop/tablets (no bottom nav)
  // - 16dp from right edge on mobile, 24dp on desktop
  // - Should account for safe area insets (home indicator, etc.)
  const bottomSpacing = Platform.select({
    web: isLargeScreen ? 24 : 16, // 24dp on desktop, 16dp on mobile web
    default: 16, // 16dp on native mobile
  });

  // Calculate bottom position:
  // - If tab bar is present: safe area + tab bar height + spacing above tab bar
  // - If no tab bar: safe area + bottom spacing from edge
  const bottomTabBarHeight = hasBottomTabBar && !isLargeScreen ? 56 : 0; // Tab bar height when visible
  const spacingFromTabBar = hasBottomTabBar ? 16 : 0; // MD3: 16dp spacing above bottom navigation (when tab bar is present)
  
  const bottomPosition = hasBottomTabBar && !isLargeScreen
    ? insets.bottom + bottomTabBarHeight + spacingFromTabBar // Mobile with tab bar: safe area + tab bar + spacing above tab bar
    : insets.bottom + bottomSpacing; // Desktop or no tab bar: safe area + spacing from edge

  return (
    <AnimatedFAB
      icon="arrow-up"
      label="Scroll to top"
      extended={false}
      onPress={scrollToTop}
      visible={visible}
      animateFrom="right"
      iconMode="static"
      style={[
        styles.fabStyle,
        {
          backgroundColor: theme.colors.primary,
          bottom: bottomPosition,
          right: bottomSpacing,
          zIndex: 1000,
          elevation: 6,
        },
      ]}
      color={theme.colors.onPrimary}
      accessibilityLabel="Scroll to top"
      accessibilityHint="Scrolls to the top of the page"
    />
  );
}

const styles = StyleSheet.create({
  fabStyle: {
    // Position is calculated dynamically based on:
    // - Safe area insets (home indicator, etc.)
    // - Bottom tab bar height (when visible)
    // - MD3 spacing guidelines
    position: 'absolute',
  },
});
