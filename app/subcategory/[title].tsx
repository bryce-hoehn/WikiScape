import CollapsibleHeader from '@/components/common/CollapsibleHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import ArticleDrawerWrapper from '@/components/layout/ArticleDrawerWrapper';
import ContentWithSidebar from '@/components/layout/ContentWithSidebar';
import { LAYOUT } from '@/constants/layout';
import { getHoverStyles } from '@/constants/motion';
import { useReducedMotion } from '@/hooks';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import {
  Appbar,
  Card,
  Icon,
  List,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArticleImageModal from '../../components/article/ArticleImageModal';
import ErrorState from '../../components/common/ErrorState';
import StandardEmptyState from '../../components/common/StandardEmptyState';
import SubcategorySkeleton from '../../components/common/SubcategorySkeleton';
import { useCategoryMembers } from '../../hooks';
import { CategoryArticle, CategorySubcategory } from '../../types/api';
import { getUserFriendlyError } from '../../utils/errorHandling';

const HEADER_HEIGHT = 60;

export default function SubCategories() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { title } = useLocalSearchParams<{ title: string }>();
  const [subcategoriesHorizontal, setSubcategoriesHorizontal] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; alt?: string } | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const totalHeaderHeight = HEADER_HEIGHT + insets.top;

  const { data, isLoading, error } = useCategoryMembers(title || '');
  const { reducedMotion } = useReducedMotion();

  // Calculate responsive max width and number of columns
  const maxContentWidth = Math.min(width - 32, LAYOUT.MAX_GRID_WIDTH);
  const numColumns =
    width >= LAYOUT.XLARGE_BREAKPOINT ? 4 : width >= LAYOUT.DESKTOP_BREAKPOINT ? 3 : 2;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback navigation if there's no screen to go back to
      router.push('/categories');
    }
  };

  const handleArticlePress = (articleTitle: string) => {
    router.push(`/article/${encodeURIComponent(articleTitle)}`);
  };

  const handleSubcategoryPress = (subcategoryTitle: string) => {
    router.push(`/subcategory/${encodeURIComponent(subcategoryTitle)}`);
  };

  const handleImagePress = (imageUri: string, alt: string) => {
    setSelectedImage({ uri: imageUri, alt });
    setImageModalVisible(true);
  };

  // Article item component - must be a component to use hooks
  const ArticleItem = React.memo(({ 
    article,
    onPress,
    onImagePress,
  }: { 
    article: CategoryArticle;
    onPress: (title: string) => void;
    onImagePress: (uri: string, alt: string) => void;
  }) => {
    const itemTheme = useTheme();
    const { reducedMotion: itemReducedMotion } = useReducedMotion();
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
      if (Platform.OS === 'web') {
        setIsHovered(true);
      }
    };

    const handleMouseLeave = () => {
      if (Platform.OS === 'web') {
        setIsHovered(false);
      }
    };

    return (
      <Card
        elevation={isHovered && Platform.OS === 'web' ? 3 : 1}
        style={{
          flex: 1,
          margin: 4,
          overflow: 'hidden',
          ...(Platform.OS === 'web' &&
            getHoverStyles(isHovered, itemReducedMotion, { scale: 1.02 })),
        }}
        onPress={() => onPress(article.title)}
        {...(Platform.OS === 'web' && {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        })}
      >
        {article.thumbnail ? (
          <Pressable
            onPress={(e: any) => {
              e.stopPropagation();
              onImagePress(article.thumbnail!, `Thumbnail for ${article.title}`);
            }}
            style={{ height: 120 }}
          >
            <Image
              source={{ uri: article.thumbnail }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </Pressable>
        ) : (
          <Card.Content style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
            <Icon source="file-document-outline" size={48} color={itemTheme.colors.onSurfaceVariant} />
          </Card.Content>
        )}
        <Card.Content style={{ padding: 12 }}>
          <Text variant="bodyMedium" numberOfLines={2} style={{ fontWeight: '500', marginBottom: 4 }}>
            {article.title.replace(/_/g, ' ')}
          </Text>
          {article.description && (
            <Text
              variant="bodySmall"
              numberOfLines={2}
              style={{ color: itemTheme.colors.onSurfaceVariant }}
            >
              {article.description}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  });

  // Subcategory item component - must be a component to use hooks
  const SubcategoryItem = React.memo(({ 
    subcategory,
    onPress,
  }: { 
    subcategory: CategorySubcategory;
    onPress: (title: string) => void;
  }) => {
    const itemTheme = useTheme();
    const { reducedMotion: itemReducedMotion } = useReducedMotion();
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
      if (Platform.OS === 'web') {
        setIsHovered(true);
      }
    };

    const handleMouseLeave = () => {
      if (Platform.OS === 'web') {
        setIsHovered(false);
      }
    };

    return (
      <Surface
        elevation={isHovered && Platform.OS === 'web' ? 2 : 1}
        style={{
          borderRadius: itemTheme.roundness * 3, // 12dp equivalent (4dp * 3)
          margin: 4,
          backgroundColor:
            isHovered && Platform.OS === 'web'
              ? itemTheme.colors.surfaceVariant
              : itemTheme.colors.surface,
          ...(Platform.OS === 'web' &&
            getHoverStyles(isHovered, itemReducedMotion, { scale: 1.01 })),
        }}
        {...(Platform.OS === 'web' && {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        })}
      >
        <List.Item
          key={subcategory.title}
          title={subcategory.title.replace(/_/g, ' ')}
          left={(props) => <List.Icon {...props} icon="folder-outline" />}
          onPress={() => onPress(subcategory.title)}
          style={{ paddingVertical: 8 }}
        />
      </Surface>
    );
  });

  const renderArticleItem = ({ item }: { item: CategoryArticle }) => {
    return (
      <ArticleItem 
        article={item} 
        onPress={handleArticlePress}
        onImagePress={handleImagePress}
      />
    );
  };

  const renderSubcategoryItem = ({ item }: { item: CategorySubcategory }) => {
    return (
      <SubcategoryItem 
        subcategory={item} 
        onPress={handleSubcategoryPress}
      />
    );
  };

  if (isLoading) {
    return (
      <ArticleDrawerWrapper>
        <ContentWithSidebar sidebar={<AppSidebar />}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <CollapsibleHeader scrollY={scrollY} headerHeight={totalHeaderHeight}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingTop: insets.top,
                }}
              >
                <Appbar.BackAction onPress={handleBack} />
                <Text style={{ fontWeight: '700', fontSize: 20, flex: 1 }}>
                  {title?.replace(/_/g, ' ') || 'Category'}
                </Text>
              </View>
            </CollapsibleHeader>
            <View style={{ paddingTop: totalHeaderHeight }}>
              <SubcategorySkeleton />
            </View>
          </View>
        </ContentWithSidebar>
      </ArticleDrawerWrapper>
    );
  }

  if (error) {
    const errorInfo = getUserFriendlyError(error);
    const handleRetry = () => {
      // Force refetch by updating the query key
      router.replace(`/subcategory/${encodeURIComponent(title || '')}`);
    };
    return (
      <ArticleDrawerWrapper>
        <ContentWithSidebar sidebar={<AppSidebar />}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <CollapsibleHeader scrollY={scrollY} headerHeight={totalHeaderHeight}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingTop: insets.top,
                }}
              >
                <Appbar.BackAction onPress={handleBack} />
                <Text style={{ fontWeight: '700', fontSize: 20, flex: 1 }}>
                  {title?.replace(/_/g, ' ') || 'Category'}
                </Text>
              </View>
            </CollapsibleHeader>
            <View style={{ paddingTop: totalHeaderHeight }}>
              <ErrorState
                title="Unable to Load Category"
                message={errorInfo.userFriendlyMessage}
                onRetry={handleRetry}
                showDetails
                error={error instanceof Error ? error : undefined}
                recoverySteps={errorInfo.recoverySteps}
              />
            </View>
          </View>
        </ContentWithSidebar>
      </ArticleDrawerWrapper>
    );
  }

  const articles = data?.articles || [];
  const subcategories = data?.subcategories || [];

  return (
    <ArticleDrawerWrapper>
      <ContentWithSidebar sidebar={<AppSidebar />}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <CollapsibleHeader scrollY={scrollY} headerHeight={totalHeaderHeight}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingTop: insets.top,
              }}
            >
              <Appbar.BackAction onPress={handleBack} />
              <Text style={{ fontWeight: '700', fontSize: 20, flex: 1 }}>
                {title?.replace(/_/g, ' ') || 'Category'}
              </Text>
            </View>
          </CollapsibleHeader>

          <View style={{ flex: 1, paddingTop: totalHeaderHeight }}>
            {articles.length === 0 && subcategories.length === 0 ? (
              <StandardEmptyState
                icon="folder-open-outline"
                title="No Content Found"
                description="This category does not contain any articles or subcategories."
              />
            ) : (
              <View
                style={{ flex: 1, maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }}
              >
                {/* Subcategories Section */}
                {subcategories.length > 0 && (
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Text variant="titleMedium" style={{ flex: 1 }}>
                        Subcategories
                      </Text>
                      <TouchableRipple
                        onPress={() => setSubcategoriesHorizontal(!subcategoriesHorizontal)}
                        style={{ borderRadius: theme.roundness * 4 }} // 16dp equivalent (4dp * 4)
                      >
                        <Icon
                          source={subcategoriesHorizontal ? 'chevron-down' : 'chevron-up'}
                          size={24}
                          color={theme.colors.onSurface}
                        />
                      </TouchableRipple>
                    </View>
                    <View style={{ maxHeight: subcategoriesHorizontal ? undefined : 400 }}>
                      <FlashList
                        data={subcategories}
                        renderItem={renderSubcategoryItem}
                        keyExtractor={(item: CategorySubcategory) => item.title}
                        {...({ estimatedItemSize: subcategoriesHorizontal ? 200 : 64 } as any)}
                        horizontal={subcategoriesHorizontal}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={!subcategoriesHorizontal}
                        scrollEnabled={true}
                        contentContainerStyle={{ paddingRight: 16 }}
                        key={`subcategories-${subcategoriesHorizontal}`}
                      />
                    </View>
                  </View>
                )}

                {/* Articles Section */}
                {articles.length > 0 && (
                  <View
                    style={{ padding: 16, paddingTop: subcategories.length > 0 ? 0 : 16, flex: 1 }}
                  >
                    <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                      Articles
                    </Text>
                    <FlashList
                      data={articles}
                      numColumns={numColumns}
                      renderItem={renderArticleItem}
                      keyExtractor={(item: CategoryArticle) => item.title}
                      {...({ estimatedItemSize: 220 } as any)}
                      contentContainerStyle={{ paddingRight: 16 }}
                      scrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ContentWithSidebar>

      <ArticleImageModal
        visible={imageModalVisible}
        selectedImage={selectedImage}
        onClose={() => {
          setImageModalVisible(false);
          setSelectedImage(null);
        }}
      />
    </ArticleDrawerWrapper>
  );
}
