/**
 * Motion constants aligned with Material Design 3
 * 
 * Duration values follow MD3's standard motion durations:
 * - Standard duration: 150ms (for most UI transitions)
 * - Emphasized duration: 200ms (for important transitions)
 * - Emphasized decelerated duration: 400ms (for complex animations)
 * 
 * Reference: https://m3.material.io/foundations/motion
 */

export const MOTION = {
  // Standard duration (150ms) - for most UI transitions
  // MD3: Standard duration for typical UI transitions
  // Reference: https://m3.material.io/foundations/motion
  durationShort: 150,

  // Emphasized duration (200ms) - for important transitions
  // MD3: Emphasized duration for important UI transitions
  // Reference: https://m3.material.io/foundations/motion
  durationMedium: 200,

  // Emphasized decelerated duration (400ms) - for complex animations
  // MD3: Emphasized decelerated duration for complex animations
  // Reference: https://m3.material.io/foundations/motion
  durationLong: 400,

  // Shimmer duration (1500ms total cycle) - for skeleton loading animations
  // MD3: Recommended ~1500ms for shimmer effects (750ms per segment)
  // Reference: https://m3.material.io/foundations/motion
  durationShimmer: 1500,

  // Stagger delay (20ms) - for list/grid item cascading animations
  // MD3: Recommended no more than 20ms between items, with max 100ms total
  // Reference: https://m3.material.io/foundations/motion
  staggerDelay: 20,

  // Maximum items to stagger - limits animation overhead
  // MD3: Recommended limiting stagger to first 10-15 items
  // Reference: https://m3.material.io/foundations/motion
  staggerLimit: 10,
} as const;

/**
 * Material Design 3 Standard Easing Curves
 * 
 * MD3 uses cubic-bezier curves for motion:
 * - Standard (emphasized): [0.4, 0.0, 0.2, 1] - for most animations
 * - Decelerate: [0.0, 0.0, 0.2, 1] - for elements entering the screen
 * - Accelerate: [0.4, 0.0, 1, 1] - for elements exiting the screen
 * 
 * Reference: https://m3.material.io/foundations/motion
 */
export const EASING = {
  // Standard easing (emphasized) - for most animations
  // MD3: Standard cubic-bezier curve for typical UI transitions
  // Used when elements enter/exit the screen
  // Reference: https://m3.material.io/foundations/motion
  standard: [0.4, 0.0, 0.2, 1] as const,

  // Decelerate easing - for elements entering the screen
  // MD3: Decelerate cubic-bezier curve for entering animations
  // Elements quickly reach their final position
  // Reference: https://m3.material.io/foundations/motion
  decelerate: [0.0, 0.0, 0.2, 1] as const,

  // Accelerate easing - for elements exiting the screen
  // MD3: Accelerate cubic-bezier curve for exiting animations
  // Elements quickly leave their starting position
  // Reference: https://m3.material.io/foundations/motion
  accelerate: [0.4, 0.0, 1, 1] as const,
} as const;

/**
 * Generates hover styles that respect reduced motion preferences
 * Background color changes are always applied, but animations (transforms, transitions)
 * are disabled when reducedMotion is true
 *
 * @param isHovered - Whether the element is currently hovered
 * @param reducedMotion - Whether reduced motion is enabled
 * @param options - Optional configuration for hover effects
 * @returns Style object with hover effects (web platform only)
 */
export function getHoverStyles(
  isHovered: boolean,
  reducedMotion: boolean,
  options?: {
    scale?: number;
    transitionProperty?: string;
  }
): Record<string, any> {
  const scale = options?.scale ?? 1.01;
  const transitionProperty = options?.transitionProperty ?? 'all';

  // Always return empty object for non-web platforms or when not hovered
  // (background color changes should be handled separately in component styles)
  if (!isHovered) {
    return {};
  }

  // When reduced motion is enabled, only return cursor (no animations)
  if (reducedMotion) {
    return {
      cursor: 'pointer',
    };
  }

  // When reduced motion is disabled, include full hover animations
  return {
    transition: `${transitionProperty} ${MOTION.durationShort}ms cubic-bezier(${EASING.standard.join(', ')})`,
    transform: [{ scale }],
    cursor: 'pointer',
  };
}
