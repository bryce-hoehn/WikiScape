import React, { memo } from 'react';
import { useTheme, type MD3Theme } from 'react-native-paper';
import { DidYouKnowItem } from '../../types/api/featured';
import BaseFeaturedCard, { FeaturedCardItem } from './BaseFeaturedCard';

interface DidYouKnowCardProps {
  item: DidYouKnowItem;
  itemWidth: number;
  theme: MD3Theme;
}

function DidYouKnowCard({ item, itemWidth, theme }: DidYouKnowCardProps) {
  // Extract title from HTML for navigation
  const getTitle = (item: FeaturedCardItem) => {
    if ('html' in item && item.html) {
      const titleMatch = item.html.match(/title="([^"]*)"/);
      return titleMatch?.[1] || 'Did You Know?';
    }
    return 'Did You Know?';
  };

  const getArticleTitle = (item: FeaturedCardItem) => {
    const title = getTitle(item);
    return title && title !== 'Did You Know?' ? title : null;
  };

  const getDescription = (item: FeaturedCardItem) => {
    if ('html' in item && item.html) {
      return item.html;
    }
    return 'No content available';
  };

  return (
    <BaseFeaturedCard
      item={item}
      itemWidth={itemWidth}
      theme={theme}
      getArticleTitle={getArticleTitle}
      getDescription={getDescription}
      getTitle={getTitle}
    />
  );
}

export default memo(DidYouKnowCard);
