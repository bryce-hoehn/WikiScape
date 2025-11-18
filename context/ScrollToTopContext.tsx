import React, { createContext, ReactNode, useCallback, useContext, useMemo, useRef } from 'react';

interface ScrollRef {
  scrollToTop?: () => void;
}

interface ScrollToTopContextType {
  registerScrollRef: (route: string, ref: ScrollRef) => void;
  scrollToTop: (route: string) => void;
  shouldScrollOnFocus: (route: string) => boolean;
  markFocused: (route: string) => void;
}

const ScrollToTopContext = createContext<ScrollToTopContextType | undefined>(undefined);

export function ScrollToTopProvider({ children }: { children: ReactNode }) {
  const scrollRefs = useRef<Record<string, ScrollRef>>({});
  const focusedRoutes = useRef<Set<string>>(new Set());

  // Memoize registerScrollRef to prevent infinite loops
  const registerScrollRef = useCallback((route: string, ref: ScrollRef) => {
    scrollRefs.current[route] = ref;
  }, []);

  // Memoize scrollToTop to prevent infinite loops
  const scrollToTop = useCallback((route: string) => {
    const ref = scrollRefs.current[route];
    if (ref?.scrollToTop) {
      ref.scrollToTop();
      return;
    }

    // If route not found, try common alternatives
    // For home route, try scrolling the default feed
    if (route === '/(tabs)' || route === '/') {
      // Try the default feed tabs in order
      const feedKeys = ['for-you', 'hot', 'random'];
      for (const feedKey of feedKeys) {
        const feedRef = scrollRefs.current[feedKey];
        if (feedRef?.scrollToTop) {
          feedRef.scrollToTop();
          return;
        }
      }
    }
  }, []);

  // Check if we should scroll to top when this route is focused
  // Returns true if the route was already focused before (user is returning to it)
  const shouldScrollOnFocus = useCallback((route: string): boolean => {
    return focusedRoutes.current.has(route);
  }, []);

  // Mark a route as focused (called when route gains focus)
  const markFocused = useCallback((route: string) => {
    focusedRoutes.current.add(route);
  }, []);

  // Memoize context value to prevent infinite re-renders
  const value = useMemo(
    () => ({
      registerScrollRef,
      scrollToTop,
      shouldScrollOnFocus,
      markFocused,
    }),
    [registerScrollRef, scrollToTop, shouldScrollOnFocus, markFocused]
  );

  return (
    <ScrollToTopContext.Provider value={value}>
      {children}
    </ScrollToTopContext.Provider>
  );
}

export function useScrollToTop() {
  const context = useContext(ScrollToTopContext);
  if (!context) {
    // Return a no-op if context is not available (safety check)
    return {
      registerScrollRef: () => {},
      scrollToTop: () => {},
      shouldScrollOnFocus: () => false,
      markFocused: () => {},
    };
  }
  return context;
}
