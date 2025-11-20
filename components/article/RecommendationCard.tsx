import { fetchArticleHtml } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Card, Icon, IconButton, Menu, ProgressBar, Text, TouchableRipple, useTheme } from 'react-native-paper';

import { LAYOUT } from '../../constants/layout';
import { getHoverStyles, MOTION } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { useReadingProgress, useReducedMotion, useVisitedArticles } from '../../hooks';
import { RecommendationCardProps } from '../../types/components';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import { copyArticleUrl, shareArticle } from '../../utils/shareUtils';
import ResponsiveImage from '../common/ResponsiveImage';

const RecommendationCard = React.memo(function RecommendationCard({
  item,
  index,
  isBookmarked,
  onBookmarkToggle,
  onRemove,
}: RecommendationCardProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { visitedArticles } = useVisitedArticles();
  const { getProgress } = useReadingProgress();
  const { reducedMotion } = useReducedMotion();
  const queryClient = useQueryClient();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0.95)).current;

  const isSmallScreen = width < LAYOUT.TABLET_BREAKPOINT;

  const isVisited = useMemo(
    () => visitedArticles.some((visited) => visited.title === item.title),
    [visitedArticles, item.title]
  );

  const isBookmarkedArticle = isBookmarked(item.title);
  const readingProgress = isBookmarkedArticle ? getProgress(item.title) : 0;

  // MD3 stagger animation: 20ms delay, limited to first 10 items
  // Skipping animations on web for performance with many cards
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

  const handleShare = async (e: any) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    try {
      await shareArticle(item.title, item.description);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Failed to share article:', error);
      }
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handlePress = () => {
    if (!contextMenuVisible) {
      router.push(`/article/${encodeURIComponent(item.title)}`);
    }
  };

  const handleLongPress = () => {
    hapticMedium();
    setContextMenuVisible(true);
  };

  const handleContextMenu = (e: any) => {
    if (Platform.OS === 'web') {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      setContextMenuVisible(true);
    }
  };

  // Prefetch article HTML on hover for faster navigation
  const handleMouseEnter = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
      // Prefetch article HTML when user hovers over card
      queryClient.prefetchQuery({
        queryKey: ['article-html', item.title],
        queryFn: () => fetchArticleHtml(item.title),
        staleTime: 30 * 60 * 1000, // 30 minutes - matches useArticleHtml config
      });
    }
  }, [item.title, queryClient]);

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  const handleOpenArticle = () => {
    hapticLight();
    setContextMenuVisible(false);
    router.push(`/article/${encodeURIComponent(item.title)}`);
  };

  const handleContextBookmark = () => {
    hapticLight();
    setContextMenuVisible(false);
    onBookmarkToggle(item);
  };

  const handleContextShare = async () => {
    hapticLight();
    setContextMenuVisible(false);
    try {
      await shareArticle(item.title, item.description);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Failed to share article:', error);
      }
    }
  };

  const handleContextCopy = async () => {
    hapticLight();
    setContextMenuVisible(false);
    try {
      await copyArticleUrl(item.title);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Failed to copy article URL:', error);
      }
    }
  };

  const imageWidth = isSmallScreen ? 100 : 140;
  const cardHeight = isSmallScreen ? 120 : 140;

  // Using shared global style element for MD3 focus styles (2px outline, 2px offset, primary color)
  const pressableRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS === 'web' && pressableRef.current) {
      const element = pressableRef.current as any;
      const STYLE_ID = 'md3-focus-styles';
      
      let styleElement = document.getElementById(STYLE_ID) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = STYLE_ID;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `
        [data-focusable="true"]:focus-visible {
          outline: 2px solid ${theme.colors.primary};
          outline-offset: 2px;
          border-radius: ${theme.roundness * 1.25}px;
        }
        
        /* Remove default focus outline for better MD3 compliance */
        [data-focusable="true"]:focus:not(:focus-visible) {
          outline: none;
        }
      `;
      
      element.setAttribute('data-focusable', 'true');
      
      // It will be updated when theme changes, which is fine
    }
  }, [theme.colors.primary, theme.roundness]);

  return (
    <Animated.View
      style={{
        width: '100%',
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        ref={pressableRef}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...(Platform.OS === 'web' && {
          onContextMenu: handleContextMenu,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          style: {
            width: '100%',
            cursor: 'pointer',
            outlineStyle: 'none', // Remove default outline, we'll add custom focus ring
          },
        })}
        style={Platform.OS !== 'web' ? { width: '100%' } : undefined}
        accessibilityLabel={`Open recommended article: ${item.title}`}
        accessibilityHint={`Opens the recommended article: ${item.title}. Long press for more options.`}
      >
        <Card
          elevation={isHovered && Platform.OS === 'web' ? 4 : 1}
          style={{
            width: '100%',
            maxWidth: '100%',
            borderRadius: theme.roundness * 3,
            backgroundColor: (isPressed || (isHovered && Platform.OS === 'web'))
              ? theme.colors.surface
              : theme.colors.elevation.level2,
            overflow: 'hidden',
            ...(Platform.OS === 'web' && getHoverStyles(isHovered, reducedMotion, { scale: 1.01 })),
          }}
        >
          <View style={{ flexDirection: 'row', height: cardHeight }}>
            <View
              style={{
                width: imageWidth,
                height: cardHeight,
                backgroundColor: theme.colors.surfaceVariant,
                position: 'relative',
              }}
            >
              {item.thumbnail ? (
                <ResponsiveImage
                  source={{
                    source: item.thumbnail.source,
                    width: item.thumbnail.width || imageWidth,
                    height: item.thumbnail.height || cardHeight,
                  }}
                  contentFit="cover"
                  style={{
                    width: imageWidth,
                    height: cardHeight,
                  }}
                  alt={`Thumbnail for ${item.title}`}
                  skipOptimization={true} // Use default thumbnail without optimization
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
              {isVisited && (
                <View
                  style={{
                    position: 'absolute',
                    top: SPACING.xs + 2,
                    right: SPACING.xs + 2,
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: theme.roundness * 2,
                    paddingHorizontal: SPACING.xs + 2,
                    paddingVertical: SPACING.xs / 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING.xs - 1,
                  }}
                >
                  <IconButton
                    icon="check-circle"
                    iconColor={theme.colors.onPrimaryContainer}
                    size={TYPOGRAPHY.bodySmall}
                    style={{ margin: 0 }}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                    Visited
                  </Text>
                </View>
              )}
            </View>

            {/* Article Content - Right side */}
            <Card.Content
              style={{
                flex: 1,
                padding: SPACING.base,
                paddingBottom: SPACING.base + SPACING.xs,
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
                    marginBottom: isSmallScreen ? SPACING.xs + 2 : SPACING.sm,
                  }}
                >
                  <Text
                    variant={isSmallScreen ? 'titleSmall' : 'titleMedium'}
                    style={{
                      lineHeight: (isSmallScreen ? TYPOGRAPHY.titleSmall : TYPOGRAPHY.titleMedium) * TYPOGRAPHY.lineHeightNormal,
                      color: theme.colors.onSurface,
                      flex: 1,
                      marginRight: SPACING.sm,
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
                      size={isSmallScreen ? TYPOGRAPHY.bodyMedium : TYPOGRAPHY.bodyLarge}
                      accessibilityLabel={`Share ${item.title}`}
                      accessibilityHint="Shares this article with others"
                    />
                    <IconButton
                      icon={isBookmarked(item.title) ? 'bookmark' : 'bookmark-outline'}
                      iconColor={isBookmarked(item.title) ? theme.colors.primary : theme.colors.onSurfaceVariant}
                      onPress={(e) => {
                        if (e && typeof e.stopPropagation === 'function') {
                          e.stopPropagation();
                        }
                        onBookmarkToggle(item);
                      }}
                      style={{ margin: 0 }}
                      size={isSmallScreen ? TYPOGRAPHY.bodyMedium : TYPOGRAPHY.bodyLarge}
                      accessibilityLabel={
                        isBookmarked(item.title)
                          ? `Remove ${item.title} from bookmarks`
                          : `Add ${item.title} to bookmarks`
                      }
                      accessibilityHint={
                        isBookmarked(item.title)
                          ? 'Removes article from bookmarks'
                          : 'Adds article to bookmarks'
                      }
                    />
                    {onRemove && (
                      <TouchableRipple
                        onPress={(e) => {
                          if (e && typeof e.stopPropagation === 'function') {
                            e.stopPropagation();
                          }
                          onRemove(item.title);
                        }}
                        style={{ margin: 0, padding: SPACING.sm, borderRadius: theme.roundness * 2 }}
                        accessibilityLabel={`Remove ${item.title} from history`}
                        accessibilityHint="Removes this article from your reading history"
                        accessibilityRole="button"
                      >
                        <Icon source="delete-outline" size={isSmallScreen ? TYPOGRAPHY.bodyMedium : TYPOGRAPHY.bodyLarge} color={theme.colors.error} />
                      </TouchableRipple>
                    )}
                  </View>
                </View>

                {isBookmarkedArticle && readingProgress > 0 && (
                  <View style={{ marginBottom: SPACING.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs - 1 }}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Reading progress
                      </Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                        {readingProgress}%
                      </Text>
                    </View>
                    <ProgressBar
                      progress={readingProgress / 100}
                      color={theme.colors.primary}
                      style={{ height: SPACING.xs - 1, borderRadius: theme.roundness * 0.5 }}
                    />
                  </View>
                )}

                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    lineHeight: (isSmallScreen ? TYPOGRAPHY.bodyMedium : TYPOGRAPHY.bodyLarge) * TYPOGRAPHY.lineHeightNormal,
                    fontSize: isSmallScreen ? TYPOGRAPHY.bodyMedium : TYPOGRAPHY.bodyLarge,
                    marginBottom: SPACING.xs,
                  }}
                  numberOfLines={2}
                >
                  {isSmallScreen
                    ? item.description || item.extract || 'No summary available'
                    : item.extract || item.description || 'No summary available'}
                </Text>
              </View>
            </Card.Content>
          </View>
        </Card>
      </Pressable>

      {/* Long-press Context Menu */}
      <Menu
        visible={contextMenuVisible}
        onDismiss={() => setContextMenuVisible(false)}
        anchor={<View style={{ position: 'absolute', left: -1000, top: -1000 }} />}
        contentStyle={{ backgroundColor: theme.colors.surface }}
      >
        <Menu.Item onPress={handleOpenArticle} leadingIcon="open-in-new" title="Open Article" />
        <Menu.Item
          onPress={handleContextBookmark}
          leadingIcon={isBookmarked(item.title) ? 'bookmark' : 'bookmark-outline'}
          title={isBookmarked(item.title) ? 'Remove Bookmark' : 'Add Bookmark'}
        />
        <Menu.Item onPress={handleContextCopy} leadingIcon="content-copy" title="Copy Link" />
        <Menu.Item onPress={handleContextShare} leadingIcon="share-variant" title="Share" />
      </Menu>
    </Animated.View>
  );
});

export default RecommendationCard;
