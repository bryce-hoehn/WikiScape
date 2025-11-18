import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React from 'react';
import FeaturedArticleCard from '../featured/FeaturedArticleCard';
import ContentSection from './ContentSection';
import { FeaturedArticleSkeleton } from './SkeletonComponents';

/**
 * Featured Article section component for SearchScreen
 */
export default function FeaturedArticleSection() {
  const { featuredContent, isLoading } = useFeaturedContent();

  return (
    <ContentSection
      title="Featured Article"
      isLoading={isLoading}
      skeleton={<FeaturedArticleSkeleton />}
    >
      {featuredContent?.tfa ? <FeaturedArticleCard /> : null}
    </ContentSection>
  );
}
