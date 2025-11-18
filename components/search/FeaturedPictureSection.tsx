import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React from 'react';
import FeaturedPictureCard from '../featured/FeaturedPictureCard';
import ContentSection from './ContentSection';
import { FeaturedPictureSkeleton } from './SkeletonComponents';

/**
 * Featured Picture section component for SearchScreen
 */
export default function FeaturedPictureSection() {
  const { featuredContent, isLoading } = useFeaturedContent();

  return (
    <ContentSection
      title="Featured Picture"
      isLoading={isLoading}
      skeleton={<FeaturedPictureSkeleton />}
    >
      {featuredContent?.image ? <FeaturedPictureCard /> : null}
    </ContentSection>
  );
}
