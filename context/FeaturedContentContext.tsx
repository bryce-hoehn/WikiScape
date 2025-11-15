import React, { createContext, ReactNode, useContext, useEffect } from 'react';
import useFeaturedContentHook from '../hooks/content/useFeaturedContent';
import { FeaturedContentContextType } from '../types/api/featured';

const FeaturedContentContext = createContext<FeaturedContentContextType | undefined>(undefined);

interface FeaturedContentProviderProps {
  children: ReactNode;
}

export function FeaturedContentProvider({ children }: FeaturedContentProviderProps) {
  const featuredContentQuery = useFeaturedContentHook();

  // Preload featured content immediately when provider mounts
  useEffect(() => {
    // Load featured content immediately on app start
    if (!featuredContentQuery.data && !featuredContentQuery.isLoading) {
      featuredContentQuery.refetch();
    }
  }, [featuredContentQuery, featuredContentQuery.data, featuredContentQuery.isLoading, featuredContentQuery.refetch]);

  const contextValue: FeaturedContentContextType = {
    featuredContent: featuredContentQuery.data?.data && featuredContentQuery.data.data.tfa ? featuredContentQuery.data.data : null,
    isLoading: featuredContentQuery.isLoading,
    error: featuredContentQuery.error?.message || null,
    refreshFeaturedContent: async () => {
      await featuredContentQuery.refetch();
    },
  };

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
