import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import useAsyncStorage from './useAsyncStorage';

const ARTICLE_LINKS_KEY = 'article_links';

/**
 * Hook for managing article links (backlinks and forward links combined)
 *
 * Stores links for articles in AsyncStorage, enabling instant recommendations
 * without API calls. Links are fetched in background when articles are viewed.
 *
 * @returns Object containing:
 *   - `getArticleLinks`: Function to get links for an article
 *   - `saveArticleLinks`: Function to save links for an article
 *   - `removeArticleLinks`: Function to remove links for an article
 *   - `clearAllLinks`: Function to clear all links
 *   - `getAllLinks`: Function to get all cached links
 *   - `loading`: Whether the initial load is in progress
 *   - `error`: Any error that occurred during loading
 *
 * @example
 * ```tsx
 * const { getArticleLinks, saveArticleLinks } = useArticleLinks();
 *
 * // Save links for an article
 * await saveArticleLinks("Albert Einstein", ["Theory of relativity", "Physics", ...]);
 *
 * // Get links for an article
 * const links = getArticleLinks("Albert Einstein");
 * ```
 */
export default function useArticleLinks() {
  const {
    value: articleLinks,
    isLoading: loading,
    updateValue,
  } = useAsyncStorage<Record<string, string[]>>(ARTICLE_LINKS_KEY, {
    defaultValue: {},
    validator: (val) => {
      // Validate that it's an object and each value is an array of strings
      if (!val || typeof val !== 'object' || Array.isArray(val)) {
        return false;
      }
      // Validate each entry has a string key and array of strings value
      return Object.entries(val).every(
        ([key, value]) =>
          typeof key === 'string' &&
          Array.isArray(value) &&
          value.every((item) => typeof item === 'string')
      );
    },
  });
  const [error, setError] = useState<string | null>(null);

  const getArticleLinks = useCallback(
    (title: string): string[] => {
      return articleLinks[title] || [];
    },
    [articleLinks]
  );

  const hasArticleLinks = useCallback(
    (title: string): boolean => {
      return title in articleLinks;
    },
    [articleLinks]
  );

  const saveArticleLinks = useCallback(
    async (title: string, links: string[]) => {
      try {
        // Remove duplicates and ensure all items are strings
        const uniqueLinks = Array.from(new Set(links.filter((link) => typeof link === 'string')));

        await updateValue((prevLinks) => {
          return {
            ...prevLinks,
            [title]: uniqueLinks,
          };
        });
      } catch (error) {
        setError('Failed to save article links');
      }
    },
    [updateValue]
  );

  const removeArticleLinks = useCallback(
    async (title: string) => {
      try {
        await updateValue((prevLinks) => {
          const updatedLinks = { ...prevLinks };
          delete updatedLinks[title];

          if (Object.keys(updatedLinks).length === 0) {
            // Remove from storage if empty
            AsyncStorage.removeItem(ARTICLE_LINKS_KEY).catch(() => {
              // Silently handle errors
            });
          }

          return updatedLinks;
        });

        return true;
      } catch (error) {
        setError('Failed to remove article links');
        return false;
      }
    },
    [updateValue]
  );

  const clearAllLinks = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ARTICLE_LINKS_KEY);
      await updateValue({});
      return true;
    } catch (error) {
      setError('Failed to clear article links');
      return false;
    }
  }, [updateValue]);

  const getAllLinks = useCallback((): Record<string, string[]> => {
    return articleLinks;
  }, [articleLinks]);

  return {
    getArticleLinks,
    hasArticleLinks,
    saveArticleLinks,
    removeArticleLinks,
    clearAllLinks,
    getAllLinks,
    loading,
    error,
  };
}

