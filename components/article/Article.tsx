import { LAYOUT } from '@/constants/layout';
import { useArticleHtml, useReadingProgress } from '@/hooks';
// import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, useWindowDimensions, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import {
  useFontFamily,
  useFontSize,
  useLineHeight,
  useParagraphSpacing,
  useReadingWidth,
} from '../../hooks';
import { useLazyFonts } from '../../hooks/fonts/useLazyFonts';
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from '../../hooks/storage/useFontSize';
import { getUserFriendlyError } from '../../utils/errorHandling';
import ErrorState from '../common/ErrorState';
import ScrollToTopFAB from '../common/ScrollToTopFAB';
import StandardEmptyState from '../common/StandardEmptyState';
import ArticleSkeleton from './ArticleSkeleton';
import ArticleToolbar from './ArticleToolbar';

// Lazy load heavy ArticleSectionedRenderer component (uses react-native-render-html)
const ArticleSectionedRenderer = React.lazy(() => import('./ArticleSectionedRenderer'));

interface ArticleProps {
  title?: string;
  articleTitle?: string; // Article title for NSFW detection (can be different from URL title)
  onHeaderStateChange?: (collapsed: boolean, progress: number) => void;
  onImagePress?: (image: { uri: string; alt?: string }) => void;
  scrollY?: Animated.Value; // Optional scrollY from parent for CollapsibleHeader
}

export default function Article({
  title,
  articleTitle,
  onHeaderStateChange,
  onImagePress,
  scrollY: externalScrollY,
}: ArticleProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { data: articleHtml, isLoading, error } = useArticleHtml(title || '');

  // Global reading preferences (used as defaults)
  const { fontSize: globalFontSize } = useFontSize();
  const { lineHeight: globalLineHeight } = useLineHeight();
  const { paragraphSpacing: globalParagraphSpacing } = useParagraphSpacing();
  const { readingWidth } = useReadingWidth();
  const { fontFamily: globalFontFamily } = useFontFamily();

  // Lazy load fonts only when a custom font is selected
  useLazyFonts(globalFontFamily);

  // Per-article font size (local state, initialized from global)
  const [localFontSize, setLocalFontSize] = useState<number | null>(null);

  // Reset local font size when article changes (so each article starts with global default)
  useEffect(() => {
    setLocalFontSize(null); // Will be initialized to globalFontSize in next effect
  }, [title, articleTitle]);

  // Initialize local font size from global on mount or when global changes
  useEffect(() => {
    if (localFontSize === null) {
      setLocalFontSize(globalFontSize);
    }
  }, [globalFontSize, localFontSize]);

  // Use local font size if set, otherwise fall back to global
  const fontSize = localFontSize ?? globalFontSize;

  // Per-article font size handlers (don't persist globally)
  const increaseFontSize = useCallback(() => {
    setLocalFontSize((prev) => {
      const current = prev ?? globalFontSize;
      const newSize = Math.min(current + 2, MAX_FONT_SIZE);
      return newSize;
    });
  }, [globalFontSize]);

  const decreaseFontSize = useCallback(() => {
    setLocalFontSize((prev) => {
      const current = prev ?? globalFontSize;
      const newSize = Math.max(current - 2, MIN_FONT_SIZE);
      return newSize;
    });
  }, [globalFontSize]);

  const resetFontSize = useCallback(() => {
    // Reset to global default (or 16 if global is not set)
    setLocalFontSize(globalFontSize);
  }, [globalFontSize]);

  const canIncrease = fontSize < MAX_FONT_SIZE;
  const canDecrease = fontSize > MIN_FONT_SIZE;

  // Use global values for other settings (lineHeight, paragraphSpacing, fontFamily)
  const lineHeight = globalLineHeight;
  const paragraphSpacing = globalParagraphSpacing;
  const fontFamily = globalFontFamily;

  // Calculate optimal reading width for article content (use user preference or default)
  const maxArticleWidth = Math.min(width - 32, readingWidth || LAYOUT.ARTICLE_MAX_WIDTH);

  // Pre-process HTML to remove <style> tags
  const cleanedArticleHtml = useMemo(() => {
    if (!articleHtml) return '';
    return articleHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  }, [articleHtml]);

  const scrollViewRef = useRef<ScrollView>(null);
  const internalScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = externalScrollY || internalScrollY;
  const [fabVisible, setFabVisible] = useState(false);
  const [sections, setSections] = useState<{ id: string; heading: string }[]>([]);
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep screen awake while reading - disabled for now due to activation errors
  // useEffect(() => {
  //   activateKeepAwake();
  //   return () => {
  //     deactivateKeepAwake();
  //   };
  // }, []);

  // Memoize callbacks to prevent re-renders
  const handleSectionsExtracted = useCallback((newSections: { id: string; heading: string }[]) => {
    setSections(newSections);
  }, []);

  const handleExpandedSectionsChange = useCallback((newExpandedSections: string[]) => {
    setExpandedSections(newExpandedSections);
  }, []);

  // Use refs to track previous values and only update state when they change
  const prevFabVisibleRef = useRef(false);
  const prevHeaderCollapsedRef = useRef(false);
  const prevScrollProgressRef = useRef(0);

  // Reading progress tracking
  const { saveProgress, getProgressData } = useReadingProgress();
  const articleTitleForProgress = articleTitle || title || '';
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const expandedSectionsRef = useRef<string[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    expandedSectionsRef.current = expandedSections;
  }, [expandedSections]);

  const handleSectionPress = useCallback((sectionId: string) => {
    setScrollToSection(sectionId);
    // Reset after a brief delay to allow navigation to occur
    setTimeout(() => setScrollToSection(null), 100);
  }, []);

  // Get initial expanded sections from saved progress
  const progressData = getProgressData(articleTitleForProgress);
  const initialExpandedSections = useMemo(() => {
    return progressData?.expandedSections || undefined;
  }, [progressData?.expandedSections]);

  // Memoized scroll handler to prevent unnecessary re-renders
  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      const contentHeight = event.nativeEvent.contentSize.height;
      const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

      // Only update state if values actually changed
      const newFabVisible = yOffset > 300;
      if (newFabVisible !== prevFabVisibleRef.current) {
        prevFabVisibleRef.current = newFabVisible;
        setFabVisible(newFabVisible);
      }

      const newCollapsed = yOffset > 50;
      if (newCollapsed !== prevHeaderCollapsedRef.current) {
        prevHeaderCollapsedRef.current = newCollapsed;
        onHeaderStateChange?.(newCollapsed, scrollProgress);
      }

      // Calculate reading progress (0-100)
      const maxScroll = Math.max(0, contentHeight - scrollViewHeight);
      const progress = maxScroll > 0 ? Math.min(100, Math.round((yOffset / maxScroll) * 100)) : 0;

      // Only update progress if it changed by at least 1% to reduce re-renders
      if (Math.abs(progress - prevScrollProgressRef.current) >= 1) {
        prevScrollProgressRef.current = progress;
        setScrollProgress(progress);
      }

      // Save progress (debounced to avoid too many writes)
      if (articleTitleForProgress && hasRestoredScroll) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          // Save progress along with currently expanded sections
          // Use ref to avoid dependency on expandedSections which changes frequently
          saveProgress(articleTitleForProgress, progress, expandedSectionsRef.current);
        }, 1000); // Save after 1 second of no scrolling
      }

      // Notify parent of header state changes (only when values change)
      const headerChanged = newCollapsed !== prevHeaderCollapsedRef.current;
      const progressChanged = Math.abs(progress - prevScrollProgressRef.current) >= 1;
      if (onHeaderStateChange && (headerChanged || progressChanged)) {
        onHeaderStateChange(newCollapsed, progress);
      }
    },
    [articleTitleForProgress, hasRestoredScroll, saveProgress, onHeaderStateChange]
  ); // Removed expandedSections to prevent re-render loops

  // Restore scroll position when article loads using onContentSizeChange
  const handleContentSizeChange = useCallback(
    (contentWidth: number, contentHeight: number) => {
      if (hasRestoredScroll || !scrollViewRef.current || contentHeight <= 0) return;

      if (progressData && progressData.progress > 0) {
        // Wait a bit longer to ensure sections are expanded and content is rendered
        const targetY = (progressData.progress / 100) * contentHeight;
        // Use a longer delay to ensure expanded sections are fully rendered
        const timeoutId = setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: targetY,
            animated: true,
          });
          setHasRestoredScroll(true);
        }, 500); // Increased delay to allow sections to expand

        // Store timeout ID for cleanup
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = timeoutId;
      } else {
        setHasRestoredScroll(true);
      }
    },
    [hasRestoredScroll, progressData]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Render states
  if (!title) {
    return (
      <StandardEmptyState
        icon="alert-circle-outline"
        title="No Article Selected"
        description="Please select an article to view its content."
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <ArticleSkeleton />
        <ArticleToolbar
          onZoomIn={increaseFontSize}
          onZoomOut={decreaseFontSize}
          onResetZoom={resetFontSize}
          canZoomIn={canIncrease}
          canZoomOut={canDecrease}
          sections={[]}
          onSectionPress={() => {}}
          currentFontSize={fontSize}
          visible={true}
        />
      </>
    );
  }

  if (error) {
    const errorInfo = getUserFriendlyError(error);
    const handleRetry = () => {
      // Navigate to home instead of retrying
      router.replace('/(tabs)');
    };
    return (
      <ErrorState
        title="Unable to Load Article"
        message={errorInfo.userFriendlyMessage}
        onRetry={handleRetry}
        showDetails
        error={error instanceof Error ? error : undefined}
        recoverySteps={errorInfo.recoverySteps}
      />
    );
  }

  if (!articleHtml) {
    return (
      <StandardEmptyState
        icon="file-document-outline"
        title="No Content Available"
        description="This article does not have any content available."
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 80,
          maxWidth: maxArticleWidth,
          alignSelf: 'center',
          width: '100%',
          paddingHorizontal: 8,
        }}
        onContentSizeChange={handleContentSizeChange}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
          listener: handleScroll,
        })}
        scrollEventThrottle={16}
        minimumZoomScale={1.0}
        maximumZoomScale={3.0}
        bouncesZoom={true}
        pinchGestureEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleSectionedRenderer
            articleHtml={cleanedArticleHtml}
            baseFontSize={fontSize}
            lineHeight={lineHeight}
            paragraphSpacing={paragraphSpacing}
            fontFamily={fontFamily}
            onSectionsExtracted={handleSectionsExtracted}
            scrollToSection={scrollToSection}
            articleTitle={articleTitle || title}
            initialExpandedSections={initialExpandedSections}
            onExpandedSectionsChange={handleExpandedSectionsChange}
            onImagePress={onImagePress}
            scrollViewRef={scrollViewRef}
          />
        </Suspense>
        {/* Reading Progress Indicator */}
        {scrollProgress > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: theme.colors.surfaceVariant,
              zIndex: 1000,
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${scrollProgress}%`,
                backgroundColor: theme.colors.primary,
              }}
            />
          </View>
        )}
      </ScrollView>

      <ScrollToTopFAB scrollRef={scrollViewRef} visible={fabVisible} hasBottomTabBar={false} />

      <ArticleToolbar
        onZoomIn={increaseFontSize}
        onZoomOut={decreaseFontSize}
        onResetZoom={resetFontSize}
        canZoomIn={canIncrease}
        canZoomOut={canDecrease}
        sections={sections}
        onSectionPress={handleSectionPress}
        currentFontSize={fontSize}
        visible={true}
      />
    </View>
  );
}
