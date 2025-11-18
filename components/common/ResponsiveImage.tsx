import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import { useNsfwFilter } from '@/hooks';
import { extractFilenameFromUrl } from '@/utils/imageAltText';
import { isNsfwImage } from '@/utils/nsfwDetection';
import { BlurView } from 'expo-blur';
import { Image, ImageContentFit } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageStyle, useWindowDimensions, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';

interface ResponsiveImageProps {
  source: {
    source: string;
    height: number;
    width: number;
  };
  contentFit?: ImageContentFit;
  style?: ImageStyle;
  alt?: string;
  title?: string; // Article title for NSFW detection
  onPress?: (image: { uri: string; alt?: string }) => void; // Callback when image is pressed
}

const ResponsiveImage = React.memo(
  ({
    source,
    contentFit = 'cover',
    style = {},
    alt = '',
    title,
    onPress,
  }: ResponsiveImageProps) => {
    const theme = useTheme();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isUnblurred, setIsUnblurred] = useState(false);
    const [isNsfw, setIsNsfw] = useState(false);
    const { isNsfwFilterEnabled } = useNsfwFilter();
    const isNsfwFilterEnabledRef = React.useRef(isNsfwFilterEnabled);
    const prevIsNsfwFilterEnabledRef = React.useRef(isNsfwFilterEnabled);

    // Keep ref in sync with current value
    React.useEffect(() => {
      isNsfwFilterEnabledRef.current = isNsfwFilterEnabled;
    }, [isNsfwFilterEnabled]);

    // Reset unblurred state when filter is toggled (only when value actually changes)
    React.useEffect(() => {
      if (prevIsNsfwFilterEnabledRef.current !== isNsfwFilterEnabled) {
        prevIsNsfwFilterEnabledRef.current = isNsfwFilterEnabled;
        setIsUnblurred(false);
      }
    }, [isNsfwFilterEnabled]);

    // Extract alt text from URL if not provided
    const finalAlt = useMemo(() => {
      if (alt && alt.trim()) {
        return alt.trim();
      }
      // Fallback: extract from filename
      if (source?.source) {
        const filename = extractFilenameFromUrl(source.source);
        return filename || 'Article image';
      }
      return 'Article image';
    }, [alt, source?.source]);

    const sourceUrl = source?.source;
    const sourceWidth = source?.width;
    const sourceHeight = source?.height;

    useEffect(() => {
      if (sourceUrl && typeof sourceUrl === 'string' && sourceWidth && sourceHeight) {
        setDimensions((prev) => {
          // Only update if dimensions actually changed
          if (prev.width === sourceWidth && prev.height === sourceHeight) {
            return prev;
          }
          return { width: sourceWidth, height: sourceHeight };
        });
      }
    }, [sourceUrl, sourceWidth, sourceHeight]);

    useEffect(() => {
      if (!isNsfwFilterEnabledRef.current) {
        return;
      }

      let cancelled = false;

      const checkNsfw = async () => {
        if (!sourceUrl) {
          setIsNsfw((prev) => (prev === false ? prev : false));
          return;
        }

        try {
          const nsfw = await isNsfwImage(sourceUrl);
          if (!cancelled) {
            setIsNsfw((prev) => {
              if (prev === nsfw) return prev;
              return nsfw;
            });
          }
        } catch (error) {
          // Silently handle NSFW check errors
          if (!cancelled) {
            setIsNsfw((prev) => (prev === false ? prev : false));
          }
        }
      };

      checkNsfw();

      return () => {
        cancelled = true;
      };
    }, [sourceUrl, title]);

    useEffect(() => {
      if (prevIsNsfwFilterEnabledRef.current !== isNsfwFilterEnabled && sourceUrl) {
        let cancelled = false;

        const checkNsfw = async () => {
          try {
            const nsfw = await isNsfwImage(sourceUrl);
            if (!cancelled) {
              setIsNsfw((prev) => {
                if (prev === nsfw) return prev;
                return nsfw;
              });
            }
          } catch (error) {
            // Silently handle NSFW re-check errors
          }
        };

        checkNsfw();
        prevIsNsfwFilterEnabledRef.current = isNsfwFilterEnabled;

        return () => {
          cancelled = true;
        };
      }
    }, [isNsfwFilterEnabled, sourceUrl, title]);

    const shouldBlur = isNsfwFilterEnabled && isNsfw && !isUnblurred;

    // Check if explicit dimensions are provided in style prop (for cards)
    // Handle both single style object and style array
    const styleObj = Array.isArray(style)
      ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
      : style && typeof style === 'object'
        ? style
        : {};
    const explicitWidth = styleObj.width as number | undefined;
    const explicitHeight = styleObj.height as number | undefined;

    // If explicit dimensions are provided, use them (for card layouts)
    const useExplicitDimensions = explicitWidth !== undefined || explicitHeight !== undefined;

    // Calculate max dimensions for large screens (only if not using explicit dimensions)
    const isLargeScreen = windowWidth >= LAYOUT.DESKTOP_BREAKPOINT;
    const maxImageWidth = useExplicitDimensions
      ? explicitWidth || windowWidth
      : isLargeScreen
        ? Math.min(LAYOUT.ARTICLE_MAX_WIDTH, 900)
        : windowWidth;
    const maxImageHeight = useExplicitDimensions
      ? explicitHeight || 600
      : Math.min(600, windowHeight * 0.6); // Max 600px or 60% of screen height

    // Calculate constrained dimensions while maintaining aspect ratio
    const aspectRatio =
      dimensions.width > 0 && dimensions.height > 0 ? dimensions.width / dimensions.height : 1;

    let constrainedWidth =
      useExplicitDimensions && explicitWidth !== undefined ? explicitWidth : maxImageWidth;
    let constrainedHeight =
      useExplicitDimensions && explicitHeight !== undefined
        ? explicitHeight
        : constrainedWidth / aspectRatio;

    // If height exceeds max, constrain by height instead (only if not using explicit dimensions)
    if (!useExplicitDimensions && constrainedHeight > maxImageHeight) {
      constrainedHeight = maxImageHeight;
      constrainedWidth = constrainedHeight * aspectRatio;
    }

    // Validate that sourceUrl is a string before rendering
    const imageUri = sourceUrl && typeof sourceUrl === 'string' ? sourceUrl : null;

    const isValidImage = true;
    // Invalid images are silently skipped (no rendering)

    // Memoize image tap handler to prevent recreating on every render
    const handleImageTap = useCallback(() => {
      if (shouldBlur) {
        // Unblur the image on first tap
        setIsUnblurred(true);
      } else if (onPress && imageUri) {
        // Call onPress callback if provided and image is not blurred
        onPress({ uri: imageUri, alt: finalAlt });
      }
    }, [shouldBlur, onPress, imageUri, finalAlt]);

    // Early return only if image is invalid - but all hooks have been called
    if (!isValidImage || !imageUri || dimensions.width === 0 || dimensions.height === 0) {
      return null;
    }

    return (
      <>
        <View style={useExplicitDimensions ? {} : { width: '100%', alignItems: 'center' }}>
          <TouchableRipple
            onPress={handleImageTap}
            disabled={!shouldBlur && !onPress}
            style={
              useExplicitDimensions
                ? {
                    width: constrainedWidth,
                    height: constrainedHeight,
                  }
                : {
                    width: constrainedWidth,
                    maxWidth: maxImageWidth,
                  }
            }
          >
            <View
              style={
                useExplicitDimensions
                  ? {
                      position: 'relative',
                      backgroundColor:
                        contentFit === 'contain' ? 'transparent' : theme.colors.surfaceVariant,
                      width: constrainedWidth,
                      height: constrainedHeight,
                    }
                  : {
                      position: 'relative',
                      backgroundColor:
                        contentFit === 'contain' ? 'transparent' : theme.colors.surfaceVariant, // Neutral background for transparent images
                      width: '100%',
                      maxHeight: maxImageHeight,
                    }
              }
            >
              <Image
                source={{ uri: imageUri }}
                contentFit={contentFit}
                alt={finalAlt}
                accessibilityLabel={finalAlt}
                placeholder={{ blurhash: 'L5H2EC=PM+yV0gMqNGa#00bH?G-9' }}
                transition={200}
                cachePolicy="memory-disk"
                style={[
                  useExplicitDimensions
                    ? {
                        width: constrainedWidth,
                        height: constrainedHeight,
                      }
                    : {
                        width: '100%',
                        height: constrainedHeight,
                        maxHeight: maxImageHeight,
                      },
                  style,
                ]}
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
        </View>
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.source?.source === nextProps.source?.source &&
      prevProps.source?.width === nextProps.source?.width &&
      prevProps.source?.height === nextProps.source?.height &&
      prevProps.alt === nextProps.alt &&
      prevProps.title === nextProps.title &&
      prevProps.onPress === nextProps.onPress &&
      prevProps.contentFit === nextProps.contentFit
    );
  }
);

export default ResponsiveImage;
