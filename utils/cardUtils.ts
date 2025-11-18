/**
 * Utility functions for card component selection and management
 */

import React from 'react';
import { type MD3Theme } from 'react-native-paper';
import { RecommendationItem } from '../types/components';
import DidYouKnowCard from '../components/featured/DidYouKnowCard';
import GenericCard from '../components/featured/GenericCard';
import NewsCard from '../components/featured/NewsCard';
import OnThisDayCard from '../components/featured/OnThisDayCard';
import { DidYouKnowItem } from '../types/api/featured';

export type CardType = 'on-this-day' | 'news' | 'did-you-know' | 'generic';

export interface CardComponentProps {
  item: RecommendationItem;
  itemWidth: number;
  theme: MD3Theme;
}

/**
 * Get the appropriate card component based on card type
 */
export function getCardComponent(cardType: CardType) {
  switch (cardType) {
    case 'on-this-day':
      return OnThisDayCard;
    case 'news':
      return NewsCard;
    case 'did-you-know':
      return DidYouKnowCard;
    case 'generic':
    default:
      return GenericCard;
  }
}
