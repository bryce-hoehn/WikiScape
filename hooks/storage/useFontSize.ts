import { useCallback, useMemo } from 'react';
import useAsyncStorage from './useAsyncStorage';

const FONT_SIZE_KEY = 'articleFontSize';
export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 24;

export default function useFontSize() {
  const {
    value: fontSize,
    isLoading,
    updateValue,
  } = useAsyncStorage<number>(FONT_SIZE_KEY, {
    defaultValue: DEFAULT_FONT_SIZE,
    validator: (val) => !isNaN(val) && val >= MIN_FONT_SIZE && val <= MAX_FONT_SIZE,
    serializer: (val) => String(val),
    deserializer: (val) => parseInt(val, 10),
  });

  const updateFontSize = useCallback(
    async (newSize: number) => {
      const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newSize));
      await updateValue(clampedSize);
    },
    [updateValue]
  );

  const increaseFontSize = useCallback(
    () => updateFontSize(fontSize + 2),
    [fontSize, updateFontSize]
  );
  const decreaseFontSize = useCallback(
    () => updateFontSize(fontSize - 2),
    [fontSize, updateFontSize]
  );
  const resetFontSize = useCallback(() => updateFontSize(DEFAULT_FONT_SIZE), [updateFontSize]);

  return useMemo(
    () => ({
      fontSize,
      isLoading,
      updateFontSize,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
      canIncrease: fontSize < MAX_FONT_SIZE,
      canDecrease: fontSize > MIN_FONT_SIZE,
    }),
    [fontSize, isLoading, updateFontSize, increaseFontSize, decreaseFontSize, resetFontSize]
  );
}
