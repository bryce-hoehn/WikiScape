import { fetchArticleHtml } from '@/api';
import { getHoverStyles } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useFeaturedContent } from '@/context/FeaturedContentContext';
import { useReducedMotion } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import ArticleImageModal from '../article/ArticleImageModal';
import HtmlRenderer from '../common/HtmlRenderer';
import ResponsiveImage from '../common/ResponsiveImage';

interface FeaturedArticleCardProps {
  variant?: 'default' | 'compact';
}

export default function FeaturedArticleCard({ variant = 'default' }: FeaturedArticleCardProps) {
  const { featuredContent } = useFeaturedContent();
  const theme = useTheme();
  const article = featuredContent?.tfa;
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; alt?: string } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { reducedMotion } = useReducedMotion();

  if (!article) {
    return null;
  }

  const isCompact = variant === 'compact';
  const maxLines = 4;
  // Fixed height to match carousel cards (410px)
  const cardHeight = 410;
  const imageHeight = isCompact ? 120 : 240;
  const contentHeight = isCompact ? 290 : 170;

  const handleImagePress = (image: { uri: string; alt?: string }) => {
    setSelectedImage(image);
    setImageModalVisible(true);
  };

  // Web-specific: Hover handlers with prefetching
  const queryClient = useQueryClient();
  const handleMouseEnter = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
      // Prefetch article HTML on hover
      const articleTitle = article.titles?.normalized || article.title;
      if (articleTitle) {
        queryClient.prefetchQuery({
          queryKey: ['article-html', articleTitle],
          queryFn: () => fetchArticleHtml(articleTitle),
          staleTime: 30 * 60 * 1000, // 30 minutes - matches useArticleHtml config
        });
      }
    }
  }, [article.titles?.normalized, article.title, queryClient]);

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  return (
    <Card
      elevation={isHovered && Platform.OS === 'web' ? 4 : 2}
      style={{
        width: '100%',
        height: cardHeight,
        backgroundColor:
          isHovered && Platform.OS === 'web'
            ? theme.colors.surface
            : theme.colors.elevation.level2,
        borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...(Platform.OS === 'web' &&
          getHoverStyles(isHovered, reducedMotion, { scale: 1.01 })),
      }}
      onPress={() =>
        router.push(
          `/article/${encodeURIComponent(article.titles?.normalized || article.title || '')}`
        )
      }
      {...(Platform.OS === 'web' && {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
      accessibilityLabel={`Open featured article: ${article.titles?.normalized || article.title || ''}`}
      accessibilityHint={`Opens the featured article: ${article.titles?.normalized || article.title || ''}`}
    >
      <View
        style={{
          height: imageHeight,
          width: '100%',
          backgroundColor: theme.colors.surfaceVariant,
          position: 'relative',
        }}
      >
        {article.thumbnail ? (
          <ResponsiveImage
            source={{
              source: article.thumbnail.source,
              width: article.thumbnail.width || 400,
              height: imageHeight || article.thumbnail.height || 400,
            }}
            contentFit={isCompact ? 'contain' : 'cover'}
            style={{
              borderRadius: theme.roundness,
              width: '100%',
              height: imageHeight,
            }}
            alt={`Thumbnail for ${article.titles?.normalized || article.title || ''}`}
            onPress={handleImagePress}
          />
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              height: imageHeight,
            }}
          >
            <IconButton
              icon="image-outline"
              iconColor={theme.colors.onSurfaceVariant}
              size={isCompact ? 48 : 80}
              style={{ margin: 0 }}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            />
          </View>
        )}
      </View>
      <Card.Content style={{ flex: 1, height: contentHeight }}>
        {/* Display title - render as HTML if it contains HTML tags */}
        {(() => {
          const titleText =
            article.titles?.display ||
            article.displaytitle ||
            article.titles?.normalized ||
            article.title ||
            'Featured Article';
          const hasHtmlInTitle =
            typeof titleText === 'string' && titleText.includes('<') && titleText.includes('>');

          if (hasHtmlInTitle) {
            return (
              <HtmlRenderer
                html={titleText}
                variant="titleMedium"
                style={{
                  // fontWeight removed - using variant default
                  marginBottom: SPACING.sm,
                  color: theme.colors.onSurface,
                }}
                maxLines={2}
              />
            );
          }

          return (
            <Text
              variant="titleMedium"
              style={{
                fontWeight: '700', // Increased from 600 to 700 for stronger hierarchy
                marginBottom: SPACING.sm,
                color: theme.colors.onSurface,
              }}
              numberOfLines={2}
            >
              {titleText}
            </Text>
          );
        })()}

        {/* Display extract - prefer HTML, fallback to plain text */}
        {article.extract_html ? (
          <HtmlRenderer
            html={article.extract_html}
            maxLines={maxLines}
            style={{ paddingTop: SPACING.md }}
          />
        ) : article.extract ? (
          <Text
            variant="bodyMedium"
            style={{
              // fontSize removed - using variant default
              lineHeight: 21,
              color: theme.colors.onSurfaceVariant,
              paddingTop: SPACING.md,
            }} // Increased line height from 20 to 21 (1.5x ratio)
            numberOfLines={maxLines}
          >
            {article.extract}
          </Text>
        ) : null}
      </Card.Content>

      <ArticleImageModal
        visible={imageModalVisible}
        selectedImage={selectedImage}
        onClose={() => {
          setImageModalVisible(false);
          setSelectedImage(null);
        }}
      />
    </Card>
  );
}
