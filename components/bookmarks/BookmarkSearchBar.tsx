import { SPACING } from '@/constants/spacing';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Searchbar, useTheme } from 'react-native-paper';

interface BookmarkSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Bookmark search bar component
 * Per MD3 specs: https://m3.material.io/components/search/specs
 */
export default function BookmarkSearchBar({ searchQuery, onSearchChange }: BookmarkSearchBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Searchbar
        placeholder="Search bookmarks..."
        onChangeText={onSearchChange}
        value={searchQuery}
        mode="bar"
        style={[
          styles.searchbar,
          {
            elevation: Platform.select({ android: 2, ios: 0, web: 2 }),
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: theme.roundness * 3,
            minHeight: 56,
            height: 56,
          },
        ]}
        inputStyle={styles.input}
        iconColor={theme.colors.onSurfaceVariant}
        // MD3 Accessibility: Proper labels and hints - per https://m3.material.io/components/search/accessibility
        accessibilityLabel="Search bookmarks"
        accessibilityRole="search"
        accessibilityHint={
          searchQuery && searchQuery.length > 0
            ? `Searching for "${searchQuery}". Results will filter as you type.`
            : 'Enter search terms to filter your bookmarks'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // MD3: 16dp horizontal padding
    paddingHorizontal: SPACING.base,
    // MD3: 8dp vertical padding
    paddingVertical: SPACING.sm,
  },
  searchbar: {
    // Elevation set dynamically in component
  },
  input: {
    // fontSize removed - using variant default from react-native-paper
    // MD3: Text color handled by theme
  },
});
