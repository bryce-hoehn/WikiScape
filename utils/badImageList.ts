import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { parseHtml, selectAll, textContent } from '@/utils/articleParsing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BAD_IMAGE_LIST_KEY = 'wikipedia_bad_image_list';
const BAD_IMAGE_LIST_CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours (1 day) - cache is updated once per day
const BAD_IMAGE_LIST_TITLE = 'MediaWiki:Bad_image_list';

interface BadImageListCache {
  filenames: string[]; // Stored as array for JSON serialization
  timestamp: number;
}

/**
 * Normalize filename for comparison (case-insensitive, handle URL encoding, spaces/underscores)
 * Wikipedia filenames can have spaces, but URLs often use underscores or %20
 */
function normalizeFilename(filename: string): string {
  try {
    let normalized = decodeURIComponent(filename);
    normalized = normalized.replace(/_/g, ' ');
    normalized = normalized.toLowerCase().trim();
    normalized = normalized.replace(/%20/g, ' ').replace(/%2F/g, '/');
    return normalized;
  } catch (e) {
    return filename.replace(/_/g, ' ').toLowerCase().trim();
  }
}

/**
 * Fetch and parse the Bad image list from Wikipedia HTML
 * Uses the same axiosInstance and Core API as article fetching for consistency
 * Ignores exceptions - all bad images are filtered regardless of article context
 */
async function fetchBadImageList(): Promise<Set<string>> {
  try {
    // Use Core API for HTML content, same as article fetching
    const response = await axiosInstance.get<string>(
      `/page/${encodeURIComponent(BAD_IMAGE_LIST_TITLE)}/html`,
      {
        baseURL: WIKIPEDIA_API_CONFIG.CORE_API_BASE_URL,
        headers: {
          Accept: 'text/html',
        },
        // Uses centralized timeout from axiosInstance (15s)
      }
    );

    const html = response.data;
    const filenames = new Set<string>();
    const doc = parseHtml(html);
    const listItems = selectAll('li', doc.children);

    for (const listItem of listItems) {
      const fileLinks = selectAll('a[href*="File:"]', listItem);

      if (fileLinks.length === 0) {
        continue;
      }

      const mainFileLink = fileLinks[0];
      const linkAttribs = (mainFileLink as any).attribs || {};
      let filename: string | null = null;

      if (linkAttribs.title && typeof linkAttribs.title === 'string') {
        if (linkAttribs.title.startsWith('File:')) {
          filename = linkAttribs.title.substring(5);
        } else {
          filename = linkAttribs.title;
        }
      }

      if (!filename && linkAttribs.href && typeof linkAttribs.href === 'string') {
        const hrefParts = linkAttribs.href.split('File:');
        if (hrefParts.length > 1) {
          const filePart = hrefParts[1].split('?')[0].split('#')[0];
          if (filePart) {
            filename = filePart;
          }
        }
      }

      if (!filename) {
        const linkText = textContent(mainFileLink);
        if (linkText) {
          if (linkText.startsWith('File:')) {
            filename = linkText.substring(5).trim();
          } else {
            filename = linkText.trim();
          }
        }
      }

      if (!filename) {
        continue;
      }

      const normalized = normalizeFilename(filename);
      if (normalized) {
        filenames.add(normalized);
      }
    }

    return filenames;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[NSFW Filter] Failed to fetch Bad image list:', error);
    }
    throw error;
  }
}

/**
 * Get the cached Bad image list or fetch a new one
 * The list is cached in AsyncStorage and only updated once per day (24 hours)
 * This reduces API calls and improves performance
 */
async function getBadImageList(): Promise<Set<string>> {
  try {
    const cached = await AsyncStorage.getItem(BAD_IMAGE_LIST_KEY);
    if (cached) {
      try {
        const parsed: BadImageListCache = JSON.parse(cached);

        // Validate cache structure
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          !parsed.filenames ||
          !Array.isArray(parsed.filenames) ||
          typeof parsed.timestamp !== 'number'
        ) {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.error('Invalid bad image list cache format');
          }
          // Clear corrupted cache
          await AsyncStorage.removeItem(BAD_IMAGE_LIST_KEY);
        } else {
          const now = Date.now();
          if (now - parsed.timestamp < BAD_IMAGE_LIST_CACHE_TIME) {
            return new Set(parsed.filenames || []);
          }
        }
      } catch (parseError) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Failed to parse bad image list cache:', parseError);
        }
        // Clear corrupted cache
        await AsyncStorage.removeItem(BAD_IMAGE_LIST_KEY);
      }
    }

    const filenames = await fetchBadImageList();
    const cacheData: BadImageListCache = {
      filenames: Array.from(filenames),
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(BAD_IMAGE_LIST_KEY, JSON.stringify(cacheData));
    return filenames;
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to get Bad image list:', error);
    }
    return new Set();
  }
}

const extractFilenameFromFilePrefix = (url: string): string | null => {
  const fileMatch = url.match(/File:([^/?#]+)/i);
  return fileMatch ? fileMatch[1] : null;
};

const extractFilenameFromThumbnailUrl = (url: string): string | null => {
  const patterns = [
    /\/commons\/thumb\/[^/]+\/([^/]+\.(jpg|jpeg|png|gif|webp|svg))\/\d+px-/i,
    /\/wikipedia\/[^/]+\/thumb\/[^/]+\/([^/]+\.(jpg|jpeg|png|gif|webp|svg))\/\d+px-/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractFilenameFromUrl = (url: string): string => {
  const urlMatch = url.match(/\/([^/?#]+\.(jpg|jpeg|png|gif|webp|svg))(?:\?|#|$)/i);
  if (urlMatch) {
    return urlMatch[1].replace(/^\d+px-/, '');
  }

  const parts = url.split('/');
  const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0];
  return lastPart.replace(/^\d+px-/, '');
};

/**
 * Extract filename from various URL formats
 */
const extractFilename = (imageUrl: string): string => {
  const filePrefixMatch = extractFilenameFromFilePrefix(imageUrl);
  if (filePrefixMatch) return filePrefixMatch;

  const thumbnailMatch = extractFilenameFromThumbnailUrl(imageUrl);
  if (thumbnailMatch) return thumbnailMatch;

  return extractFilenameFromUrl(imageUrl);
};

/**
 * Check if an image filename is in the Bad image list
 * All bad images are filtered regardless of article context (exceptions are ignored)
 * @param imageUrl - The image URL or filename
 */
export async function isBadImage(imageUrl: string): Promise<boolean> {
  try {
    const filenames = await getBadImageList();
    const filename = extractFilename(imageUrl);
    const normalized = normalizeFilename(filename);
    return filenames.has(normalized);
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Error checking bad image list:', error);
    }
    return false;
  }
}

/**
 * Clear the cached Bad image list (useful for testing or forcing refresh)
 */
export async function clearBadImageListCache(): Promise<void> {
  await AsyncStorage.removeItem(BAD_IMAGE_LIST_KEY);
}
