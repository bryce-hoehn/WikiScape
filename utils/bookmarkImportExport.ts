import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { ThemeType } from '../context/ThemeProvider';
import { ReadingProgress } from '../hooks/storage/useReadingProgress';
import { VisitedArticle } from '../hooks/storage/useVisitedArticles';
import { Bookmark, OfflineArticle } from '../types/bookmarks';
import * as BookmarkStorage from './bookmarkStorage';

// Type guard for file with uri
function hasUri(file: File | { uri: string }): file is { uri: string } {
  return (
    typeof file === 'object' &&
    file !== null &&
    'uri' in file &&
    typeof (file as { uri: unknown }).uri === 'string'
  );
}

// Storage keys
const VISITED_ARTICLES_KEY = 'visited_articles';
const READING_PROGRESS_KEY = 'reading_progress';
const THEME_STORAGE_KEY = 'wikipediaexpo_theme_preference';
const FONT_SIZE_KEY = 'articleFontSize';
const FONT_FAMILY_KEY = 'articleFontFamily';
const LINE_HEIGHT_KEY = 'articleLineHeight';
const PARAGRAPH_SPACING_KEY = 'articleParagraphSpacing';
const READING_PADDING_KEY = 'articleReadingPadding';
const REDUCED_MOTION_KEY = '@wikiscroll:reducedMotion';
const ACCORDION_BEHAVIOR_KEY = 'accordion_auto_close';

export interface UserProfileExportData {
  version: string;
  exportedAt: string;
  // Bookmarks and offline articles
  bookmarks: Bookmark[];
  offlineArticles: Record<string, OfflineArticle>;
  // Reading history
  visitedArticles: VisitedArticle[];
  readingProgress: Record<string, ReadingProgress>;
  // Settings
  theme: ThemeType | null;
  fontSize: number | null;
  fontFamily: string | null;
  lineHeight: number | null;
  paragraphSpacing: number | null;
  readingPadding: number | null;
  reducedMotion: boolean | null;
  accordionAutoClose: boolean | null;
}

/**
 * Export complete user profile (bookmarks, history, settings) to a JSON file
 */
export async function exportUserProfile(): Promise<boolean> {
  try {
    // Load all user data
    const bookmarks = await BookmarkStorage.loadBookmarks();
    const offlineArticles = await BookmarkStorage.loadOfflineArticles();

    // Remove large content fields from offline articles to reduce export size
    // HTML and structured content can be re-fetched when needed for offline reading
    // We only keep essential metadata and exclude all large content fields
    const offlineArticlesForExport: Record<string, Partial<OfflineArticle>> = {};
    for (const [title, article] of Object.entries(offlineArticles)) {
      // Exclude known large fields: html, extract_html, and any other large structured data
      const { html, extract_html, sections, content, wikitext, ...articleMetadata } =
        article as any;

      offlineArticlesForExport[title] = {
        ...articleMetadata,
        // Ensure downloadedAt is preserved
        downloadedAt: article.downloadedAt,
      };
    }

    // Load reading history
    const visitedArticlesJson = await AsyncStorage.getItem(VISITED_ARTICLES_KEY);
    let visitedArticles: VisitedArticle[] = [];
    if (visitedArticlesJson) {
      try {
        const parsed = JSON.parse(visitedArticlesJson);
        if (Array.isArray(parsed)) {
          visitedArticles = parsed;
        }
      } catch (parseError) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Failed to parse visited articles for export:', parseError);
        }
      }
    }

    // Load reading progress
    const readingProgressJson = await AsyncStorage.getItem(READING_PROGRESS_KEY);
    let readingProgress: Record<string, ReadingProgress> = {};
    if (readingProgressJson) {
      try {
        const parsed = JSON.parse(readingProgressJson);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          readingProgress = parsed;
        }
      } catch (parseError) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Failed to parse reading progress for export:', parseError);
        }
      }
    }

    // Load settings
    const theme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    const fontSizeJson = await AsyncStorage.getItem(FONT_SIZE_KEY);
    const fontFamily = await AsyncStorage.getItem(FONT_FAMILY_KEY);
    const lineHeightJson = await AsyncStorage.getItem(LINE_HEIGHT_KEY);
    const paragraphSpacingJson = await AsyncStorage.getItem(PARAGRAPH_SPACING_KEY);
    const readingPaddingJson = await AsyncStorage.getItem(READING_PADDING_KEY);
    const reducedMotionJson = await AsyncStorage.getItem(REDUCED_MOTION_KEY);
    const accordionAutoCloseJson = await AsyncStorage.getItem(ACCORDION_BEHAVIOR_KEY);

    const exportData: UserProfileExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      bookmarks,
      offlineArticles: offlineArticlesForExport as Record<string, OfflineArticle>,
      visitedArticles,
      readingProgress,
      theme: theme as ThemeType | null,
      fontSize: fontSizeJson ? parseInt(fontSizeJson, 10) : null,
      fontFamily: fontFamily || null,
      lineHeight: lineHeightJson ? parseFloat(lineHeightJson) : null,
      paragraphSpacing: paragraphSpacingJson ? parseInt(paragraphSpacingJson, 10) : null,
      readingPadding: readingPaddingJson ? parseInt(readingPaddingJson, 10) : null,
      reducedMotion: reducedMotionJson ? reducedMotionJson === 'true' : null,
      accordionAutoClose: accordionAutoCloseJson ? accordionAutoCloseJson === 'true' : null,
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    if (Platform.OS === 'web') {
      // Web: Create download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wikipedia-profile-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } else {
      // Mobile: Write to file system then share
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      const fileName = `wikipedia-profile-${new Date().toISOString().split('T')[0]}.json`;
      const documentDir = (FileSystem as any).documentDirectory;
      if (!documentDir) {
        throw new Error('Document directory is not available');
      }
      const fileUri = `${documentDir}${fileName}`;

      // Write file to document directory (UTF-8 is the default encoding)
      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export User Profile',
      });

      return true;
    }
  } catch (error) {
    console.error('Failed to export user profile:', error);
    throw error;
  }
}

/**
 * Import complete user profile from a JSON file
 */
export async function importUserProfile(fileContent: string): Promise<{
  bookmarks: Bookmark[];
  offlineArticles: Record<string, OfflineArticle>;
  visitedArticles: VisitedArticle[];
  readingProgress: Record<string, ReadingProgress>;
  theme: ThemeType | null;
  fontSize: number | null;
  fontFamily: string | null;
  lineHeight: number | null;
  paragraphSpacing: number | null;
  readingPadding: number | null;
  reducedMotion: boolean | null;
  accordionAutoClose: boolean | null;
}> {
  try {
    let data: UserProfileExportData;
    try {
      data = JSON.parse(fileContent) as UserProfileExportData;
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        throw new Error('Invalid JSON file. Please ensure the file is a valid JSON export.');
      }
      throw parseError;
    }

    // Validate the structure
    if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
      throw new Error('Invalid file format: bookmarks array is missing or invalid');
    }

    if (!data.offlineArticles || typeof data.offlineArticles !== 'object') {
      throw new Error('Invalid file format: offlineArticles object is missing or invalid');
    }

    // Validate bookmark structure
    for (const bookmark of data.bookmarks) {
      if (!bookmark.title || typeof bookmark.title !== 'string') {
        throw new Error('Invalid bookmark: missing or invalid title');
      }
      if (!bookmark.bookmarkedAt || typeof bookmark.bookmarkedAt !== 'string') {
        throw new Error('Invalid bookmark: missing or invalid bookmarkedAt');
      }
    }

    // Validate offline articles structure
    // Note: html field is optional (excluded from exports to reduce size)
    for (const [title, article] of Object.entries(data.offlineArticles)) {
      if (!article || typeof article !== 'object') {
        throw new Error(`Invalid offline article for "${title}": article is not an object`);
      }
      if (!article.downloadedAt || typeof article.downloadedAt !== 'string') {
        throw new Error(`Invalid offline article for "${title}": missing downloadedAt`);
      }
      // HTML field is optional - articles can be re-downloaded for offline reading if needed
    }

    // Validate visited articles (if present)
    if (data.visitedArticles !== undefined) {
      if (!Array.isArray(data.visitedArticles)) {
        throw new Error('Invalid file format: visitedArticles must be an array');
      }
      for (const article of data.visitedArticles) {
        if (!article.title || typeof article.title !== 'string') {
          throw new Error('Invalid visited article: missing or invalid title');
        }
        if (!article.visitedAt || typeof article.visitedAt !== 'string') {
          throw new Error('Invalid visited article: missing or invalid visitedAt');
        }
      }
    }

    // Validate reading progress (if present)
    if (data.readingProgress !== undefined) {
      if (typeof data.readingProgress !== 'object') {
        throw new Error('Invalid file format: readingProgress must be an object');
      }
      // Validate structure
      for (const [title, progress] of Object.entries(data.readingProgress)) {
        if (
          !progress ||
          typeof progress !== 'object' ||
          !('progress' in progress) ||
          !('lastReadAt' in progress)
        ) {
          throw new Error(`Invalid reading progress for "${title}": missing required fields`);
        }
      }
    }

    // Save all imported data
    await BookmarkStorage.saveBookmarks(data.bookmarks);
    await BookmarkStorage.saveOfflineArticles(data.offlineArticles);

    // Save reading history
    if (data.visitedArticles !== undefined) {
      await AsyncStorage.setItem(VISITED_ARTICLES_KEY, JSON.stringify(data.visitedArticles));
    }

    // Save reading progress
    if (data.readingProgress !== undefined) {
      await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(data.readingProgress));
    }

    // Save settings
    if (data.theme !== null && data.theme !== undefined) {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, data.theme);
    }

    if (data.fontSize !== null && data.fontSize !== undefined) {
      await AsyncStorage.setItem(FONT_SIZE_KEY, String(data.fontSize));
    }

    if (data.fontFamily !== null && data.fontFamily !== undefined) {
      await AsyncStorage.setItem(FONT_FAMILY_KEY, data.fontFamily);
    }

    if (data.lineHeight !== null && data.lineHeight !== undefined) {
      await AsyncStorage.setItem(LINE_HEIGHT_KEY, String(data.lineHeight));
    }

    if (data.paragraphSpacing !== null && data.paragraphSpacing !== undefined) {
      await AsyncStorage.setItem(PARAGRAPH_SPACING_KEY, String(data.paragraphSpacing));
    }

    if (data.readingPadding !== null && data.readingPadding !== undefined) {
      await AsyncStorage.setItem(READING_PADDING_KEY, String(data.readingPadding));
    }

    if (data.reducedMotion !== null && data.reducedMotion !== undefined) {
      await AsyncStorage.setItem(REDUCED_MOTION_KEY, String(data.reducedMotion));
    }

    if (data.accordionAutoClose !== null && data.accordionAutoClose !== undefined) {
      await AsyncStorage.setItem(ACCORDION_BEHAVIOR_KEY, String(data.accordionAutoClose));
    }

    return {
      bookmarks: data.bookmarks,
      offlineArticles: data.offlineArticles,
      visitedArticles: data.visitedArticles || [],
      readingProgress: data.readingProgress || {},
      theme: data.theme ?? null,
      fontSize: data.fontSize ?? null,
      fontFamily: data.fontFamily ?? null,
      lineHeight: data.lineHeight ?? null,
      paragraphSpacing: data.paragraphSpacing ?? null,
      readingPadding: data.readingPadding ?? null,
      reducedMotion: data.reducedMotion ?? null,
      accordionAutoClose: data.accordionAutoClose ?? null,
    };
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to import user profile:', error);
    }
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.message.includes('Invalid JSON'))
    ) {
      throw new Error('Invalid JSON file. Please ensure the file is a valid JSON export.');
    }
    throw error;
  }
}

/**
 * Read file content from a File object (web) or file URI (mobile)
 */
export async function readFileContent(file: File | { uri: string }): Promise<string> {
  if (Platform.OS === 'web') {
    // Web: Read File object
    if (!(file instanceof File)) {
      throw new Error('Expected File object on web platform');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  } else {
    // Mobile: Read from file URI using FileSystem
    if (!hasUri(file)) {
      throw new Error('Expected file object with uri property on mobile platform');
    }
    try {
      // UTF-8 is the default encoding
      const content = await FileSystem.readAsStringAsync(file.uri);
      return content;
    } catch (error) {
      throw new Error('Failed to read file');
    }
  }
}
