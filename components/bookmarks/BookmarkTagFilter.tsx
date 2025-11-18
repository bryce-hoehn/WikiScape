import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Chip, IconButton, useTheme } from 'react-native-paper';
import { Bookmark } from '../../types/bookmarks';

interface BookmarkTagFilterProps {
  bookmarks: Bookmark[];
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export default function BookmarkTagFilter({
  bookmarks,
  selectedTag,
  onTagChange,
}: BookmarkTagFilterProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [currentPage, setCurrentPage] = useState(0);

  // Extract unique tags from all bookmarks
  const tags = React.useMemo(() => {
    const tagSet = new Set<string>();
    bookmarks.forEach((bookmark) => {
      if (bookmark.tags && bookmark.tags.length > 0) {
        bookmark.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [bookmarks]);

  // Count bookmarks with each tag
  const tagCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    tags.forEach((tag) => {
      counts[tag] = bookmarks.filter((b) => b.tags?.includes(tag)).length;
    });
    return counts;
  }, [bookmarks, tags]);

  // Prepare data with "All Tags" option
  const tagData = React.useMemo(() => {
    return [
      { tag: null, label: 'All Tags', count: bookmarks.length },
      ...tags.map((tag) => ({ tag, label: tag, count: tagCounts[tag] })),
    ];
  }, [tags, tagCounts, bookmarks.length]);

  // Calculate pagination for web
  const isWeb = Platform.OS === 'web';
  // Estimate available width: screen width minus sidebars and padding
  // For header, we have less space - estimate container width
  const containerPadding = 24; // 12px on each side
  const estimatedChipWidth = 120; // Average width including count text and margin
  const availableWidth = width - containerPadding;
  const tagsPerPage = isWeb ? Math.max(1, Math.floor(availableWidth / estimatedChipWidth)) : tagData.length;
  const totalPages = isWeb ? Math.ceil(tagData.length / tagsPerPage) : 1;
  const startIndex = currentPage * tagsPerPage;
  const endIndex = startIndex + tagsPerPage;
  const displayedTags = isWeb ? tagData.slice(startIndex, endIndex) : tagData;

  // Reset to first page when tagData changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [tagData.length]);

  if (tags.length === 0) {
    return null; // Don't show tag filter if no tags exist
  }

  const renderTagItem = ({
    item,
  }: {
    item: { tag: string | null; label: string; count: number };
  }) => (
    <Chip
      selected={selectedTag === item.tag}
      onPress={() => onTagChange(item.tag)}
      style={styles.chip}
      textStyle={{ fontSize: 14 }}
      mode="flat"
      compact
    >
      {item.label} ({item.count})
    </Chip>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {isWeb ? (
        <>
          <View style={styles.tagsRow}>
            {displayedTags.map((item) => (
              <Chip
                key={item.tag || 'all'}
                selected={selectedTag === item.tag}
                onPress={() => onTagChange(item.tag)}
                style={styles.chip}
                textStyle={{ fontSize: 14 }}
                mode="flat"
                compact
              >
                {item.label} ({item.count})
              </Chip>
            ))}
          </View>
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <IconButton
                icon="chevron-left"
                iconColor={
                  currentPage === 0
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant
                }
                size={20}
                onPress={() => {
                  if (currentPage > 0) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                disabled={currentPage === 0}
                accessibilityLabel="Previous page"
                accessibilityHint="Navigate to the previous page of tags"
              />
              <View style={styles.pageIndicators}>
                {Array.from({ length: totalPages }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pageIndicator,
                      {
                        backgroundColor:
                          currentPage === index
                            ? theme.colors.primary
                            : theme.colors.surfaceVariant,
                      },
                    ]}
                  />
                ))}
              </View>
              <IconButton
                icon="chevron-right"
                iconColor={
                  currentPage === totalPages - 1
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant
                }
                size={20}
                onPress={() => {
                  if (currentPage < totalPages - 1) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                disabled={currentPage === totalPages - 1}
                accessibilityLabel="Next page"
                accessibilityHint="Navigate to the next page of tags"
              />
            </View>
          )}
        </>
      ) : (
        <FlashList
          data={tagData}
          renderItem={renderTagItem}
          keyExtractor={(item) => item.tag || 'all'}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={100}
          contentContainerStyle={styles.chipContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipContainer: {
    paddingRight: 12,
    gap: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    marginRight: 4,
    height: 32,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  pageIndicators: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
