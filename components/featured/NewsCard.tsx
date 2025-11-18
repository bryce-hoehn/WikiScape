import HtmlRenderer from '@/components/common/HtmlRenderer';
import { SPACING } from '@/constants/spacing';
import React, { memo } from 'react';
import { Text, useTheme, type MD3Theme } from 'react-native-paper';
import { RecommendationItem } from '../../types/components';
import BaseFeaturedCard, { FeaturedCardItem } from './BaseFeaturedCard';

interface NewsCardProps {
  item: RecommendationItem;
  itemWidth: number;
  theme: MD3Theme;
}

function NewsCard({ item, itemWidth, theme }: NewsCardProps) {
  const getArticleTitle = (item: FeaturedCardItem) => {
    if ('title' in item) {
      if (item.links?.[0]?.title) return item.links[0].title;
      if (item.articleTitle) return item.articleTitle;
      if (item.title) return item.title;
    }
    return null;
  };

  const getTitle = (item: FeaturedCardItem) => {
    if ('title' in item) {
      return item.title || 'News Story';
    }
    return 'News Story';
  };

  const formatTitle = (title: string) => {
    return title.replace(/_/g, ' ');
  };

  const getDescription = (item: FeaturedCardItem) => {
    if ('title' in item) {
      return item.description || item.story || 'Latest news';
    }
    return 'Latest news';
  };

  const renderContent = (item: FeaturedCardItem, description: string) => {
    if (description.includes('<')) {
      return <HtmlRenderer html={description} maxLines={4} style={{ paddingTop: SPACING.md }} />;
    }
    return (
      <Text
        variant="bodyMedium"
        style={{ fontSize: 14, lineHeight: 18, paddingTop: SPACING.md }}
        numberOfLines={4}
      >
        {description}
      </Text>
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
      formatTitle={formatTitle}
      renderContent={renderContent}
    />
  );
}

export default memo(NewsCard);
