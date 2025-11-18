import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Bookmark } from '../../types/bookmarks';
import BookmarkTagFilter from './BookmarkTagFilter';

interface BookmarkFiltersProps {
  bookmarks: Bookmark[];
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export default function BookmarkFilters({
  bookmarks,
  selectedTag,
  onTagChange,
}: BookmarkFiltersProps) {
  const theme = useTheme();
  const hasTags = bookmarks.some((b) => b.tags && b.tags.length > 0);

  if (!hasTags) {
    return null; // Don't show filters if there's nothing to filter
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant },
      ]}
    >
      <BookmarkTagFilter
        bookmarks={bookmarks}
        selectedTag={selectedTag}
        onTagChange={onTagChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
});
