import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { List, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';
import ArticleImageModal from '../article/ArticleImageModal';
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
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; alt?: string } | null>(null);

  const handleImagePress = useCallback((image: { uri: string; alt?: string }) => {
    setSelectedImage(image);
    setImageModalVisible(true);
  }, []);

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
            paddingVertical: SPACING.xs,
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
                title={title}
                onPress={handleImagePress}
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
        contentContainerStyle={{ paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <ArticleImageModal
        visible={imageModalVisible}
        selectedImage={selectedImage}
        onClose={() => {
          setImageModalVisible(false);
          setSelectedImage(null);
        }}
      />
    </>
  );
}

export default memo(BaseListWithHeader) as typeof BaseListWithHeader;
