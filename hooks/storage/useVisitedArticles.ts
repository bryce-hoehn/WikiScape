import { Article } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import useArticleLinks from './useArticleLinks';
import useAsyncStorage from './useAsyncStorage';

export interface VisitedArticle {
  title: string;
  visitedAt: string;
}

/**
 * Visited article with optional full article data
 * Used for displaying recently viewed articles with thumbnails
 */
export interface VisitedArticleItem extends VisitedArticle {
  article?: Article;
}

const VISITED_ARTICLES_KEY = 'visited_articles';

/**
 * Hook for managing visited articles history
 *
 * Tracks articles that the user has viewed, maintaining a list of up to 100
 * most recent visits. Uses useAsyncStorage as base and adds custom methods
 * for array manipulation.
 *
 * @returns Object containing:
 *   - `visitedArticles`: Array of VisitedArticle objects (most recent first)
 *   - `loading`: Whether the initial load is in progress
 *   - `error`: Any error that occurred during loading
 *   - `addVisitedArticle`: Function to add a new visited article
 *   - `removeVisitedArticle`: Function to remove a specific article from history
 *   - `clearVisitedArticles`: Function to clear all visited articles
 *   - `loadVisitedArticles`: Function to manually reload from storage
 *
 * @example
 * ```tsx
 * const { visitedArticles, addVisitedArticle } = useVisitedArticles();
 *
 * // Add a visited article
 * await addVisitedArticle("Albert Einstein");
 *
 * // Display recent articles
 * visitedArticles.slice(0, 5).map(article => (
 *   <ArticleCard key={article.title} title={article.title} />
 * ));
 * ```
 */
export default function useVisitedArticles() {
  const {
    value: visitedArticles,
    isLoading: loading,
    updateValue,
  } = useAsyncStorage<VisitedArticle[]>(VISITED_ARTICLES_KEY, {
    defaultValue: [],
    validator: (val) => {
      // Validate that it's an array and each item has the required structure
      if (!Array.isArray(val)) {
        return false;
      }
      // Validate each item has required fields
      return val.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          typeof item.title === 'string' &&
          typeof item.visitedAt === 'string' &&
          item.title.length > 0
      );
    },
  });
  const { removeArticleLinks, clearAllLinks } = useArticleLinks();
  const [error, setError] = useState<string | null>(null);

  // Load visited articles (refresh from storage)
  const loadVisitedArticles = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(VISITED_ARTICLES_KEY);
      if (stored) {
        try {
          const articles = JSON.parse(stored);
          if (Array.isArray(articles)) {
            await updateValue(articles);
          } else {
            // Clear corrupted data
            await AsyncStorage.removeItem(VISITED_ARTICLES_KEY);
            await updateValue([]);
          }
        } catch (parseError) {
          // Clear corrupted data
          await AsyncStorage.removeItem(VISITED_ARTICLES_KEY);
          await updateValue([]);
        }
      }
    } catch (error) {
      setError('Failed to load visited articles');
    }
  }, [updateValue]);

  const addVisitedArticle = useCallback(
    async (title: string) => {
      try {
        const newArticle: VisitedArticle = {
          title,
          visitedAt: new Date().toISOString(),
        };

        // Use functional update to avoid stale closure issues
        // This ensures we always work with the latest value
        await updateValue((prevArticles) => {
          // Remove any existing entry with the same title and add new one at the front
          const filtered = prevArticles.filter((a) => a.title !== title);
          // Keep only the 100 most recent
          return [newArticle, ...filtered].slice(0, 100);
        });
      } catch (error) {
        setError('Failed to save visited article');
      }
    },
    [updateValue]
  );

  const removeVisitedArticle = useCallback(
    async (title: string) => {
      try {
        // Remove article links first
        await removeArticleLinks(title);

        // Use functional update to avoid stale closure issues
        await updateValue((prevArticles) => {
          const updatedArticles = prevArticles.filter((a) => a.title !== title);
          
          if (updatedArticles.length === 0) {
            // Remove from storage if empty
            AsyncStorage.removeItem(VISITED_ARTICLES_KEY).catch(() => {
              // Silently handle errors
            });
          }
          
          return updatedArticles;
        });

        return true;
      } catch (error) {
        setError('Failed to remove visited article');
        return false;
      }
    },
    [updateValue, removeArticleLinks]
  );

  const clearVisitedArticles = useCallback(async () => {
    try {
      // Clear all article links first
      await clearAllLinks();

      // Then clear visited articles
      await AsyncStorage.removeItem(VISITED_ARTICLES_KEY);
      await updateValue([]);
      return true;
    } catch (error) {
      setError('Failed to clear visited articles');
      return false;
    }
  }, [updateValue, clearAllLinks]);

  return {
    visitedArticles,
    loading,
    error,
    addVisitedArticle,
    removeVisitedArticle,
    clearVisitedArticles,
    loadVisitedArticles,
  };
}
