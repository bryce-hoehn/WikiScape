import { fetchArticleHtml } from '@/api';
import HtmlRenderer from '@/components/common/HtmlRenderer';
import { LAYOUT } from '@/constants/layout';
import { getHoverStyles } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useReducedMotion } from '@/hooks';
import useBookmarkToggle from '@/hooks/ui/useBookmarkToggle';
import useThumbnailLoader from '@/hooks/ui/useThumbnailLoader';
import { shareArticle } from '@/utils/shareUtils';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { memo, ReactNode, Suspense, useCallback, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { Card, IconButton, Text, type MD3Theme } from 'react-native-paper';
import { DidYouKnowItem } from '../../types/api/featured';
import { RecommendationItem } from '../../types/components';
import ResponsiveImage from '../common/ResponsiveImage';

// Lazy load ArticleImageModal - only needed when user opens an image
const ArticleImageModal = React.lazy(() => import('../article/ArticleImageModal'));

export type FeaturedCardItem = RecommendationItem | DidYouKnowItem;

interface BaseFeaturedCardProps {
  item: FeaturedCardItem;
  itemWidth?: number;
  theme: MD3Theme;
  // Configuration functions
  getArticleTitle: (item: FeaturedCardItem) => string | null;
  getDescription: (item: FeaturedCardItem) => string;
  getTitle: (item: FeaturedCardItem) => string;
  // Optional customizations
  headerContent?: ReactNode; // For year display in OnThisDayCard
  formatTitle?: (title: string) => string; // For title formatting (e.g., NewsCard replaces _)
  renderContent?: (item: FeaturedCardItem, description: string) => ReactNode; // Custom content rendering
}

/**
 * Base component for all featured content cards
 * Consolidates common structure: Card, image, title, and content
 */
function BaseFeaturedCard({
  item,
  itemWidth,
  theme,
  getArticleTitle,
  getDescription,
  getTitle,
  headerContent,
  formatTitle,
  renderContent,
}: BaseFeaturedCardProps) {
  const { width } = useWindowDimensions();
  const { thumbnail, isLoading: isLoadingThumbnail } = useThumbnailLoader(item);
  const { handleBookmarkToggle, isBookmarked } = useBookmarkToggle();
  const { reducedMotion } = useReducedMotion();
  const articleTitle = getArticleTitle(item);
  const title = getTitle(item);
  const description = getDescription(item);
  const displayTitle = formatTitle ? formatTitle(title) : title;
  const hasHtmlContent = description.includes('<') && description.includes('>');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; alt?: string } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Determine if we're on a small screen (mobile)
  const isSmallScreen = width < LAYOUT.TABLET_BREAKPOINT;

  // Handle card press - navigate to article if available
  const handleCardPress = useCallback(() => {
    if (articleTitle) {
      router.push(`/article/${encodeURIComponent(articleTitle)}`);
    }
  }, [articleTitle]);

  const handleShare = useCallback(
    async (e: any) => {
      e?.stopPropagation?.(); // Prevent card navigation
      if (!articleTitle) return;
      try {
        await shareArticle(articleTitle, description);
      } catch (error) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Failed to share article:', error);
        }
      }
    },
    [articleTitle, description]
  );

  const handleBookmark = useCallback(
    (e: any) => {
      e?.stopPropagation?.(); // Prevent card navigation
      if (!articleTitle) return;
      handleBookmarkToggle({
        title: articleTitle,
        description: description,
        thumbnail: thumbnail
          ? {
              source: thumbnail,
              width: undefined,
              height: undefined,
            }
          : undefined,
      });
    },
    [articleTitle, description, thumbnail, handleBookmarkToggle]
  );

  const handleImagePress = useCallback((image: { uri: string; alt?: string }) => {
    setSelectedImage(image);
    setImageModalVisible(true);
  }, []);

  // Web-specific: Hover handlers with prefetching
  const queryClient = useQueryClient();
  const handleMouseEnter = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
      // Prefetch article HTML on hover
      if (articleTitle) {
        queryClient.prefetchQuery({
          queryKey: ['article-html', articleTitle],
          queryFn: () => fetchArticleHtml(articleTitle),
          staleTime: 30 * 60 * 1000, // 30 minutes - matches useArticleHtml config
        });
      }
    }
  }, [articleTitle, queryClient]);

  const handleMouseLeave = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  }, []);

  // Default content rendering
  const defaultRenderContent = () => {
    if (hasHtmlContent) {
      return <HtmlRenderer html={description} maxLines={4} style={{ paddingTop: SPACING.md }} />;
    }
    return (
      <Text
        variant="bodyMedium"
        style={{ fontSize: 14, lineHeight: 18, paddingTop: SPACING.md }}
        numberOfLines={4}
      >
        {description}
      </Text>
    );
  };

  const content = renderContent ? renderContent(item, description) : defaultRenderContent();

  // Fixed card height to ensure consistency across all carousel items
  const cardHeight = 410; // Image (260) + Content section (260)
  const imageHeight = 240;
  const contentHeight = 260;

  return (
    <View style={{ flex: 1, height: cardHeight }}>
      {headerContent ? <View style={{ marginBottom: SPACING.md }}>{headerContent}</View> : null}
      <Card
        elevation={isHovered && Platform.OS === 'web' ? 4 : 2}
        style={{
          width: itemWidth || '100%',
          maxWidth: itemWidth || '100%',
          height: cardHeight,
          borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
          overflow: 'hidden',
          backgroundColor:
            isHovered && Platform.OS === 'web'
              ? theme.colors.surface
              : theme.colors.elevation.level2,
          display: 'flex',
          flexDirection: 'column',
          ...(Platform.OS === 'web' &&
            getHoverStyles(isHovered, reducedMotion, { scale: 1.01 })),
        }}
        onPress={handleCardPress}
        {...(Platform.OS === 'web' && {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        })}
      >
        <View
          style={{
            height: imageHeight,
            width: '100%',
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          {isLoadingThumbnail ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Loading image...
              </Text>
            </View>
          ) : thumbnail ? (
            <ResponsiveImage
              source={{
                source: thumbnail,
                width: 400,
                height: imageHeight,
              }}
              contentFit="cover"
              style={{ height: imageHeight, width: '100%' }}
              alt={`Thumbnail for ${displayTitle}`}
              title={displayTitle}
              onPress={handleImagePress}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No Image
              </Text>
            </View>
          )}
        </View>
        <Card.Content
          style={{
            padding: SPACING.md,
            width: '100%',
            maxWidth: '100%',
            height: contentHeight,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: SPACING.xs,
            }}
          >
            <Text
              variant="titleMedium"
              style={{
                fontWeight: '700',
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
            {articleTitle && (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                <IconButton
                  icon="share-variant"
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={handleShare}
                  style={{
                    margin: 0,
                    backgroundColor: 'transparent',
                  }}
                  size={isSmallScreen ? 18 : 20}
                  accessibilityLabel={`Share ${displayTitle}`}
                  accessibilityHint="Shares this article with others"
                />
                <IconButton
                  icon={isBookmarked(articleTitle) ? 'bookmark' : 'bookmark-outline'}
                  iconColor={
                    isBookmarked(articleTitle)
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                  onPress={handleBookmark}
                  style={{
                    margin: 0,
                    backgroundColor: 'transparent',
                  }}
                  size={isSmallScreen ? 18 : 20}
                  accessibilityLabel={
                    isBookmarked(articleTitle)
                      ? `Remove ${displayTitle} from bookmarks`
                      : `Add ${displayTitle} to bookmarks`
                  }
                  accessibilityHint={
                    isBookmarked(articleTitle)
                      ? 'Removes article from bookmarks'
                      : 'Adds article to bookmarks'
                  }
                />
              </View>
            )}
          </View>
          <View style={{ width: '100%', maxWidth: '100%', flex: 1, overflow: 'hidden' }}>
            {content}
          </View>
        </Card.Content>
      </Card>

      {imageModalVisible && (
        <Suspense fallback={null}>
          <ArticleImageModal
            visible={imageModalVisible}
            selectedImage={selectedImage}
            onClose={() => {
              setImageModalVisible(false);
              setSelectedImage(null);
            }}
          />
        </Suspense>
      )}
    </View>
  );
}

export default memo(BaseFeaturedCard);
