// Native date formatting - no external dependency needed
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';
import { VisitedArticle } from '../../hooks/storage/useVisitedArticles';

interface HistoryCardProps {
  item: VisitedArticle;
}

export default function HistoryCard({ item }: HistoryCardProps) {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hoursAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hoursAgo < 1) {
      return 'Just now';
    } else if (hoursAgo < 24) {
      const minutesAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (minutesAgo < 60) {
        return `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
      }
      return `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <Card
      elevation={2}
      style={{
        width: '100%',
        marginBottom: SPACING.lg, // Increased from SPACING.md (12dp) to SPACING.lg (24dp)
        borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
        // No border - MD3 recommends using elevation for depth instead of borders
        backgroundColor: theme.colors.elevation.level2,
        overflow: 'hidden',
      }}
      onPress={() => router.push(`/article/${encodeURIComponent(item.title)}`)}
      accessibilityLabel={`Open article: ${item.title}`}
      accessibilityHint={`Opens the ${item.title} article`}
    >
      <View style={{ flexDirection: 'row', padding: SPACING.md, alignItems: 'center' }}>
        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            variant="titleMedium"
            style={{
              fontWeight: '700', // Increased from 600 to 700 for stronger hierarchy
              color: theme.colors.onSurface,
              marginBottom: SPACING.xs,
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: SPACING.xs,
            }}
          >
            {formatDate(item.visitedAt)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
