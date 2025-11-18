import React, { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MOTION } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import { useReducedMotion } from '../../hooks';

// Skeleton component for featured article
export function FeaturedArticleSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={{
        width: '100%',
        padding: 20,
        borderRadius: theme.roundness, // 16dp equivalent
      }}
    >
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: theme.roundness * 2, // 8dp equivalent (4dp * 2)
          }}
        />
        <View style={{ flex: 1, gap: 8 }}>
          <View
            style={{
              height: 20,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 4,
            }}
          />
          <View
            style={{
              height: 16,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 4,
              width: '80%',
            }}
          />
          <View
            style={{
              height: 16,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 4,
              width: '60%',
            }}
          />
        </View>
      </View>
    </View>
  );
}

// Skeleton component for featured picture
export function FeaturedPictureSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={{
        width: '100%',
        padding: 20,
        borderRadius: theme.roundness, // 16dp equivalent
      }}
    >
      <View style={{ gap: 12 }}>
        <View
          style={{
            height: 20,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 4,
            width: '70%',
          }}
        />
        <View
          style={{
            height: 200,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: theme.roundness * 2, // 8dp equivalent (4dp * 2)
          }}
        />
        <View
          style={{
            height: 16,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 4,
            width: '90%',
          }}
        />
      </View>
    </View>
  );
}

// Skeleton component for Featured Carousel (replaces DidYouKnowSkeleton and OnThisDaySkeleton)
export function FeaturedCarouselSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={{
        width: '100%',
        padding: 20,
        borderRadius: theme.roundness, // 16dp equivalent
      }}
    >
      <View style={{ gap: 12 }}>
        <View
          style={{
            height: 20,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 4,
            width: '60%',
          }}
        />
        <View
          style={{
            height: 60,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: theme.roundness * 2, // 8dp equivalent (4dp * 2)
          }}
        />
        <View
          style={{
            height: 16,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 4,
            width: '80%',
          }}
        />
        <View
          style={{
            height: 16,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 4,
            width: '70%',
          }}
        />
      </View>
    </View>
  );
}

// Skeleton component for Trending Articles Carousel
export function TrendingCarouselSkeleton({ itemsCount = 3 }: { itemsCount?: number }) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  // Shimmer animation (skip if reduced motion is enabled)
  useEffect(() => {
    if (reducedMotion) {
      fadeAnim.setValue(1);
      shimmerAnim.setValue(0);
      return;
    }

    const useNativeDriver = Platform.OS !== 'web';

    // MD3-compliant shimmer animation
    // Split durationShimmer into two segments for smooth back-and-forth motion
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

    // MD3-compliant fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: MOTION.durationMedium, // Use medium duration for fade-in
      useNativeDriver,
    }).start();

    return () => shimmer.stop();
  }, [shimmerAnim, fadeAnim, reducedMotion]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.7, 0.2],
  });

  const SkeletonBox = ({
    width,
    height,
    borderRadius = 0,
    style,
  }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: React.ComponentProps<typeof View>['style'];
  }) => {
    return (
      <View
        style={[
          {
            width: width as any,
            height,
            borderRadius,
            backgroundColor: theme.colors.surfaceVariant,
            overflow: 'hidden',
          },
          style,
        ]}
      >
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

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        width: '100%',
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.background,
          borderRadius: theme.roundness * 0.5,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: itemsCount }).map((_, index) => {
          const isFirst = index === 0;
          const isLast = index === itemsCount - 1;

          return (
            <View
              key={index}
              style={{
                backgroundColor: theme.colors.elevation.level2,
                borderRadius: isFirst ? theme.roundness * 0.5 : 0,
                borderTopLeftRadius: isFirst ? theme.roundness * 0.5 : 0,
                borderTopRightRadius: isFirst ? theme.roundness * 0.5 : 0,
                borderBottomLeftRadius: isLast ? theme.roundness * 0.5 : 0,
                borderBottomRightRadius: isLast ? theme.roundness * 0.5 : 0,
                marginTop: isFirst ? 0 : SPACING.xs,
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING.md,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {/* Thumbnail/Number badge skeleton */}
              <SkeletonBox
                width={48}
                height={48}
                borderRadius={theme.roundness * 0.5}
                style={{ marginRight: SPACING.md }}
              />

              {/* Title and description skeleton */}
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBox width="80%" height={16} borderRadius={4} />
                <SkeletonBox width="60%" height={12} borderRadius={4} />
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}
