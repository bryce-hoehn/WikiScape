import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import themesData from '../constants/themes.json';

// Storage keys
const THEME_STORAGE_KEY = 'wikipediaexpo_theme_preference';

// Theme types
export type ThemeType =
  | 'automatic'
  | 'light'
  | 'dark'
  | 'light-medium-contrast'
  | 'light-high-contrast'
  | 'dark-medium-contrast'
  | 'dark-high-contrast'
  | 'papyrus';

interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Material Design 3 Color Token System
 *
 * MD3 uses a semantic color system with five essential color groups:
 * - Primary: Brand color, used for key actions and interactive elements
 * - Secondary: Supporting color for less prominent actions
 * - Tertiary: Accent color for additional emphasis
 * - Error: For error states and destructive actions
 * - Neutral/Neutral Variant: For surfaces, backgrounds, and text
 *
 * Each color group has:
 * - Base color (e.g., primary)
 * - "On" color (e.g., onPrimary) - text/content that appears on the base color
 * - Container color (e.g., primaryContainer) - lighter/darker variant for containers
 * - "On Container" color (e.g., onPrimaryContainer) - text/content on container
 *
 * Elevation colors map to surface container colors:
 * - level0: Transparent (no elevation)
 * - level1: surfaceContainerLowest
 * - level2: surfaceContainerLow
 * - level3: surfaceContainer
 * - level4: surfaceContainerHigh
 * - level5: surfaceContainerHighest
 *
 * Reference: https://m3.material.io/styles/color/overview
 * Reference: https://m3.material.io/styles/color/roles
 */
const createMD3Theme = (scheme: any, isDark: boolean) => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      // Primary color role - brand color for key actions
      // MD3: Primary color is the main brand color, used for primary buttons, FABs, links
      // Reference: https://m3.material.io/styles/color/roles
      primary: scheme.primary,

      // On-primary - text/content color on primary background
      // MD3: Ensures proper contrast for text/icons on primary-colored surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onPrimary: scheme.onPrimary,

      // Primary container - lighter/darker variant for containers
      // MD3: Used for less prominent primary-colored containers
      // Reference: https://m3.material.io/styles/color/roles
      primaryContainer: scheme.primaryContainer,

      // On-primary container - text/content on primary container
      // MD3: Ensures proper contrast for text/icons on primary container surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onPrimaryContainer: scheme.onPrimaryContainer,

      // Secondary color role - supporting brand color
      // MD3: Secondary color for less prominent actions and accents
      // Reference: https://m3.material.io/styles/color/roles
      secondary: scheme.secondary,

      // On-secondary - text/content color on secondary background
      // MD3: Ensures proper contrast for text/icons on secondary-colored surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onSecondary: scheme.onSecondary,

      // Secondary container - lighter/darker variant for containers
      // MD3: Used for less prominent secondary-colored containers
      // Reference: https://m3.material.io/styles/color/roles
      secondaryContainer: scheme.secondaryContainer,

      // On-secondary container - text/content on secondary container
      // MD3: Ensures proper contrast for text/icons on secondary container surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onSecondaryContainer: scheme.onSecondaryContainer,

      // Tertiary color role - accent color
      // MD3: Tertiary color for additional emphasis and variety
      // Reference: https://m3.material.io/styles/color/roles
      tertiary: scheme.tertiary,

      // On-tertiary - text/content color on tertiary background
      // MD3: Ensures proper contrast for text/icons on tertiary-colored surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onTertiary: scheme.onTertiary,

      // Tertiary container - lighter/darker variant for containers
      // MD3: Used for less prominent tertiary-colored containers
      // Reference: https://m3.material.io/styles/color/roles
      tertiaryContainer: scheme.tertiaryContainer,

      // On-tertiary container - text/content on tertiary container
      // MD3: Ensures proper contrast for text/icons on tertiary container surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onTertiaryContainer: scheme.onTertiaryContainer,

      // Error color role - for error states
      // MD3: Error color for destructive actions and error messages
      // Reference: https://m3.material.io/styles/color/roles
      error: scheme.error,

      // On-error - text/content color on error background
      // MD3: Ensures proper contrast for text/icons on error-colored surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onError: scheme.onError,

      // Error container - lighter/darker variant for containers
      // MD3: Used for error message containers and less prominent error states
      // Reference: https://m3.material.io/styles/color/roles
      errorContainer: scheme.errorContainer,

      // On-error container - text/content on error container
      // MD3: Ensures proper contrast for text/icons on error container surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onErrorContainer: scheme.onErrorContainer,

      // Background - main app background
      // MD3: Background color for the entire app surface
      // Reference: https://m3.material.io/styles/color/roles
      background: scheme.background,

      // On-background - text/content on background
      // MD3: Primary text color for content on the background
      // Reference: https://m3.material.io/styles/color/roles
      onBackground: scheme.onBackground,

      // Surface - default surface color
      // MD3: Default color for cards, sheets, and other surfaces
      // Reference: https://m3.material.io/styles/color/roles
      surface: scheme.surface,

      // On-surface - text/content on surface
      // MD3: Primary text color for content on surfaces
      // Reference: https://m3.material.io/styles/color/roles
      onSurface: scheme.onSurface,

      // Surface variant - alternative surface color
      // MD3: Used for surfaces that need visual distinction from default surface
      // Reference: https://m3.material.io/styles/color/roles
      surfaceVariant: scheme.surfaceVariant,

      // On-surface variant - text/content on surface variant
      // MD3: Text color for content on surface variant backgrounds
      // Reference: https://m3.material.io/styles/color/roles
      onSurfaceVariant: scheme.onSurfaceVariant,

      // Outline - for borders and dividers
      // MD3: Color for borders, dividers, and outlines
      // Reference: https://m3.material.io/styles/color/roles
      outline: scheme.outline,

      // Outline variant - lighter outline color
      // MD3: Lighter variant for subtle borders and dividers
      // Reference: https://m3.material.io/styles/color/roles
      outlineVariant: scheme.outlineVariant,

      // Scrim - overlay color for modals/dialogs
      // MD3: Semi-transparent overlay color for modals, dialogs, and bottom sheets
      // Reference: https://m3.material.io/styles/color/roles
      scrim: scheme.scrim,

      // Shadow - shadow color
      // MD3: Color used for shadows (typically black with opacity)
      // Reference: https://m3.material.io/styles/color/roles
      shadow: scheme.shadow,

      // Inverse surface - for inverse surfaces
      // MD3: Surface color for inverse surfaces (light surfaces in dark theme, dark in light)
      // Reference: https://m3.material.io/styles/color/roles
      inverseSurface: scheme.inverseSurface,

      // Inverse on-surface - text/content on inverse surface
      // MD3: Text color for content on inverse surfaces
      // Reference: https://m3.material.io/styles/color/roles
      inverseOnSurface: scheme.inverseOnSurface,

      // Inverse primary - primary color for inverse surfaces
      // MD3: Primary color variant for use on inverse surfaces
      // Reference: https://m3.material.io/styles/color/roles
      inversePrimary: scheme.inversePrimary,

      // Elevation colors - mapped from surface container colors
      // MD3: Elevation uses surface container colors to create depth hierarchy
      // Reference: https://m3.material.io/styles/elevation/overview
      elevation: {
        // level0: No elevation (transparent)
        // MD3: Transparent background for surfaces with no elevation
        // Reference: https://m3.material.io/styles/elevation/overview
        level0: 'transparent',

        // level1: Lowest elevation
        // MD3: Uses surfaceContainerLowest for subtle elevation
        // Reference: https://m3.material.io/styles/elevation/overview
        level1: scheme.surfaceContainerLowest || (isDark ? '#1D2024' : '#F3F3FA'),

        // level2: Low elevation
        // MD3: Uses surfaceContainerLow for low elevation surfaces
        // Reference: https://m3.material.io/styles/elevation/overview
        level2: scheme.surfaceContainerLow || (isDark ? '#282A2F' : '#EDEDF4'),

        // level3: Medium elevation
        // MD3: Uses surfaceContainer for medium elevation surfaces
        // Reference: https://m3.material.io/styles/elevation/overview
        level3: scheme.surfaceContainer || (isDark ? '#33353A' : '#E7E8EE'),

        // level4: High elevation
        // MD3: Uses surfaceContainerHigh for high elevation surfaces
        // Reference: https://m3.material.io/styles/elevation/overview
        level4: scheme.surfaceContainerHigh || (isDark ? '#37393E' : '#E2E2E9'),

        // level5: Highest elevation
        // MD3: Uses surfaceContainerHighest for highest elevation surfaces
        // Reference: https://m3.material.io/styles/elevation/overview
        level5: scheme.surfaceContainerHighest || (isDark ? '#3C3E43' : '#DCDCE3'),
      },
    },
  };
};

// Create themes from JSON data (static - created once)
const themes = {
  light: createMD3Theme(themesData.schemes.light, false),
  'light-medium-contrast': createMD3Theme(themesData.schemes['light-medium-contrast'], false),
  'light-high-contrast': createMD3Theme(themesData.schemes['light-high-contrast'], false),
  dark: createMD3Theme(themesData.schemes.dark, true),
  'dark-medium-contrast': createMD3Theme(themesData.schemes['dark-medium-contrast'], true),
  'dark-high-contrast': createMD3Theme(themesData.schemes['dark-high-contrast'], true),
  papyrus: createMD3Theme(themesData.schemes.papyrus, false),
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('automatic');

  // Load theme preference from storage on component mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          // Use saved preference if available
          setCurrentTheme(savedTheme as ThemeType);
        } else {
          // If no saved preference, default to automatic
          setCurrentTheme('automatic');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Fallback to dark theme on error
        setCurrentTheme('dark');
      }
    };

    loadThemePreference();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - systemColorScheme is used for effectiveTheme calculation, not in this effect

  const setTheme = useCallback(async (theme: ThemeType) => {
    setCurrentTheme(theme);

    // Save theme preference to storage
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  // Determine the actual theme to use (handle automatic mode)
  const effectiveTheme =
    currentTheme === 'automatic' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : currentTheme;

  const theme = themes[effectiveTheme];

  // Memoize context value to prevent infinite re-renders
  const value = useMemo(
    () => ({
      currentTheme,
      setTheme,
    }),
    [currentTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
