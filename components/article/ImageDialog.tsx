import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Appbar, IconButton, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MOTION } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import { useReducedMotion } from '../../hooks';

interface ImageDialogProps {
  visible: boolean;
  selectedImage: { uri: string; alt?: string } | null;
  onClose: () => void;
  // Optional: Array of all images for navigation
  images?: Array<{ uri: string; alt?: string }>;
  initialIndex?: number;
}

export default function ImageDialog({
  visible,
  selectedImage,
  onClose,
  images,
  initialIndex = 0,
}: ImageDialogProps) {
  const theme = useTheme();
  const closeButtonRef = useRef<any>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { reducedMotion } = useReducedMotion();

  // Determine if we have multiple images for navigation
  const imageArray = images && images.length > 0 ? images : selectedImage ? [selectedImage] : [];
  const hasMultipleImages = imageArray.length > 1;

  // Current image index state
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (images && images.length > 0 && initialIndex >= 0 && initialIndex < images.length) {
      return initialIndex;
    }
    return 0;
  });

  // Update current index when selectedImage changes (for backward compatibility)
  useEffect(() => {
    if (selectedImage && images && images.length > 0) {
      const index = images.findIndex((img) => img.uri === selectedImage.uri);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    } else if (selectedImage && !images) {
      setCurrentIndex(0);
    }
  }, [selectedImage, images]);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (visible) {
      if (images && images.length > 0 && initialIndex >= 0 && initialIndex < images.length) {
        setCurrentIndex(initialIndex);
      } else {
        setCurrentIndex(0);
      }
    }
  }, [visible, images, initialIndex]);

  // Get current image
  const currentImage = imageArray[currentIndex] || null;

  // Pinch-to-zoom state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Swipe navigation state
  const swipeTranslateX = useSharedValue(0);
  
  // Shared value to trigger navigation from worklet (1 = next, -1 = previous)
  const navigationDirection = useSharedValue(0);
  
  // Shared values to track current index and array length for worklet access
  const currentIndexShared = useSharedValue(currentIndex);
  const imageArrayLengthShared = useSharedValue(imageArray.length);

  // Update shared values when state changes
  useEffect(() => {
    currentIndexShared.value = currentIndex;
    imageArrayLengthShared.value = imageArray.length;
  }, [currentIndex, imageArray.length]);

  // Navigation functions
  const goToPrevious = () => {
    if (hasMultipleImages && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Reset zoom when changing images
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  };

  const goToNext = () => {
    if (hasMultipleImages && currentIndex < imageArray.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Reset zoom when changing images
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  };

  // Effect to handle navigation triggered from gesture worklet
  useEffect(() => {
    if (navigationDirection.value !== 0) {
      const direction = navigationDirection.value;
      navigationDirection.value = 0; // Reset

      if (direction === -1) {
        goToPrevious();
      } else if (direction === 1) {
        goToNext();
      }
    }
  }, [navigationDirection.value]);

  // Reset zoom and swipe when modal closes or image changes
  useEffect(() => {
    if (!visible) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      swipeTranslateX.value = 0;
    }
  }, [visible, currentIndex]);

  // Focus management for accessibility
  useEffect(() => {
    if (visible && closeButtonRef.current) {
      // Focus the close button when modal opens
      const timeoutId = setTimeout(() => {
        closeButtonRef.current?.focus?.();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [visible]);

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Clamp scale between 1 and 5
      if (scale.value < 1) {
        scale.value = withTiming(1, { duration: MOTION.durationShort });
        savedScale.value = 1;
      } else if (scale.value > 5) {
        scale.value = withTiming(5, { duration: MOTION.durationShort });
        savedScale.value = 5;
      }
    });

  // Pan gesture for moving zoomed image (only when zoomed)
  const panGesture = Gesture.Pan()
    .enabled(true)
    .onUpdate((e) => {
      // Only allow panning when zoomed
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  // Horizontal swipe gesture for navigation (only when not zoomed)
  const swipeGesture = Gesture.Pan()
    .enabled(hasMultipleImages)
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      // Only allow horizontal swiping when not zoomed
      if (scale.value === 1) {
        swipeTranslateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (scale.value === 1) {
        const swipeThreshold = windowWidth * 0.25; // 25% of screen width
        const velocity = e.velocityX;

        if (e.translationX > swipeThreshold || velocity > 500) {
          // Swipe right - go to previous
          if (currentIndexShared.value > 0) {
            navigationDirection.value = -1;
          }
        } else if (e.translationX < -swipeThreshold || velocity < -500) {
          // Swipe left - go to next
          if (currentIndexShared.value < imageArrayLengthShared.value - 1) {
            navigationDirection.value = 1;
          }
        }
        // Reset swipe position
        swipeTranslateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      } else {
        swipeTranslateX.value = withSpring(0);
      }
    });

  // Combined gestures - prioritize swipe when not zoomed, pan when zoomed
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(swipeGesture, panGesture)
  );

  // Animated style for image container (swipe navigation)
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: swipeTranslateX.value }],
    };
  });

  // Animated style for image (zoom and pan)
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Handle double tap to reset zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        // Reset zoom
        if (reducedMotion) {
          scale.value = 1;
          savedScale.value = 1;
          translateX.value = 0;
          translateY.value = 0;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        } else {
          scale.value = withTiming(1, { duration: MOTION.durationShort });
          savedScale.value = 1;
          translateX.value = withTiming(0, { duration: MOTION.durationShort });
          translateY.value = withTiming(0, { duration: MOTION.durationShort });
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        }
      } else {
        // Zoom in
        if (reducedMotion) {
          scale.value = 2;
          savedScale.value = 2;
        } else {
          scale.value = withTiming(2, { duration: MOTION.durationShort });
          savedScale.value = 2;
        }
      }
    });

  const allGestures = Gesture.Simultaneous(composedGesture, doubleTapGesture);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      accessibilityViewIsModal={true}
      accessible={true}
      accessibilityLabel="Image modal"
    >
      <View
        style={{ flex: 1, backgroundColor: theme.colors.scrim + 'E6' }} // 90% opacity (0xE6 in hex = 230/255 ≈ 0.9)
        // Remove accessible prop to prevent semantic HTML wrapper that might conflict with Appbar.Content h1
      >
        <Appbar.Header
          style={{
            backgroundColor: 'transparent',
            marginTop: 0,
            paddingTop: 0,
            elevation: 0,
          }}
          accessibilityRole="toolbar"
          // Remove accessible prop - Appbar.Header handles its own accessibility
        >
          <Appbar.Action
            ref={closeButtonRef}
            icon="close"
            onPress={onClose}
            color={theme.colors.surface}
            accessible={true}
            accessibilityLabel="Close image modal"
            accessibilityRole="button"
            accessibilityHint="Closes the image modal and returns to the article"
          />
          <Appbar.Content
            title={
              hasMultipleImages
                ? `${currentImage?.alt || 'Image'} (${currentIndex + 1} of ${imageArray.length})`
                : currentImage?.alt || 'Image'
            }
            titleStyle={{ color: theme.colors.surface }}
            // Appbar.Content already renders as h1 on web, don't add header role
          />
        </Appbar.Header>

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: -56, // Compensate for Appbar height
          }}
        >
          {currentImage && (
            <GestureDetector gesture={allGestures}>
              <Animated.View
                style={[
                  {
                    width: windowWidth,
                    height: windowHeight * 0.8,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  containerAnimatedStyle,
                ]}
              >
                <Animated.View style={imageAnimatedStyle}>
                  <Image
                    source={{ uri: currentImage.uri }}
                    style={{
                      width: windowWidth,
                      height: windowHeight * 0.8,
                    }}
                    contentFit="contain"
                    accessible={true}
                    accessibilityLabel={currentImage.alt || 'Article image'}
                    accessibilityRole="image"
                    accessibilityHint={
                      hasMultipleImages
                        ? 'Pinch to zoom, double tap to zoom in/out, drag to pan when zoomed, swipe left/right to navigate'
                        : 'Pinch to zoom, double tap to zoom in/out, drag to pan when zoomed'
                    }
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          )}

          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
            }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onPress={onClose}
              activeOpacity={1}
              accessible={true}
              accessibilityLabel="Close image modal"
              accessibilityRole="button"
              accessibilityHint="Tap outside image to close the modal"
            />
          </View>

          {/* Navigation Buttons */}
          {hasMultipleImages && (
            <>
              {currentIndex > 0 && (
                <IconButton
                  icon="chevron-left"
                  iconColor={theme.colors.surface}
                  size={40}
                  style={{
                    position: 'absolute',
                    left: SPACING.base,
                    backgroundColor: theme.colors.scrim + 'CC', // 80% opacity
                    zIndex: 10,
                  }}
                  onPress={goToPrevious}
                  accessible={true}
                  accessibilityLabel="Previous image"
                  accessibilityHint={`Go to image ${currentIndex} of ${imageArray.length}`}
                />
              )}
              {currentIndex < imageArray.length - 1 && (
                <IconButton
                  icon="chevron-right"
                  iconColor={theme.colors.surface}
                  size={40}
                  style={{
                    position: 'absolute',
                    right: SPACING.base,
                    backgroundColor: theme.colors.scrim + 'CC', // 80% opacity
                    zIndex: 10,
                  }}
                  onPress={goToNext}
                  accessible={true}
                  accessibilityLabel="Next image"
                  accessibilityHint={`Go to image ${currentIndex + 2} of ${imageArray.length}`}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
