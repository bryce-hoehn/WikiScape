import React from 'react';
import { View } from 'react-native';
import { List, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';
import { MOTION } from '../../constants/motion';
import { useReducedMotion } from '../../hooks';
import { Animated, Platform } from 'react-native';

interface SearchResultSkeletonProps {
  index?: number;
}

/**
 * Skeleton loader for search result list items
 * Matches the layout of BaseListWithHeader List.Item
 */
export default function SearchResultSkeleton({ index = 0 }: SearchResultSkeletonProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  React.useEffect(() => {
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

    // MD3-compliant stagger animation
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
    borderRadius = theme.roundness * 1, // 4dp equivalent (4dp * 1)
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
      borderRadius,
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
    <Animated.View style={{ opacity: fadeAnim }}>
      <List.Item
        title=""
        description=""
        left={() => (
          <SkeletonBox
            width={40}
            height={40}
            borderRadius={theme.roundness * 1} // 4dp equivalent (4dp * 1)
            style={{ marginRight: 16 }}
          />
        )}
        style={{ paddingVertical: SPACING.sm }}
      >
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="70%" height={16} />
          <SkeletonBox width="90%" height={12} />
        </View>
      </List.Item>
    </Animated.View>
  );
}
