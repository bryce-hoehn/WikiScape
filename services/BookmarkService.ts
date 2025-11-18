import { QueryClient } from '@tanstack/react-query';
import { fetchArticleSummary } from '../api';
import { ImageThumbnail } from '../types/api/base';
import { Bookmark, OfflineArticle } from '../types/bookmarks';
import { saveBookmarks, saveOfflineArticles } from '../utils/bookmarkStorage';

/**
 * Download article for offline reading
 */
export async function downloadArticle(
  queryClient: QueryClient,
  title: string,
  currentOfflineArticles: Record<string, OfflineArticle>
): Promise<boolean> {
  try {
    // Use React Query's cache first, then fetch if needed
    const cachedArticle = queryClient.getQueryData(['article', title]);

    let article: OfflineArticle | undefined;
    if (cachedArticle) {
      article = cachedArticle as OfflineArticle;
    } else {
      // Fetch and cache the article
      const articleResponse = await fetchArticleSummary(title);
      if (articleResponse.article) {
        article = {
          ...articleResponse.article,
          downloadedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(['article', title], article);
      }
    }

    if (article) {
      const updatedOfflineArticles = {
        ...currentOfflineArticles,
        [title]: article,
      };

      await saveOfflineArticles(updatedOfflineArticles);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to download article for offline reading:', error);
    return false;
  }
}

/**
 * Add a bookmark (offline download must be done manually)
 */
export async function addBookmark(
  queryClient: QueryClient,
  title: string,
  currentBookmarks: Bookmark[],
  currentOfflineArticles: Record<string, OfflineArticle>,
  thumbnail?: ImageThumbnail,
  summary?: string
): Promise<Bookmark[]> {
  try {
    // Check if bookmark already exists to prevent duplicates
    const existingBookmark = currentBookmarks.find((b) => b.title === title);
    if (existingBookmark) {
      // Bookmark already exists, return current bookmarks without adding duplicate
      return currentBookmarks;
    }

    const newBookmark: Bookmark = {
      title,
      thumbnail,
      summary,
      bookmarkedAt: new Date().toISOString(),
    };

    const updatedBookmarks = [newBookmark, ...currentBookmarks];
    await saveBookmarks(updatedBookmarks);

    // Note: Offline download is now manual - user must press download button
    // This prevents automatic storage of large article data

    return updatedBookmarks;
  } catch (error) {
    console.error('Failed to add bookmark:', error);
    return currentBookmarks;
  }
}

/**
 * Remove a bookmark and associated offline article
 * Removes only the first matching bookmark to handle potential duplicates
 */
export async function removeBookmark(
  title: string,
  currentBookmarks: Bookmark[],
  currentOfflineArticles: Record<string, OfflineArticle>
): Promise<{ bookmarks: Bookmark[]; offlineArticles: Record<string, OfflineArticle> }> {
  try {
    // Find the first matching bookmark index
    const bookmarkIndex = currentBookmarks.findIndex((bookmark) => bookmark.title === title);

    if (bookmarkIndex === -1) {
      // Bookmark not found, return current state
      return { bookmarks: currentBookmarks, offlineArticles: currentOfflineArticles };
    }

    // Remove only the first matching bookmark (handles duplicates)
    const updatedBookmarks = [
      ...currentBookmarks.slice(0, bookmarkIndex),
      ...currentBookmarks.slice(bookmarkIndex + 1),
    ];
    await saveBookmarks(updatedBookmarks);

    // Remove from offline articles if it exists
    let updatedOfflineArticles = { ...currentOfflineArticles };
    if (currentOfflineArticles[title]) {
      const { [title]: removed, ...remainingOfflineArticles } = currentOfflineArticles;
      updatedOfflineArticles = remainingOfflineArticles;
      await saveOfflineArticles(updatedOfflineArticles);
    }

    return { bookmarks: updatedBookmarks, offlineArticles: updatedOfflineArticles };
  } catch (error) {
    console.error('Failed to remove bookmark:', error);
    return { bookmarks: currentBookmarks, offlineArticles: currentOfflineArticles };
  }
}

/**
 * Download all bookmarks for offline reading
 * @param onProgress Optional callback that receives progress (0-1) and current item index
 */
export async function downloadAllBookmarks(
  queryClient: QueryClient,
  currentBookmarks: Bookmark[],
  currentOfflineArticles: Record<string, OfflineArticle>,
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<Record<string, OfflineArticle>> {
  try {
    const bookmarkTitles = currentBookmarks.map((bookmark) => bookmark.title);
    const total = bookmarkTitles.length;

    // Fetch articles one by one to report progress
    const updatedOfflineArticles = { ...currentOfflineArticles };

    for (let i = 0; i < bookmarkTitles.length; i++) {
      const title = bookmarkTitles[i];
      try {
        const articleResponse = await fetchArticleSummary(title);
        if (articleResponse.article) {
          const offlineArticle: OfflineArticle = {
            ...articleResponse.article,
            downloadedAt: new Date().toISOString(),
          };
          updatedOfflineArticles[articleResponse.article.title] = offlineArticle;
        }
      } catch (error) {
        // Silently handle fetch errors for individual articles
      }

      // Report progress
      if (onProgress) {
        const progress = (i + 1) / total;
        onProgress(progress, i + 1, total);
      }
    }

    await saveOfflineArticles(updatedOfflineArticles);

    return updatedOfflineArticles;
  } catch (error) {
    // Silently handle download errors - return current state
    return currentOfflineArticles;
  }
}

/**
 * Remove duplicate bookmarks (keeps the first occurrence of each title)
 * This is a cleanup function to handle any existing duplicates in storage
 */
export function removeDuplicateBookmarks(bookmarks: Bookmark[]): Bookmark[] {
  const seen = new Set<string>();
  const unique: Bookmark[] = [];

  for (const bookmark of bookmarks) {
    if (!seen.has(bookmark.title)) {
      seen.add(bookmark.title);
      unique.push(bookmark);
    }
  }

  return unique;
}
