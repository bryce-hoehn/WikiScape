import { Platform, TextStyle } from 'react-native';
import { type MD3Theme } from 'react-native-paper';

/**
 * Generates the style map passed to `RenderHtml` based on the current theme.
 * This is a pure function that takes a theme parameter and returns styles.
 *
 * @param theme The theme object from `react-native-paper`.
 * @returns An object where keys are HTML tag names and values are style objects.
 */
export function getArticleTagStyles(
  theme: MD3Theme,
  baseFontSize: number = 16,
  lineHeight: number = 1.6,
  paragraphSpacing: number = 16,
  fontFamily: string = 'system'
): Record<string, TextStyle> {
  const ratio = baseFontSize / 16; // Calculate ratio from base size

  // Map font family values to actual font families
  const fontFamilyMap: Record<string, string | undefined> = {
    system: undefined, // Use system default
    serif: 'Georgia, serif',
    'sans-serif': 'Arial, sans-serif',
    monospace: 'Courier New, monospace',
    Roboto: 'Roboto_400Regular',
    OpenSans: 'OpenSans_400Regular',
    Inter: 'Inter_400Regular',
    Lora: 'Lora_400Regular',
    Merriweather: 'Merriweather_400Regular',
    PlayfairDisplay: 'PlayfairDisplay_400Regular',
  };

  const fontFamilyValue = fontFamilyMap[fontFamily] || undefined;

  return {
    body: {
      color: theme.colors.onSurface,
      lineHeight: baseFontSize * lineHeight,
      fontSize: baseFontSize,
      fontFamily: fontFamilyValue,
      marginBottom: paragraphSpacing,
    },
    h1: {
      fontWeight: '700' as TextStyle['fontWeight'],
      marginTop: 18,
      marginBottom: 12 + paragraphSpacing,
      color: theme.colors.onSurface,
      fontSize: 22 * ratio,
      lineHeight: 22 * ratio * lineHeight,
      fontFamily: fontFamilyValue,
    },
    h2: {
      fontWeight: '700' as TextStyle['fontWeight'],
      marginTop: 16,
      marginBottom: 10 + paragraphSpacing,
      color: theme.colors.onSurface,
      fontSize: 18 * ratio,
      lineHeight: 18 * ratio * lineHeight,
      fontFamily: fontFamilyValue,
    },
    h3: {
      fontWeight: '600' as TextStyle['fontWeight'],
      marginTop: 16,
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    h4: {
      fontWeight: '600' as TextStyle['fontWeight'],
      marginTop: 14,
      marginBottom: 6,
      color: theme.colors.onSurface,
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
      marginBottom: paragraphSpacing,
      color: theme.colors.onSurface,
      fontSize: baseFontSize,
      lineHeight: baseFontSize * lineHeight,
      fontFamily: fontFamilyValue,
    },
    a: {
      color: theme.colors.primary,
      textDecorationLine: 'none',
    },
    ul: {
      marginVertical: 12, // MD3: 12dp vertical spacing (1.5x base unit)
      marginLeft: 16, // MD3: 16dp indentation (2x base unit)
    },
    ol: {
      marginVertical: 12, // MD3: 12dp vertical spacing (1.5x base unit)
      marginLeft: 16, // MD3: 16dp indentation (2x base unit)
    },
    li: {
      marginVertical: 4,
      color: theme.colors.onSurface,
      lineHeight: baseFontSize * lineHeight,
      fontSize: baseFontSize,
      fontFamily: fontFamilyValue,
    },
    table: {
      backgroundColor: 'transparent',
      marginVertical: 12, // MD3: 12dp vertical spacing
      width: '100%',
      maxWidth: '100%',
      borderRadius: theme.roundness, // MD3: Use theme roundness for shape
      overflow: 'hidden',
      alignSelf: 'center',
    },
    thead: {
      backgroundColor: 'transparent', // MD3: Transparent, rely on th styling
    },
    tbody: {
      backgroundColor: 'transparent',
    },
    th: {
      backgroundColor: (theme.colors as any).surfaceContainerHighest || theme.colors.surfaceVariant, // MD3: Subtle elevation for headers
      color: theme.colors.onSurface, // MD3: On-surface for text
      fontWeight: '600' as TextStyle['fontWeight'], // MD3: Use 600 for medium emphasis
      paddingVertical: 8, // MD3: 8dp vertical padding (1x base unit)
      paddingHorizontal: 12, // MD3: 12dp horizontal padding (1.5x base unit)
      textAlign: 'left' as TextStyle['textAlign'],
      fontSize: baseFontSize * 0.95,
      overflow: 'hidden',
      maxWidth: '100%',
      minWidth: 0,
      borderWidth: 0.5, // MD3: Thinner borders for subtlety
      borderColor: theme.colors.outlineVariant, // MD3: Use outlineVariant for subtle borders
      borderStyle: 'solid' as any,
    },
    td: {
      paddingVertical: 8, // MD3: 8dp vertical padding (1x base unit)
      paddingHorizontal: 12, // MD3: 12dp horizontal padding (1.5x base unit)
      color: theme.colors.onSurface, // MD3: On-surface for text
      fontSize: baseFontSize * 0.95,
      overflow: 'hidden',
      maxWidth: '100%',
      minWidth: 0,
      borderWidth: 0.5, // MD3: Thinner borders for subtlety
      borderColor: theme.colors.outlineVariant, // MD3: Use outlineVariant for subtle borders
      borderStyle: 'solid' as any,
      // Default text alignment for table cells
      textAlign: 'left' as TextStyle['textAlign'],
    },
    tr: {
      backgroundColor: 'transparent',
    },
    caption: {
      fontSize: baseFontSize * 0.85,
      color: theme.colors.onSurfaceVariant, // MD3: On-surface-variant for secondary text
      fontStyle: 'italic',
      paddingVertical: 8, // MD3: 8dp vertical padding (1x base unit)
      textAlign: 'center' as TextStyle['textAlign'],
    },
    // Improved code styling
    code: {
      backgroundColor: theme.colors.surfaceVariant, // MD3: Surface variant for emphasis
      color: theme.colors.onSurfaceVariant, // MD3: On-surface-variant for text
      paddingHorizontal: 4, // MD3: 4dp horizontal padding (0.5x base unit)
      paddingVertical: 2, // MD3: 2dp vertical padding (minimal)
      borderRadius: theme.roundness * 2, // MD3: 8dp equivalent for inline elements (4dp * 2)
      fontFamily: 'monospace',
    },
    pre: {
      backgroundColor: theme.colors.surfaceVariant, // MD3: Surface variant for code blocks
      color: theme.colors.onSurfaceVariant, // MD3: On-surface-variant for text
      padding: 16, // MD3: 16dp padding (2x base unit)
      borderRadius: theme.roundness, // MD3: Standard roundness for blocks
      fontFamily: 'monospace',
      overflow: 'scroll',
      marginVertical: 12, // MD3: 12dp vertical spacing (1.5x base unit)
    },
    // Blockquote styling
    blockquote: {
      backgroundColor: theme.colors.surfaceVariant, // MD3: Surface variant for emphasis
      borderLeftWidth: 4, // MD3: 4dp accent border (0.5x base unit)
      borderLeftColor: theme.colors.primary, // MD3: Primary color for accent
      paddingVertical: 12, // MD3: 12dp vertical padding (1.5x base unit)
      paddingHorizontal: 16, // MD3: 16dp horizontal padding (2x base unit)
      marginVertical: 12, // MD3: 12dp vertical spacing (1.5x base unit)
      marginLeft: 16, // MD3: 16dp left margin (2x base unit)
      fontStyle: 'italic',
      color: theme.colors.onSurfaceVariant, // MD3: On-surface-variant for text
    },
    // Image styling
    img: {
      maxWidth: '100%',
      height: 'auto',
    },
  };
}

/**
 * Generates class-based styles for Wikipedia-specific elements
 *
 * @param theme The theme object from `react-native-paper`.
 * @returns An object where keys are CSS class names and values are style objects.
 */
export function getArticleClassStyles(
  theme: MD3Theme,
  baseFontSize: number = 16
): Record<string, TextStyle> {
  const ratio = baseFontSize / 16;

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
    reference: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12 * ratio,
      fontStyle: 'italic',
    },
    external: {
      color: theme.colors.primary,
    },
    // MediaWiki wikitable class - matches Wikipedia table styling
    // This class is applied to <table class="wikitable"> elements
    wikitable: {
      backgroundColor: 'transparent',
      width: '100%',
      borderRadius: (theme as any).roundness,
      overflow: 'hidden',
      alignSelf: 'center',
    },
    // Sortable tables (jQuery tablesorter)
    sortable: {
      backgroundColor: 'transparent',
    },
    'jquery-tablesorter': {
      backgroundColor: 'transparent',
    },
    // Plain row headers - normal font weight, left-aligned
    // Applied to tables with class="wikitable plainrowheaders"
    plainrowheaders: {
      backgroundColor: 'transparent',
    },
    // Collapsible tables
    'mw-collapsible': {
      backgroundColor: 'transparent',
    },
    'mw-collapsed': {
      backgroundColor: 'transparent',
    },
    // Table with no borders
    'wikitable noborder': {
      borderWidth: 0,
    },
    // Table with alternating row colors (zebra striping)
    // so zebra striping would need a custom renderer
    'wikitable zebra': {
      backgroundColor: 'transparent',
    },
    // Navigation boxes
    navbox: {
      backgroundColor: theme.colors.surfaceVariant, // MD3: Surface variant for containers
      borderColor: theme.colors.outlineVariant, // MD3: Outline variant for subtle borders
      borderRadius: theme.roundness, // MD3: Standard roundness
      padding: 12, // MD3: 12dp padding (1.5x base unit)
      marginVertical: 16, // MD3: 16dp vertical spacing (2x base unit)
    },
    // Citation styles
    citation: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12 * ratio,
    },
    // Mobile-optimized table cells
    'mobile-table-cell': {
      minWidth: 80,
      paddingVertical: 8, // MD3: 8dp vertical padding (1x base unit)
      paddingHorizontal: 8, // MD3: 8dp horizontal padding (1x base unit) - increased for consistency
    },
    // Infobox tables - should take full container width
    infobox: {
      maxWidth: '100%',
      marginLeft: -8, // Break out of section padding
      marginRight: -8, // Break out of section padding
      ...Platform.select({
        web: {
          width: 'calc(100% + 16px)' as any,
        },
        default: {
          width: '100%',
        },
      }),
    },
  };
}
