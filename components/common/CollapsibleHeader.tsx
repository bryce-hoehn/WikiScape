import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useReducedMotion } from '../../hooks';

interface CollapsibleHeaderProps {
  scrollY: Animated.Value;
  headerHeight?: number;
  scrollThreshold?: number;
  maxScroll?: number;
  children?: React.ReactNode;
  backgroundColor?: string; // Optional custom background color
}

/**
 * Simple reusable collapsible header component
 * Collapses based on scroll position and provides animated spacing for content below
 */
export default function CollapsibleHeader({
  scrollY,
  headerHeight = 60,
  scrollThreshold = 50,
  maxScroll = 200,
  children,
  backgroundColor,
}: CollapsibleHeaderProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const headerBg = backgroundColor || theme.colors.background;

  // Create fixed animated values that persist across renders
  const fixedHeightRef = useRef(new Animated.Value(headerHeight));
  const fixedOpacityRef = useRef(new Animated.Value(1));

  // Update fixed values when reducedMotion or headerHeight changes
  useEffect(() => {
    if (reducedMotion) {
      fixedHeightRef.current.setValue(headerHeight);
      fixedOpacityRef.current.setValue(1);
    }
  }, [reducedMotion, headerHeight]);

  // Animate height from headerHeight to 0
  // If reduced motion is enabled, keep header fixed at full height
  const animatedHeight = useMemo(() => {
    if (reducedMotion) {
      return fixedHeightRef.current; // Fixed height when reduced motion is enabled
    }
    return scrollY.interpolate({
        inputRange: [0, scrollThreshold, maxScroll],
        outputRange: [headerHeight, headerHeight, 0],
        extrapolate: 'clamp',
      });
  }, [reducedMotion, scrollY, headerHeight, scrollThreshold, maxScroll]);

  // Fade out as it collapses
  // If reduced motion is enabled, keep opacity at 1 (fully visible)
  const opacity = useMemo(() => {
    if (reducedMotion) {
      return fixedOpacityRef.current; // Fixed opacity when reduced motion is enabled
    }
    return scrollY.interpolate({
        inputRange: [0, scrollThreshold, maxScroll],
        outputRange: [1, 1, 0],
        extrapolate: 'clamp',
      });
  }, [reducedMotion, scrollY, scrollThreshold, maxScroll]);

  return (
    <Animated.View
      // @ts-expect-error - main role is valid for React Native Web but not in TypeScript types
      accessibilityRole="banner"
      accessibilityLabel="App header"
      style={[
        styles.container,
        {
          height: animatedHeight,
          backgroundColor: headerBg,
          opacity,
          pointerEvents: 'box-none' as any,
        },
      ]}
    >
      {children || (
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/scroll.png')}
            style={[
              styles.icon,
              {
                width: 40,
                height: 40,
                borderRadius: theme.roundness * 2, // 8dp equivalent (4dp * 2)
              },
            ]}
            resizeMode="contain"
            {...(Platform.OS === 'web' &&
              {
                // Web-specific props applied directly, not in style
              })}
          />
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Hook to get animated marginTop for content that should move up as header collapses
 */
export function useCollapsibleHeaderSpacing(
  scrollY: Animated.Value,
  headerHeight: number = 60,
  scrollThreshold: number = 50,
  maxScroll: number = 200
) {
  const { reducedMotion } = useReducedMotion();
  
  // Create fixed animated value that persists across renders
  const fixedMarginTopRef = useRef(new Animated.Value(headerHeight));
  
  // Update fixed value when reducedMotion or headerHeight changes
  useEffect(() => {
    if (reducedMotion) {
      fixedMarginTopRef.current.setValue(headerHeight);
    }
  }, [reducedMotion, headerHeight]);
  
  // If reduced motion is enabled, keep margin fixed at headerHeight
  const animatedMarginTop = useMemo(() => {
    if (reducedMotion) {
      return fixedMarginTopRef.current; // Fixed margin when reduced motion is enabled
    }
    return scrollY.interpolate({
    inputRange: [0, scrollThreshold, maxScroll],
    outputRange: [headerHeight, headerHeight, 0],
    extrapolate: 'clamp',
  });
  }, [reducedMotion, scrollY, headerHeight, scrollThreshold, maxScroll]);

  return animatedMarginTop;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    // Web-specific styles handled via component props if needed
  },
});
