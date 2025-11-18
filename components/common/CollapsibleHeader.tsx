import React from 'react';
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

  // Animate height from headerHeight to 0
  // If reduced motion is enabled, use a simple value that doesn't animate
  const animatedHeight = reducedMotion
    ? scrollY.interpolate({
        inputRange: [0, maxScroll],
        outputRange: [headerHeight, 0],
        extrapolate: 'clamp',
      })
    : scrollY.interpolate({
        inputRange: [0, scrollThreshold, maxScroll],
        outputRange: [headerHeight, headerHeight, 0],
        extrapolate: 'clamp',
      });

  // Fade out as it collapses
  // If reduced motion is enabled, skip the fade animation
  const opacity = reducedMotion
    ? scrollY.interpolate({
        inputRange: [0, maxScroll],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : scrollY.interpolate({
        inputRange: [0, scrollThreshold, maxScroll],
        outputRange: [1, 1, 0],
        extrapolate: 'clamp',
      });

  return (
    <Animated.View
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
            source={require('../../assets/images/books.png')}
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
  const animatedMarginTop = scrollY.interpolate({
    inputRange: [0, scrollThreshold, maxScroll],
    outputRange: [headerHeight, headerHeight, 0],
    extrapolate: 'clamp',
  });

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
