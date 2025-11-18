import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { default as useReadingProgress } from '../hooks/storage/useReadingProgress';
import * as BookmarkService from '../services/BookmarkService';
import { ImageThumbnail } from '../types/api/base';
import { Bookmark, BookmarksContextType, OfflineArticle } from '../types/bookmarks';
import * as BookmarkStorage from '../utils/bookmarkStorage';

// Create context for bookmarks
const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

/**
 * Provider component for bookmarks context
 *
 * Manages bookmarks state and provides bookmark-related functions to child components.
 * Handles loading, adding, removing, and organizing bookmarks, as well as offline
 * article downloads.
 *
 * @param children - React children components
 *
 * @example
 * ```tsx
 * <BookmarksProvider>
 *   <App />
 * </BookmarksProvider>
 * ```
 */
export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [offlineArticles, setOfflineArticles] = useState<Record<string, OfflineArticle>>({});
  const queryClient = useQueryClient();
  const { cleanupOldProgress } = useReadingProgress();

  const loadBookmarks = useCallback(async () => {
    const loadedBookmarks = await BookmarkStorage.loadBookmarks();
    // Remove any duplicates that might exist in storage
    const cleanedBookmarks = BookmarkService.removeDuplicateBookmarks(loadedBookmarks);

    // Save cleaned bookmarks if duplicates were found
    if (cleanedBookmarks.length !== loadedBookmarks.length) {
      await BookmarkStorage.saveBookmarks(cleanedBookmarks);
    }

    setBookmarks(cleanedBookmarks);
  }, []);

  const loadOfflineArticles = useCallback(async () => {
    const loadedArticles = await BookmarkStorage.loadOfflineArticles();
    setOfflineArticles(loadedArticles);
  }, []);

  // Load bookmarks and offline articles from storage on mount
  // Note: loadBookmarks and loadOfflineArticles are stable (useCallback with empty deps)
  useEffect(() => {
    loadBookmarks();
    loadOfflineArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  // Cleanup old reading progress when bookmarks are loaded
  useEffect(() => {
    if (bookmarks.length > 0) {
      const bookmarkedTitles = bookmarks.map((b) => b.title);
      // Run cleanup after a short delay to avoid blocking initial load
      const timeoutId = setTimeout(() => {
        cleanupOldProgress(bookmarkedTitles).catch((error) => {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.error('Failed to cleanup reading progress:', error);
          }
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [bookmarks, cleanupOldProgress]);

  const downloadArticle = useCallback(
    async (title: string): Promise<boolean> => {
      const success = await BookmarkService.downloadArticle(queryClient, title, offlineArticles);
      if (success) {
        const updatedOfflineArticles = await BookmarkStorage.loadOfflineArticles();
        setOfflineArticles(updatedOfflineArticles);
      }
      return success;
    },
    [queryClient, offlineArticles]
  );

  const addBookmark = useCallback(
    async (title: string, thumbnail?: ImageThumbnail, summary?: string): Promise<boolean> => {
      const updatedBookmarks = await BookmarkService.addBookmark(
        queryClient,
        title,
        bookmarks,
        offlineArticles,
        thumbnail,
        summary
      );
      setBookmarks(updatedBookmarks);
      return true;
    },
    [queryClient, bookmarks, offlineArticles]
  );

  const removeBookmark = useCallback(
    async (title: string): Promise<boolean> => {
      const result = await BookmarkService.removeBookmark(title, bookmarks, offlineArticles);
      setBookmarks(result.bookmarks);
      setOfflineArticles(result.offlineArticles);
      return true;
    },
    [bookmarks, offlineArticles]
  );

  const updateBookmarkFolder = useCallback(
    async (title: string, folder: string | undefined): Promise<boolean> => {
      try {
        const updatedBookmarks = bookmarks.map((bookmark) =>
          bookmark.title === title ? { ...bookmark, folder } : bookmark
        );
        setBookmarks(updatedBookmarks);
        await BookmarkStorage.saveBookmarks(updatedBookmarks);
        return true;
      } catch (error) {
        console.error('Failed to update bookmark folder:', error);
        return false;
      }
    },
    [bookmarks]
  );

  const updateBookmarkTags = useCallback(
    async (title: string, tags: string[]): Promise<boolean> => {
      try {
        const updatedBookmarks = bookmarks.map((bookmark) =>
          bookmark.title === title ? { ...bookmark, tags } : bookmark
        );
        setBookmarks(updatedBookmarks);
        await BookmarkStorage.saveBookmarks(updatedBookmarks);
        return true;
      } catch (error) {
        console.error('Failed to update bookmark tags:', error);
        return false;
      }
    },
    [bookmarks]
  );

  const removeBookmarks = useCallback(
    async (titles: string[]): Promise<boolean> => {
      try {
        let updatedBookmarks = [...bookmarks];
        let updatedOfflineArticles = { ...offlineArticles };

        for (const title of titles) {
          const result = await BookmarkService.removeBookmark(
            title,
            updatedBookmarks,
            updatedOfflineArticles
          );
          updatedBookmarks = result.bookmarks;
          updatedOfflineArticles = result.offlineArticles;
        }

        setBookmarks(updatedBookmarks);
        setOfflineArticles(updatedOfflineArticles);
        return true;
      } catch (error) {
        console.error('Failed to remove bookmarks:', error);
        return false;
      }
    },
    [bookmarks, offlineArticles]
  );

  const isBookmarked = useCallback(
    (title: string): boolean => {
      return bookmarks.some((bookmark) => bookmark.title === title);
    },
    [bookmarks]
  );

  const isArticleDownloaded = useCallback(
    (title: string): boolean => {
      return !!offlineArticles[title];
    },
    [offlineArticles]
  );

  const getOfflineArticle = useCallback(
    (title: string): OfflineArticle | null => {
      return offlineArticles[title] || null;
    },
    [offlineArticles]
  );

  const clearBookmarks = useCallback(async (): Promise<void> => {
    try {
      setBookmarks([]);
      setOfflineArticles({});
      await BookmarkStorage.clearAllBookmarks();
    } catch (error) {
      console.error('Failed to clear bookmarks:', error);
    }
  }, []);

  const downloadAllBookmarks = useCallback(
    async (
      onProgress?: (progress: number, current: number, total: number) => void
    ): Promise<boolean> => {
      const updatedOfflineArticles = await BookmarkService.downloadAllBookmarks(
        queryClient,
        bookmarks,
        offlineArticles,
        onProgress
      );
      setOfflineArticles(updatedOfflineArticles);
      return Object.keys(updatedOfflineArticles).length > Object.keys(offlineArticles).length;
    },
    [queryClient, bookmarks, offlineArticles]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value: BookmarksContextType = useMemo(
    () => ({
      bookmarks,
      addBookmark,
      removeBookmark,
      removeBookmarks,
      updateBookmarkFolder,
      updateBookmarkTags,
      isBookmarked,
      clearBookmarks,
      loadBookmarks,
      // Offline reading functionality
      offlineArticles,
      isArticleDownloaded,
      getOfflineArticle,
      downloadArticle,
      downloadAllBookmarks,
    }),
    [
      bookmarks,
      offlineArticles,
      addBookmark,
      removeBookmark,
      removeBookmarks,
      updateBookmarkFolder,
      updateBookmarkTags,
      isBookmarked,
      clearBookmarks,
      loadBookmarks,
      isArticleDownloaded,
      getOfflineArticle,
      downloadArticle,
      downloadAllBookmarks,
    ]
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

/**
 * Hook to access the bookmarks context
 *
 * Provides access to bookmarks state and all bookmark-related functions.
 * Must be used within a BookmarksProvider component.
 *
 * @returns BookmarksContextType object containing:
 *   - `bookmarks`: Array of Bookmark objects
 *   - `offlineArticles`: Record of downloaded articles keyed by title
 *   - `addBookmark`: Function to add a bookmark
 *   - `removeBookmark`: Function to remove a bookmark
 *   - `updateBookmarkFolder`: Function to organize bookmarks into folders
 *   - `downloadArticle`: Function to download an article for offline reading
 *   - `downloadAllBookmarks`: Function to download all bookmarked articles
 *   - `clearBookmarks`: Function to clear all bookmarks
 *   - `loadBookmarks`: Function to reload bookmarks from storage
 *   - `isArticleDownloaded`: Function to check if an article is downloaded
 *   - `getOfflineArticle`: Function to get a downloaded article
 *
 * @throws Error if used outside of BookmarksProvider
 *
 * @example
 * ```tsx
 * const { bookmarks, addBookmark } = useBookmarks();
 *
 * await addBookmark("Albert Einstein", thumbnail, summary);
 * ```
 */
export function useBookmarks(): BookmarksContextType {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
