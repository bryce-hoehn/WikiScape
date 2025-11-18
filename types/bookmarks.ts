import { Article } from './api';
import { ImageThumbnail } from './api/base';

export interface Bookmark {
  title: string;
  thumbnail?: ImageThumbnail;
  summary?: string;
  bookmarkedAt: string;
  folder?: string; // Folder name (undefined = uncategorized)
  tags?: string[]; // Array of tag names
}

export interface OfflineArticle extends Article {
  downloadedAt: string;
}

export interface BookmarksContextType {
  bookmarks: Bookmark[];
  addBookmark: (title: string, thumbnail?: ImageThumbnail, summary?: string) => Promise<boolean>;
  removeBookmark: (title: string) => Promise<boolean>;
  removeBookmarks: (titles: string[]) => Promise<boolean>;
  updateBookmarkFolder: (title: string, folder: string | undefined) => Promise<boolean>;
  updateBookmarkTags: (title: string, tags: string[]) => Promise<boolean>;
  isBookmarked: (title: string) => boolean;
  clearBookmarks: () => Promise<void>;
  loadBookmarks: () => Promise<void>;
  // Offline reading functionality
  offlineArticles: Record<string, OfflineArticle>;
  isArticleDownloaded: (title: string) => boolean;
  getOfflineArticle: (title: string) => OfflineArticle | null;
  downloadArticle: (title: string) => Promise<boolean>;
  downloadAllBookmarks: (
    onProgress?: (progress: number, current: number, total: number) => void
  ) => Promise<boolean>;
}
