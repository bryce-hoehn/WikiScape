import { LAYOUT } from '@/constants/layout';
import { getHoverStyles } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useFeaturedContent } from '@/context/FeaturedContentContext';
import { useReducedMotion } from '@/hooks';
import useBookmarkToggle from '@/hooks/ui/useBookmarkToggle';
import { shareArticle } from '@/utils/shareUtils';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { Card, IconButton, TouchableRipple, useTheme } from 'react-native-paper';
import ArticleImageModal from '../article/ArticleImageModal';
import HtmlRenderer from '../common/HtmlRenderer';

export default function FeaturedImageCard() {
  const { featuredContent } = useFeaturedContent();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const img = featuredContent?.image;
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { reducedMotion } = useReducedMotion();
  const { handleBookmarkToggle, isBookmarked } = useBookmarkToggle();

  if (!img) {
    return null;
  }

  // Determine if we're on a small screen (mobile)
  const isSmallScreen = width < LAYOUT.TABLET_BREAKPOINT;

  // Fixed height to match carousel cards (410px)
  const cardHeight = 410;
  const imageHeight = 240;
  const contentHeight = 170;

  const handleShare = async (e: any) => {
    e?.stopPropagation?.(); // Prevent card navigation
    try {
      await shareArticle(img.title, img.description.text);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Failed to share article:', error);
      }
    }
  };

  const handleBookmark = (e: any) => {
    e?.stopPropagation?.(); // Prevent card navigation
    handleBookmarkToggle({
      title: img.title,
      description: img.description.text,
      thumbnail: img.image
        ? {
            source: img.image.source,
            width: img.image.width,
            height: img.image.height,
          }
        : undefined,
    });
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
        {...(Platform.OS === 'web' && {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        })}
      >
        {img.image && (
          <TouchableRipple
            onPress={() => setImageModalVisible(true)}
            style={{
              width: '100%',
              height: imageHeight,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: img.image.source }}
              contentFit="cover"
              style={{
                width: '100%',
                height: '100%',
                borderTopLeftRadius: theme.roundness * 1.25,
                borderTopRightRadius: theme.roundness * 1.25,
              }}
              alt={`Thumbnail for ${img.title || 'Featured Picture'}`}
            />
          </TouchableRipple>
        )}
        <Card.Content
          style={{
            backgroundColor: theme.colors.elevation.level2,
            height: contentHeight,
            padding: SPACING.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: isSmallScreen ? 6 : 8,
            }}
          >
            <View style={{ flex: 1 }} />
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
                accessibilityLabel={`Share ${img.title}`}
                accessibilityHint="Shares this article with others"
              />
              <IconButton
                icon={isBookmarked(img.title) ? 'bookmark' : 'bookmark-outline'}
                iconColor={
                  isBookmarked(img.title) ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
                onPress={handleBookmark}
                style={{
                  margin: 0,
                  backgroundColor: 'transparent',
                }}
                size={isSmallScreen ? 18 : 20}
                accessibilityLabel={
                  isBookmarked(img.title)
                    ? `Remove ${img.title} from bookmarks`
                    : `Add ${img.title} to bookmarks`
                }
                accessibilityHint={
                  isBookmarked(img.title)
                    ? 'Removes article from bookmarks'
                    : 'Adds article to bookmarks'
                }
              />
            </View>
          </View>
          <HtmlRenderer
            html={img.description.html}
            maxLines={4}
            style={{ color: theme.colors.onSurface }}
          />
        </Card.Content>
      </Card>

      <ArticleImageModal
        visible={imageModalVisible}
        selectedImage={{ uri: img.image.source, alt: img.title || 'Featured Picture' }}
        onClose={() => setImageModalVisible(false)}
      />
    </>
  );
}
