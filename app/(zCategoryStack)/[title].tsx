import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Appbar, Card, Icon, List, Surface, Text, useTheme } from 'react-native-paper';
import CustomBottomNav from '../../components/layout/CustomBottomNav';
import { useCategoryMembers } from '../../hooks';
import { CategoryArticle, CategorySubcategory } from '../../types/api';

export default function SubCategories() {
  const theme = useTheme();
  const router = useRouter();
  const { title } = useLocalSearchParams<{ title: string }>();
  const [subcategoriesHorizontal, setSubcategoriesHorizontal] = useState(true);
  
  const { data, isLoading, error } = useCategoryMembers(title || '');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback navigation if there's no screen to go back to
      router.push('/(tabs)/categories');
    }
  };

  const handleArticlePress = (articleTitle: string) => {
    router.push(`/(zArticleStack)/${encodeURIComponent(articleTitle)}`);
  };

  const handleSubcategoryPress = (subcategoryTitle: string) => {
    router.push(`/(zCategoryStack)/${encodeURIComponent(subcategoryTitle)}`);
  };

  const renderArticleItem = (article: CategoryArticle) => (
    <Card
      style={{ flex: 1, margin: 4, overflow: 'hidden' }}
      onPress={() => handleArticlePress(article.title)}
    >
      {article.thumbnail ? (
        <View style={{ height: 120 }}>
          <Image 
            source={{ uri: article.thumbnail }} 
            style={{ width: '100%', height: '100%'}}
            contentFit="cover"
          />
        </View>
      ) : (
        <Card.Content style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
          <Icon source="file-document-outline" size={48} color={theme.colors.onSurfaceVariant} />
        </Card.Content>
      )}
      <Card.Content style={{ padding: 12 }}>
        <Text 
          variant="bodyMedium" 
          numberOfLines={2}
          style={{ fontWeight: '500', marginBottom: 4 }}
        >
          {article.title.replace(/_/g, ' ')}
        </Text>
        {article.description && (
          <Text 
            variant="bodySmall" 
            numberOfLines={2}
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {article.description}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderSubcategoryItem = (subcategory: CategorySubcategory) => (
    <Surface elevation={1} style={{ borderRadius: 12, margin: 4 }}>
      <List.Item
        key={subcategory.title}
        title={subcategory.title.replace(/_/g, ' ')}
        left={props => <List.Icon {...props} icon="folder-outline" />}
        onPress={() => handleSubcategoryPress(subcategory.title)}
        style={{ paddingVertical: 8 }}
      />
    </Surface>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleBack} />
          <Appbar.Content title={title || 'Category'} />
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16 }}>Loading category content...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleBack} />
          <Appbar.Content title={title || 'Category'} />
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
            Failed to load category
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
            Please check your connection and try again.
          </Text>
        </View>
      </View>
    );
  }

  const articles = data?.articles || [];
  const subcategories = data?.subcategories || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleBack} />
          <Appbar.Content title={title?.replace(/_/g, ' ') || 'Category'} />
        </Appbar.Header>

        {articles.length === 0 && subcategories.length === 0 ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', padding: 32 }}>
            <List.Icon icon="folder-open-outline" />
            <Text variant="titleMedium" style={{ textAlign: 'center', marginTop: 16 }}>
              No content found
            </Text>
            <Text variant="bodyMedium" style={{ textAlign: 'center', marginTop: 8 }}>
              This category does not contain any articles or subcategories.
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Subcategories Section */}
            {subcategories.length > 0 && (
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text
                    variant="titleMedium"
                    style={{ flex: 1 }}
                  >
                    Subcategories
                  </Text>
                  <TouchableOpacity onPress={() => setSubcategoriesHorizontal(!subcategoriesHorizontal)}>
                    <Icon
                      source={subcategoriesHorizontal ? "chevron-down" : "chevron-up"}
                      size={24}
                      color={theme.colors.onSurface}
                    />
                  </TouchableOpacity>
                </View>
                <FlashList
                  data={subcategories}
                  renderItem={({ item }) => renderSubcategoryItem(item)}
                  keyExtractor={(item: CategorySubcategory) => item.title}
                  horizontal={subcategoriesHorizontal}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  key={`subcategories-${subcategoriesHorizontal}`}
                />
              </View>
            )}

            {/* Articles Section */}
            {articles.length > 0 && (
              <View style={{ padding: 16, paddingTop: subcategories.length > 0 ? 0 : 16, flex: 1 }}>
                <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                  Articles
                </Text>
                <FlashList
                  data={articles}
                  numColumns={2}
                  renderItem={({ item }) => renderArticleItem(item)}
                  keyExtractor={(item: CategoryArticle) => item.title}
                  contentContainerStyle={{ paddingRight: 16 }}
                  scrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                />
              </View>
            )}
          </View>
        )}
      </View>
      <CustomBottomNav />
    </View>
  );
}
