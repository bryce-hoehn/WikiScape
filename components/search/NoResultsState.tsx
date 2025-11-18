import { router } from 'expo-router';
import React from 'react';
import StandardEmptyState from '../common/StandardEmptyState';

interface NoResultsStateProps {
  query: string;
  onClearSearch?: () => void;
}

export default function NoResultsState({ query, onClearSearch }: NoResultsStateProps) {
  const suggestions = [];

  if (onClearSearch) {
    suggestions.push({
      label: 'Clear Search',
      action: onClearSearch,
      icon: 'close',
    });
  }

  suggestions.push({
    label: 'Browse Trending',
    action: () => router.push('/(tabs)/search'),
    icon: 'trending-up',
  });

  return (
    <StandardEmptyState
      icon="magnify"
      title="No Results Found"
      description={`We couldn't find any articles matching "${query}". Try a different search term or browse trending articles.`}
      suggestions={suggestions}
    />
  );
}
