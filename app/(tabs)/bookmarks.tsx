import BookmarkCard from '@/components/bookmarks/BookmarkCard';
import BookmarkEditModal from '@/components/bookmarks/BookmarkEditModal';
import BookmarkFilters from '@/components/bookmarks/BookmarkFilters';
import BookmarkSearchBar from '@/components/bookmarks/BookmarkSearchBar';
import BookmarkSortMenu, { SortOption } from '@/components/bookmarks/BookmarkSortMenu';
import BookmarkTagEditor from '@/components/bookmarks/BookmarkTagEditor';
import BookmarksEmptyState from '@/components/bookmarks/BookmarksEmptyState';
import ProgressModal from '@/components/common/ProgressModal';
import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import { useScrollToTop } from '@/context/ScrollToTopContext';
import { useBookmarks, useReadingProgress } from '@/hooks';
import { Bookmark } from '@/types/bookmarks';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, View, useWindowDimensions } from 'react-native';
import { Appbar, Button, Chip, Menu, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useSnackbar } from '../../context/SnackbarContext';

export default function BookmarksScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const {
    bookmarks,
    removeBookmark,
    removeBookmarks,
    clearBookmarks,
    downloadAllBookmarks,
    isArticleDownloaded,
    updateBookmarkTags,
    loadBookmarks,
    addBookmark,
  } = useBookmarks();
  const { getProgress, clearProgress, clearAllProgress, saveProgress } = useReadingProgress();
  const { showSuccess, showError, showSnackbar } = useSnackbar();
  const { registerScrollRef, scrollToTop } = useScrollToTop();
  const wasFocusedRef = useRef(false);

  // State management
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadCurrent, setDownloadCurrent] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [bulkTagModalVisible, setBulkTagModalVisible] = useState(false);
  const [bulkTags, setBulkTags] = useState<string[]>([]);
  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [tagsModalBookmark, setTagsModalBookmark] = useState<Bookmark | null>(null);
  const flashListRef = useRef<any>(null);

  // Register scroll ref for scroll-to-top functionality
  useEffect(() => {
    registerScrollRef('/(tabs)/bookmarks', {
      scrollToTop: () => {
        if (flashListRef.current) {
          flashListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      },
    });
  }, [registerScrollRef]);

  // Listen for tab press from bottom nav bar - scroll to top if already focused
  useFocusEffect(
    useCallback(() => {
      // If we were already focused before, this means the user pressed the tab again
      if (wasFocusedRef.current) {
        scrollToTop('/(tabs)/bookmarks');
      }
      // Mark as focused for next time
      wasFocusedRef.current = true;
    }, [scrollToTop])
  );

  // Calculate content width - match Feed layout (single column, 650px max)
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;
  const leftOffset = isLargeScreen ? 448 : 0; // gutter + drawer
  const rightOffset = isLargeScreen ? 480 : 0; // sidebar
  const availableWidth = width - leftOffset - rightOffset;

  const maxCardWidth = 650; // Match Feed max width
  const horizontalPadding =
    availableWidth > maxCardWidth ? (availableWidth - maxCardWidth) / 2 : SPACING.base;
  // Card width: on large screens use maxCardWidth, on small screens use availableWidth minus padding
  const cardWidth =
    availableWidth > maxCardWidth ? maxCardWidth : availableWidth - SPACING.base * 2; // SPACING.base padding on each side

  // Lazy load Fuse.js - only needed when searching
  const [fuseModule, setFuseModule] = useState<typeof import('fuse.js') | null>(null);
  const [isLoadingFuse, setIsLoadingFuse] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() && !fuseModule && !isLoadingFuse) {
      setIsLoadingFuse(true);
      import('fuse.js')
        .then((module) => {
          setFuseModule(module);
          setIsLoadingFuse(false);
        })
        .catch(() => {
          setIsLoadingFuse(false);
        });
    }
  }, [searchQuery, fuseModule, isLoadingFuse]);

  // Filter and sort bookmarks
  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = [...bookmarks];

    // Filter by tag
    if (selectedTag !== null) {
      filtered = filtered.filter((b) => b.tags?.includes(selectedTag));
    }

    // Filter by search query using Fuse.js for fuzzy search
    if (searchQuery.trim()) {
      if (fuseModule) {
        // Use Fuse.js for fuzzy search when loaded
        const Fuse = fuseModule.default;
        const fuse = new Fuse(filtered, {
          keys: [
            { name: 'title', weight: 0.7 },
            { name: 'summary', weight: 0.3 },
            { name: 'tags', weight: 0.1 },
          ],
          threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
          includeScore: true,
          minMatchCharLength: 2,
        });

        const searchResults = fuse.search(searchQuery);
        filtered = searchResults.map((result) => result.item);
      } else {
        // Fallback to simple string matching while Fuse.js loads
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            b.summary?.toLowerCase().includes(query) ||
            b.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          const progressA = getProgress(a.title);
          const progressB = getProgress(b.title);
          return progressB - progressA; // Descending (highest first)
        case 'date':
        default:
          return new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime(); // Descending (newest first)
      }
    });

    return filtered;
  }, [bookmarks, searchQuery, selectedTag, sortOption, getProgress, fuseModule]);

  const handleRemoveBookmark = useCallback(
    async (title: string) => {
      // Store bookmark data for undo
      const bookmarkToDelete = bookmarks.find((b) => b.title === title);
      const progressToDelete = getProgress(title);

      if (bookmarkToDelete) {
        await removeBookmark(title);
        await clearProgress(title);

        // Show snackbar with undo option
        showSnackbar(`Bookmark removed`, {
          duration: 5000,
          action: {
            label: 'Undo',
            onPress: async () => {
              try {
                // Restore bookmark
                await addBookmark(
                  bookmarkToDelete.title,
                  bookmarkToDelete.thumbnail,
                  bookmarkToDelete.summary
                );

                // Restore progress if it existed
                if (progressToDelete > 0) {
                  await saveProgress(bookmarkToDelete.title, progressToDelete);
                }
              } catch (error) {
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                  console.error('Failed to undo bookmark removal:', error);
                }
                showError('Failed to restore bookmark');
              }
            },
          },
        });
      }
    },
    [
      bookmarks,
      removeBookmark,
      clearProgress,
      getProgress,
      addBookmark,
      saveProgress,
      showSnackbar,
      showError,
    ]
  );

  const handleDownloadAll = useCallback(async () => {
    if (filteredAndSortedBookmarks.length === 0) return;

    const notDownloaded = filteredAndSortedBookmarks.filter((b) => !isArticleDownloaded(b.title));
    if (notDownloaded.length === 0) {
      showSuccess('All bookmarks are already downloaded');
      return;
    }

    setIsDownloadingAll(true);
    setDownloadProgress(0);
    setDownloadCurrent(0);
    setDownloadTotal(notDownloaded.length);

    try {
      const success = await downloadAllBookmarks((progress, current, total) => {
        setDownloadProgress(progress);
        setDownloadCurrent(current);
        setDownloadTotal(total);
      });

      if (success) {
        showSuccess(
          `Downloaded ${notDownloaded.length} article${notDownloaded.length !== 1 ? 's' : ''} for offline reading`
        );
      } else {
        showError('Failed to download some articles');
      }
    } catch {
      showError('Failed to download articles');
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(0);
      setDownloadCurrent(0);
      setDownloadTotal(0);
    }
  }, [
    filteredAndSortedBookmarks,
    isArticleDownloaded,
    downloadAllBookmarks,
    showSuccess,
    showError,
  ]);

  const handleClearAllBookmarks = useCallback(() => {
    if (bookmarks.length === 0) return;

    const confirmAction = () => {
      clearBookmarks();
      clearAllProgress();
      showSuccess('All bookmarks cleared');
    };

    if (bookmarks.length > 5) {
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(
          'Are you sure you want to clear all your bookmarks? This action cannot be undone.'
        );
        if (confirmed) confirmAction();
      } else {
        Alert.alert(
          'Clear All Bookmarks',
          'Are you sure you want to clear all your bookmarks? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear All', style: 'destructive', onPress: confirmAction },
          ]
        );
      }
    } else {
      confirmAction();
    }
  }, [bookmarks.length, clearBookmarks, clearAllProgress, showSuccess]);

  // Selection mode handlers
  const toggleSelection = useCallback((title: string) => {
    setSelectedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedTitles(new Set(filteredAndSortedBookmarks.map((b) => b.title)));
  }, [filteredAndSortedBookmarks]);

  const deselectAll = useCallback(() => {
    setSelectedTitles(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedTitles.size === 0) return;

    const count = selectedTitles.size;
    const confirmAction = async () => {
      try {
        // Store bookmarks and progress for undo
        const bookmarksToDelete = bookmarks.filter((b) => selectedTitles.has(b.title));
        const progressToDelete: Record<string, number> = {};
        for (const title of selectedTitles) {
          const progress = getProgress(title);
          if (progress > 0) {
            progressToDelete[title] = progress;
          }
        }

        await removeBookmarks(Array.from(selectedTitles));
        // Clear progress for deleted bookmarks
        for (const title of selectedTitles) {
          await clearProgress(title);
        }
        setSelectedTitles(new Set());
        setSelectionMode(false);

        // Show snackbar with undo option
        showSnackbar(`Deleted ${count} bookmark${count !== 1 ? 's' : ''}`, {
          duration: 5000,
          action: {
            label: 'Undo',
            onPress: async () => {
              try {
                // Restore all bookmarks
                for (const bookmark of bookmarksToDelete) {
                  await addBookmark(bookmark.title, bookmark.thumbnail, bookmark.summary);
                }

                // Restore progress
                for (const [title, progress] of Object.entries(progressToDelete)) {
                  await saveProgress(title, progress);
                }
              } catch (error) {
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                  console.error('Failed to undo bookmark deletion:', error);
                }
                showError('Failed to restore bookmarks');
              }
            },
          },
        });
      } catch {
        showError('Failed to delete bookmarks');
      }
    };

    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(`Delete ${count} bookmark${count !== 1 ? 's' : ''}?`);
      if (confirmed) confirmAction();
    } else {
      Alert.alert('Delete Bookmarks', `Delete ${count} bookmark${count !== 1 ? 's' : ''}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmAction },
      ]);
    }
  }, [
    selectedTitles,
    removeBookmarks,
    clearProgress,
    showSnackbar,
    showError,
    bookmarks,
    getProgress,
    addBookmark,
    saveProgress,
  ]);

  const handleEditBookmark = useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setEditModalVisible(true);
  }, []);

  const handleShowAllTags = useCallback((bookmark: Bookmark) => {
    setTagsModalBookmark(bookmark);
    setTagsModalVisible(true);
  }, []);

  const handleSaveBookmarkEdit = useCallback(
    async (tags: string[]) => {
      if (!editingBookmark) return;
      try {
        await updateBookmarkTags(editingBookmark.title, tags);
        showSuccess('Bookmark updated');
      } catch {
        showError('Failed to update bookmark');
      }
    },
    [editingBookmark, updateBookmarkTags, showSuccess, showError]
  );

  const handleBulkTagSave = useCallback(async () => {
    if (selectedTitles.size === 0) return;
    try {
      const count = selectedTitles.size;
      for (const title of selectedTitles) {
        const bookmark = bookmarks.find((b) => b.title === title);
        if (bookmark) {
          // Merge existing tags with new tags, removing duplicates
          const existingTags = bookmark.tags || [];
          const mergedTags = Array.from(new Set([...existingTags, ...bulkTags]));
          await updateBookmarkTags(title, mergedTags);
        }
      }
      setBulkTagModalVisible(false);
      setBulkTags([]);
      setSelectedTitles(new Set());
      setSelectionMode(false);
      showSuccess(`Tagged ${count} bookmark${count !== 1 ? 's' : ''}`);
    } catch (error) {
      showError('Failed to tag bookmarks');
    }
  }, [selectedTitles, bulkTags, bookmarks, updateBookmarkTags, showSuccess, showError]);

  const handleLongPress = useCallback(
    (title: string) => {
      if (!selectionMode) {
        setSelectionMode(true);
        setSelectedTitles(new Set([title]));
      } else {
        toggleSelection(title);
      }
    },
    [selectionMode, toggleSelection]
  );

  const renderBookmarkCard = useCallback(
    ({ item }: { item: Bookmark }) => {
      const isSelected = selectedTitles.has(item.title);

      return (
        <View
          style={{
            marginBottom: SPACING.lg,
            width: cardWidth,
            alignSelf: 'center',
          }}
        >
          <BookmarkCard
            item={item}
            onRemoveBookmark={handleRemoveBookmark}
            selectionMode={selectionMode}
            isSelected={isSelected}
            onToggleSelection={() => toggleSelection(item.title)}
            onLongPress={() => handleLongPress(item.title)}
            onEdit={() => handleEditBookmark(item)}
            onTagPress={(tag) => setSelectedTag(tag)}
            onShowAllTags={() => handleShowAllTags(item)}
          />
        </View>
      );
    },
    [
      handleRemoveBookmark,
      handleEditBookmark,
      handleLongPress,
      handleShowAllTags,
      cardWidth,
      selectionMode,
      selectedTitles,
      toggleSelection,
      setSelectedTag,
    ]
  );

  const renderEmptyState = useCallback(() => <BookmarksEmptyState />, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadBookmarks();
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Failed to refresh bookmarks:', error);
      }
      showError('Failed to refresh bookmarks');
    } finally {
      setRefreshing(false);
    }
  }, [loadBookmarks, showError]);

  return (
    <>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} mode="center-aligned">
        {selectionMode ? (
          <>
            <Appbar.Action
              icon="close"
              onPress={() => {
                setSelectionMode(false);
                setSelectedTitles(new Set());
              }}
            />
            <Appbar.Content
              title={`${selectedTitles.size} selected`}
              titleStyle={{ fontWeight: '700', fontSize: 20 }}
            />
            <Appbar.Action
              icon="tag"
              onPress={() => {
                // Get all unique tags from selected bookmarks
                const allTags = new Set<string>();
                bookmarks
                  .filter((b) => selectedTitles.has(b.title))
                  .forEach((b) => {
                    if (b.tags) {
                      b.tags.forEach((tag) => allTags.add(tag));
                    }
                  });
                setBulkTags(Array.from(allTags));
                setBulkTagModalVisible(true);
              }}
              disabled={selectedTitles.size === 0}
            />
            <Appbar.Action
              icon="delete"
              color={theme.colors.error}
              onPress={handleBulkDelete}
              disabled={selectedTitles.size === 0}
            />
          </>
        ) : (
          <>
            <Appbar.Content
              title={`Bookmarks (${filteredAndSortedBookmarks.length}${filteredAndSortedBookmarks.length !== bookmarks.length ? ` of ${bookmarks.length}` : ''})`}
              titleStyle={{
                fontWeight: '700',
                fontSize: 20,
                color: theme.colors.onSurface,
                textAlign: 'center',
              }}
            />
            {bookmarks.length > 0 && (
              <>
                <BookmarkSortMenu
                  visible={sortMenuVisible}
                  onDismiss={() => setSortMenuVisible(false)}
                  anchor={
                    <Appbar.Action
                      icon="sort"
                      onPress={() => setSortMenuVisible(true)}
                      accessibilityLabel="Sort bookmarks"
                    />
                  }
                  currentSort={sortOption}
                  onSortChange={setSortOption}
                />
                <Menu
                  visible={moreMenuVisible}
                  onDismiss={() => setMoreMenuVisible(false)}
                  anchor={
                    <Appbar.Action
                      icon="dots-vertical"
                      onPress={() => setMoreMenuVisible(true)}
                      accessibilityLabel="More options"
                    />
                  }
                  anchorPosition="bottom"
                >
                  <Menu.Item
                    leadingIcon="download"
                    onPress={() => {
                      setMoreMenuVisible(false);
                      handleDownloadAll();
                    }}
                    disabled={isDownloadingAll}
                    title={isDownloadingAll ? 'Downloading...' : 'Download All'}
                  />
                  <Menu.Item
                    leadingIcon="delete-sweep"
                    titleStyle={{ color: theme.colors.error }}
                    onPress={() => {
                      setMoreMenuVisible(false);
                      handleClearAllBookmarks();
                    }}
                    title="Clear All"
                  />
                </Menu>
              </>
            )}
          </>
        )}
      </Appbar.Header>

      {bookmarks.length > 0 && (
        <>
          <BookmarkSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <BookmarkFilters
            bookmarks={bookmarks}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />
        </>
      )}

      {selectionMode && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <Button
            mode="outlined"
            onPress={
              selectedTitles.size === filteredAndSortedBookmarks.length ? deselectAll : selectAll
            }
          >
            {selectedTitles.size === filteredAndSortedBookmarks.length
              ? 'Deselect All'
              : 'Select All'}
          </Button>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            {selectedTitles.size} of {filteredAndSortedBookmarks.length} selected
          </Text>
        </View>
      )}

      <FlashList
        ref={flashListRef}
        data={filteredAndSortedBookmarks}
        renderItem={renderBookmarkCard}
        keyExtractor={(item: Bookmark) => item.title + item.bookmarkedAt}
        {...({ estimatedItemSize: 220 } as any)}
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          paddingVertical: 16,
          flexGrow: 1,
          paddingHorizontal: horizontalPadding,
          ...(filteredAndSortedBookmarks.length === 0 && {
            justifyContent: 'center',
          }),
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      <Portal>
        <ProgressModal
          visible={isDownloadingAll}
          progress={downloadProgress}
          message={
            downloadTotal > 0
              ? `Downloading ${downloadCurrent} of ${downloadTotal} articles...`
              : 'Downloading articles...'
          }
          showPercentage={true}
          onCancel={() => {
            setIsDownloadingAll(false);
            setDownloadProgress(0);
            setDownloadCurrent(0);
            setDownloadTotal(0);
          }}
          cancelLabel="Cancel"
        />

        <BookmarkEditModal
          visible={editModalVisible}
          bookmark={editingBookmark}
          allBookmarks={bookmarks}
          onDismiss={() => {
            setEditModalVisible(false);
            setEditingBookmark(null);
          }}
          onSave={handleSaveBookmarkEdit}
        />

        <Modal
          visible={bulkTagModalVisible}
          onDismiss={() => {
            setBulkTagModalVisible(false);
            setBulkTags([]);
          }}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 24,
            margin: 20,
            borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
          }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16, fontWeight: '700' }}>
            Add Tags
          </Text>
          <Text
            variant="bodyMedium"
            style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}
          >
            Add tags to {selectedTitles.size} selected bookmark
            {selectedTitles.size !== 1 ? 's' : ''}. These tags will be added to existing tags.
          </Text>

          <BookmarkTagEditor tags={bulkTags} onTagsChange={setBulkTags} />

          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
            <Button
              mode="outlined"
              onPress={() => {
                setBulkTagModalVisible(false);
                setBulkTags([]);
              }}
            >
              Cancel
            </Button>
            <Button mode="contained" onPress={handleBulkTagSave}>
              Add Tags
            </Button>
          </View>
        </Modal>

        {/* Tags Modal - Shows all tags for a bookmark */}
        <Modal
          visible={tagsModalVisible}
          onDismiss={() => {
            setTagsModalVisible(false);
            setTagsModalBookmark(null);
          }}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 24,
            margin: 20,
            borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
            width: Math.min(width - 40, 500), // Constrain to container width with 20px margin on each side
            alignSelf: 'center',
          }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 8, fontWeight: '700' }}>
            {tagsModalBookmark?.title}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}
          >
            All Tags
          </Text>

          {tagsModalBookmark?.tags && tagsModalBookmark.tags.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {tagsModalBookmark.tags.map((tag) => (
                <Chip
                  key={tag}
                  onPress={() => {
                    setSelectedTag(tag);
                    setTagsModalVisible(false);
                    setTagsModalBookmark(null);
                  }}
                  style={{
                    height: 32,
                    marginBottom: 4,
                  }}
                  textStyle={{ fontSize: 13 }}
                  mode="flat"
                  accessible={true}
                  accessibilityLabel={`Filter by tag: ${tag}`}
                  accessibilityHint="Filters bookmarks by this tag"
                >
                  {tag}
                </Chip>
              ))}
            </View>
          ) : (
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}
            >
              No tags
            </Text>
          )}

          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              mode="outlined"
              onPress={() => {
                setTagsModalVisible(false);
                setTagsModalBookmark(null);
              }}
            >
              Close
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}
