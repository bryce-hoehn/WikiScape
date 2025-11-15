import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';

import { BookmarkCardProps } from '../../types/components';

export default function BookmarkCard({ item, onRemoveBookmark }: BookmarkCardProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Card
      style={{
        width: '100%',
        marginBottom: 16,
        borderRadius: 16,
        elevation: 4,
      }}
      onPress={() => router.push(`/(zArticleStack)/${encodeURIComponent(item.title)}`)}
      accessibilityLabel={`Open article: ${item.title}`}
      accessibilityHint={`Opens the ${item.title} article`}
    >
      {/* Article Image */}
      {item.thumbnail && (
        <Image
          source={{ uri: item.thumbnail.source }}
          style={{
            height: 200,
            width: '100%',
            backgroundColor: theme.colors.surfaceVariant
          }}
          contentFit="cover"
          placeholder={{ blurhash: 'L5H2EC=PM+yV0gMqNGa#00bH?G-9' }}
          alt={`Thumbnail for ${item.title}`}
          accessibilityLabel={`Thumbnail image for ${item.title}`}
        />
      )}

      {/* Article Content */}
      <Card.Content style={{ padding: 20 }}>
        <Text 
          variant="titleLarge" 
          style={{ 
            fontWeight: '700', 
            marginBottom: 8,
            lineHeight: 24,
            color: theme.colors.onSurface
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text 
          variant="bodyMedium" 
          style={{ 
            color: theme.colors.onSurfaceVariant,
            lineHeight: 20,
            marginBottom: 16
          }}
          numberOfLines={3}
        >
          {item.summary}
        </Text>
        
        {/* Remove Bookmark Button */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
          paddingTop: 16
        }}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Bookmarked {new Date(item.bookmarkedAt).toLocaleDateString()}
          </Text>
          <IconButton
            icon="bookmark-off"
            iconColor={theme.colors.error}
            size={24}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card navigation
              onRemoveBookmark(item.title);
            }}
            style={{ margin: 0 }}
            accessibilityLabel={`Remove ${item.title} from bookmarks`}
            accessibilityHint={`Removes this article from your bookmarks`}
          />
        </View>
      </Card.Content>
    </Card>
  );
}
