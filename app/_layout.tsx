import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBackgroundColorAsync } from 'expo-system-ui';
import React, { useEffect } from 'react';
import { LogBox, Platform, View } from 'react-native';
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
// Filters console.error for known harmless third-party library errors.
if (typeof __DEV__ !== 'undefined' && !__DEV__) {
  console.log = () => {};
  console.debug = () => {};
  
  // Silence warnings in production
  console.warn = () => {};
  
  // Disable React Native LogBox warnings in production
  try {
    LogBox.ignoreAllLogs(true);
  } catch (e) {
    // LogBox might not be available in all environments
  }
  
  // Filter console.error to silence known harmless errors from third-party libraries
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    
    // List of known harmless error patterns to silence in production
    const harmlessErrors = [
      "can't access property",
      "document.body is null",
      "useNativeDriver",
      "RCTAnimation",
      "shadow*",
      "props.pointerEvents is deprecated",
      "Source map error",
      "request failed with status 404",
      "installHook.js.map",
    ];
    
    // Only silence if it matches a known harmless error pattern
    const isHarmless = harmlessErrors.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (!isHarmless) {
      originalError.apply(console, args);
    }
  };
  
  // Also catch uncaught errors and filter them
  if (typeof window !== 'undefined') {
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const errorMessage = String(message);
      const harmlessErrors = [
        "can't access property",
        "document.body is null",
        "useNativeDriver",
        "Source map error",
      ];
      
      const isHarmless = harmlessErrors.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (!isHarmless && originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false; // Suppress the error
    };
    
    // Catch unhandled promise rejections that might be harmless
    const originalUnhandledRejection = window.onunhandledrejection;
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason || '');
      const harmlessErrors = [
        "can't access property",
        "document.body is null",
      ];
      
      const isHarmless = harmlessErrors.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isHarmless) {
        event.preventDefault(); // Suppress the error
      } else if (originalUnhandledRejection) {
        // Call original handler if it exists
        if (typeof originalUnhandledRejection === 'function') {
          originalUnhandledRejection.call(window, event);
        }
      }
    });
  }
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
    const prepareApp = async () => {
      await setBackgroundColorAsync(theme.colors.background);
      await SplashScreen.hideAsync();
    };

    prepareApp().catch(() => {
      // Fallback: hide splash screen even if background color fails
      SplashScreen.hideAsync();
    });
  }, [theme.colors.background]);

  // Update root view background color to match theme
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
                    gestureEnabled: true, // Enable swipe-back gesture on iOS
                    animation: 'default', // Use default slide animation
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
