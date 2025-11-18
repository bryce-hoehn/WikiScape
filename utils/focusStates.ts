/**
 * Material Design 3 Focus State Utilities
 * Provides standardized focus indicators for interactive components
 * 
 * References:
 * - Material Design 3 Principles: https://m3.material.io/foundations/overview/principles
 * - Interaction States: https://m3.material.io/foundations/interaction/states/applying-states
 */

import { Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';

/**
 * MD3 Focus Ring Specifications:
 * Based on Material Design 3 principles and accessibility best practices:
 * - Width: 2px (minimum for accessibility compliance)
 * - Color: Primary color (ensures visibility and brand consistency)
 * - Offset: 2px from element edge (prevents overlap with element border)
 * - Border radius: Matches element's border radius (maintains visual consistency)
 * 
 * Note: These specifications follow WCAG 2.2 guidelines for focus indicators
 * (minimum 2px thickness, 3:1 contrast ratio) and align with MD3 design principles.
 */

export interface FocusStyleOptions {
  theme: MD3Theme;
  borderRadius?: number;
  offset?: number;
  width?: number;
}

/**
 * Get MD3-compliant focus styles for web
 * Returns CSS styles that can be applied via style element or inline styles
 */
export function getMD3FocusStyles(options: FocusStyleOptions): string {
  const { theme, borderRadius = 0, offset = 2, width = 2 } = options;
  
  return `
    [data-focusable="true"]:focus-visible {
      outline: ${width}px solid ${theme.colors.primary};
      outline-offset: ${offset}px;
      border-radius: ${borderRadius}px;
    }
    
    /* Remove default focus outline for better MD3 compliance */
    [data-focusable="true"]:focus:not(:focus-visible) {
      outline: none;
    }
  `;
}

/**
 * Apply MD3 focus styles to an element (web only)
 * Creates or updates a shared style element in the document head
 */
export function applyMD3FocusStyles(
  elementRef: React.RefObject<any>,
  options: FocusStyleOptions,
  styleId: string = 'md3-focus-styles'
): () => void {
  if (Platform.OS !== 'web' || !elementRef.current) {
    return () => {}; // No-op cleanup
  }

  const element = elementRef.current as any;
  
  // Get or create the shared style element
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  // Update the style content
  styleElement.textContent = getMD3FocusStyles(options);
  
  // Mark element as focusable
  element.setAttribute('data-focusable', 'true');
  
  return () => {
    // Style element is shared globally, no per-component cleanup needed
  };
}

/**
 * Get focus style props for React Native components
 * For native platforms, focus is handled by the platform
 */
export function getFocusProps(accessible: boolean = true) {
  return {
    accessible,
    accessibilityRole: 'button' as const,
  };
}

