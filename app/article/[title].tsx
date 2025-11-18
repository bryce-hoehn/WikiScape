import { fetchArticleThumbnail } from '@/api/articles/fetchArticleThumbnail';
import { SearchOverlay } from '@/components';
import Article from '@/components/article/Article';
import CollapsibleHeader, {
  useCollapsibleHeaderSpacing,
} from '@/components/common/CollapsibleHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import ArticleDrawerWrapper from '@/components/layout/ArticleDrawerWrapper';
import ContentWithSidebar from '@/components/layout/ContentWithSidebar';
import { useArticle, useBookmarks, useVisitedArticles } from '@/hooks';
import { ImageThumbnail } from '@/types';
import { shareArticle } from '@/utils/shareUtils';
import { router, useLocalSearchParams } from 'expo-router';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { ActivityIndicator, Appbar, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSnackbar } from '../../context/SnackbarContext';

// Lazy load ArticleImageModal - only needed when user opens an image
const ArticleImageModal = React.lazy(() => import('@/components/article/ArticleImageModal'));

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
  const insets = useSafeAreaInsets();
  const totalHeaderHeight = HEADER_HEIGHT + insets.top;
  const animatedPaddingTop = useCollapsibleHeaderSpacing(scrollY, totalHeaderHeight);
  const { data: article, isLoading: isLoadingArticle } = useArticle(title as string);
  const { addVisitedArticle } = useVisitedArticles();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { showSuccess } = useSnackbar();

  // Fetch thumbnail when title changes - defer to avoid blocking navigation
  useEffect(() => {
    const fetchThumbnail = async () => {
      if (title) {
        setIsLoadingThumbnail(true);
        // Use setTimeout to yield to the UI thread for navigation
        setTimeout(async () => {
          try {
            const thumbnail = await fetchArticleThumbnail(title as string);
            setThumbnail(thumbnail as unknown as ImageThumbnail);
          } catch (error) {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
              console.error('Failed to fetch thumbnail:', error);
            }
          } finally {
            setIsLoadingThumbnail(false);
          }
        }, 100);
      } else {
        setThumbnail(undefined);
        setIsLoadingThumbnail(false);
      }
    };

    fetchThumbnail();
  }, [title]);

  // Track article visit when article data is loaded (only once per article) - defer to avoid blocking
  useEffect(() => {
    if (article && title && !hasTrackedVisit.current) {
      // Use setTimeout to yield to the UI thread for navigation
      setTimeout(() => {
        addVisitedArticle(title as string);
        hasTrackedVisit.current = true;
      }, 200);
    }
  }, [article, title, addVisitedArticle]);

  // Reset tracking when title changes
  useEffect(() => {
    hasTrackedVisit.current = false;
  }, [title]);

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
                          marginLeft: 8,
                        }}
                      >
                        <Text style={{ fontWeight: '700', fontSize: 20, flex: 1 }}>Loading...</Text>
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                          style={{ marginRight: 8 }}
                        />
                      </View>
                    ) : (
                      <Text
                        style={{ flex: 1, marginLeft: 8, fontWeight: '700', fontSize: 20 }}
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
          <ArticleImageModal
            visible={showImageModal}
            selectedImage={selectedImage}
            onClose={handleCloseImageModal}
          />
        </Suspense>
      )}
    </>
  );
}
