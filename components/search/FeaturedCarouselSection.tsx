import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React from 'react';
import { RecommendationItem } from '../../types/components';
import { CardType } from '../../utils/cardUtils';
import SimpleFeaturedCarousel from '../featured/SimpleFeaturedCarousel';
import ContentSection from './ContentSection';
import { FeaturedCarouselSkeleton } from './SkeletonComponents';

interface FeaturedCarouselSectionProps {
  title: string;
  items: RecommendationItem[] | null | undefined;
  cardType?: CardType;
  year?: number;
}

/**
 * Reusable carousel section component for SearchScreen
 */
export default function FeaturedCarouselSection({
  title,
  items,
  cardType = 'generic',
  year,
}: FeaturedCarouselSectionProps) {
  const { isLoading } = useFeaturedContent();

  return (
    <ContentSection title={title} isLoading={isLoading} skeleton={<FeaturedCarouselSkeleton />}>
      {items ? <SimpleFeaturedCarousel items={items} cardType={cardType} /> : null}
    </ContentSection>
  );
}
