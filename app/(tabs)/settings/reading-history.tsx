import { fetchArticleSummariesBatch } from '@/api';
import RecommendationCard from '@/components/article/RecommendationCard';
import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import { TYPOGRAPHY } from '@/constants/typography';
import { useBookmarkToggle, useReadingProgress, useVisitedArticles } from '@/hooks';
import { RecommendationItem } from '@/types/components';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSnackbar } from '../../../context/SnackbarContext';

const ITEMS_PER_PAGE = 10;

export default function ReadingHistoryScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const {
    removeVisitedArticle,
    clearVisitedArticles,
    visitedArticles,
    addVisitedArticle,
    loadVisitedArticles,
  } = useVisitedArticles();
  const { clearAllProgress, saveProgress, getProgressData } = useReadingProgress();
  const { showSuccess, showError, showSnackbar } = useSnackbar();
  const { handleBookmarkToggle, isBookmarked } = useBookmarkToggle();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const flashListRef = useRef<FlashListRef<RecommendationItem[]>>(null);

  // Calculate content width to match main feed layout
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;
  // Left: 88px gutter + 280px drawer = 368px, plus 1px divider
  const leftOffset = isLargeScreen ? 369 : 0;
  // Right: 480px sidebar + 1px divider
  const rightOffset = isLargeScreen ? 481 : 0;
  const availableWidth = width - leftOffset - rightOffset;
  const maxCardWidth = 800; // Match main feed max width
  const cardWidth =
    availableWidth > maxCardWidth ? maxCardWidth : availableWidth - SPACING.base * 2;
  // itemWidth should be the available content width, not full screen width
  const itemWidth = availableWidth;

  // Batch fetch all article summaries at once (much faster)
  const articleTitles = useMemo(
    () => visitedArticles.map((visited) => visited.title),
    [visitedArticles]
  );

  const { data: summariesMap, isLoading: isLoadingSummaries } = useQuery({
    queryKey: ['article-summaries-batch', articleTitles.sort().join('|')],
    queryFn: () => fetchArticleSummariesBatch(articleTitles),
    enabled: articleTitles.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Convert summaries to RecommendationItems, preserving order of visitedArticles
  const articleItems = useMemo(() => {
    if (!summariesMap) return [];
    
    return visitedArticles
      .map((visited) => {
        const article = summariesMap[visited.title];
        if (article) {
          return {
            title: article.title,
            displaytitle: article.displaytitle || article.title,
            description: article.description,
            extract: article.extract,
            thumbnail: article.thumbnail,
            pageid: article.pageid,
          } as RecommendationItem;
        }
        return null;
      })
      .filter((item): item is RecommendationItem => item !== null);
  }, [summariesMap, visitedArticles]);

  // Create pages of 10 items each
  const pages = useMemo(() => {
    const result: RecommendationItem[][] = [];
    for (let i = 0; i < articleItems.length; i += ITEMS_PER_PAGE) {
      result.push(articleItems.slice(i, i + ITEMS_PER_PAGE));
    }
    return result;
  }, [articleItems]);

  // Scroll to page when currentPage changes externally
  useEffect(() => {
    if (flashListRef.current && currentPage !== undefined && pages.length > 0) {
      flashListRef.current.scrollToIndex({ index: currentPage, animated: true });
    }
  }, [currentPage, pages.length]);

  const handleResetReadingHistory = () => {
    const isHistoryEmpty = visitedArticles.length === 0;
    if (isHistoryEmpty) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmClearHistory = async () => {
    setShowConfirmDialog(false);
    setIsResetting(true);
    try {
      const articlesToRestore = [...visitedArticles];
      const progressToRestore: Record<
        string,
        { progress: number; lastReadAt: string; expandedSections?: string[] }
      > = {};

      for (const article of visitedArticles) {
        const progressData = getProgressData(article.title);
        if (progressData) {
          progressToRestore[article.title] = progressData;
        }
      }

      await Promise.all([clearVisitedArticles(), clearAllProgress()]);

      showSnackbar('Reading history and progress cleared successfully', {
        duration: 5000,
        action: {
          label: 'Undo',
          onPress: async () => {
            try {
              for (const article of articlesToRestore) {
                await addVisitedArticle(article.title);
              }

              for (const [title, progressData] of Object.entries(progressToRestore)) {
                await saveProgress(title, progressData.progress, progressData.expandedSections);
              }

              await loadVisitedArticles();
            } catch (error) {
              if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.error('Failed to undo history clearing:', error);
              }
              showError('Failed to restore reading history');
            }
          },
        },
      });
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Failed to clear reading history:', error);
      }
      showError('Failed to clear reading history. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRemoveArticle = async (title: string) => {
    try {
      await removeVisitedArticle(title);
      showSuccess('Article removed from history');
      // Reset to first page if current page becomes empty
      if (pages.length > 0 && currentPage >= pages.length - 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      showError('Failed to remove article from history');
    }
  };

  const renderPage = ({
    item: pageItems,
    index: pageIndex,
  }: {
    item: RecommendationItem[];
    index: number;
  }) => (
    <ScrollView
      style={{ width: itemWidth, flex: 1 }}
      contentContainerStyle={{
        paddingVertical: SPACING.sm,
        paddingBottom: SPACING.xl,
        alignItems: 'center',
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={true}
    >
      {pageItems.map((articleItem, itemIndex) => (
        <View
          key={`${articleItem.title}-${itemIndex}`}
          style={{
            marginBottom: SPACING.base,
            width: cardWidth,
            alignSelf: 'center',
          }}
        >
          <RecommendationCard
            item={articleItem}
            index={itemIndex}
            isBookmarked={isBookmarked}
            onBookmarkToggle={handleBookmarkToggle}
            onRemove={handleRemoveArticle}
          />
        </View>
      ))}
    </ScrollView>
  );

  return (
    <>
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.surface,
        }}
        mode="center-aligned"
      >
        <Appbar.BackAction onPress={() => router.push('/(tabs)/settings')} />
        <Appbar.Content
          title="Reading History"
          titleStyle={{
            // MD3: Center-aligned app bars use 22sp title
            // Reference: https://m3.material.io/components/app-bars/overview
            fontWeight: '500', // MD3: Medium weight (500) for app bar titles
            fontSize: TYPOGRAPHY.appBarTitle,
          }}
        />
      </Appbar.Header>

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
      >
        {/* Clear History Section */}
        <List.Section>
          <List.Subheader>Manage History</List.Subheader>
          <View style={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING.base }}>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginBottom: 8,
                lineHeight: 18,
              }}
            >
              Permanently delete all reading history and reading progress. This will also affect
              your personalized &quot;For You&quot; recommendations.
            </Text>
            <Button
              mode="outlined"
              onPress={handleResetReadingHistory}
              disabled={isResetting || visitedArticles.length === 0}
              loading={isResetting}
              icon="delete-outline"
              textColor={theme.colors.error}
              style={{ marginTop: 8 }}
            >
              {isResetting ? 'Clearing...' : 'Clear History'}
            </Button>
          </View>
        </List.Section>

        <Divider style={{ marginVertical: 8 }} />

        {visitedArticles.length > 0 ? (
          <>
            <View
              style={{
                // Calculate height for 5 cards: 5 * cardHeight (140) + 4 * spacing (16) + padding (16) = 780px
                height: 780,
              }}
            >
              <FlashList
                ref={flashListRef}
                data={pages}
                renderItem={renderPage}
                keyExtractor={(_, index) => `page-${index}`}
                {...({ estimatedItemSize: itemWidth } as any)}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={itemWidth}
                decelerationRate="fast"
                pagingEnabled
                contentContainerStyle={{
                  backgroundColor: theme.colors.background,
                }}
                style={{ backgroundColor: theme.colors.background, flex: 1 }}
                onMomentumScrollEnd={(event) => {
                  const pageIndex = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
                  setCurrentPage(pageIndex);
                }}
                ListEmptyComponent={
                  <View
                    style={{
                      width: itemWidth,
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: SPACING.base,
                    }}
                  >
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                    >
                      Loading articles...
                    </Text>
                  </View>
                }
              />
            </View>

            {/* Page indicators and navigation controls */}
            {pages.length > 1 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: SPACING.sm,
                  gap: SPACING.md,
                }}
              >
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
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      flashListRef.current?.scrollToIndex({ index: newPage, animated: true });
                    }
                  }}
                  disabled={currentPage === 0}
                  accessibilityLabel="Previous page"
                  accessibilityHint="Navigate to the previous page of articles"
                />

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {pages.map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: theme.roundness * 1, // 4dp equivalent (4dp * 1)
                        backgroundColor:
                          index === currentPage
                            ? theme.colors.primary
                            : theme.colors.surfaceVariant,
                      }}
                    />
                  ))}
                </View>

                <IconButton
                  icon="chevron-right"
                  iconColor={
                    currentPage === pages.length - 1
                      ? theme.colors.onSurfaceDisabled
                      : theme.colors.onSurfaceVariant
                  }
                  size={24}
                  onPress={() => {
                    if (currentPage < pages.length - 1) {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      flashListRef.current?.scrollToIndex({ index: newPage, animated: true });
                    }
                  }}
                  disabled={currentPage === pages.length - 1}
                  accessibilityLabel="Next page"
                  accessibilityHint="Navigate to the next page of articles"
                />
              </View>
            )}
          </>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: SPACING.base,
              minHeight: 400,
            }}
          >
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
              }}
            >
              No reading history yet
            </Text>
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showConfirmDialog}
          onDismiss={() => setShowConfirmDialog(false)}
          style={{
            maxWidth: Math.min(availableWidth - SPACING.base * 2, 500),
            alignSelf: 'center',
            marginHorizontal: SPACING.base,
          }}
        >
          <Dialog.Title>Reset Reading History</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to clear your reading history and reading progress? This action
              cannot be undone and will affect your personalized recommendations.
            </Text>
            {visitedArticles.length > 0 && (
              <Text
                variant="bodySmall"
                style={{
                  marginTop: 8,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                This will delete {visitedArticles.length} article
                {visitedArticles.length !== 1 ? 's' : ''} from your history.
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {/* M3: Dismissive action (Cancel) on left, affirmative action (Reset) on right */}
            <Button mode="outlined" onPress={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={confirmClearHistory}
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
            >
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
