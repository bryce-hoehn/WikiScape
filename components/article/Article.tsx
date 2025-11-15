import { useArticleHtml } from "@/hooks";
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, useWindowDimensions, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import RenderHtml, { HTMLContentModel, HTMLElementModel } from 'react-native-render-html';
import { getArticleClassStyles, getArticleTagStyles } from '../../utils/articleStyles';
import ScrollToTopFAB from '../common/ScrollToTopFAB';
import ArticleImageModal from './ArticleImageModal';
import { CaptionRenderer, createDomVisitors, ImageRenderer } from './ArticleRenderers';

// Optimized article content component
const ArticleContent = React.memo(({
  articleHtml,
  renderConfig,
  fontSize
}: {
  articleHtml: string;
  renderConfig: any;
  fontSize: number;
}) => (
  <RenderHtml
    contentWidth={renderConfig.width}
    source={{ html: articleHtml || '' }}
    tagsStyles={renderConfig.tagsStyles}
    classesStyles={renderConfig.classesStyles}
    renderersProps={renderConfig.renderersProps}
    renderers={renderConfig.renderers}
    domVisitors={renderConfig.domVisitors}
    customHTMLElementModels={renderConfig.customHTMLElementModels}
    enableExperimentalMarginCollapsing={true}
    ignoredDomTags={['link', 'meta', 'map', 'video', 'audio']}
    enableExperimentalBRCollapsing={true}
    defaultTextProps={{selectable: true}}
    baseStyle={{
      userSelect: 'text',
      fontSize: fontSize,
      lineHeight: fontSize * 1.5,
    }}
  />
));
ArticleContent.displayName = 'ArticleContent';

interface ArticleProps {
  title?: string;
}

interface ImageModalState {
  visible: boolean;
  selectedImage: { uri: string; alt?: string } | null;
}

export default function Article({ title }: ArticleProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { data: articleHtml, isLoading, error } = useArticleHtml(title || '');
  const [imageModalState, setImageModalState] = useState<ImageModalState>({
    visible: false,
    selectedImage: null
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const [fabVisible, setFabVisible] = useState(false);
  const [fontSize, setFontSize] = useState(16); // Base font size

  const handleLinkPress = useCallback((href: string) => {
    // Handle internal Wikipedia links (both relative and absolute)
    if (href.startsWith('/wiki/') || href.includes('wikipedia.org/wiki/')) {
      let articleTitle = '';
      
      // Extract article title from different URL formats
      if (href.startsWith('/wiki/')) {
        // Relative path: /wiki/Article_Title
        articleTitle = href.replace('/wiki/', '');
      } else if (href.includes('wikipedia.org/wiki/')) {
        // Absolute URL: https://en.wikipedia.org/wiki/Article_Title
        const urlParts = href.split('/wiki/');
        if (urlParts.length > 1) {
          articleTitle = urlParts[1];
        }
      }
      
      // Clean up the title (remove anchors, query parameters)
      articleTitle = articleTitle.split('#')[0].split('?')[0];
      
      if (articleTitle) {
        router.push(`/(zArticleStack)/${articleTitle}`);
        return; // Prevent default behavior
      }
    }
    
    // For all other links, open in external browser
    Linking.openURL(href).catch(console.error);
  }, []);

  // Optimized: Only recalculate base styles when theme changes
  const baseTagsStyles = useMemo(() => getArticleTagStyles(theme), [theme]);
  
  // Optimized: Apply font scaling directly in the baseStyle instead of recalculating all tags
  const tagsStyles = useMemo(() => {
    return baseTagsStyles as any;
  }, [baseTagsStyles]);

  const classesStyles = useMemo(() => getArticleClassStyles(theme) as any, [theme]);

  // // Zoom controls
  // const increaseFontSize = useCallback(() => {
  //   setFontSize(prev => Math.min(prev + 2, 24)); // Max 24px
  // }, []);

  // const decreaseFontSize = useCallback(() => {
  //   setFontSize(prev => Math.max(prev - 2, 12)); // Min 12px
  // }, []);

  // const resetFontSize = useCallback(() => {
  //   setFontSize(16); // Reset to default
  // }, []);

  const renderersProps = useMemo(() => ({
    a: {
      onPress: (event: any, href: string) => {
        handleLinkPress(href);
      },
    }
  }), [handleLinkPress]);

  const handleImagePress = useCallback((image: { uri: string; alt?: string }) => {
    setImageModalState({
      visible: true,
      selectedImage: image
    });
  }, []);

  const handleCloseImageModal = useCallback(() => {
    setImageModalState({
      visible: false,
      selectedImage: null
    });
  }, []);

  const renderers = useMemo(() => ({
    img: (props: any) => <ImageRenderer {...props} onImagePress={handleImagePress} />,
    caption: CaptionRenderer
  }), [handleImagePress]);

  const customHTMLElementModels = useMemo(() => ({
    caption: HTMLElementModel.fromCustomModel({
      tagName: 'caption',
      contentModel: HTMLContentModel.block
    })
  }), []);

  const domVisitors = useMemo(() => createDomVisitors(), []);


  // Optimized: Memoize render configuration with stable dependencies
  const renderConfig = useMemo(() => ({
    width,
    tagsStyles,
    classesStyles,
    renderersProps,
    renderers,
    domVisitors,
    customHTMLElementModels
  }), [width, tagsStyles, classesStyles, renderersProps, renderers, domVisitors, customHTMLElementModels]);


  // Render states
  if (!title) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text selectable variant="bodyMedium">No article title provided</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text selectable style={{ marginTop: 16 }}>Loading article...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text selectable variant="bodyMedium">Error loading article: {error.message}</Text>
      </View>
    );
  }

  if (!articleHtml) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text selectable variant="bodyMedium">No article content available</Text>
      </View>
    );
  }

  return (
    <>
      {/* Zoom Controls */}
      {/* <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 2 }}>
        <Appbar.Action
          icon="minus"
          onPress={decreaseFontSize}
          disabled={fontSize <= 12}
          accessibilityLabel="Decrease font size"
          accessibilityHint="Makes the article text smaller"
        />
        <Appbar.Content
          title={`${Math.round((fontSize / 16) * 100)}%`}
          titleStyle={{ textAlign: 'center', fontSize: 14 }}
        />
        <Appbar.Action
          icon="plus"
          onPress={increaseFontSize}
          disabled={fontSize >= 24}
          accessibilityLabel="Increase font size"
          accessibilityHint="Makes the article text larger"
        />
        <Appbar.Action
          icon="format-size"
          onPress={resetFontSize}
          accessibilityLabel="Reset font size"
          accessibilityHint="Resets the article text to default size"
        />
      </Appbar.Header> */}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
        onScroll={(event) => {
          const yOffset = event.nativeEvent.contentOffset.y;
          setFabVisible(yOffset > 300);
        }}
        scrollEventThrottle={16}
        // Enable pinch-to-zoom and text selection
        minimumZoomScale={1.0}
        maximumZoomScale={3.0}
        bouncesZoom={true}
        pinchGestureEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ padding: 16 }}>
          <ArticleContent
            articleHtml={articleHtml || ''}
            renderConfig={renderConfig}
            fontSize={fontSize}
          />
        </View>
      </ScrollView>
      <ScrollToTopFAB scrollRef={scrollViewRef} visible={fabVisible} />
      <ArticleImageModal
        visible={imageModalState.visible}
        selectedImage={imageModalState.selectedImage}
        onClose={handleCloseImageModal}
      />
    </>
  );
}