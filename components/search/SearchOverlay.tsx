import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useDebounce, useSearchSuggestions, useVisitedArticles } from '../../hooks';
import { SearchOverlayProps } from '../../types';
import NoResultsState from './NoResultsState';
import RecentArticlesList from './RecentArticlesList';
import SearchHeader from './SearchHeader';
import SearchResultsList from './SearchResultsList';

export default function SearchOverlay({ visible, onClose, initialQuery = '' }: SearchOverlayProps) {
  const theme = useTheme();
  const [query, setQuery] = useState(initialQuery);
  const { visitedArticles } = useVisitedArticles();
  
  const debouncedQuery = useDebounce(query, 300);
  const { data: suggestions } = useSearchSuggestions(debouncedQuery);

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      router.push(`/(zArticleStack)/${encodeURIComponent(query)}`);
      onClose();
      setQuery('');
    }
  }, [query, onClose]);

  const handleSuggestionClick = useCallback((title: string) => {
    router.push(`/(zArticleStack)/${encodeURIComponent(title)}`);
    onClose();
    setQuery('');
  }, [onClose]);

  const handleClose = useCallback(() => {
    onClose();
    setQuery('');
  }, [onClose]);

  const recentVisitedArticles = useMemo(() => 
    visitedArticles.slice(0, 10), // Limit to 10 most recent
    [visitedArticles]
  );

  // Determine what to show
  const safeSuggestions = suggestions || [];
  const showSearchResults = safeSuggestions.length > 0;
  const showNoResults = query.trim().length > 0 && safeSuggestions.length === 0;
  const showRecentlyViewed = recentVisitedArticles.length > 0 && !showSearchResults && !showNoResults;

  if (!visible) {
    return null;
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      accessible={true}
      accessibilityLabel="Search overlay"
      accessibilityRole="search"
      importantForAccessibility="yes"
    >
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={handleSearchSubmit}
        onClose={handleClose}
      />
          
      {/* Search Results */}
      {showSearchResults && (
        <SearchResultsList
          suggestions={safeSuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
      
      {showNoResults && <NoResultsState query={query} />}
      
      {showRecentlyViewed && (
        <RecentArticlesList
          recentVisitedArticles={recentVisitedArticles}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
    </View>
  );
}
