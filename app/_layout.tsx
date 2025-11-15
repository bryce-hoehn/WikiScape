import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { BookmarksProvider } from '../context/BookmarksContext';
import { FeaturedContentProvider } from '../context/FeaturedContentContext';
import { ThemeProvider } from '../context/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function Layout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BookmarksProvider>
            <FeaturedContentProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(zArticleStack)" options={{ headerShown: false }} />
                <Stack.Screen name="(zCategoryStack)" options={{ headerShown: false }} />
              </Stack>
            </FeaturedContentProvider>
          </BookmarksProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

