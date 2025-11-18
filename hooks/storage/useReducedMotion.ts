import useAsyncStorage from './useAsyncStorage';

const REDUCED_MOTION_KEY = '@wikiflow:reducedMotion';
const DEFAULT_REDUCED_MOTION = false;

/**
 * Hook for managing reduced motion preference
 * Respects WCAG 2.2 2.3.3 (Animation from Interactions)
 * Allows users to disable non-essential animations
 */
export default function useReducedMotion() {
  const {
    value: reducedMotion,
    isLoading,
    updateValue,
  } = useAsyncStorage<boolean>(REDUCED_MOTION_KEY, {
    defaultValue: DEFAULT_REDUCED_MOTION,
  });

  return {
    reducedMotion,
    setReducedMotion: updateValue,
    isLoading,
  };
}
