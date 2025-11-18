import { Share } from 'react-native';
import { copyToClipboard } from './clipboard';

/**
 * Share a Wikipedia article using the native share dialog
 *
 * Opens the system share sheet allowing users to share the article URL
 * via any installed app (email, messaging, social media, etc.).
 *
 * @param title - Article title
 * @param description - Article description (optional, currently unused)
 * @param url - Article URL (optional, will generate from title if not provided)
 * @throws Error if sharing fails
 *
 * @example
 * ```ts
 * await shareArticle("Albert Einstein", "German physicist", "https://en.wikipedia.org/wiki/Albert_Einstein");
 * ```
 */
export const shareArticle = async (
  title: string,
  description?: string,
  url?: string
): Promise<void> => {
  try {
    const articleUrl = url || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

    await Share.share({
      message: articleUrl,
      title: `Share "${title}"`,
    });
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Error sharing article:', error);
    }
    throw error;
  }
};

/**
 * Copy article URL to clipboard
 *
 * Copies the Wikipedia article URL to the device clipboard for easy sharing.
 *
 * @param title - Article title
 * @param url - Article URL (optional, will generate from title if not provided)
 *
 * @example
 * ```ts
 * await copyArticleUrl("Albert Einstein");
 * // URL copied to clipboard: "https://en.wikipedia.org/wiki/Albert_Einstein"
 * ```
 */
export const copyArticleUrl = async (title: string, url?: string): Promise<void> => {
  const articleUrl = url || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  await copyToClipboard(articleUrl);
};

/**
 * Check if sharing is available on the current device
 *
 * @returns Always returns true (React Native Share is always available)
 *
 * @example
 * ```ts
 * if (await isSharingAvailable()) {
 *   await shareArticle("Albert Einstein");
 * }
 * ```
 */
export const isSharingAvailable = async (): Promise<boolean> => {
  return true; // React Native Share is always available
};
