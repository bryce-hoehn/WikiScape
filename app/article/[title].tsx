import { fetchArticleBacklinks, fetchArticleLinks } from '@/api';
import { fetchArticleThumbnail } from '@/api/articles/fetchArticleThumbnail';
import { SearchOverlay } from '@/components';
import Article from '@/components/article/Article';
import CollapsibleHeader, {
  useCollapsibleHeaderSpacing,
} from '@/components/common/CollapsibleHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import ArticleDrawerWrapper from '@/components/layout/ArticleDrawerWrapper';
import ContentWithSidebar from '@/components/layout/ContentWithSidebar';
import { SPACING } from '@/constants/spacing';
import { TYPOGRAPHY } from '@/constants/typography';
import { useArticle, useArticleHtml, useArticleLinks, useBookmarks, useVisitedArticles } from '@/hooks';
import { ImageThumbnail } from '@/types';
import { extractAllImages } from '@/utils/articleParsing';
import { shareArticle } from '@/utils/shareUtils';
import { router, useLocalSearchParams } from 'expo-router';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { ActivityIndicator, Appbar, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSnackbar } from '../../context/SnackbarContext';

// Lazy load ImageDialog - only needed when user opens an image
const ImageDialog = React.lazy(() => import('@/components/article/ImageDialog'));

const HEADER_HEIGHT = 60;

export default function ArticleScreen() {
  const theme = useTheme();
  const { title } = useLocalSearchParams<{ title: string }>();
  const [showSearch, setShowSearch] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; alt?: string } | null>(null);
  const [thumbnail, setThumbnail] = useState<ImageThumbnail>();
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const hasTrackedVisit = useRef(false);
  const hasFetchedLinks = useRef(false);
  const insets = useSafeAreaInsets();
  const totalHeaderHeight = HEADER_HEIGHT + insets.top;
  const animatedPaddingTop = useCollapsibleHeaderSpacing(scrollY, totalHeaderHeight);
  const { data: article, isLoading: isLoadingArticle } = useArticle(title as string);
  const { data: articleHtml } = useArticleHtml(title as string);
  const { addVisitedArticle } = useVisitedArticles();
  const { hasArticleLinks, saveArticleLinks } = useArticleLinks();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { showSuccess } = useSnackbar();

  // Extract all images from article HTML
  const articleImages = useMemo(() => {
    if (!articleHtml) return [];
    return extractAllImages(articleHtml);
  }, [articleHtml]);

  // Find current image index when selectedImage changes
  const currentImageIndex = useMemo(() => {
    if (!selectedImage || articleImages.length === 0) return 0;
    const index = articleImages.findIndex((img) => img.uri === selectedImage.uri);
    return index >= 0 ? index : 0;
  }, [selectedImage, articleImages]);

  // Fetch thumbnail when title changes - defer to avoid blocking navigation
  useEffect(() => {
    if (!title) {
      setThumbnail(undefined);
      setIsLoadingThumbnail(false);
      return;
    }

    // Defer thumbnail fetch until after initial render and interactions complete
    const fetchThumbnail = async () => {
      setIsLoadingThumbnail(true);
      try {
        const thumbnail = await fetchArticleThumbnail(title as string);
        setThumbnail(thumbnail as unknown as ImageThumbnail);
      } catch (error) {
        // Error is already logged by fetchArticleThumbnail in dev mode
        // Silently handle thumbnail fetch failures - article can still be displayed
      } finally {
        setIsLoadingThumbnail(false);
      }
    };

    // Use requestIdleCallback on web, InteractionManager on native, or setTimeout as fallback
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(fetchThumbnail, { timeout: 2000 });
    } else {
      // Defer to next frame + small delay to let UI render first
      setTimeout(fetchThumbnail, 300);
    }
  }, [title]);

  // Track article visit when article data is loaded (only once per article) - defer to avoid blocking
  useEffect(() => {
    if (article && title && !hasTrackedVisit.current) {
      // Defer visit tracking until after interactions complete
      const trackVisit = () => {
        addVisitedArticle(title as string);
        hasTrackedVisit.current = true;
      };

      // Use requestIdleCallback on web, InteractionManager on native, or setTimeout as fallback
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(trackVisit, { timeout: 3000 });
      } else {
        // Defer to allow UI to render first
        setTimeout(trackVisit, 500);
      }
    }
  }, [article, title, addVisitedArticle]);

  // Reset tracking when title changes
  useEffect(() => {
    hasTrackedVisit.current = false;
    hasFetchedLinks.current = false;
  }, [title]);

  // Fetch article links in background after article is loaded and tracked
  // Priority: 1. Render article, 2. Track visit, 3. Fetch links
  useEffect(() => {
    if (article && title && hasTrackedVisit.current && !hasFetchedLinks.current) {
      // Check if article already exists in storage (even if it has no links)
      if (hasArticleLinks(title)) {
        // Article already cached, no need to fetch
        hasFetchedLinks.current = true;
        return;
      }

      // Mark as fetching to prevent duplicate fetches
      hasFetchedLinks.current = true;

      // Defer link fetching until after user has started reading
      const fetchLinks = async () => {
        try {
          // Fetch both backlinks and forward links in parallel
          const [backlinks, forwardLinks] = await Promise.all([
            fetchArticleBacklinks(title),
            fetchArticleLinks(title),
          ]);

          // Combine both arrays, removing duplicates
          const allLinks = Array.from(new Set([...backlinks, ...forwardLinks]));

          // Save to AsyncStorage (even if empty, to avoid refetching articles with no links)
          await saveArticleLinks(title, allLinks);
        } catch (error) {
          // Silently handle fetch failures - don't block article viewing
          // Reset flag so we can retry if needed
          hasFetchedLinks.current = false;
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.error(`Failed to fetch links for ${title}:`, error);
          }
        }
      };

      // Use requestIdleCallback on web, setTimeout on native
      // Longer timeout to ensure user has started reading
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(fetchLinks, { timeout: 5000 });
      } else {
        // Defer to allow user to start reading first
        setTimeout(fetchLinks, 2000);
      }
    }
  }, [article, title, hasArticleLinks, saveArticleLinks]);

  const handleBackPress = () => {
    router.back();
  };

  const handleSearchClose = () => {
    setShowSearch(false);
  };

  const handleBookmarkToggle = async () => {
    if (!article) return;

    const bookmarked = isBookmarked(article.title);
    try {
      if (bookmarked) {
        await removeBookmark(article.title);
        showSuccess('Article removed from bookmarks');
      } else {
        await addBookmark(article.title, thumbnail, article.description);
        showSuccess('Article bookmarked');
      }
    } catch {
      // Error handling is done by the context
    }
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await shareArticle(article.title, article.description, article.content_urls?.mobile.page);
    } catch (error) {
      console.error('Failed to share article:', error);
    }
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  return (
    <>
      {showSearch ? (
        <SearchOverlay visible={showSearch} onClose={handleSearchClose} />
      ) : (
        <ArticleDrawerWrapper>
          <ContentWithSidebar sidebar={<AppSidebar />}>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <CollapsibleHeader scrollY={scrollY} headerHeight={totalHeaderHeight}>
                <View style={{ paddingTop: insets.top }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Appbar.BackAction
                      onPress={handleBackPress}
                      accessibilityLabel="Go back"
                      accessibilityHint="Returns to previous screen"
                    />
                    {isLoadingArticle || isLoadingThumbnail ? (
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginLeft: SPACING.sm,
                        }}
                      >
                        <Text
                        style={{
                          // MD3: Small app bars use 22sp title
                          // Reference: https://m3.material.io/components/app-bars/overview
                          fontWeight: '500', // MD3: Medium weight (500) for app bar titles
                          fontSize: TYPOGRAPHY.appBarTitle,
                          flex: 1,
                        }}
                      >
                        Loading...
                      </Text>
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                          style={{ marginRight: SPACING.sm }}
                        />
                      </View>
                    ) : (
                      <Text
                        style={{
                          // MD3: Small app bars use 22sp title
                          // Reference: https://m3.material.io/components/app-bars/overview
                          flex: 1,
                          marginLeft: SPACING.sm,
                          fontWeight: '500', // MD3: Medium weight (500) for app bar titles
                          fontSize: TYPOGRAPHY.appBarTitle, // 22sp per MD3 specification
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {article?.title || ''}
                      </Text>
                    )}
                    {handleShare && (
                      <Appbar.Action
                        icon="share-variant"
                        onPress={handleShare}
                        accessibilityLabel="Share article"
                        accessibilityHint="Shares this article with others"
                      />
                    )}
                    <Appbar.Action
                      icon={
                        article?.title && isBookmarked(article.title)
                          ? 'bookmark'
                          : 'bookmark-outline'
                      }
                      iconColor={
                        article?.title && isBookmarked(article.title)
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant
                      }
                      onPress={handleBookmarkToggle}
                      accessibilityLabel={
                        article?.title && isBookmarked(article.title)
                          ? 'Remove bookmark'
                          : 'Add bookmark'
                      }
                      accessibilityHint={
                        article?.title && isBookmarked(article.title)
                          ? 'Removes article from bookmarks'
                          : 'Adds article to bookmarks'
                      }
                    />
                  </View>
                </View>
              </CollapsibleHeader>
              {scrollProgress > 0 && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: animatedPaddingTop,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                  }}
                >
                  <ProgressBar
                    progress={scrollProgress / 100}
                    color={theme.colors.primary}
                    style={{ height: 2 }}
                  />
                </Animated.View>
              )}
              <Animated.View style={{ flex: 1, paddingTop: animatedPaddingTop }}>
                <Article
                  title={title as string}
                  articleTitle={article?.title}
                  onHeaderStateChange={(collapsed: boolean, progress: number) => {
                    setScrollProgress(progress);
                  }}
                  scrollY={scrollY}
                  onImagePress={(image) => {
                    setSelectedImage(image);
                    setShowImageModal(true);
                  }}
                />
              </Animated.View>
            </View>
          </ContentWithSidebar>
        </ArticleDrawerWrapper>
      )}

      {showImageModal && (
        <Suspense fallback={null}>
          <ImageDialog
            visible={showImageModal}
            selectedImage={selectedImage}
            onClose={handleCloseImageModal}
            images={articleImages.length > 0 ? articleImages : undefined}
            initialIndex={currentImageIndex}
          />
        </Suspense>
      )}
    </>
  );
}
