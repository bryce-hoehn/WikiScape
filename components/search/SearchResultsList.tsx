import React from 'react';
import { SearchSuggestion } from '../../types';
import BaseListWithHeader from './BaseListWithHeader';

interface SearchResultsListProps {
  suggestions: SearchSuggestion[];
  onSuggestionClick: (title: string) => void;
}

export default function SearchResultsList({
  suggestions,
  onSuggestionClick,
}: SearchResultsListProps) {
  return (
    <BaseListWithHeader
      data={suggestions}
      headerTitle="Search Results"
      getTitle={(item) => item.title}
      getDescription={(item) => item.description}
      getThumbnail={(item) => item.image || null}
      fallbackIcon="file-document-outline"
      onItemPress={(item) => onSuggestionClick(item.title)}
      keyExtractor={(item) => `suggestion-${item.title}`}
      accessibilityLabel={(item) => `Open article: ${item.title}`}
      accessibilityHint={(item) => `Opens the ${item.title} article`}
    />
  );
}
