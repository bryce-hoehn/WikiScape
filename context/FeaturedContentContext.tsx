import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import useFeaturedContentHook from '../hooks/content/useFeaturedContent';
import { FeaturedContentContextType } from '../types/api/featured';

const FeaturedContentContext = createContext<FeaturedContentContextType | undefined>(undefined);

interface FeaturedContentProviderProps {
  children: ReactNode;
}

export function FeaturedContentProvider({ children }: FeaturedContentProviderProps) {
  const featuredContentQuery = useFeaturedContentHook();

  // Extract stable properties - refetch is stable from React Query
  const { data, isLoading, error, refetch } = featuredContentQuery;

  // Note: We don't need a manual refetch here because React Query automatically:
  // 1. Fetches on mount if data is missing or stale
  // 2. Uses initialData from in-memory cache for fast UI
  // 3. Handles background refresh via refetchInterval (15 minutes)
  // Manual refetch would be redundant and could cause duplicate network requests

  // Safely access react-query result shape — fetchFeaturedContent returns { data: ... }
  const raw = (data as any) ?? null;
  const errorMessage = error?.message || null;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: FeaturedContentContextType = useMemo(
    () => ({
      featuredContent: raw?.data && raw.data.tfa ? raw.data : null,
      isLoading,
      error: errorMessage,
      refreshFeaturedContent: async () => {
        await refetch();
      },
    }),
    [raw, isLoading, errorMessage, refetch]
  );

  return (
    <FeaturedContentContext.Provider value={contextValue}>
      {children}
    </FeaturedContentContext.Provider>
  );
}

export function useFeaturedContent(): FeaturedContentContextType {
  const context = useContext(FeaturedContentContext);
  if (context === undefined) {
    throw new Error('useFeaturedContent must be used within a FeaturedContentProvider');
  }
  return context;
}
