import { MOTION } from '@/constants/motion';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, useWindowDimensions, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { LAYOUT } from '../../constants/layout';
import { SPACING } from '../../constants/spacing';
import { useReducedMotion } from '../../hooks';

interface CardSkeletonProps {
  index?: number;
}

/**
 * Skeleton loader component that matches RecommendationCard layout
 * Provides smooth shimmer animation for better loading experience
 */
export default function CardSkeleton({ index = 0 }: CardSkeletonProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { reducedMotion } = useReducedMotion();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  // Determine if we're on a small screen (mobile)
  const isSmallScreen = width < LAYOUT.TABLET_BREAKPOINT;

  // Shimmer animation (skip if reduced motion is enabled)
  useEffect(() => {
    if (reducedMotion) {
      // Skip animations when reduced motion is enabled
      fadeAnim.setValue(1);
      shimmerAnim.setValue(0);
      return;
    }

    // Use native driver only on native platforms (not web)
    const useNativeDriver = Platform.OS !== 'web';

    // MD3 recommends ~1500ms for shimmer animations
    // Split into two segments for smooth back-and-forth motion
    const shimmerSegmentDuration = MOTION.durationShimmer / 2;

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: shimmerSegmentDuration,
          useNativeDriver,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: shimmerSegmentDuration,
          useNativeDriver,
        }),
      ])
    );
    shimmer.start();

    // Fade in animation with MD3-compliant stagger
    // MD3: 20ms stagger delay, limited to first 10 items
    const staggerDelay = index < MOTION.staggerLimit ? index * MOTION.staggerDelay : 0;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: MOTION.durationShort, // MD3: 150ms for standard transitions
      delay: staggerDelay,
      useNativeDriver,
    }).start();

    return () => shimmer.stop();
  }, [shimmerAnim, fadeAnim, index, reducedMotion]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.7, 0.2],
  });

  const SkeletonBox = ({
    width,
    height,
    borderRadius = undefined, // Will use theme.roundness if not provided
    style,
  }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: React.ComponentProps<typeof View>['style'];
  }) => {
    const baseStyle: React.ComponentProps<typeof View>['style'] = {
      width: width as React.ComponentProps<typeof View>['style'] extends { width?: infer W }
        ? W
        : never,
      height,
      borderRadius: borderRadius ?? theme.roundness, // Use theme roundness as default
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden',
    };

    return (
      <View style={style ? [baseStyle, style] : baseStyle}>
        <Animated.View
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: theme.colors.elevation.level2,
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          }}
        />
      </View>
    );
  };

  // Responsive dimensions to match horizontal RecommendationCard
  const imageWidth = isSmallScreen ? 100 : 140;
  const cardHeight = isSmallScreen ? 120 : 140;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        marginBottom: SPACING.base,
      }}
    >
      <View
        style={{
          borderRadius: theme.roundness, // Use theme roundness
          backgroundColor: theme.colors.elevation.level2,
          // No border - MD3 recommends using elevation for depth instead of borders
          // For skeleton loaders, we rely on background color contrast
          overflow: 'hidden',
          // Note: View components don't support elevation prop, but skeleton loaders
          // don't need elevation since they're temporary loading states
        }}
      >
        <View style={{ flexDirection: 'row', height: cardHeight }}>
          {/* Image skeleton - Left side */}
          <SkeletonBox width={imageWidth} height={cardHeight} borderRadius={0} />

          {/* Content skeleton - Right side */}
          <View
            style={{
              flex: 1,
              padding: isSmallScreen ? SPACING.md : SPACING.base,
              justifyContent: 'space-between',
            }}
          >
            {/* Title and buttons skeleton */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: isSmallScreen ? 6 : SPACING.sm,
              }}
            >
              <SkeletonBox
                width="70%"
                height={isSmallScreen ? 16 : 20}
                style={{ marginRight: SPACING.sm }}
              />
              <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                <SkeletonBox
                  width={isSmallScreen ? 28 : 32}
                  height={isSmallScreen ? 28 : 32}
                  borderRadius={isSmallScreen ? 14 : theme.roundness}
                />
                <SkeletonBox
                  width={isSmallScreen ? 28 : 32}
                  height={isSmallScreen ? 28 : 32}
                  borderRadius={isSmallScreen ? 14 : theme.roundness}
                />
              </View>
            </View>
            <SkeletonBox
              width="85%"
              height={isSmallScreen ? 14 : 18}
              style={{ marginBottom: isSmallScreen ? 6 : SPACING.sm }}
            />

            {/* Description skeleton */}
            <SkeletonBox
              width="100%"
              height={isSmallScreen ? 12 : 14}
              style={{ marginBottom: SPACING.xs }}
            />
            <SkeletonBox width="90%" height={isSmallScreen ? 12 : 14} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
