import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { hapticLight } from '@/utils/haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../../constants/layout';
import { useReducedMotion } from '../../hooks';

interface ArticleToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  sections: { id: string; heading: string }[];
  onSectionPress: (sectionId: string) => void;
  currentFontSize?: number;
  visible?: boolean;
}

export default function ArticleToolbar({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canZoomIn,
  canZoomOut,
  sections,
  onSectionPress,
  currentFontSize = 16,
  visible = true,
}: ArticleToolbarProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;
  const [tocVisible, setTocVisible] = useState(false);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const openTOC = () => {
    hapticLight();
    setTocVisible(true);
  };
  const closeTOC = () => setTocVisible(false);

  const handleZoomIn = () => {
    hapticLight();
    onZoomIn();
  };

  const handleZoomOut = () => {
    hapticLight();
    onZoomOut();
  };

  const handleResetZoom = () => {
    hapticLight();
    onResetZoom();
  };

  const handleHome = () => {
    hapticLight();
    router.push('/');
  };

  const handleSectionPress = (sectionId: string) => {
    hapticLight();
    onSectionPress(sectionId);
  };

  // Animate toolbar visibility
  useEffect(() => {
    if (reducedMotion) {
      // Skip animations when reduced motion is enabled
      if (visible) {
        translateY.value = 0;
        opacity.value = 1;
      } else {
        translateY.value = 100;
        opacity.value = 0;
      }
    } else {
      if (visible) {
        translateY.value = withTiming(0, { duration: MOTION.durationMedium });
        opacity.value = withTiming(1, { duration: MOTION.durationMedium });
      } else {
        translateY.value = withTiming(100, { duration: MOTION.durationMedium });
        opacity.value = withTiming(0, { duration: MOTION.durationMedium });
      }
    }
  }, [visible, translateY, opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  // MD3 toolbar positioning with FAB integration
  // Toolbar: 56dp height, 4dp elevation, positioned to avoid FAB overlap
  // FAB: 56dp size, positioned at bottom right with 16dp (mobile) or 24dp (desktop) spacing
  // Note: Article page has no bottom tab bar, so only account for safe area insets
  const fabWidth = 56;
  const bottomSpacing = Platform.select({
    web: isLargeScreen ? 24 : 16,
    default: 16,
  });
  const fabRightSpacing = bottomSpacing;
  const fabTotalWidth = fabWidth + fabRightSpacing;
  
  // Toolbar spacing from bottom edge (no bottom tab bar on article page)
  // Use same spacing as FAB to align them at the same height
  const toolbarBottom = insets.bottom + bottomSpacing;
  const toolbarMaxWidth = width - fabTotalWidth - SPACING.base;

  return (
    <Animated.View 
      style={[
        styles.container, 
        animatedStyle, 
        { 
          pointerEvents: 'box-none' as any,
          bottom: toolbarBottom,
          zIndex: 999,
        }
      ]}
    >
      <Surface
        elevation={4}
        style={[
          styles.toolbar,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.roundness * 7, // 28dp for pill shape (half of 56dp height)
            maxWidth: toolbarMaxWidth,
          },
        ]}
      >
        <IconButton 
          icon="home" 
          size={24} 
          onPress={handleHome} 
          accessibilityLabel="Go to home"
          accessibilityHint="Returns to home screen"
        />

        <IconButton
          icon="minus"
          size={24}
          onPress={handleZoomOut}
          disabled={!canZoomOut}
          accessibilityLabel="Decrease font size"
          accessibilityHint={`Decreases article font size. Current size: ${currentFontSize}px`}
        />

        <IconButton
          icon="format-size"
          size={24}
          onPress={handleResetZoom}
          accessibilityLabel="Reset font size"
          accessibilityHint={`Resets article font size to default. Current size: ${currentFontSize}px`}
        />

        <IconButton
          icon="plus"
          size={24}
          onPress={handleZoomIn}
          disabled={!canZoomIn}
          accessibilityLabel="Increase font size"
          accessibilityHint={`Increases article font size. Current size: ${currentFontSize}px`}
        />

        <IconButton
          icon="format-list-bulleted"
          size={24}
          onPress={openTOC}
          accessibilityLabel="Table of contents"
          accessibilityHint="Opens table of contents to navigate article sections"
        />
      </Surface>

      <Portal>
        <Modal
          visible={tocVisible}
          onDismiss={closeTOC}
          contentContainerStyle={styles.modalContent}
        >
          <Surface
            elevation={4}
            style={[
              styles.tocMenu,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.roundness * 3,
              },
            ]}
          >
            <View style={styles.tocHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Table of Contents
              </Text>
              <IconButton icon="close" size={20} onPress={closeTOC} />
            </View>
            <Divider />
            <ScrollView style={styles.tocScroll}>
              {sections.map((section) => (
                <List.Item
                  key={section.id}
                  title={section.heading}
                  titleNumberOfLines={2}
                  onPress={() => {
                    handleSectionPress(section.id);
                    closeTOC();
                  }}
                  left={(props) => <List.Icon {...props} icon="chevron-right" />}
                />
              ))}
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minHeight: 56,
    height: 56,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    alignSelf: 'center',
  },
  tocMenu: {
    maxHeight: 400,
    overflow: 'hidden',
  },
  tocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: SPACING.base,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  tocScroll: {
    maxHeight: 340,
  },
});
