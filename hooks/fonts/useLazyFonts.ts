import { Inter_400Regular } from '@expo-google-fonts/inter';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import { Merriweather_400Regular, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from '@expo-google-fonts/open-sans';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { FontDisplay, useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { FontFamily } from '../storage/useFontFamily';

// Helper function to wrap font sources with FontDisplay.SWAP for web
// This ensures fallback text renders immediately while custom fonts load
const wrapWithFontDisplay = (fontSource: any) => ({
  uri: fontSource,
  display: FontDisplay.SWAP,
});

// Map font family names to their font objects with FontDisplay.SWAP
const FONT_MAP: Record<string, Record<string, any>> = {
  Roboto: {
    Roboto_400Regular: wrapWithFontDisplay(Roboto_400Regular),
    Roboto_700Bold: wrapWithFontDisplay(Roboto_700Bold),
  },
  OpenSans: {
    OpenSans_400Regular: wrapWithFontDisplay(OpenSans_400Regular),
    OpenSans_600SemiBold: wrapWithFontDisplay(OpenSans_600SemiBold),
    OpenSans_700Bold: wrapWithFontDisplay(OpenSans_700Bold),
  },
  Lora: {
    Lora_400Regular: wrapWithFontDisplay(Lora_400Regular),
    Lora_700Bold: wrapWithFontDisplay(Lora_700Bold),
  },
  Merriweather: {
    Merriweather_400Regular: wrapWithFontDisplay(Merriweather_400Regular),
    Merriweather_700Bold: wrapWithFontDisplay(Merriweather_700Bold),
  },
  PlayfairDisplay: {
    PlayfairDisplay_400Regular: wrapWithFontDisplay(PlayfairDisplay_400Regular),
    PlayfairDisplay_700Bold: wrapWithFontDisplay(PlayfairDisplay_700Bold),
  },
  Inter: {
    Inter_400Regular: wrapWithFontDisplay(Inter_400Regular),
  },
};

// Track which fonts have been loaded
const loadedFonts = new Set<string>();

/**
 * Hook to lazily load fonts on-demand
 * Only loads fonts when they're actually needed (when user selects them)
 */
export function useLazyFonts(fontFamily: FontFamily) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  // System fonts and generic fonts don't need loading
  const needsLoading =
    fontFamily !== 'system' &&
    fontFamily !== 'serif' &&
    fontFamily !== 'sans-serif' &&
    fontFamily !== 'monospace';

  const fontConfig = needsLoading ? FONT_MAP[fontFamily] : null;

  const [fontsLoadedResult, fontsErrorResult] = useFonts(fontConfig || {});

  useEffect(() => {
    if (!needsLoading) {
      // System/generic fonts are always "loaded" (they use system fonts)
      setFontsLoaded(true);
      setFontError(null);
      return;
    }

    if (loadedFonts.has(fontFamily)) {
      // Font already loaded previously
      setFontsLoaded(true);
      setFontError(null);
      return;
    }

    // Font needs to be loaded
    if (fontsLoadedResult) {
      loadedFonts.add(fontFamily);
      setFontsLoaded(true);
      setFontError(null);
    } else if (fontsErrorResult) {
      setFontError(fontsErrorResult);
    } else {
      setFontsLoaded(false);
    }
  }, [fontFamily, fontsLoadedResult, fontsErrorResult, needsLoading]);

  return { fontsLoaded, fontError };
}
