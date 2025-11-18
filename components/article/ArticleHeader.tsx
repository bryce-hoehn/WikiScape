import React from 'react';
import { ActivityIndicator, Animated, Platform, View } from 'react-native';
import { Appbar, ProgressBar, useTheme } from 'react-native-paper';
import { MOTION } from '../../constants/motion';
import { useReducedMotion } from '../../hooks';

interface ArticleHeaderProps {
  title?: string;
  isBookmarked: (title: string) => boolean;
  onBookmarkToggle: () => void;
  onSearchPress: () => void;
  onBackPress: () => void;
  onToggleRenderer?: () => void;
  useCustomParser?: boolean;
  onShare?: () => void;
  collapsed?: boolean;
  scrollProgress?: number;
  isLoading?: boolean;
}

export default function ArticleHeader({
  title,
  isBookmarked,
  onBookmarkToggle,
  onSearchPress,
  onBackPress,
  onToggleRenderer,
  useCustomParser = false,
  onShare,
  collapsed = false,
  scrollProgress = 0,
  isLoading = false,
}: ArticleHeaderProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const titleOpacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (reducedMotion) {
      // Skip animation when reduced motion is enabled
      titleOpacity.setValue(collapsed ? 0 : 1);
      return;
    }

    // Use native driver only on native platforms (not web)
    const useNativeDriver = Platform.OS !== 'web';

    Animated.timing(titleOpacity, {
      toValue: collapsed ? 0 : 1,
      duration: MOTION.durationShort, // MD3 standard duration
      useNativeDriver,
    }).start();
  }, [collapsed, titleOpacity, reducedMotion]);

  return (
    <View>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction
          onPress={onBackPress}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to previous screen"
        />
        <Appbar.Content
          title={collapsed ? '' : title || (isLoading ? 'Loading...' : '')}
          titleStyle={{
            fontWeight: '600',
            fontSize: collapsed ? 0 : 18,
          }}
          accessibilityLabel={`Article: ${title || (isLoading ? 'Loading' : '')}`}
        />
        {isLoading && !collapsed && (
          <View style={{ marginRight: 8 }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}

        {onShare && (
          <Appbar.Action
            icon="share-variant"
            onPress={onShare}
            accessibilityLabel="Share article"
            accessibilityHint="Shares this article with others"
          />
        )}
        <Appbar.Action
          icon={title && isBookmarked(title) ? 'bookmark' : 'bookmark-outline'}
          iconColor={
            title && isBookmarked(title) ? theme.colors.primary : theme.colors.onSurfaceVariant
          }
          onPress={onBookmarkToggle}
          accessibilityLabel={title && isBookmarked(title) ? 'Remove bookmark' : 'Add bookmark'}
          accessibilityHint={
            title && isBookmarked(title)
              ? 'Removes article from bookmarks'
              : 'Adds article to bookmarks'
          }
        />
      </Appbar.Header>
      {/* Reading Progress Indicator */}
      {scrollProgress > 0 && (
        <ProgressBar
          progress={scrollProgress / 100}
          color={theme.colors.primary}
          style={{ height: 2 }}
        />
      )}
    </View>
  );
}
