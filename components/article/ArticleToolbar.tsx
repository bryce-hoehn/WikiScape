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
import ScrollToTopFAB from '../common/ScrollToTopFAB';

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
  fabVisible?: boolean; // Whether the FAB is visible (affects toolbar positioning)
  scrollRef?: React.RefObject<any>; // ScrollView ref for FAB scroll-to-top functionality
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
  fabVisible = false,
  scrollRef,
}: ArticleToolbarProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;
  const [tocVisible, setTocVisible] = useState(false);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const alignmentProgress = useSharedValue(fabVisible && !isLargeScreen ? 1 : 0);

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

  useEffect(() => {
    const targetValue = fabVisible && !isLargeScreen ? 1 : 0;
    if (reducedMotion) {
      alignmentProgress.value = targetValue;
    } else {
      alignmentProgress.value = withTiming(targetValue, { 
        duration: MOTION.durationMedium 
      });
    }
  }, [fabVisible, isLargeScreen, alignmentProgress, reducedMotion]);


  const fabWidth = 56;
  const bottomSpacing = Platform.select({
    web: isLargeScreen ? SPACING.lg : SPACING.base,
    default: SPACING.base,
  });
  const fabRightSpacing = bottomSpacing;
  const spacingBetweenFabAndToolbar = SPACING.sm;
  const fabTotalWidth = fabWidth + fabRightSpacing + spacingBetweenFabAndToolbar;
  const toolbarBottom = insets.bottom + bottomSpacing;
  const toolbarMaxWidth = width - fabTotalWidth;
  const toolbarLeftPadding = SPACING.base;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const toolbarAnimatedStyle = useAnimatedStyle(() => {
    const centeredMaxWidth = width - (toolbarLeftPadding * 2);
    const maxWidth = alignmentProgress.value * toolbarMaxWidth + (1 - alignmentProgress.value) * centeredMaxWidth;
    const shiftAmount = SPACING.sm;
    const translateX = -shiftAmount * alignmentProgress.value;
    
    return {
      maxWidth,
      transform: [{ translateX }],
    };
  }, [width, toolbarMaxWidth, toolbarLeftPadding, alignmentProgress]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        animatedStyle, 
        { 
          pointerEvents: 'box-none' as any,
          bottom: toolbarBottom,
          zIndex: 1000,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible' as any,
        }
      ]}
    >
      <Animated.View 
        style={[
          toolbarAnimatedStyle, 
          { 
            pointerEvents: 'auto' as any,
            overflow: 'visible' as any,
            zIndex: 1001,
          }
        ]}
      >
      <Surface
          elevation={1}
        style={[
          styles.toolbar,
          {
              backgroundColor: theme.colors.elevation.level3,
              borderRadius: theme.roundness * 7,
              zIndex: 1001,
          },
        ]}
      >
        <IconButton 
          icon="home" 
          size={24} 
          iconColor={theme.colors.onSurfaceVariant}
          onPress={handleHome} 
          accessibilityLabel="Go to home"
          accessibilityHint="Returns to home screen"
        />

        <IconButton
          icon="minus"
          size={24}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={handleZoomOut}
          disabled={!canZoomOut}
          accessibilityLabel="Decrease font size"
          accessibilityHint={`Decreases article font size. Current size: ${currentFontSize}px`}
        />

        <IconButton
          icon="format-size"
          size={24}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={handleResetZoom}
          accessibilityLabel="Reset font size"
          accessibilityHint={`Resets article font size to default. Current size: ${currentFontSize}px`}
        />

        <IconButton
          icon="plus"
          size={24}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={handleZoomIn}
          disabled={!canZoomIn}
          accessibilityLabel="Increase font size"
          accessibilityHint={`Increases article font size. Current size: ${currentFontSize}px`}
        />

        <View style={{ zIndex: 1002, position: 'relative' }}>
          <IconButton
            icon="format-list-bulleted"
            size={24}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={openTOC}
            accessibilityLabel="Table of contents"
            accessibilityHint="Opens table of contents to navigate article sections"
          />
        </View>
      </Surface>
      </Animated.View>

      {/* FAB positioned within toolbar container for coordinated touch handling */}
      {scrollRef && (
        <View 
          style={{
            position: 'absolute',
            bottom: 0,
            right: bottomSpacing,
            zIndex: 998, // Lower than toolbar (1001) so toolbar buttons receive touches first
            width: 56, // FAB standard size
            height: 56, // FAB standard size
          }}
        >
          <ScrollToTopFAB 
            scrollRef={scrollRef} 
            visible={fabVisible} 
            hasBottomTabBar={false}
            containerPositioned={true}
          />
        </View>
      )}

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
    // alignItems, justifyContent, and paddingLeft are set dynamically to left-align when FAB is present
    // Default to flex-start to prevent centering
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minHeight: 56,
    height: 56,
    overflow: 'visible',
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
