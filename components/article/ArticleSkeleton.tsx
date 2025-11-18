import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useReducedMotion } from '@/hooks';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, useWindowDimensions, View } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * Skeleton loader component that matches Article layout
 * Provides smooth shimmer animation for better loading experience
 */
export default function ArticleSkeleton() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { reducedMotion } = useReducedMotion();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;
  // Match Article.tsx width calculation - use ARTICLE_MAX_WIDTH instead of MAX_CONTENT_WIDTH
  const maxArticleWidth = Math.min(width - 32, LAYOUT.ARTICLE_MAX_WIDTH);
  const horizontalPadding = 8; // Match Article.tsx paddingHorizontal: 8

  // Shimmer animation (skip if reduced motion is enabled)
  useEffect(() => {
    if (reducedMotion) {
      fadeAnim.setValue(1);
      shimmerAnim.setValue(0);
      return;
    }

    const useNativeDriver = Platform.OS !== 'web';
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

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: MOTION.durationMedium,
      useNativeDriver,
    }).start();

    return () => shimmer.stop();
  }, [shimmerAnim, fadeAnim, reducedMotion]);

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
    borderRadius = undefined,
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
      borderRadius: borderRadius ?? theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden',
    };

    return (
      <View style={style ? [baseStyle, style] : baseStyle}>
        <Animated.View
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: theme.colors.surface,
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          }}
        />
      </View>
    );
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          maxWidth: maxArticleWidth,
          alignSelf: 'center',
          width: '100%',
          paddingHorizontal: horizontalPadding,
          paddingVertical: SPACING.base,
        }}
      >
        {/* Title skeleton */}
        <SkeletonBox width="85%" height={32} style={{ marginBottom: SPACING.md }} />
        <SkeletonBox width="60%" height={24} style={{ marginBottom: SPACING.lg }} />

        {/* Image skeleton (if article has image) */}
        <SkeletonBox
          width="100%"
          height={200}
          style={{ marginBottom: SPACING.lg, borderRadius: theme.roundness }}
        />

        {/* Intro paragraph skeletons */}
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="95%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.md }} />
        <SkeletonBox width="90%" height={16} style={{ marginBottom: SPACING.lg }} />

        {/* Section heading skeleton */}
        <SkeletonBox width="40%" height={28} style={{ marginBottom: SPACING.md }} />

        {/* Section content skeletons */}
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="98%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.md }} />
        <SkeletonBox width="92%" height={16} style={{ marginBottom: SPACING.lg }} />

        {/* Another section heading */}
        <SkeletonBox width="35%" height={28} style={{ marginBottom: SPACING.md }} />

        {/* More content */}
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="96%" height={16} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: SPACING.md }} />
      </View>
    </Animated.View>
  );
}
