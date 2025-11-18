import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Chip, IconButton, Modal, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';
import { Bookmark } from '../../types/bookmarks';
import BookmarkTagEditor from './BookmarkTagEditor';

interface BookmarkEditModalProps {
  visible: boolean;
  bookmark: Bookmark | null;
  allBookmarks?: Bookmark[];
  onDismiss: () => void;
  onSave: (tags: string[]) => Promise<void>;
}

export default function BookmarkEditModal({
  visible,
  bookmark,
  allBookmarks = [],
  onDismiss,
  onSave,
}: BookmarkEditModalProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Extract all unique tags from all bookmarks
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    allBookmarks.forEach((b) => {
      if (b.tags && b.tags.length > 0) {
        b.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [allBookmarks]);

  useEffect(() => {
    if (bookmark) {
      setTags(bookmark.tags || []);
    }
  }, [bookmark]);

  // Reset to first page when modal opens or existingTags change
  useEffect(() => {
    if (visible) {
      setCurrentPage(0);
    }
  }, [visible, existingTags.length]);

  // Calculate pagination for web
  const isWeb = Platform.OS === 'web';
  const modalContentWidth = Math.min(width - 40, 500) - 48; // Subtract padding (24px * 2)
  // Estimate: average chip width ~80px + gap 8px, but we'll use a conservative estimate
  const estimatedChipWidth = 100; // Average width including margin
  const tagsPerPage = isWeb ? Math.max(1, Math.floor(modalContentWidth / estimatedChipWidth)) : existingTags.length;
  const totalPages = isWeb ? Math.ceil(existingTags.length / tagsPerPage) : 1;
  const startIndex = currentPage * tagsPerPage;
  const endIndex = startIndex + tagsPerPage;
  const displayedTags = isWeb ? existingTags.slice(startIndex, endIndex) : existingTags;

  const handleTagPress = (tag: string) => {
    if (tags.includes(tag)) {
      // Remove tag if already selected
      setTags(tags.filter((t) => t !== tag));
    } else {
      // Add tag if not selected
      setTags([...tags, tag]);
    }
  };

  const handleSave = async () => {
    if (!bookmark) return;
    setSaving(true);
    try {
      await onSave(tags);
      onDismiss();
    } catch (error) {
      console.error('Failed to save bookmark changes:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!bookmark) return null;

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
    >
      <Text variant="titleMedium" style={{ marginBottom: SPACING.base }}>
        {bookmark.title}
      </Text>

      <BookmarkTagEditor tags={tags} onTagsChange={setTags} />

      {existingTags.length > 0 && (
        <View style={styles.existingTagsContainer}>
          <Text
            variant="labelMedium"
            style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}
          >
            Existing Tags
          </Text>
          {isWeb ? (
            <>
              <View style={styles.tagsGrid}>
                {displayedTags.map((tag) => {
                  const isSelected = tags.includes(tag);
                  return (
                    <Chip
                      key={tag}
                      selected={isSelected}
                      onPress={() => handleTagPress(tag)}
                      style={[styles.existingTagChip, { height: 32 }]}
                      mode="flat"
                    >
                      {tag}
                    </Chip>
                  );
                })}
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
                    size={24}
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
                    size={24}
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.existingTagsList}
            >
              {existingTags.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    selected={isSelected}
                    onPress={() => handleTagPress(tag)}
                    style={[styles.existingTagChip, { height: 32 }]}
                    mode="flat"
                  >
                    {tag}
                  </Chip>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={onDismiss} disabled={saving}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSave} loading={saving}>
          Save
        </Button>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, width: number) => StyleSheet.create({
  modal: {
    padding: 24,
    margin: 20,
    borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
    maxHeight: '80%',
    width: Math.min(width - 40, 500), // Constrain to container width with 20px margin on each side
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 24,
  },
  existingTagsContainer: {
    marginTop: 16,
  },
  existingTagsList: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  existingTagChip: {
    marginRight: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  pageIndicators: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
