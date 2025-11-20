// Native date formatting - no external dependency needed
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Portal, Searchbar, useTheme } from 'react-native-paper';
import { useDebounce, useSearchSuggestions, useVisitedArticles } from '../../hooks';
import SearchOverlay from '../search/SearchOverlay';

interface SearchBarProps {
  value?: string;
  onChangeText?: (query: string) => void;
  onIconPress?: () => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  headerStyle?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
  disableOverlay?: boolean;
}

/**
 * Clean, Material Design 3 compliant SearchBar component
 *
 * Platform behavior:
 * - Web: Shows dropdown suggestions menu (Google-style)
 * - Mobile: Opens full-screen SearchOverlay modal
 */
export default function SearchBar({
  value: controlledValue,
  onChangeText: controlledOnChangeText,
  onIconPress,
  onSubmitEditing,
  onFocus,
  onBlur,
  placeholder = 'Search Wikipedia',
  headerStyle = false,
  autoFocus = false,
  style,
  disableOverlay = false,
}: SearchBarProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [internalValue, setInternalValue] = useState('');
  const [showWebMenu, setShowWebMenu] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<TextInput>(null);
  const searchBarRef = useRef<View>(null);
  const isNavigatingRef = useRef(false);

  // Controlled or uncontrolled state
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const onChangeText = controlledOnChangeText || setInternalValue;

  // Web: Search suggestions
  const debouncedQuery = useDebounce(value || '', 300);
  const { data: suggestions, isLoading: isLoadingSuggestions } =
    useSearchSuggestions(debouncedQuery);
  const { visitedArticles } = useVisitedArticles();

  const handleFocus = () => {
    // Don't open overlay if we're navigating (prevents overlay from reopening after navigation)
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      onFocus?.();
      return;
    }
    if (!disableOverlay) {
      if (Platform.OS === 'web') {
        // Remeasure position when opening menu
        setTimeout(() => measureSearchBarPosition(), 0);
        setShowWebMenu(true);
      } else {
        setShowMobileOverlay(true);
      }
    }
    onFocus?.();
  };

  const handleBlur = () => {
    if (Platform.OS === 'web') {
      // Delay to allow menu clicks
      setTimeout(() => setShowWebMenu(false), MOTION.durationMedium);
    }
    onBlur?.();
  };

  const handleSuggestionClick = (title: string) => {
    onChangeText(title);
    // Set navigating flag to prevent overlay from reopening
    isNavigatingRef.current = true;
    if (Platform.OS === 'web') {
      setShowWebMenu(false);
      inputRef.current?.blur();
    } else {
      setShowMobileOverlay(false);
    }
    router.push(`/article/${encodeURIComponent(title)}`);
  };

  const handleIconPress = () => {
    if (!disableOverlay) {
      if (Platform.OS === 'web') {
        setShowWebMenu(true);
      } else {
        setShowMobileOverlay(true);
      }
    }
    inputRef.current?.focus();
    onIconPress?.();
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleOverlayClose = useCallback(() => {
    setShowMobileOverlay(false);
    inputRef.current?.blur();
  }, []);

  const handleSubmit = () => {
    if (Platform.OS === 'web') {
      onSubmitEditing?.();
    } else {
      if (!showMobileOverlay && !disableOverlay) {
        setShowMobileOverlay(true);
      } else {
        onSubmitEditing?.();
      }
    }
  };

  // MD3 styling - per https://m3.material.io/components/search/specs
  // Elevation: level1 for standard search bars (level2 was too high)
  const elevation = headerStyle ? 0 : Platform.select({ android: 1, ios: 0, web: 1 });
  const backgroundColor = headerStyle ? 'transparent' : theme.colors.elevation.level1;
  const shouldShowWebMenu = Platform.OS === 'web' && showWebMenu && !disableOverlay;

  // Web: Prepare suggestions and recent articles
  const safeSuggestions = suggestions || [];
  const hasQuery = debouncedQuery.trim().length > 2;
  const showSuggestions = safeSuggestions.length > 0 && !isLoadingSuggestions && hasQuery;
  // Memoize to prevent unnecessary recalculations when visitedArticles reference changes
  const recentVisitedArticles = useMemo(() => visitedArticles.slice(0, 5), [visitedArticles]);
  const showRecent = recentVisitedArticles.length > 0 && !hasQuery;
  const showLoading = isLoadingSuggestions && hasQuery;

  const measureSearchBarPosition = () => {
    if (Platform.OS === 'web' && searchBarRef.current) {
      searchBarRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({
          top: pageY + height + 4,
          left: pageX,
          width: width,
        });
      });
    }
  };

  const handleSearchBarLayout = () => {
    measureSearchBarPosition();
  };

  return (
    <View style={[style, { position: 'relative' }]}>
      <View ref={searchBarRef} onLayout={handleSearchBarLayout}>
        <Searchbar
          ref={inputRef}
          placeholder={placeholder}
          value={value || ''}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          onIconPress={handleIconPress}
          onClearIconPress={handleClear}
          clearIcon={value && value.length > 0 ? 'close' : undefined}
          mode="bar"
          style={{
            elevation,
            backgroundColor,
            // MD3: corner.medium (12dp) for search bars - per https://m3.material.io/components/search/specs
            borderRadius: headerStyle ? 0 : theme.roundness * 3,
            // MD3: Ensure 56dp height for search bars - per https://m3.material.io/components/search/specs
            minHeight: 56,
            height: 56,
          }}
          inputStyle={{
            // fontSize removed - using variant default
            color: theme.colors.onSurface,
            paddingVertical: 0,
            textAlignVertical: 'center',
            includeFontPadding: false,
          }}
          iconColor={theme.colors.onSurfaceVariant}
          // MD3 Accessibility: Proper labels and hints - per https://m3.material.io/components/search/accessibility
          accessibilityLabel="Search Wikipedia"
          accessibilityRole="search"
          accessibilityHint={
            value && value.length > 0
              ? `Searching for "${value}". Press enter to search or tap to view suggestions.`
              : 'Enter search terms to find Wikipedia articles. Tap to view suggestions.'
          }
          autoFocus={autoFocus}
          returnKeyType="search"
          {...(Platform.OS === 'web' && {
            autoComplete: 'off',
            autoCorrect: false,
            spellCheck: false,
          })}
          {...(Platform.OS === 'android' && {
            autoComplete: 'off',
            importantForAutofill: 'no',
          })}
        />
      </View>

      {/* Web: Simple HTML dropdown - Use Portal to render above everything */}
      {Platform.OS === 'web' &&
        shouldShowWebMenu &&
        (showSuggestions || showRecent || showLoading) &&
        dropdownPosition.width > 0 && (
          <Portal>
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.surface,
                  pointerEvents: 'box-none' as any,
                  ...Platform.select({
                    web: {
                      position: 'fixed' as any,
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      width: dropdownPosition.width,
                      zIndex: 9999,
                      // Use theme shadow color for box shadow
                      boxShadow: `0 4px 6px ${theme.colors.shadow}1A`, // 10% opacity (0x1A in hex = 26/255 ≈ 0.1)
                    },
                  }),
                },
              ]}
            >
              <ScrollView
                style={{ maxHeight: 400, pointerEvents: 'auto' as any }}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {/* Search Suggestions */}
                {showSuggestions &&
                  safeSuggestions.map((suggestion, index: number) => (
                    <Pressable
                      key={`suggestion-${suggestion.title}-${index}`}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleSuggestionClick(suggestion.title);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        {
                          backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
                          borderBottomColor: theme.colors.outlineVariant + '1A', // 10% opacity
                        },
                      ]}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.colors.onSurface }]}>
                        {suggestion.title}
                      </Text>
                      {suggestion.description && (
                        <Text
                          style={[
                            styles.dropdownItemDescription,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          {suggestion.description}
                        </Text>
                      )}
                    </Pressable>
                  ))}

                {/* Recently Viewed */}
                {showRecent &&
                  recentVisitedArticles.map((item) => (
                    <Pressable
                      key={`recent-${item.title}-${item.visitedAt}`}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleSuggestionClick(item.title);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        {
                          backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
                          borderBottomColor: theme.colors.outlineVariant + '1A', // 10% opacity
                        },
                      ]}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.colors.onSurface }]}>
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.dropdownItemDescription,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {new Date(item.visitedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </Pressable>
                  ))}

                {/* Loading State */}
                {showLoading && (
                  <View style={[styles.dropdownItem, { borderBottomColor: theme.colors.outlineVariant + '1A' }]}>
                    <Text
                      style={[styles.dropdownItemText, { color: theme.colors.onSurfaceVariant }]}
                    >
                      Loading suggestions...
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </Portal>
        )}

      {/* Mobile: Full-screen overlay */}
      {Platform.OS !== 'web' && (
        <SearchOverlay
          visible={showMobileOverlay && !disableOverlay}
          onClose={handleOverlayClose}
          initialQuery={value || ''}
        />
      )}
    </View>
  );
}

// Styles that need theme are created dynamically in component
const createStyles = (theme: any) => {
  const spacing = require('@/constants/spacing').SPACING;
  return StyleSheet.create({
    dropdown: {
      borderRadius: theme.roundness * 2, // 8dp equivalent (4dp * 2)
      overflow: 'hidden',
      ...Platform.select({
        web: {
          // boxShadow will be set dynamically in component to use theme colors
        },
        default: {
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: spacing.xs / 2,
          elevation: 4,
          zIndex: 1000,
        },
      }),
    },
    dropdownItem: {
      paddingHorizontal: SPACING.base,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      // borderBottomColor will be set dynamically in component to use theme colors
    },
    dropdownItemText: {
      // fontSize and fontWeight removed - using variant defaults
    },
    dropdownItemDescription: {
      // fontSize removed - using variant default
      marginTop: spacing.xs / 4, // 2dp (half of xs)
    },
  });
};
