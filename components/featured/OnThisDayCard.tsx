import HtmlRenderer from '@/components/common/HtmlRenderer';
import { SPACING } from '@/constants/spacing';
import { router } from 'expo-router';
import React, { memo, useCallback } from 'react';
import { Text, useTheme, type MD3Theme } from 'react-native-paper';
import { RecommendationItem } from '../../types/components';
import BaseFeaturedCard, { FeaturedCardItem } from './BaseFeaturedCard';

interface OnThisDayCardProps {
  item: RecommendationItem;
  theme: MD3Theme;
  itemWidth?: number;
}

function OnThisDayCard({ item, theme, itemWidth }: OnThisDayCardProps) {
  const year = item.year;

  const getArticleTitle = (item: FeaturedCardItem) => {
    if ('title' in item) {
      if (item.pages?.[0]?.title) return item.pages[0].title;
      if (item.articleTitle) return item.articleTitle;
    }
    return null;
  };

  const getTitle = (item: FeaturedCardItem) => {
    if ('title' in item) {
      const title = item.pages?.[0]?.title || item.articleTitle || 'On This Day';
      return title.replace(/_/g, ' ');
    }
    return 'On This Day';
  };

  const getDescription = (item: FeaturedCardItem) => {
    if ('title' in item) {
      return item.html || item.text || 'No content available';
    }
    if ('html' in item) {
      return item.html || 'No content available';
    }
    return 'No content available';
  };

  const handleYearPress = useCallback(() => {
    if (year) {
      router.push(`/article/${encodeURIComponent(year)}`);
    }
  }, [year, router]);

  const headerContent = year ? (
    <Text
      variant="titleLarge"
      onPress={handleYearPress}
      style={{
        fontWeight: 'bold',
        color: theme.colors.primary,
      }}
    >
      {year}
    </Text>
  ) : undefined;

  const renderContent = (item: FeaturedCardItem, description: string) => {
    return (
      <HtmlRenderer
        html={description}
        maxLines={4}
        style={{ paddingTop: SPACING.md, flexShrink: 1 }}
      />
    );
  };

  return (
    <BaseFeaturedCard
      item={item}
      itemWidth={itemWidth}
      theme={theme}
      getArticleTitle={getArticleTitle}
      getDescription={getDescription}
      getTitle={getTitle}
      headerContent={headerContent}
      renderContent={renderContent}
    />
  );
}

export default memo(OnThisDayCard);
