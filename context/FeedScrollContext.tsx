import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface FeedScrollContextType {
  saveScrollPosition: (feedKey: string, position: number) => void;
  getScrollPosition: (feedKey: string) => number | undefined;
  clearScrollPosition: (feedKey: string) => void;
}

const FeedScrollContext = createContext<FeedScrollContextType | undefined>(undefined);

export function FeedScrollProvider({ children }: { children: ReactNode }) {
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});
  // Use ref to store scroll positions to prevent getScrollPosition from changing on every update
  const scrollPositionsRef = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    scrollPositionsRef.current = scrollPositions;
  }, [scrollPositions]);

  const saveScrollPosition = useCallback((feedKey: string, position: number) => {
    setScrollPositions((prev) => {
      const updated = {
        ...prev,
        [feedKey]: position,
      };
      scrollPositionsRef.current = updated;
      return updated;
    });
  }, []);

  // Use ref to prevent getScrollPosition from changing on every scroll position update
  const getScrollPosition = useCallback((feedKey: string) => {
    return scrollPositionsRef.current[feedKey];
  }, []);

  const clearScrollPosition = useCallback((feedKey: string) => {
    setScrollPositions((prev) => {
      const newPositions = { ...prev };
      delete newPositions[feedKey];
      scrollPositionsRef.current = newPositions;
      return newPositions;
    });
  }, []);

  // Memoize context value to prevent infinite re-renders
  // Note: scrollPositions is not included to prevent unnecessary re-renders
  // Use getScrollPosition() to access scroll positions instead
  const value = useMemo(
    () => ({
      saveScrollPosition,
      getScrollPosition,
      clearScrollPosition,
    }),
    [saveScrollPosition, getScrollPosition, clearScrollPosition]
  );

  return (
    <FeedScrollContext.Provider value={value}>
      {children}
    </FeedScrollContext.Provider>
  );
}

export function useFeedScroll() {
  const context = useContext(FeedScrollContext);
  if (!context) {
    throw new Error('useFeedScroll must be used within FeedScrollProvider');
  }
  return context;
}
