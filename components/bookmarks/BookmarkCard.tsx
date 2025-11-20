import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { Card, Chip, IconButton, ProgressBar, Text, useTheme } from 'react-native-paper';
import { getHoverStyles } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import ResponsiveImage from '../common/ResponsiveImage';


import { LAYOUT } from '../../constants/layout';
import { useSnackbar } from '../../context/SnackbarContext';
import { useBookmarks, useReadingProgress, useReducedMotion } from '../../hooks';
import { BookmarkCardProps } from '../../types/components';

const BookmarkCard = React.memo(function BookmarkCard({
  item,
  onRemoveBookmark,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
  onLongPress,
  onEdit,
  onTagPress,
  onShowAllTags,
}: BookmarkCardProps & {
  onEdit?: () => void;
  onLongPress?: () => void;
  onTagPress?: (tag: string) => void;
  onShowAllTags?: () => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { getProgress } = useReadingProgress();
  const { downloadArticle, isArticleDownloaded } = useBookmarks();
  const { reducedMotion } = useReducedMotion();
  const { showSuccess, showError } = useSnackbar();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const readingProgress = getProgress(item.title);
  const isDownloaded = isArticleDownloaded(item.title);

  // Determine if we're on a small screen (mobile)
  const isSmallScreen = width < LAYOUT.TABLET_BREAKPOINT;

  // Responsive dimensions for horizontal card layout
  // Increased height to accommodate tags, description, and progress bar
  const imageWidth = isSmallScreen ? 100 : 120;
  const cardHeight = isSmallScreen ? 160 : 180;

  const handleDownload = async (e: GestureResponderEvent) => {
    e.stopPropagation(); // Prevent card navigation
    setIsDownloading(true);
    try {
      const success = await downloadArticle(item.title);
      if (success) {
        showSuccess('Article downloaded for offline reading');
      } else {
        showError('Failed to download article');
      }
    } catch (error) {
      showError('Failed to download article');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCardPress = () => {
    if (selectionMode && onToggleSelection) {
      onToggleSelection();
    } else {
      router.push(`/article/${encodeURIComponent(item.title)}`);
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
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

  // Web-specific: Add MD3-compliant focus styles
  const pressableRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS === 'web' && pressableRef.current) {
      const element = pressableRef.current as any;
      const STYLE_ID = 'md3-focus-styles';
      
      // Get or create the shared style element
      let styleElement = document.getElementById(STYLE_ID) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = STYLE_ID;
        document.head.appendChild(styleElement);
      }
      
      // Update the style content with MD3-compliant focus styles
      styleElement.textContent = `
        [data-focusable="true"]:focus-visible {
          outline: 2px solid ${theme.colors.primary};
          outline-offset: 2px;
          border-radius: ${theme.roundness * 1.25}px;
        }
        
        [data-focusable="true"]:focus:not(:focus-visible) {
          outline: none;
        }
      `;
      
      element.setAttribute('data-focusable', 'true');
    }
  }, [theme.colors.primary, theme.roundness]);

  return (
    <Pressable
      ref={pressableRef}
      onPress={handleCardPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...(Platform.OS === 'web' && {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        style: {
          width: '100%',
          cursor: 'pointer',
          outlineStyle: 'none', // Remove default outline, we'll add custom focus ring
        },
      })}
      style={Platform.OS !== 'web' ? { width: '100%' } : undefined} // Spacing handled by parent wrapper
      accessibilityLabel={`Open article: ${item.title}`}
      accessibilityHint={`Opens the ${item.title} article. Long press to select.`}
    >
      <Card
        elevation={isHovered && Platform.OS === 'web' ? 4 : 1} // M3: Default elevation 1dp, increases to 4dp on hover
        style={{
          width: '100%',
          maxWidth: '100%',
          minHeight: cardHeight,
          borderRadius: theme.roundness * 3, // M3: 12dp corner radius (4dp * 3)
          // Only show border when selected in selection mode (for visual feedback)
          // Otherwise rely on elevation for depth (MD3 best practice)
          borderWidth: selectionMode && isSelected ? 2 : 0,
          borderColor: selectionMode && isSelected ? theme.colors.primary : 'transparent',
          backgroundColor:
            isPressed || (isHovered && Platform.OS === 'web')
              ? theme.colors.surface
              : theme.colors.elevation.level2,
          overflow: 'hidden',
          ...(Platform.OS === 'web' &&
            getHoverStyles(isHovered, reducedMotion, { scale: 1.01 })),
        }}
      >
        <View style={{ flexDirection: 'row', height: cardHeight }}>
          {/* Selection Checkbox */}
          {selectionMode && (
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                zIndex: 10,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.roundness * 1.25, // Use theme roundness (slightly larger for circular buttons)
              }}
            >
              <IconButton
                icon={isSelected ? 'check-circle' : 'circle-outline'}
                iconColor={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                size={20}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleSelection?.();
                }}
                style={{ margin: 0 }}
              />
            </View>
          )}

          {/* Article Image - Left side */}
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
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  No Image
                </Text>
              </View>
            )}
          </View>

          {/* Article Content - Right side */}
          <Card.Content
            style={{
              flex: 1,
              padding: isSmallScreen ? SPACING.md : SPACING.lg,
              justifyContent: 'space-between',
              height: cardHeight,
              minHeight: cardHeight,
            }}
          >
            <View style={{ flex: 1, minHeight: 0, overflow: 'visible' }}>
              {/* Title and Actions */}
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
                {!selectionMode && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      flexShrink: 0,
                      marginLeft: SPACING.xs,
                      paddingTop: SPACING.xs / 2,
                    }}
                  >
                    {onEdit && (
                      <IconButton
                        icon="tag"
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={(e) => {
                          e.stopPropagation();
                          onEdit();
                        }}
                        style={{ margin: 0 }}
                        size={isSmallScreen ? TYPOGRAPHY.bodyMedium : TYPOGRAPHY.bodyLarge}
                        accessibilityLabel={`Edit tags for ${item.title}`}
                        accessibilityHint="Edit bookmark tags"
                      />
                    )}
                    <IconButton
                      icon={isDownloaded ? 'check-circle' : 'download'}
                      iconColor={
                        isDownloaded ? theme.colors.primary : theme.colors.onSurfaceVariant
                      }
                      onPress={handleDownload}
                      disabled={isDownloading || isDownloaded}
                      loading={isDownloading}
                      style={{ margin: 0 }}
                      size={isSmallScreen ? TYPOGRAPHY.bodyMedium : TYPOGRAPHY.bodyLarge}
                      accessibilityLabel={
                        isDownloaded
                          ? `${item.title} is downloaded`
                          : `Download ${item.title} for offline reading`
                      }
                      accessibilityHint={
                        isDownloaded
                          ? 'Article is already downloaded'
                          : 'Downloads this article for offline reading'
                      }
                    />
                    <IconButton
                      icon="bookmark-off"
                      iconColor={theme.colors.error}
                      onPress={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(item.title);
                      }}
                      style={{ margin: 0 }}
                      size={isSmallScreen ? TYPOGRAPHY.bodyMedium : TYPOGRAPHY.bodyLarge}
                      accessibilityLabel={`Remove ${item.title} from bookmarks`}
                      accessibilityHint={`Removes this article from your bookmarks`}
                    />
                  </View>
                )}
              </View>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: SPACING.xs,
                    marginBottom: SPACING.xs + 2,
                    marginTop: SPACING.xs / 2,
                  }}
                >
                  {item.tags.slice(0, 2).map((tag) => (
                    <Chip
                      key={tag}
                      style={{
                        height: 28,
                        paddingHorizontal: SPACING.xs + 2,
                        paddingVertical: 0,
                        justifyContent: 'center',
                      }}
                      textStyle={{
                        lineHeight: TYPOGRAPHY.bodySmall,
                      }}
                      mode="flat"
                      compact
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onTagPress?.(tag);
                      }}
                      accessible={true}
                      accessibilityLabel={`Filter by tag: ${tag}`}
                      accessibilityHint="Filters bookmarks by this tag"
                    >
                      {tag}
                    </Chip>
                  ))}
                  {item.tags.length > 2 && (
                    <Chip
                      style={{
                        height: 28,
                        paddingHorizontal: SPACING.xs + 2,
                        paddingVertical: 0,
                        justifyContent: 'center',
                      }}
                      textStyle={{
                        lineHeight: TYPOGRAPHY.bodySmall,
                      }}
                      mode="flat"
                      compact
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onShowAllTags?.();
                      }}
                      accessible={true}
                      accessibilityLabel={`Show all ${item.tags.length} tags`}
                      accessibilityHint="Opens a modal showing all tags for this bookmark"
                    >
                      +{item.tags.length - 2}
                    </Chip>
                  )}
                </View>
              )}

              {/* Summary */}
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  lineHeight: isSmallScreen ? 20 : 22,
                  fontSize: isSmallScreen ? 12 : 13,
                  marginTop: 4,
                  marginBottom: readingProgress > 0 ? 8 : 0, // Add spacing before progress bar if it exists
                }}
                numberOfLines={isSmallScreen ? 2 : 3}
              >
                {item.summary || 'No summary available'}
              </Text>

              {/* Reading Progress Indicator */}
              {readingProgress > 0 && (
                <View style={{ marginBottom: 4, marginTop: 0 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 2,
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        // fontSize removed - using variant default
                      }}
                    >
                      Progress
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: '600',
                        // fontSize removed - using variant default
                      }}
                    >
                      {readingProgress}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={readingProgress / 100}
                    color={theme.colors.primary}
                    style={{ height: 2, borderRadius: theme.roundness * 0.5 }} // 2dp for thin progress bar (4dp * 0.5)
                  />
                </View>
              )}
            </View>

            {/* Footer - Bookmarked date */}
            {/* <Text variant="labelSmall" style={{ 
              color: theme.colors.onSurfaceVariant,
              fontSize: 9,
              marginTop: 4,
            }}>
              {new Date(item.bookmarkedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text> */}
          </Card.Content>
        </View>
      </Card>
    </Pressable>
  );
});

export default BookmarkCard;
