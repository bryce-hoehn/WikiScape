import HtmlRenderer from '@/components/common/HtmlRenderer';
import React, { memo } from 'react';
import { Text, useTheme, type MD3Theme } from 'react-native-paper';
import { RecommendationItem } from '../../types/components';
import BaseFeaturedCard, { FeaturedCardItem } from './BaseFeaturedCard';

interface GenericCardProps {
  item: RecommendationItem;
  itemWidth: number;
  theme: MD3Theme;
}

function GenericCard({ item, itemWidth, theme }: GenericCardProps) {
  const getArticleTitle = (item: FeaturedCardItem) => {
    if ('title' in item) {
      if (item.articleTitle) return item.articleTitle;
      if (item.page?.title) return item.page.title;
      if (item.title && item.title !== 'Did You Know?' && !item.title.includes('...')) {
        return item.title;
      }
      if (item.pageid) return item.title || null;
    }
    return null;
  };

  const getTitle = (item: FeaturedCardItem) => {
    if ('title' in item) {
      return item.title || 'Article';
    }
    return 'Article';
  };

  const getDescription = (item: FeaturedCardItem) => {
    if ('title' in item) {
      return item.description || item.title || 'No content available';
    }
    return 'No content available';
  };

  const renderContent = (item: FeaturedCardItem, description: string) => {
    const hasHtmlContent = description.includes('<') && description.includes('>');

    if (description === 'No content available') {
      return (
        <Text variant="bodyMedium" style={{ fontSize: 14, lineHeight: 18, textAlign: 'center' }}>
          {description}
        </Text>
      );
    }

    if (hasHtmlContent) {
      return (
        <HtmlRenderer html={description} maxLines={4} style={{ fontSize: 14, lineHeight: 18, flexShrink: 1 }} />
      );
    }

    return (
      <Text variant="bodyMedium" style={{ fontSize: 14, lineHeight: 18 }} numberOfLines={4}>
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
      renderContent={renderContent}
    />
  );
}

export default memo(GenericCard);
