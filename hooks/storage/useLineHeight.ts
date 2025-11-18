import { useCallback, useMemo } from 'react';
import useAsyncStorage from './useAsyncStorage';

const LINE_HEIGHT_KEY = 'articleLineHeight';
const DEFAULT_LINE_HEIGHT = 1.6;
const MIN_LINE_HEIGHT = 1.0;
const MAX_LINE_HEIGHT = 2.5;
const STEP = 0.1;

export default function useLineHeight() {
  const {
    value: lineHeight,
    isLoading,
    updateValue,
  } = useAsyncStorage<number>(LINE_HEIGHT_KEY, {
    defaultValue: DEFAULT_LINE_HEIGHT,
    validator: (val) => !isNaN(val) && val >= MIN_LINE_HEIGHT && val <= MAX_LINE_HEIGHT,
    serializer: (val) => String(val),
    deserializer: (val) => parseFloat(val),
  });

  const updateLineHeight = useCallback(
    async (newHeight: number) => {
      const clampedHeight = Math.max(MIN_LINE_HEIGHT, Math.min(MAX_LINE_HEIGHT, newHeight));
      await updateValue(clampedHeight);
    },
    [updateValue]
  );

  const increaseLineHeight = useCallback(
    () => updateLineHeight(lineHeight + STEP),
    [lineHeight, updateLineHeight]
  );
  const decreaseLineHeight = useCallback(
    () => updateLineHeight(lineHeight - STEP),
    [lineHeight, updateLineHeight]
  );
  const resetLineHeight = useCallback(
    () => updateLineHeight(DEFAULT_LINE_HEIGHT),
    [updateLineHeight]
  );

  return useMemo(
    () => ({
      lineHeight,
      isLoading,
      updateLineHeight,
      increaseLineHeight,
      decreaseLineHeight,
      resetLineHeight,
      canIncrease: lineHeight < MAX_LINE_HEIGHT,
      canDecrease: lineHeight > MIN_LINE_HEIGHT,
    }),
    [
      lineHeight,
      isLoading,
      updateLineHeight,
      increaseLineHeight,
      decreaseLineHeight,
      resetLineHeight,
    ]
  );
}
