import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bookmark, OfflineArticle } from '../types/bookmarks';

const BOOKMARKS_KEY = 'bookmarked_articles';
const OFFLINE_ARTICLES_KEY = 'offline_articles';

/**
 * Load bookmarks from storage
 */
export async function loadBookmarks(): Promise<Bookmark[]> {
  try {
    const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Invalid bookmarks data format, expected array');
        }
        // Clear corrupted data
        await AsyncStorage.removeItem(BOOKMARKS_KEY);
        return [];
      }
      return parsed;
    } catch (parseError) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Failed to parse bookmarks:', parseError);
      }
      // Clear corrupted data
      await AsyncStorage.removeItem(BOOKMARKS_KEY);
      return [];
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to load bookmarks:', error);
    }
    return [];
  }
}

/**
 * Save bookmarks to storage
 */
export async function saveBookmarks(bookmarks: Bookmark[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return true;
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to save bookmarks:', error);
    }
    return false;
  }
}

/**
 * Load offline articles from storage
 */
export async function loadOfflineArticles(): Promise<Record<string, OfflineArticle>> {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_ARTICLES_KEY);
    if (!stored) return {};

    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Invalid offline articles data format, expected object');
        }
        // Clear corrupted data
        await AsyncStorage.removeItem(OFFLINE_ARTICLES_KEY);
        return {};
      }
      return parsed;
    } catch (parseError) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Failed to parse offline articles:', parseError);
      }
      // Clear corrupted data
      await AsyncStorage.removeItem(OFFLINE_ARTICLES_KEY);
      return {};
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to load offline articles:', error);
    }
    return {};
  }
}

/**
 * Save offline articles to storage
 */
export async function saveOfflineArticles(
  articles: Record<string, OfflineArticle>
): Promise<boolean> {
  try {
    await AsyncStorage.setItem(OFFLINE_ARTICLES_KEY, JSON.stringify(articles));
    return true;
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to save offline articles:', error);
    }
    return false;
  }
}

/**
 * Clear all bookmarks and offline articles
 */
export async function clearAllBookmarks(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(BOOKMARKS_KEY);
    await AsyncStorage.removeItem(OFFLINE_ARTICLES_KEY);
    return true;
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to clear bookmarks:', error);
    }
    return false;
  }
}
