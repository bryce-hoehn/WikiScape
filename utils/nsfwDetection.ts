/**
 * Utility functions for detecting NSFW/sensitive content
 * Uses both Wikipedia's official Bad image list and nsfwjs ML detection
 * - Wikipedia Bad image list: https://en.wikipedia.org/wiki/MediaWiki:Bad_image_list
 * - NSFWJS ML detection: https://github.com/infinitered/nsfwjs (web only)
 */

import { Platform } from 'react-native';
import { isBadImage } from './badImageList';
import { isNsfwImageWithML } from './nsfwjsDetection';

// Result cache to avoid redundant checks
interface CacheEntry {
  isNsfw: boolean;
  timestamp: number;
}

const resultCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory issues

/**
 * Check if an image is NSFW using both Wikipedia's Bad image list and nsfwjs ML detection
 * Returns true if EITHER method detects the image as NSFW
 * - Wikipedia Bad image list: Fast, cached, official Wikipedia list
 * - NSFWJS ML detection: Slower but catches images not in the official list
 *
 * Performance optimizations:
 * - Result caching (24h TTL) to avoid redundant checks
 * - Early exit: Skip ML check if Bad image list already found it
 * - Cache size limit to prevent memory issues
 *
 * All bad images are filtered regardless of article context (exceptions are ignored)
 * @param imageUrl - The image URL or filename
 * @returns Promise<boolean> - true if image is NSFW according to either method
 */
export async function isNsfwImage(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;

  // Check cache first
  const cached = resultCache.get(imageUrl);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_TTL) {
      return cached.isNsfw;
    } else {
      // Expired entry, remove it
      resultCache.delete(imageUrl);
    }
  }

  // Step 1: Check Wikipedia's Bad image list first (fast, cached)
  // This catches ~80% of NSFW images and is very fast
  // We MUST wait for this to complete before proceeding to ML check
  const isBadImageResult = await isBadImage(imageUrl);

  // Step 2: If Bad image list found it, early exit (no ML check needed)
  if (isBadImageResult) {
    // Early exit: Bad image list found it, no need for ML check
    // Cache the result
    setCacheResult(imageUrl, true);
    return true;
  }

  // Step 3: Bad image list didn't find it, NOW check with ML detection (web only)
  // IMPORTANT: ML check only runs AFTER Bad image list check has fully completed
  // This is slower but catches images not in the official list
  // We explicitly await the Bad image list result above before starting ML
  // ML detection is only available on web - React Native uses bad image list only
  if (Platform.OS === 'web') {
    try {
      const isMlNsfw = await isNsfwImageWithML(imageUrl);
      const result = isMlNsfw;

      // Cache the result
      setCacheResult(imageUrl, result);
      return result;
    } catch (error) {
      // If ML detection fails, fall back to Bad image list result (false)
      const result = false;
      setCacheResult(imageUrl, result);
      return result;
    }
  } else {
    // On React Native, only use bad image list (no ML detection)
    setCacheResult(imageUrl, false);
    return false;
  }
}

/**
 * Cache a result for an image URL
 * Implements LRU-like eviction when cache exceeds MAX_CACHE_SIZE
 */
function setCacheResult(imageUrl: string, isNsfw: boolean): void {
  // If cache is too large, remove oldest entries
  if (resultCache.size >= MAX_CACHE_SIZE) {
    // Remove 20% of oldest entries (simple eviction strategy)
    const entries = Array.from(resultCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    for (let i = 0; i < toRemove; i++) {
      resultCache.delete(entries[i][0]);
    }
  }

  resultCache.set(imageUrl, {
    isNsfw,
    timestamp: Date.now(),
  });
}

/**
 * Clear the result cache (useful for testing or memory management)
 */
export function clearNsfwResultCache(): void {
  resultCache.clear();
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getNsfwCacheStats(): { size: number; maxSize: number } {
  return {
    size: resultCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}
