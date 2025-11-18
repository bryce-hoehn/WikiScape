import { SPACING } from '@/constants/spacing';
import { useNsfwFilter } from '@/hooks';
import { DEFAULT_SELECTORS_TO_REMOVE, removeElement, selectAll } from '@/utils/articleParsing';
import { hapticLight, hapticMedium } from '@/utils/haptics';
import { extractAltText } from '@/utils/imageAltText';
import { isNsfwImage } from '@/utils/nsfwDetection';
import { copyArticleUrl, shareArticle } from '@/utils/shareUtils';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, useWindowDimensions, View } from 'react-native';
import { Menu, Text, TouchableRipple, useTheme } from 'react-native-paper';
import type { TNode } from 'react-native-render-html';

/**
 * Type guard for TNode with attributes
 */
type TNodeWithAttributes = TNode & {
  attributes?: Record<string, string>;
  parent?: TNodeWithAttributes;
};

/**
 * Type guard for text node with data
 */
type TNodeText = TNode & {
  type: 'text';
  data: string;
};

// Custom caption renderer for table captions
export const CaptionRenderer = ({ tnode }: { tnode: TNode }) => {
  const theme = useTheme();

  const textContent = tnode.children
    ?.map((child: TNode) => {
      // Extract text content from text nodes
      if (child.type === 'text' && 'data' in child) {
        return (child as TNodeText).data || '';
      }
      return '';
    })
    .join('')
    .trim();

  if (!textContent) {
    return null;
  }

  return (
    <View
      style={{
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8,
      }}
    >
      <Text
        selectable
        style={{
          textAlign: 'center',
          paddingHorizontal: 8,
          fontStyle: 'italic',
          color: theme.colors.onSurfaceVariant,
          // fontSize removed - using variant default
          lineHeight: 18,
        }}
      >
        {textContent}
      </Text>
    </View>
  );
};

// Custom image renderer using Expo Image with comprehensive URL resolution and fallbacks
export const ImageRenderer = React.memo(
  ({
    tnode,
    style,
    onImagePress,
    articleTitle,
  }: {
    tnode: TNode;
    style: React.CSSProperties;
    onImagePress: (image: { uri: string; alt?: string }) => void;
    articleTitle?: string;
  }) => {
    // Call all hooks first to maintain consistent hook order
    const theme = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    
    const maxWidth = React.useMemo(() => Math.min(windowWidth - 32, 800), [windowWidth]);
    
    const [errored, setErrored] = useState(false);
    const [isUnblurred, setIsUnblurred] = useState(false);
    const [isNsfw, setIsNsfw] = useState(false);
    const [imageContextMenuVisible, setImageContextMenuVisible] = useState(false);
    const { isNsfwFilterEnabled } = useNsfwFilter();
    const prevIsNsfwFilterEnabledRef = React.useRef(isNsfwFilterEnabled);

    // Reset unblurred state when filter is toggled (only when value actually changes)
    React.useEffect(() => {
      if (prevIsNsfwFilterEnabledRef.current !== isNsfwFilterEnabled) {
        prevIsNsfwFilterEnabledRef.current = isNsfwFilterEnabled;
        setIsUnblurred(false);
      }
    }, [isNsfwFilterEnabled]);

    // Memoize expensive srcset parsing to avoid re-computation on every render
    const extractBestSrcFromSrcset = useCallback((srcset: string): string => {
      try {
        const candidates = String(srcset)
          .split(',')
          .map((c: string) => c.trim())
          .filter(Boolean);
        if (candidates.length === 0) return '';

        let bestCandidate = candidates[candidates.length - 1];
        let bestResolution = 0;

        for (const candidate of candidates) {
          const parts = candidate.trim().split(/\s+/);
          if (parts.length < 2) continue;

          const descriptor = parts[parts.length - 1];
          const xMatch = descriptor.match(/(\d+)x/);
          if (xMatch) {
            const resolution = parseInt(xMatch[1], 10);
            if (resolution > bestResolution) {
              bestResolution = resolution;
              bestCandidate = candidate;
            }
          }
        }

        return bestCandidate.split(/\s+/)[0];
      } catch {
        return '';
      }
    }, []);

    // Safe defaults when tnode is null to maintain consistent hook call order
    const attrs = tnode ? (tnode as TNodeWithAttributes)?.attributes || {} : {};
    const parentAttrs = tnode ? (tnode as TNodeWithAttributes)?.parent?.attributes || {} : {};
    
    const getRawSrcSafe = (): string => {
      if (!tnode) return '';
      const directSrc = attrs.src || attrs['data-src'] || attrs['data-image'] || '';
      if (directSrc && !directSrc.startsWith('data:') && !directSrc.includes('placeholder')) {
        return directSrc;
      }
      if (attrs.srcset) {
        const srcsetSrc = extractBestSrcFromSrcset(attrs.srcset);
        if (srcsetSrc && !srcsetSrc.startsWith('data:') && !srcsetSrc.includes('placeholder')) {
          return srcsetSrc;
        }
      }
      return '';
    };

    const resolveImageUrlSafe = (raw: string): string => {
      if (!raw) return '';
      if (raw.startsWith('//')) return 'https:' + raw;
      if (raw.startsWith('./')) return `https://en.wikipedia.org/wiki/${raw.slice(2)}`;
      if (raw.startsWith('/') && !raw.startsWith('//')) return `https://en.wikipedia.org${raw}`;
      if (raw.includes('upload.wikimedia.org')) return raw.startsWith('https://') ? raw : 'https://' + raw.replace(/^https?:\/\//, '');
      return raw;
    };

    const rawSrc = getRawSrcSafe();
    const imageUrl = resolveImageUrlSafe(rawSrc);
    const alt = tnode ? extractAltText(attrs, parentAttrs, imageUrl) : '';

    // Consolidated NSFW checking in single useEffect to avoid duplicate async operations
    useEffect(() => {
      if (!isNsfwFilterEnabled || !imageUrl) {
        setIsNsfw(false);
        return;
      }

      let cancelled = false;

      const checkNsfw = async () => {
        try {
          const nsfw = await isNsfwImage(imageUrl);
          if (!cancelled) {
            setIsNsfw((prev) => {
              if (prev === nsfw) return prev;
              return nsfw;
            });
          }
        } catch (error) {
          if (!cancelled) {
            setIsNsfw(false);
          }
        }
      };

      checkNsfw();

      return () => {
        cancelled = true;
      };
    }, [isNsfwFilterEnabled, imageUrl, articleTitle]);

    // Call all hooks first to maintain consistent hook order
    const handleImagePress = useCallback(() => {
      if (onImagePress && imageUrl) onImagePress({ uri: imageUrl, alt });
    }, [imageUrl, alt, onImagePress]);

    const onError = useCallback(() => {
      setErrored(true);
    }, []);

    // Compute all values needed for hooks, even when tnode is null
    // Get image dimensions from attributes (with safe defaults)
    let imageWidth = 0;
    let imageHeight = 0;
    
    if (tnode && attrs.width) {
      const w = Number(attrs.width);
      if (!isNaN(w) && w > 0) imageWidth = w;
    }
    if (tnode && attrs.height) {
      const h = Number(attrs.height);
      if (!isNaN(h) && h > 0) imageHeight = h;
    }

    // Calculate final dimensions
    let constrainedWidth: number;
    let constrainedHeight: number;

    if (imageWidth > 0 && imageHeight > 0) {
      // Use original size, but constrain if too large
      if (imageWidth > maxWidth) {
        constrainedWidth = maxWidth;
        constrainedHeight = (imageHeight / imageWidth) * maxWidth;
      } else {
        constrainedWidth = imageWidth;
        constrainedHeight = imageHeight;
      }
    } else {
      // No dimensions available - use a reasonable default
      constrainedWidth = Math.min(400, maxWidth);
      constrainedHeight = constrainedWidth * 0.67; // 3:2 aspect ratio
    }

    // Fallback to safe defaults if dimensions are invalid
    if (
      constrainedWidth <= 0 ||
      constrainedHeight <= 0 ||
      !isFinite(constrainedWidth) ||
      !isFinite(constrainedHeight)
    ) {
      constrainedWidth = Math.min(300, maxWidth);
      constrainedHeight = constrainedWidth * 0.67; // Safe default
    }

    const shouldBlur = isNsfwFilterEnabled && isNsfw && !isUnblurred;

    const handleImageTap = useCallback(() => {
      if (imageContextMenuVisible) {
        return;
      }
      if (shouldBlur) {
        setIsUnblurred(true);
      } else {
        handleImagePress();
      }
    }, [shouldBlur, handleImagePress, imageContextMenuVisible]);

    const handleImageLongPress = useCallback(() => {
      hapticMedium();
      setImageContextMenuVisible(true);
    }, []);

    const handleViewFullscreen = useCallback(() => {
      hapticLight();
      setImageContextMenuVisible(false);
      handleImagePress();
    }, [handleImagePress]);

    const handleShareImage = useCallback(async () => {
      hapticLight();
      setImageContextMenuVisible(false);
      try {
        await shareArticle(articleTitle || '', alt || 'Image');
      } catch (error) {
        // Silently handle share errors
      }
    }, [articleTitle, alt]);

    const handleCopyImageUrl = useCallback(async () => {
      hapticLight();
      setImageContextMenuVisible(false);
      try {
        if (imageUrl) {
          await copyArticleUrl(articleTitle || '', imageUrl);
        }
      } catch (error) {
        // Silently handle copy errors
      }
    }, [articleTitle, imageUrl]);

    const handleOpenImageUrl = useCallback(() => {
      hapticLight();
      setImageContextMenuVisible(false);
      if (imageUrl) {
        Linking.openURL(imageUrl).catch(() => {
          // Ignore errors opening external URLs
        });
      }
    }, [imageUrl]);

    if (!tnode) {
      return null;
    }

    const isInvalidImageSrc = (src: string): boolean => {
      if (!src) return true;
      return (
        src.startsWith('data:') ||
        src.includes('placeholder') ||
        src.includes('1x1') ||
        src.includes('transparent')
      );
    };

    const getRawSrcFull = (): string => {
      const directSrc = attrs.src || attrs['data-src'] || attrs['data-image'] || '';
      if (directSrc && !isInvalidImageSrc(directSrc)) {
        return directSrc;
      }

      if (attrs.srcset) {
        const srcsetSrc = extractBestSrcFromSrcset(attrs.srcset);
        if (srcsetSrc && !isInvalidImageSrc(srcsetSrc)) {
          return srcsetSrc;
        }
      }

      return '';
    };

    const normalizeProtocol = (url: string): string => {
      if (url.startsWith('//')) {
        return 'https:' + url;
      }
      return url;
    };

    const resolveRelativePath = (url: string): string => {
      if (url.startsWith('./')) {
        return `https://en.wikipedia.org/wiki/${url.slice(2)}`;
      }
      if (url.startsWith('/') && !url.startsWith('//')) {
        return `https://en.wikipedia.org${url}`;
      }
      return url;
    };

    const convertWikiFilePageToCommons = (url: string): string | null => {
      const fileMatch = url.match(/\/wiki\/(?:File|Image):(.+)$/i);
      if (!fileMatch) return null;

      const fileName = fileMatch[1].split('#')[0].split('?')[0];
      if (!fileName) return null;

      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
    };

    const resolveImageUrlFull = (raw: string): string => {
      if (!raw) return '';

      let resolvedUrl = normalizeProtocol(raw);
      resolvedUrl = resolveRelativePath(resolvedUrl);

      const commonsUrl = convertWikiFilePageToCommons(resolvedUrl);
      if (commonsUrl) return commonsUrl;

      // Keep thumbnails as-is - they're already optimized and browser handles WebP negotiation
      if (resolvedUrl.includes('upload.wikimedia.org')) {
        return normalizeProtocol(resolvedUrl);
      }

      return resolvedUrl;
    };

    const rawSrcFull = getRawSrcFull();
    const imageUrlFull = resolveImageUrlFull(rawSrcFull);
    const altFull = extractAltText(attrs, parentAttrs, imageUrlFull);
    
    const finalImageUrl = imageUrlFull || imageUrl;
    const finalAlt = altFull || alt;

    // Show placeholder UI when image fails, but skip if URL is clearly a placeholder
    if (errored) {
      // Don't show error UI for obviously invalid images
      if (
        finalImageUrl.includes('placeholder') ||
        finalImageUrl.includes('1x1') ||
        finalImageUrl.includes('triangle')
      ) {
        return null;
      }
      return (
        <View
          style={{
            width: '100%',
            marginVertical: 8,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
          }}
        >
          <Text
            selectable
            numberOfLines={2}
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
          >
            Image failed to load
          </Text>
          <TouchableRipple
            onPress={() =>
              Linking.openURL(finalImageUrl).catch(() => {
                // Ignore errors opening external URLs
              })
            }
          >
            <Text style={{ color: theme.colors.primary, padding: 8 }}>Open image</Text>
          </TouchableRipple>
        </View>
      );
    }

    const isInvalidUrl =
      !finalImageUrl ||
      finalImageUrl.trim() === '' ||
      (!finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) ||
      finalImageUrl.includes('placeholder') ||
      finalImageUrl.includes('1x1') ||
      finalImageUrl.includes('transparent') ||
      finalImageUrl.includes('data:') ||
      finalImageUrl.toLowerCase().includes('triangle') ||
      finalImageUrl.toLowerCase().includes('green');

    if (isInvalidUrl) {
      return null;
    }

    // Add a simple Referer header on native to help Android/iOS with some Wikimedia responses
    // Only create image source if we have a valid URL
    const imageSource =
      Platform.OS === 'web'
        ? { uri: finalImageUrl }
        : {
          uri: finalImageUrl,
          headers: {
            Referer: 'https://en.wikipedia.org',
          },
        };

    // Double-check that the URI is valid before rendering
    if (!imageSource.uri || imageSource.uri.trim() === '') {
      return null;
    }

    return (
      <View
        style={{
          width: '100%',
          maxWidth: maxWidth,
          alignSelf: 'center',
          alignItems: 'center',
          marginVertical: 8,
          position: 'relative',
        }}
      >
        <TouchableRipple
          onPress={handleImageTap}
          onLongPress={handleImageLongPress}
          accessibilityLabel={
            shouldBlur ? 'Sensitive image - tap to reveal' : `View image: ${finalAlt || 'Article image'}`
          }
          accessibilityHint={
            shouldBlur
              ? 'Tap to reveal sensitive image. Long press for more options.'
              : 'Opens image in full screen view. Long press for more options.'
          }
          accessibilityRole="button"
          style={{
            width: constrainedWidth,
            alignSelf: 'center',
          }}
        >
          <View
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: theme.roundness, // Use theme roundness
              backgroundColor: theme.colors.surfaceVariant, // Neutral background for transparent images
              width: constrainedWidth,
              height: constrainedHeight,
            }}
          >
            <Image
              source={imageSource}
              style={{
                width: '100%',
                height: '100%',
              }}
              contentFit="contain"
              alt={finalAlt}
              accessibilityLabel={finalAlt || 'Article image'}
              accessibilityHint="Article image, tap to view full screen"
              onError={onError}
              onLoad={() => {
                // Image loaded successfully
              }}
              placeholder={{ blurhash: 'L5H2EC=PM+yV0gMqNGa#00bH?G-9' }}
              transition={200}
            />
            {shouldBlur && (
              <BlurView
                intensity={100}
                tint="dark"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: theme.roundness, // Use theme roundness
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    // Use theme scrim color with appropriate opacity
                    backgroundColor: theme.colors.scrim + (theme.dark ? 'B3' : '99'), // 70% dark, 60% light
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: 0.8,
                  }}
                >
                  <Text variant="labelLarge" style={{ color: theme.colors.surface }}>
                    Sensitive Content
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.surface,
                      marginTop: SPACING.xs,
                      textAlign: 'center',
                    }}
                  >
                    Tap to reveal
                  </Text>
                </View>
              </BlurView>
            )}
          </View>
        </TouchableRipple>

        {/* Long-press Context Menu */}
        <Menu
          visible={imageContextMenuVisible}
          onDismiss={() => setImageContextMenuVisible(false)}
          anchor={<View style={{ position: 'absolute', left: -1000, top: -1000 }} />}
          contentStyle={{ backgroundColor: theme.colors.surface }}
        >
          <Menu.Item
            onPress={handleViewFullscreen}
            leadingIcon="fullscreen"
            title="View Fullscreen"
          />
          {finalImageUrl && (
            <>
              <Menu.Item
                onPress={handleCopyImageUrl}
                leadingIcon="content-copy"
                title="Copy Image URL"
              />
              <Menu.Item
                onPress={handleOpenImageUrl}
                leadingIcon="open-in-new"
                title="Open Image URL"
              />
            </>
          )}
          <Menu.Item onPress={handleShareImage} leadingIcon="share-variant" title="Share Article" />
        </Menu>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Compare based on image URL and props, not tnode object reference
    // (tnode objects are recreated by RenderHtml on every render)
    const prevAttrs = (prevProps.tnode as TNodeWithAttributes)?.attributes || {};
    const nextAttrs = (nextProps.tnode as TNodeWithAttributes)?.attributes || {};
    const prevSrc = prevAttrs.src || prevAttrs['data-src'] || prevAttrs['data-image'] || '';
    const nextSrc = nextAttrs.src || nextAttrs['data-src'] || nextAttrs['data-image'] || '';

    // Compare based on actual values, not object references
    const srcEqual = prevSrc === nextSrc;
    const articleTitleEqual = prevProps.articleTitle === nextProps.articleTitle;
    const onImagePressEqual = prevProps.onImagePress === nextProps.onImagePress;

    // If all relevant props are equal, skip re-render
    if (srcEqual && articleTitleEqual && onImagePressEqual) {
      return true; // Props are equal, skip re-render
    }

    // Props changed, allow re-render
    return false;
  }
);

/**
 * DOM processing function - synchronous version with batching for large DOMs
 * Processes elements in batches to avoid blocking the UI thread for very large articles
 * Optimized for web performance - prevents accumulation of batch processing
 */
import type { Element } from 'domhandler';

// Track active batch processing to prevent accumulation on web
let activeBatchProcessing = false;
let activeRafId: number | null = null;

const processDom = (element: Element | null | undefined) => {
  if (!element || !element.children || element.children.length === 0) {
    return;
  }

  // Prevent multiple batch processing operations from running simultaneously
  // This prevents accumulation of requestAnimationFrame calls on web
  if (activeBatchProcessing) {
    return;
  }

  try {
    // Use centralized selectors from articleParsing utils
    // Collect all elements to remove first
    const elementsToRemove: Element[] = [];

    for (const selector of DEFAULT_SELECTORS_TO_REMOVE) {
      const elements = selectAll(selector, element);
      elementsToRemove.push(...elements);
    }

    // If we have many elements (>100), process in smaller batches
    const BATCH_SIZE = 50;
    const MAX_SYNC_ELEMENTS = 100;

    if (elementsToRemove.length > MAX_SYNC_ELEMENTS) {
      // For very large DOMs, process first batch synchronously, rest asynchronously
      const firstBatch = elementsToRemove.slice(0, MAX_SYNC_ELEMENTS);
      const remaining = elementsToRemove.slice(MAX_SYNC_ELEMENTS);

      // Process first batch immediately
      for (const el of firstBatch) {
        try {
          if (el.parentNode) {
            removeElement(el);
          }
        } catch {
          // Continue with next element
        }
      }

      // Process remaining in batches with requestAnimationFrame to yield to UI
      // Use requestAnimationFrame instead of setTimeout for better performance on web
      activeBatchProcessing = true;
      let batchIndex = 0;

      const processBatch = () => {
        const batch = remaining.slice(batchIndex, batchIndex + BATCH_SIZE);
        for (const el of batch) {
          try {
            if (el.parentNode) {
              removeElement(el);
            }
          } catch {
            // Continue with next element
          }
        }
        batchIndex += BATCH_SIZE;
        if (batchIndex < remaining.length) {
          // Use requestAnimationFrame on web, setTimeout on native
          if (typeof requestAnimationFrame !== 'undefined') {
            activeRafId = requestAnimationFrame(processBatch);
          } else {
            setTimeout(processBatch, 0);
          }
        } else {
          activeRafId = null;
          activeBatchProcessing = false;
        }
      };

      if (remaining.length > 0) {
        if (typeof requestAnimationFrame !== 'undefined') {
          activeRafId = requestAnimationFrame(processBatch);
        } else {
          setTimeout(processBatch, 0);
        }
      } else {
        activeBatchProcessing = false;
      }
    } else {
      // Small DOM: process all synchronously (fast, no UI impact)
      for (const el of elementsToRemove) {
        try {
          if (el.parentNode) {
            removeElement(el);
          }
        } catch {
          // Continue with next element
        }
      }
    }
  } catch {
    // Silently fail to avoid blocking the UI
  }
};

/**
 * Hook for creating DOM visitors - synchronous version
 */
export const useDomVisitors = () => {
  const [visitors, setVisitors] = useState<{ onElement: (element: Element) => void } | null>(null);

  useEffect(() => {
    const cleanCss = (element: Element) => {
      // Lightweight DOM cleanup; avoid logging in production
      processDom(element);
    };

    setVisitors({
      onElement: cleanCss,
    });
  }, []);

  return visitors;
};
