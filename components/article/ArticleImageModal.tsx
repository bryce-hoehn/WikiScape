import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { Modal, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Appbar, useTheme } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MOTION } from '../../constants/motion';
import { useReducedMotion } from '../../hooks';

interface ArticleImageModalProps {
  visible: boolean;
  selectedImage: { uri: string; alt?: string } | null;
  onClose: () => void;
}

export default function ArticleImageModal({
  visible,
  selectedImage,
  onClose,
}: ArticleImageModalProps) {
  const theme = useTheme();
  const closeButtonRef = useRef<any>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { reducedMotion } = useReducedMotion();

  // Pinch-to-zoom state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset zoom when modal closes
  useEffect(() => {
    if (!visible) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [visible]);

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

  // Pan gesture for moving zoomed image
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combined gestures
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Animated style for image
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
        accessible={true}
        accessibilityLabel="Image modal content"
        importantForAccessibility="yes"
      >
        <Appbar.Header
          style={{
            backgroundColor: 'transparent',
            marginTop: 0,
            paddingTop: 0,
            elevation: 0,
          }}
          accessible={true}
          accessibilityRole="toolbar"
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
            title={selectedImage?.alt || 'Image'}
            titleStyle={{ color: theme.colors.surface }}
            accessible={true}
            accessibilityRole="header"
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
          {selectedImage && (
            <GestureDetector gesture={allGestures}>
              <Animated.View
                style={[
                  {
                    width: windowWidth,
                    height: windowHeight * 0.8,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Animated.View style={imageAnimatedStyle}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={{
                      width: windowWidth,
                      height: windowHeight * 0.8,
                    }}
                    contentFit="contain"
                    accessible={true}
                    accessibilityLabel={selectedImage.alt || 'Article image'}
                    accessibilityRole="image"
                    accessibilityHint="Pinch to zoom, double tap to zoom in/out, drag to pan when zoomed"
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          )}
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
      </View>
    </Modal>
  );
}
