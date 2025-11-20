import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { List, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';
import { useImagePrefetching } from '../../hooks';
import ResponsiveImage from '../common/ResponsiveImage';

interface BaseListWithHeaderProps<T> {
  data: T[];
  headerTitle: string;
  getTitle: (item: T) => string;
  getDescription?: (item: T) => string;
  getThumbnail?: (item: T) => string | null;
  getThumbnailDimensions?: (item: T) => { width: number; height: number } | null;
  fallbackIcon?: string;
  onItemPress: (item: T) => void;
  keyExtractor: (item: T) => string;
  accessibilityLabel?: (item: T) => string;
  accessibilityHint?: (item: T) => string;
  estimatedItemSize?: number;
}

/**
 * Base component for lists with headers
 * Consolidates common structure: header text and FlashList with List.Item
 */
function BaseListWithHeader<T>({
  data,
  headerTitle,
  getTitle,
  getDescription,
  getThumbnail,
  getThumbnailDimensions,
  fallbackIcon = 'file-document-outline',
  onItemPress,
  keyExtractor,
  accessibilityLabel,
  accessibilityHint,
  estimatedItemSize = 80,
}: BaseListWithHeaderProps<T>) {
  const theme = useTheme();

  // Image prefetching: Prefetch images for items about to become visible
  const { onViewableItemsChanged } = useImagePrefetching({
    data,
    getImageUrl: (item) => {
      if (!getThumbnail) return undefined;
      const thumbnail = getThumbnail(item);
      return typeof thumbnail === 'string' ? thumbnail : undefined;
    },
    preferredWidth: 56, // Standard width for list thumbnails
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item is considered visible when 50% is shown
    minimumViewTime: 100, // Minimum time item must be visible (ms)
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: T }) => {
      const title = getTitle(item);
      const description = getDescription ? getDescription(item) : undefined;
      const thumbnail = getThumbnail ? getThumbnail(item) : null;
      const dimensions = getThumbnailDimensions ? getThumbnailDimensions(item) : null;
      const thumbnailSize = 56; // Smaller thumbnails for better list density
      const defaultWidth = thumbnailSize;
      const defaultHeight = thumbnailSize;

      return (
        <List.Item
          title={title}
          description={description}
          style={{
            backgroundColor: theme.colors.elevation.level2,
            marginHorizontal: SPACING.sm,
            marginVertical: SPACING.xs / 2,
            borderRadius: theme.roundness,
            // M3: List items use default padding from RNP (16dp horizontal)
            // No need to override paddingVertical - RNP handles heights correctly
          }}
          left={(props) =>
            thumbnail ? (
              <ResponsiveImage
                source={{
                  source: thumbnail,
                  width: dimensions?.width || defaultWidth,
                  height: dimensions?.height || defaultHeight,
                }}
                contentFit="cover"
                style={{
                  width: thumbnailSize,
                  height: thumbnailSize,
                  borderRadius: theme.roundness * 2, // 8dp equivalent (4dp * 2)
                  marginRight: SPACING.sm,
                }}
                alt={`Thumbnail for ${title}`}
              />
            ) : (
              <View
                style={{
                  width: thumbnailSize,
                  height: thumbnailSize,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <List.Icon {...props} icon={fallbackIcon} />
              </View>
            )
          }
          onPress={() => onItemPress(item)}
          accessibilityLabel={accessibilityLabel ? accessibilityLabel(item) : `Open: ${title}`}
          accessibilityHint={accessibilityHint ? accessibilityHint(item) : `Opens ${title}`}
        />
      );
    },
    [
      getTitle,
      getDescription,
      getThumbnail,
      getThumbnailDimensions,
      fallbackIcon,
      onItemPress,
      accessibilityLabel,
      accessibilityHint,
      theme,
    ]
  );

  const renderHeader = useCallback(
    () => (
      <Text
        variant="titleSmall"
        style={{
          paddingHorizontal: SPACING.base,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.md,
          color: theme.colors.onSurface,
          fontWeight: '500',
          letterSpacing: 0.15,
        }}
        // MD3 Accessibility: Proper header role - per https://m3.material.io/components/search/accessibility
        accessibilityRole="header"
        accessibilityLabel={headerTitle}
      >
        {headerTitle}
      </Text>
    ),
    [headerTitle, theme]
  );

  return (
    <>
      {renderHeader()}
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        {...({ estimatedItemSize } as any)}
        contentContainerStyle={{ 
          paddingHorizontal: SPACING.sm, 
          paddingTop: SPACING.sm, // M3: 8dp top padding for lists
          paddingBottom: SPACING.sm, // M3: 8dp bottom padding for lists
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // MD3 Accessibility: Proper list role - per https://m3.material.io/components/search/accessibility
        accessibilityRole="list"
        accessibilityLabel={`${data.length} ${headerTitle.toLowerCase()}`}
      />
    </>
  );
}

export default memo(BaseListWithHeader) as typeof BaseListWithHeader;
