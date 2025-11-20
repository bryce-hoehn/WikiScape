import { fetchArticleHtml } from '@/api';
import HtmlRenderer from '@/components/common/HtmlRenderer';
import { LAYOUT } from '@/constants/layout';
import { getHoverStyles, MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useReducedMotion, useVisitedArticles } from '@/hooks';
import useBookmarkToggle from '@/hooks/ui/useBookmarkToggle';
import useThumbnailLoader from '@/hooks/ui/useThumbnailLoader';
import { shareArticle } from '@/utils/shareUtils';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { DidYouKnowItem } from '../../types/api/featured';
import { RecommendationItem } from '../../types/components';
import { CardType } from '../../utils/cardUtils';
import ResponsiveImage from '../common/ResponsiveImage';

export type HorizontalFeaturedCardItem = RecommendationItem | DidYouKnowItem;

interface HorizontalFeaturedCardProps {
  item: HorizontalFeaturedCardItem;
  index: number;
  cardType?: CardType;
}

/**
 * Horizontal featured card component that combines the horizontal layout
 * of RecommendationCard with the HTML parsing capabilities of FeaturedCards
 */
const HorizontalFeaturedCard = memo(function HorizontalFeaturedCard({
  item,
  index,
  cardType = 'generic',
}: HorizontalFeaturedCardProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { visitedArticles } = useVisitedArticles();
  const { reducedMotion } = useReducedMotion();
  const { thumbnail, isLoading: isLoadingThumbnail } = useThumbnailLoader(item);
  const { handleBookmarkToggle, isBookmarked } = useBookmarkToggle();
  const queryClient = useQueryClient();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0.95)).current;

  const isSmallScreen = width < LAYOUT.TABLET_BREAKPOINT;
  
  // Extract article title based on card type
  const articleTitle = useMemo(() => {
    if (cardType === 'news') {
      if ('links' in item && item.links?.[0]?.title) return item.links[0].title;
      if ('articleTitle' in item && item.articleTitle) return item.articleTitle;
      if ('title' in item && item.title) return item.title;
    } else if (cardType === 'did-you-know') {
      if ('html' in item && item.html) {
        const titleMatch = item.html.match(/title="([^"]*)"/);
        const title = titleMatch?.[1];
        return title && title !== 'Did You Know?' ? title : null;
      }
    } else if (cardType === 'on-this-day') {
      if ('page' in item && item.page?.title) return item.page.title;
      if ('articleTitle' in item && item.articleTitle) return item.articleTitle;
    } else {
      // generic
      if ('articleTitle' in item && item.articleTitle) return item.articleTitle;
      if ('page' in item && item.page?.title) return item.page.title;
      if ('title' in item && item.title && item.title !== 'Did You Know?' && !item.title.includes('...')) {
        return item.title;
      }
      if ('pageid' in item && item.pageid) return item.title || null;
    }
    return null;
  }, [item, cardType]);

  const isVisited = useMemo(
    () => (articleTitle ? visitedArticles.some((visited) => visited.title === articleTitle) : false),
    [visitedArticles, articleTitle]
  );

  // Extract display title based on card type
  const displayTitle = useMemo(() => {
    if (cardType === 'did-you-know') {
      if ('html' in item && item.html) {
        const titleMatch = item.html.match(/title="([^"]*)"/);
        return titleMatch?.[1] || 'Did You Know?';
      }
      return 'Did You Know?';
    } else if (cardType === 'news') {
      const title = 'title' in item ? item.title || 'News Story' : 'News Story';
      return title.replace(/_/g, ' ');
    } else if (cardType === 'on-this-day') {
      return 'title' in item ? item.title || 'On This Day' : 'On This Day';
    } else {
      return 'title' in item ? item.title || 'Article' : 'Article';
    }
  }, [item, cardType]);

  // Extract description based on card type
  const description = useMemo(() => {
    if (cardType === 'did-you-know') {
      if ('html' in item && item.html) {
        return item.html;
      }
      return 'No content available';
    } else if (cardType === 'news') {
      if ('description' in item) {
        return item.description || item.story || 'Latest news';
      }
      return 'Latest news';
    } else if (cardType === 'on-this-day') {
      if ('description' in item) {
        return item.description || item.text || item.html || 'No content available';
      }
      return 'No content available';
    } else {
      // generic
      if ('description' in item) {
        return item.description || item.title || 'No content available';
      }
      return 'No content available';
    }
  }, [item, cardType]);
  const hasHtmlContent = description.includes('<') && description.includes('>');

  // MD3 stagger animation: 20ms delay, limited to first 10 items
  React.useEffect(() => {
    if (reducedMotion || Platform.OS === 'web') {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      return;
    }

    const useNativeDriver = true;
    const staggerDelay = index < MOTION.staggerLimit ? index * MOTION.staggerDelay : 0;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: MOTION.durationShort,
        delay: staggerDelay,
        useNativeDriver,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: MOTION.durationShort,
        delay: staggerDelay,
        useNativeDriver,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, index, reducedMotion]);

  const handlePress = useCallback(() => {
    if (articleTitle) {
      router.push(`/article/${encodeURIComponent(articleTitle)}`);
    }
  }, [articleTitle]);

  const handleShare = useCallback(
    async (e: any) => {
      e?.stopPropagation?.();
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
      e?.stopPropagation?.();
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


  // Prefetch article HTML on hover
  const handleMouseEnter = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
      if (articleTitle) {
        queryClient.prefetchQuery({
          queryKey: ['article-html', articleTitle],
          queryFn: () => fetchArticleHtml(articleTitle),
          staleTime: 30 * 60 * 1000,
        });
      }
    }
  }, [articleTitle, queryClient]);

  const handleMouseLeave = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  }, []);

  // Card dimensions
  const cardHeight = 120;
  const imageWidth = 120;

  return (
    <Animated.View
      style={{
        width: '100%',
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        {...(Platform.OS === 'web' && {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          style: {
            width: '100%',
            cursor: 'pointer',
          },
        })}
        style={Platform.OS !== 'web' ? { width: '100%' } : undefined}
        accessibilityLabel={`Open article: ${displayTitle}`}
        accessibilityHint={`Opens the article: ${displayTitle}`}
      >
        <Card
          elevation={isPressed || (isHovered && Platform.OS === 'web') ? 4 : 1} // M3: Default elevation 1dp, increases to 4dp on hover/press
          style={{
            width: '100%',
            maxWidth: '100%',
            borderRadius: theme.roundness * 3, // M3: 12dp corner radius (4dp * 3)
            backgroundColor:
              isPressed || (isHovered && Platform.OS === 'web')
                ? theme.colors.surface
                : theme.colors.elevation.level2,
            overflow: 'hidden',
            ...(Platform.OS === 'web' && getHoverStyles(isHovered, reducedMotion, { scale: 1.01 })),
          }}
        >
          <View style={{ flexDirection: 'row', height: cardHeight }}>
            {/* Image - Left side */}
            <View
              style={{
                width: imageWidth,
                height: cardHeight,
                backgroundColor: theme.colors.surfaceVariant,
                position: 'relative',
              }}
            >
              {isLoadingThumbnail ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Loading...
                  </Text>
                </View>
              ) : thumbnail ? (
                <ResponsiveImage
                  source={{
                    source: thumbnail,
                    width: imageWidth,
                    height: cardHeight,
                  }}
                  contentFit="cover"
                  style={{
                    width: imageWidth,
                    height: cardHeight,
                  }}
                  alt={`Thumbnail for ${displayTitle}`}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    No Image
                  </Text>
                </View>
              )}
              {/* Visited Badge */}
              {isVisited && (
                <View
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: theme.roundness * 2,
                    paddingHorizontal: SPACING.xs + 2,
                    paddingVertical: SPACING.xs / 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <IconButton
                    icon="check-circle"
                    iconColor={theme.colors.onPrimaryContainer}
                    size={12}
                    style={{ margin: 0 }}
                  />
                  <Text
                    variant="labelSmall"
                    style={{
                      color: theme.colors.onPrimaryContainer,
                    }}
                  >
                    Visited
                  </Text>
                </View>
              )}
            </View>

            {/* Content - Right side */}
            <Card.Content
              style={{
                flex: 1,
                padding: isSmallScreen ? SPACING.md : SPACING.lg,
                paddingBottom: isSmallScreen ? SPACING.md + 4 : SPACING.lg + 4,
                justifyContent: 'space-between',
                height: cardHeight,
              }}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: isSmallScreen ? 6 : 8,
                  }}
                >
                  <Text
                    variant={isSmallScreen ? 'titleSmall' : 'titleMedium'}
                    style={{
                      lineHeight: isSmallScreen ? 22 : 28,
                      color: theme.colors.onSurface,
                      flex: 1,
                      marginRight: 8,
                    }}
                    numberOfLines={isSmallScreen ? 2 : 2}
                  >
                    {displayTitle}
                  </Text>
                  {articleTitle && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

                {/* Description with HTML support */}
                {hasHtmlContent ? (
                  <HtmlRenderer
                    html={description}
                    maxLines={2}
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      lineHeight: isSmallScreen ? 21 : 26,
                      fontSize: isSmallScreen ? 14 : 17,
                      fontWeight: '400',
                    }}
                  />
                ) : (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      lineHeight: isSmallScreen ? 21 : 26,
                      fontSize: isSmallScreen ? 14 : 17,
                      fontWeight: '400',
                    }}
                    numberOfLines={2}
                  >
                    {description}
                  </Text>
                )}
              </View>
            </Card.Content>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
});

export default HorizontalFeaturedCard;

