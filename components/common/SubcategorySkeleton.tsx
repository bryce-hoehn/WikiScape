import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useReducedMotion } from '@/hooks';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, useWindowDimensions, View } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * Skeleton loader component that matches Subcategory page layout
 * Shows skeleton for subcategories and article cards
 */
export default function SubcategorySkeleton() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { reducedMotion } = useReducedMotion();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  const numColumns =
    width >= LAYOUT.XLARGE_BREAKPOINT ? 4 : width >= LAYOUT.DESKTOP_BREAKPOINT ? 3 : 2;

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
            backgroundColor: theme.colors.elevation.level2,
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          }}
        />
      </View>
    );
  };

  // Render skeleton for subcategory item (horizontal list item)
  const SubcategorySkeletonItem = () => (
    <View style={{ margin: 4, width: 200 }}>
      <View
        style={{
          borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
          backgroundColor: theme.colors.elevation.level2,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <SkeletonBox width={24} height={24} borderRadius={theme.roundness * 0.75} style={{ marginRight: SPACING.md }} />
        <SkeletonBox width={140} height={16} />
      </View>
    </View>
  );

  // Render skeleton for article card - match exact structure of actual cards
  const ArticleCardSkeleton = () => (
    <View style={{ flex: 1, margin: 4 }}>
      <View
        style={{
          borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
          backgroundColor: theme.colors.elevation.level2,
          overflow: 'hidden',
        }}
      >
        <SkeletonBox width="100%" height={120} />
        <View style={{ padding: 12 }}>
          <SkeletonBox width="85%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonBox width="100%" height={12} style={{ marginBottom: 4 }} />
          <SkeletonBox width="75%" height={12} />
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={{ opacity: fadeAnim, flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Subcategories Section Skeleton */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <SkeletonBox width={120} height={20} style={{ marginRight: 8 }} />
            <SkeletonBox width={24} height={24} borderRadius={theme.roundness * 0.75} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            {[0, 1, 2, 3].map((index) => (
              <SubcategorySkeletonItem key={index} />
            ))}
          </View>
        </View>

        {/* Articles Section Skeleton */}
        <View>
          <SkeletonBox width={80} height={20} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {Array.from({ length: numColumns * 2 }).map((_, index) => (
              <View key={index} style={{ width: `${100 / numColumns}%`, paddingHorizontal: 4 }}>
                <ArticleCardSkeleton />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
