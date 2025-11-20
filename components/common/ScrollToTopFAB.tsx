import React from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { AnimatedFAB, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/layout';
import { SPACING } from '../../constants/spacing';
import { useReducedMotion } from '../../hooks';

interface ScrollToTopFABProps {
  scrollRef: React.RefObject<any>;
  visible?: boolean;
  hasBottomTabBar?: boolean; // Whether the page has a bottom tab bar
  containerPositioned?: boolean; // Whether the FAB is positioned by its container (disables internal positioning)
}

export default function ScrollToTopFAB({ scrollRef, visible = true, hasBottomTabBar = true, containerPositioned = false }: ScrollToTopFABProps) {
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

  const bottomSpacing = Platform.select({
    web: isLargeScreen ? 24 : 16,
    default: 16,
  });

  const spacingFromTabBar = hasBottomTabBar && !isLargeScreen ? 16 : 0;
  const bottomPosition = hasBottomTabBar && !isLargeScreen
    ? spacingFromTabBar
    : insets.bottom + bottomSpacing;

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
        styles.fabStyle, // Always use absolute positioning
        {
          backgroundColor: theme.colors.secondaryContainer,
          borderRadius: SPACING.base, // M3: FAB corner radius is 16dp
          ...(containerPositioned ? {
            // When container-positioned, position at bottom-right of container
            position: 'absolute',
            bottom: 0,
            right: 0,
          } : {
            bottom: bottomPosition,
            right: bottomSpacing,
          }),
          zIndex: 998, // Lower than toolbar (1000) to ensure toolbar buttons receive touches
          elevation: 3, // M3: FAB elevation is 3dp (increases to 4dp when pressed)
        },
      ]}
      color={theme.colors.onSecondaryContainer}
      accessibilityLabel="Scroll to top"
      accessibilityHint="Scrolls to the top of the page"
    />
  );
}

const styles = StyleSheet.create({
  fabStyle: {
    position: 'absolute',
  },
});
