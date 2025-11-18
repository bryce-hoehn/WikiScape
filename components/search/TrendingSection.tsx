import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React from 'react';
import TrendingList from '../featured/Trending';
import ContentSection from './ContentSection';
import { TrendingCarouselSkeleton } from './SkeletonComponents';

interface TrendingSectionProps {
  maxItemsPerPage?: number;
}

/**
 * Trending Articles section component for SearchScreen
 */
export default function TrendingSection({ maxItemsPerPage = 6 }: TrendingSectionProps) {
  const { featuredContent, isLoading } = useFeaturedContent();

  return (
    <ContentSection
      title="Trending Articles"
      isLoading={isLoading}
      skeleton={<TrendingCarouselSkeleton itemsCount={maxItemsPerPage} />}
    >
      {featuredContent?.mostread ? <TrendingList maxItemsPerPage={maxItemsPerPage} /> : null}
    </ContentSection>
  );
}
