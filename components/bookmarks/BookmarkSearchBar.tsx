import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar, useTheme } from 'react-native-paper';

interface BookmarkSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function BookmarkSearchBar({ searchQuery, onSearchChange }: BookmarkSearchBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Searchbar
        placeholder="Search bookmarks..."
        onChangeText={onSearchChange}
        value={searchQuery}
        style={styles.searchbar}
        inputStyle={styles.input}
        iconColor={theme.colors.onSurfaceVariant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    elevation: 0,
  },
  input: {
    fontSize: 16,
  },
});
