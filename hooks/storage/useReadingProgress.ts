import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '../../utils/debounce';

export interface ReadingProgress {
  progress: number; // 0-100 percentage
  lastReadAt: string; // ISO timestamp
  expandedSections?: string[]; // IDs of sections that were expanded
}

const READING_PROGRESS_KEY = 'reading_progress';

/**
 * Hook for managing reading progress for articles
 *
 * Tracks scroll position as a percentage (0-100) for each article, with
 * automatic persistence to AsyncStorage. Progress is saved with debouncing
 * to avoid excessive writes. Also tracks which sections were expanded.
 *
 * @returns Object containing:
 *   - `getProgress`: Function to get progress for a specific article
 *   - `saveProgress`: Function to save progress for an article
 *   - `clearProgress`: Function to clear progress for an article
 *   - `cleanupOldProgress`: Function to remove progress for articles not in a given list
 *   - `loading`: Whether the initial load is in progress
 *
 * @example
 * ```tsx
 * const { saveProgress, getProgress } = useReadingProgress();
 *
 * // Save progress
 * await saveProgress("Albert Einstein", 45, ["section-1", "section-2"]);
 *
 * // Get progress
 * const progress = getProgress("Albert Einstein");
 * console.log(`Read ${progress?.progress}%`);
 * ```
 */
export default function useReadingProgress() {
  const [progressMap, setProgressMap] = useState<Map<string, ReadingProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const pendingSaveRef = useRef<Map<string, ReadingProgress> | null>(null);

  // Load progress from storage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(READING_PROGRESS_KEY);
        if (stored) {
          try {
            const data = JSON.parse(stored);
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
              // Clear corrupted data
              await AsyncStorage.removeItem(READING_PROGRESS_KEY);
              return;
            }

            const map = new Map<string, ReadingProgress>();

            Object.entries(data).forEach(([title, progress]) => {
              // Validate ReadingProgress structure
              if (
                progress &&
                typeof progress === 'object' &&
                'progress' in progress &&
                'lastReadAt' in progress
              ) {
                map.set(title, progress as ReadingProgress);
              }
            });

            setProgressMap(map);
          } catch (parseError) {
            // Clear corrupted data
            await AsyncStorage.removeItem(READING_PROGRESS_KEY);
          }
        }
      } catch (error) {
        // Silently handle load errors
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  // Debounced save function - persists progress to AsyncStorage
  const debouncedSave = useRef(
    debounce(async (progressData: Map<string, ReadingProgress>) => {
      try {
        // Convert Map to object for storage
        const obj: Record<string, ReadingProgress> = {};
        progressData.forEach((value, key) => {
          obj[key] = value;
        });
        await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(obj));
      } catch (error) {
        // Silently handle save errors
      }
    }, 1000) // 1 second debounce
  ).current;

  // Save progress to storage with debouncing to avoid excessive writes
  const saveProgress = useCallback(
    async (title: string, progress: number, expandedSections?: string[]) => {
      if (!title || progress < 0 || progress > 100) return;

      const readingProgress: ReadingProgress = {
        progress: Math.round(progress),
        lastReadAt: new Date().toISOString(),
        expandedSections: expandedSections || [],
      };

      const newMap = new Map(progressMap);
      newMap.set(title, readingProgress);
      setProgressMap(newMap);

      // Store pending save
      pendingSaveRef.current = newMap;

      // Debounce: Save after 1 second of no updates
      debouncedSave(newMap);
    },
    [progressMap, debouncedSave]
  );

  // Save pending progress on unmount (flush debounced function)
  useEffect(() => {
    return () => {
      // Flush any pending debounced saves
      debouncedSave.flush();
      // Save immediately on unmount if there's pending data
      if (pendingSaveRef.current) {
        const obj: Record<string, ReadingProgress> = {};
        pendingSaveRef.current.forEach((value, key) => {
          obj[key] = value;
        });
        AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(obj)).catch(() => {
          // Silently handle save errors on unmount
        });
      }
    };
  }, []);

  // Get progress for a specific article
  const getProgress = useCallback(
    (title: string): number => {
      const progress = progressMap.get(title);
      return progress?.progress || 0;
    },
    [progressMap]
  );

  // Get full progress object
  const getProgressData = useCallback(
    (title: string): ReadingProgress | null => {
      return progressMap.get(title) || null;
    },
    [progressMap]
  );

  // Clear progress for an article
  const clearProgress = useCallback(
    async (title: string) => {
      const newMap = new Map(progressMap);
      newMap.delete(title);
      setProgressMap(newMap);

      try {
        const obj: Record<string, ReadingProgress> = {};
        newMap.forEach((value, key) => {
          obj[key] = value;
        });
        await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(obj));
      } catch (error) {
        // Silently handle clear errors
      }
    },
    [progressMap]
  );

  // Clear all progress
  const clearAllProgress = useCallback(async () => {
    setProgressMap(new Map());
    try {
      await AsyncStorage.removeItem(READING_PROGRESS_KEY);
    } catch (error) {
      // Silently handle clear errors
    }
  }, []);

  /**
   * Cleanup old reading progress data
   * Removes progress for articles that:
   * - Are finished (progress >= 100) AND not visited in 90 days
   * - Have not been opened in 90 days
   * - Exceed the limit of 200 most recent articles
   * Bookmarks bypass these restrictions and are always kept
   */
  const cleanupOldProgress = useCallback(
    async (bookmarkedTitles: string[] = []) => {
      try {
        const now = Date.now();
        const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
        const bookmarkedSet = new Set(bookmarkedTitles);

        // Convert to array and sort by lastReadAt (most recent first)
        const entries = Array.from(progressMap.entries()).map(([title, progress]) => ({
          title,
          ...progress,
        }));

        // Sort by lastReadAt descending (most recent first)
        entries.sort((a, b) => {
          const timeA = new Date(a.lastReadAt).getTime();
          const timeB = new Date(b.lastReadAt).getTime();
          return timeB - timeA;
        });

        const newMap = new Map<string, ReadingProgress>();
        let keptCount = 0;

        for (const entry of entries) {
          const { title, ...progress } = entry;
          const lastReadTime = new Date(entry.lastReadAt).getTime();
          const isBookmarked = bookmarkedSet.has(title);
          const isFinished = entry.progress >= 100;
          const isOld = lastReadTime < ninetyDaysAgo;

          // Keep if:
          // 1. Bookmarked (always keep)
          // 2. Not finished and not old (keep active reading)
          // 3. Finished but visited recently (within 90 days)
          // 4. Within the 200 most recent limit
          if (isBookmarked) {
            newMap.set(title, progress);
          } else if (isFinished && isOld) {
            // Finished and old - remove
            continue;
          } else if (isOld) {
            // Not visited in 90 days - remove
            continue;
          } else if (keptCount >= 200) {
            // Exceeded limit - remove
            continue;
          } else {
            // Keep
            newMap.set(title, progress);
            keptCount++;
          }
        }

        setProgressMap(newMap);

        // Save cleaned data
        if (newMap.size !== progressMap.size) {
          const obj: Record<string, ReadingProgress> = {};
          newMap.forEach((value, key) => {
            obj[key] = value;
          });
          await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(obj));
        }
      } catch (error) {
        // Silently handle cleanup errors
      }
    },
    [progressMap]
  );

  return {
    progressMap,
    loading,
    saveProgress,
    getProgress,
    getProgressData,
    clearProgress,
    clearAllProgress,
    cleanupOldProgress,
  };
}
