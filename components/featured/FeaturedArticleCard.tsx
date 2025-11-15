import { useFeaturedContent } from '@/context/FeaturedContentContext';
import { router } from 'expo-router';
import React from 'react';
import { Card } from 'react-native-paper';
import HtmlRenderer from '../common/HtmlRenderer';
import ResponsiveImage from '../common/ResponsiveImage';

export default function FeaturedArticleCard() {
  const { featuredContent } = useFeaturedContent();
  const article = featuredContent?.tfa;

  if (!article) {
    return null;
  }

  return (
    <Card
      style={{ width: '100%' }}
      onPress={() => router.push(`/(zArticleStack)/${encodeURIComponent(article.titles?.normalized || article.title || '')}`)}
      accessibilityLabel={`Open featured article: ${article.titles?.normalized || article.title || ''}`}
      accessibilityHint={`Opens the featured article: ${article.titles?.normalized || article.title || ''}`}
    >
      {article.thumbnail && (
        <ResponsiveImage
          source={{
            source: article.thumbnail.source,
            width: article.thumbnail.width || 400,
            height: article.thumbnail.height || 300
          }}
          contentFit="cover"
          style={{ borderRadius: 12 }}
          alt={`Thumbnail for ${article.titles?.normalized || article.title || ''}`}
        />
      )}
      <Card.Content>
        <HtmlRenderer html={article.extract_html || ''} maxLines={6} style={{paddingTop: 12}}/>
      </Card.Content>
    </Card>
  );
}
