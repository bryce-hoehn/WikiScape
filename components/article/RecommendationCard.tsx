import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';

import { RecommendationCardProps } from '../../types/components';
import { shareArticle } from '../../utils/shareUtils';

export default function RecommendationCard({
  item,
  index,
  isBookmarked,
  onBookmarkToggle
}: RecommendationCardProps) {
  const handleShare = async (e: any) => {
    e.stopPropagation(); // Prevent card navigation
    try {
      await shareArticle(item.title, item.description);
    } catch (error) {
      console.error('Failed to share article:', error);
    }
  };
  const theme = useTheme();
    
    return (
    <View style={{ alignItems: 'center' }}>
      <Card
        style={{
          width: '100%',
          marginBottom: 16,
          borderRadius: 8,
          elevation: 1,
          overflow: 'hidden',
        }}
        onPress={() => router.push(`/(zArticleStack)/${encodeURIComponent(item.title)}`)}
        accessibilityLabel={`Open recommended article: ${item.title}`}
        accessibilityHint={`Opens the recommended article: ${item.title}`}
      >
        {/* Article Image */}
        {item.thumbnail && (
          <Image
            source={{ uri: item.thumbnail.source }}
            style={{
              height: 300,
              width: '100%',
              backgroundColor: theme.colors.surfaceVariant
            }}
            contentFit="cover"
            placeholder={{ blurhash: 'L5H2EC=PM+yV0gMqNGa#00bH?G-9' }}
            alt={`Thumbnail for ${item.title}`}
            accessibilityLabel={`Thumbnail for ${item.title}`}
          />
        )}

        {/* Article Content */}
        <Card.Content style={{ padding: 20 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: '700',
                lineHeight: 24,
                color: theme.colors.onSurface,
                flex: 1,
                marginRight: 12
              }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                icon="share-variant"
                iconColor={theme.colors.onSurfaceVariant}
                onPress={handleShare}
                style={{ margin: 0 }}
                size={20}
                accessibilityLabel={`Share ${item.title}`}
                accessibilityHint="Shares this article with others"
              />
              <IconButton
                icon={isBookmarked(item.title) ? "bookmark" : "bookmark-outline"}
                iconColor={isBookmarked(item.title) ? theme.colors.primary : theme.colors.onSurfaceVariant}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent card navigation
                  onBookmarkToggle(item);
                }}
                style={{ margin: 0 }}
                size={20}
                accessibilityLabel={isBookmarked(item.title) ? `Remove ${item.title} from bookmarks` : `Add ${item.title} to bookmarks`}
                accessibilityHint={isBookmarked(item.title) ? "Removes article from bookmarks" : "Adds article to bookmarks"}
              />
            </View>
          </View>
          <Text 
            variant="bodyMedium" 
            style={{ 
              color: theme.colors.onSurfaceVariant,
              lineHeight: 20,
            }}
            numberOfLines={3}
            >
            {item.description}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}
