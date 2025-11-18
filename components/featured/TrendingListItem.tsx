import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { List, Text, useTheme } from 'react-native-paper';
import { getHoverStyles } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import { useReducedMotion } from '../../hooks';
import ArticleImageModal from '../article/ArticleImageModal';

interface TrendingListItemProps {
  item: {
    id: string;
    title: string;
    normalizedTitle: string;
    thumbnail?: string;
    description?: string;
  };
  itemIndex: number;
  pageIndex: number;
  itemsPerPage: number;
  isFirst: boolean;
  isLast: boolean;
}

export default function TrendingListItem({
  item,
  itemIndex,
  pageIndex,
  itemsPerPage,
  isFirst,
  isLast,
}: TrendingListItemProps) {
  const theme = useTheme();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; alt?: string } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { reducedMotion } = useReducedMotion();

  const handleImagePress = () => {
    if (item.thumbnail) {
      setSelectedImage({ uri: item.thumbnail, alt: `Thumbnail for ${item.normalizedTitle}` });
      setImageModalVisible(true);
    }
  };

  // Web-specific: Hover handlers
  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  return (
    <>
      <List.Item
        title={item.normalizedTitle}
        description={item.description}
        onPress={() => router.push(`/article/${encodeURIComponent(item.title)}`)}
        titleStyle={{
          fontSize: 16,
          fontWeight: '500',
          color: theme.colors.onSurface,
        }}
        descriptionStyle={{
          fontSize: 12,
          color: theme.colors.onSurfaceVariant,
          marginTop: 2,
        }}
        contentStyle={{ paddingVertical: 0, minHeight: 0 }}
        accessibilityLabel={`Open trending article: ${item.normalizedTitle}`}
        accessibilityHint={`Opens the trending article: ${item.normalizedTitle}`}
        {...(Platform.OS === 'web' && {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        })}
        left={(props) =>
          item.thumbnail ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleImagePress();
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.roundness * 2, // 8dp equivalent (4dp * 2)
                overflow: 'hidden',
                marginRight: SPACING.md,
                marginLeft: SPACING.md,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={{ width: '100%', height: '100%' }}
                placeholder={{ blurhash: 'L5H2EC=PM+yV0gMqNGa#00bH?G-9' }}
                alt={`Thumbnail for ${item.normalizedTitle}`}
                accessibilityLabel={`Thumbnail for ${item.normalizedTitle}`}
              />
            </Pressable>
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.roundness, // 16dp equivalent
                backgroundColor: theme.colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: SPACING.md,
                marginLeft: SPACING.md,
              }}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: theme.colors.onPrimary,
                }}
              >
                {pageIndex * itemsPerPage + itemIndex + 1}
              </Text>
            </View>
          )
        }
        style={{
          backgroundColor:
            isHovered && Platform.OS === 'web'
              ? theme.colors.surfaceVariant
              : 'transparent',
          marginTop: isFirst ? 0 : 0,
          marginBottom: 0,
          paddingBottom: 0,
          ...(Platform.OS === 'web' && {
            ...getHoverStyles(isHovered, reducedMotion, {
              transitionProperty: 'background-color',
            }),
            borderRadius: theme.roundness * 0.5, // Default border radius for all corners
            borderBottomLeftRadius: isLast ? theme.roundness * 3 : theme.roundness * 0.5, // Match Card border radius for last item
            borderBottomRightRadius: isLast ? theme.roundness * 3 : theme.roundness * 0.5, // Match Card border radius for last item
          }),
        }}
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
