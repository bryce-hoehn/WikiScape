import { useCallback, useMemo } from 'react';
import useAsyncStorage from './useAsyncStorage';

const READING_WIDTH_KEY = 'articleReadingWidth';
const DEFAULT_WIDTH = 800;
const MIN_WIDTH = 400;
const MAX_WIDTH = 1200;
const STEP = 50;

export default function useReadingWidth() {
  const {
    value: readingWidth,
    isLoading,
    updateValue,
  } = useAsyncStorage<number>(READING_WIDTH_KEY, {
    defaultValue: DEFAULT_WIDTH,
    validator: (val) => !isNaN(val) && val >= MIN_WIDTH && val <= MAX_WIDTH,
    serializer: (val) => String(val),
    deserializer: (val) => parseInt(val, 10),
  });

  const updateReadingWidth = useCallback(
    async (newWidth: number) => {
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      await updateValue(clampedWidth);
    },
    [updateValue]
  );

  const increaseReadingWidth = useCallback(
    () => updateReadingWidth(readingWidth + STEP),
    [readingWidth, updateReadingWidth]
  );
  const decreaseReadingWidth = useCallback(
    () => updateReadingWidth(readingWidth - STEP),
    [readingWidth, updateReadingWidth]
  );
  const resetReadingWidth = useCallback(
    () => updateReadingWidth(DEFAULT_WIDTH),
    [updateReadingWidth]
  );

  return useMemo(
    () => ({
      readingWidth,
      isLoading,
      updateReadingWidth,
      increaseReadingWidth,
      decreaseReadingWidth,
      resetReadingWidth,
      canIncrease: readingWidth < MAX_WIDTH,
      canDecrease: readingWidth > MIN_WIDTH,
    }),
    [
      readingWidth,
      isLoading,
      updateReadingWidth,
      increaseReadingWidth,
      decreaseReadingWidth,
      resetReadingWidth,
    ]
  );
}
