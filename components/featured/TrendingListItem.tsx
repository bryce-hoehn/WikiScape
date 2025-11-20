import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { List, Text, useTheme } from 'react-native-paper';
import { getHoverStyles } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { useReducedMotion } from '../../hooks';
import { getRandomBlurhash } from '../../utils/blurhash';

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
  const [isHovered, setIsHovered] = useState(false);
  const { reducedMotion } = useReducedMotion();


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
          fontSize: TYPOGRAPHY.titleMedium,
          fontWeight: '500',
          color: theme.colors.onSurface,
        }}
        descriptionStyle={{
          fontSize: TYPOGRAPHY.bodySmall,
          color: theme.colors.onSurfaceVariant,
          marginTop: SPACING.xs / 2,
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
            <View
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
                placeholder={{ blurhash: getRandomBlurhash(item.thumbnail) }}
                alt={`Thumbnail for ${item.normalizedTitle}`}
                accessibilityLabel={`Thumbnail for ${item.normalizedTitle}`}
              />
            </View>
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
                  fontSize: TYPOGRAPHY.bodyMedium,
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
    </>
  );
}
