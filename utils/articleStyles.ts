import { TextStyle } from 'react-native';
import { MD3Theme } from 'react-native-paper';

/**
 * Generates the style map passed to `RenderHtml` based on the current theme.
 * This is a pure function that takes a theme parameter and returns styles.
 *
 * @param theme The theme object from `react-native-paper`.
 * @returns An object where keys are HTML tag names and values are style objects.
 */
export function getArticleTagStyles(theme: MD3Theme): Record<string, TextStyle> {
  return {
    body: {
      // Remove fixed font sizes to allow baseStyle scaling
      color: theme.colors.onSurface,
      letterSpacing: 0.15,
    },
    h1: {
      fontWeight: '700' as TextStyle['fontWeight'],
      marginTop: 24,
      marginBottom: 16,
      color: theme.colors.onSurface,
      letterSpacing: 0.25,
    },
    h2: {
      fontWeight: '700' as TextStyle['fontWeight'],
      marginTop: 20,
      marginBottom: 12,
      color: theme.colors.onSurface,
      letterSpacing: 0.2,
    },
    h3: {
      fontWeight: '600' as TextStyle['fontWeight'],
      marginTop: 16,
      marginBottom: 8,
      color: theme.colors.onSurface,
      letterSpacing: 0.15,
    },
    h4: {
      fontWeight: '600' as TextStyle['fontWeight'],
      marginTop: 14,
      marginBottom: 6,
      color: theme.colors.onSurface,
      letterSpacing: 0.1,
    },
    h5: {
      fontWeight: '600' as TextStyle['fontWeight'],
      marginTop: 12,
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
    h6: {
      fontWeight: '600' as TextStyle['fontWeight'],
      marginTop: 10,
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
    p: {
      marginTop: 12,
      marginBottom: 12,
      color: theme.colors.onSurface,
      letterSpacing: 0.15,
    },
    a: {
      color: theme.colors.primary,
      textDecorationLine: 'none',
    },
    ul: {
      marginVertical: 12,
      marginLeft: 16,
    },
    ol: {
      marginVertical: 12,
      marginLeft: 16,
    },
    li: {
      marginVertical: 4,
      color: theme.colors.onSurface,
      lineHeight: 22,
    },
    table: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      marginVertical: 16,
      overflow: 'hidden',
      width: '100%',
    },
    th: {
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.onSurface,
      fontWeight: '700' as TextStyle['fontWeight'],
      paddingVertical: 12,
      paddingHorizontal: 10,
      textAlign: 'center' as TextStyle['textAlign'],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    td: {
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      color: theme.colors.onSurface,
    },
    tr: {
      // Ensure proper row behavior
      minHeight: 44,
    },
    // Improved code styling
    code: {
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
    pre: {
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.onSurfaceVariant,
      padding: 16,
      borderRadius: 8,
      fontFamily: 'monospace',
      overflow: 'scroll',
      marginVertical: 12,
    },
    // Blockquote styling
    blockquote: {
      backgroundColor: theme.colors.surfaceVariant,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginVertical: 12,
      marginLeft: 16,
      fontStyle: 'italic',
      color: theme.colors.onSurfaceVariant,
    },
    // Image styling
    img: {
      maxWidth: '100%',
      height: 'auto',
    }
  };
}

/**
 * Generates class-based styles for Wikipedia-specific elements
 *
 * @param theme The theme object from `react-native-paper`.
 * @returns An object where keys are CSS class names and values are style objects.
 */
export function getArticleClassStyles(theme: MD3Theme): Record<string, TextStyle> {
  return {
    // Image containers
    thumbinner: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    multiimageinner: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    // Wikipedia-specific classes for better theme adaptation
    infobox: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 12,
      marginVertical: 16,
    },
    reference: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontStyle: 'italic',
    },
    external: {
      color: theme.colors.primary,
    },
    // Table improvements for mobile
    wikitable: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
    },
    // Navigation boxes
    navbox: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 12,
      marginVertical: 16,
    },
    // Citation styles
    citation: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    // Mobile-optimized table cells
    'mobile-table-cell': {
      minWidth: 80,
      paddingVertical: 8,
      paddingHorizontal: 6,
    }
  };
}