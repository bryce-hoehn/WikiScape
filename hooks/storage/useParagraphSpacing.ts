import { useCallback, useMemo } from 'react';
import useAsyncStorage from './useAsyncStorage';

const PARAGRAPH_SPACING_KEY = 'articleParagraphSpacing';
const DEFAULT_SPACING = 16;
const MIN_SPACING = 0;
const MAX_SPACING = 32;
const STEP = 4;

export default function useParagraphSpacing() {
  const {
    value: paragraphSpacing,
    isLoading,
    updateValue,
  } = useAsyncStorage<number>(PARAGRAPH_SPACING_KEY, {
    defaultValue: DEFAULT_SPACING,
    validator: (val) => !isNaN(val) && val >= MIN_SPACING && val <= MAX_SPACING,
    serializer: (val) => String(val),
    deserializer: (val) => parseInt(val, 10),
  });

  const updateParagraphSpacing = useCallback(
    async (newSpacing: number) => {
      const clampedSpacing = Math.max(MIN_SPACING, Math.min(MAX_SPACING, newSpacing));
      await updateValue(clampedSpacing);
    },
    [updateValue]
  );

  const increaseParagraphSpacing = useCallback(
    () => updateParagraphSpacing(paragraphSpacing + STEP),
    [paragraphSpacing, updateParagraphSpacing]
  );
  const decreaseParagraphSpacing = useCallback(
    () => updateParagraphSpacing(paragraphSpacing - STEP),
    [paragraphSpacing, updateParagraphSpacing]
  );
  const resetParagraphSpacing = useCallback(
    () => updateParagraphSpacing(DEFAULT_SPACING),
    [updateParagraphSpacing]
  );

  return useMemo(
    () => ({
      paragraphSpacing,
      isLoading,
      updateParagraphSpacing,
      increaseParagraphSpacing,
      decreaseParagraphSpacing,
      resetParagraphSpacing,
      canIncrease: paragraphSpacing < MAX_SPACING,
      canDecrease: paragraphSpacing > MIN_SPACING,
    }),
    [
      paragraphSpacing,
      isLoading,
      updateParagraphSpacing,
      increaseParagraphSpacing,
      decreaseParagraphSpacing,
      resetParagraphSpacing,
    ]
  );
}
