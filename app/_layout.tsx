import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBackgroundColorAsync } from 'expo-system-ui';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { BookmarksProvider } from '../context/BookmarksContext';
import { FeaturedContentProvider } from '../context/FeaturedContentContext';
import { FeedScrollProvider } from '../context/FeedScrollContext';
import { ScrollToTopProvider } from '../context/ScrollToTopContext';
import { SnackbarProvider } from '../context/SnackbarContext';
import { ThemeProvider } from '../context/ThemeProvider';

// Silence development-only logs in production builds (aggressive sweep).
// Keeps console.error for runtime errors, removes console.log/warn/debug noise.
if (typeof __DEV__ !== 'undefined' && !__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - keep data in cache longer to reduce refetches
      refetchOnWindowFocus: false, // Don't refetch when window regains focus - reduces unnecessary requests
    },
  },
});

// Keep the splash screen visible while fetching resources
SplashScreen.preventAutoHideAsync();

// Inner layout component that has access to theme
function InnerLayout() {
  const theme = useTheme();

  useEffect(() => {
    // Set root view background color before hiding splash screen
    // This prevents white flash during async route loading
    const prepareApp = async () => {
      await setBackgroundColorAsync(theme.colors.background);
      await SplashScreen.hideAsync();
    };

    prepareApp().catch(() => {
      // Fallback: hide splash screen even if background color fails
      SplashScreen.hideAsync();
    });

    // NSFWJS model preloading disabled since NSFW filter is disabled by default
    // If the filter is re-enabled in the future, uncomment this:
    // if (Platform.OS === 'web') {
    //   preloadNsfwjsModel().catch(() => {
    //     // Silently fail - model will load on-demand if preload fails
    //   });
    // }
  }, [theme.colors.background]);

  // Update root view background color to match theme
  // This helps prevent white flash during route transitions
  useEffect(() => {
    const bgColor = theme.colors.background;
    
    // Use expo-system-ui to set root view background (works on all platforms)
    setBackgroundColorAsync(bgColor).catch(() => {
      // Silently fail if not supported on platform
    });
    
    // Also update web DOM elements
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const root = document.getElementById('root');
      
      if (root) {
        root.style.backgroundColor = bgColor;
      }
      
      document.body.style.backgroundColor = bgColor;
      document.documentElement.style.backgroundColor = bgColor;
    }
  }, [theme.colors.background]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SnackbarProvider>
        <ScrollToTopProvider>
          <FeedScrollProvider>
            <BookmarksProvider>
              <FeaturedContentProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.colors.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="article/[title]" />
                  <Stack.Screen name="subcategory/[title]" />
                </Stack>
              </FeaturedContentProvider>
            </BookmarksProvider>
          </FeedScrollProvider>
        </ScrollToTopProvider>
      </SnackbarProvider>
    </View>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <InnerLayout />
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
