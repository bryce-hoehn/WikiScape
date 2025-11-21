import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SnackbarContextType {
  showSnackbar: (message: string, options?: SnackbarOptions) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

interface SnackbarOptions {
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<{ label: string; onPress: () => void } | undefined>();
  const [duration, setDuration] = useState(4000); // M3: Minimum 4 seconds

  const showSnackbar = useCallback((msg: string, options?: SnackbarOptions) => {
    setMessage(msg);
    // Transform action label to all-caps per M3 specs
    setAction(
      options?.action
        ? {
            label: options.action.label.toUpperCase(), // M3: Action button text should be all-caps
            onPress: options.action.onPress,
          }
        : undefined
    );
    // M3: Duration should be 4-10 seconds (default 4 seconds)
    const requestedDuration = options?.duration || 4000;
    setDuration(Math.max(4000, Math.min(10000, requestedDuration))); // Clamp between 4-10 seconds
    setVisible(true);
  }, []);

  const showSuccess = useCallback(
    (msg: string) => {
      showSnackbar(msg, { duration: 4000 }); // M3: Minimum 4 seconds
    },
    [showSnackbar]
  );

  const showError = useCallback(
    (msg: string) => {
      showSnackbar(msg, { duration: 5000 }); // Errors can be slightly longer (5 seconds)
    },
    [showSnackbar]
  );

  const showInfo = useCallback(
    (msg: string) => {
      showSnackbar(msg, { duration: 4000 }); // M3: Minimum 4 seconds
    },
    [showSnackbar]
  );

  const onDismiss = useCallback(() => {
    setVisible(false);
    setAction(undefined);
  }, []);

  // Memoize context value to prevent infinite re-renders
  const value = useMemo(
    () => ({
      showSnackbar,
      showSuccess,
      showError,
      showInfo,
    }),
    [showSnackbar, showSuccess, showError, showInfo]
  );

  // M3: Width constraints for tablet/desktop (min 288dp, max 568dp)
  const isLargeScreen = windowWidth >= LAYOUT.DESKTOP_BREAKPOINT;
  
  // Calculate bottom offset to position snackbar above navigation bar
  // On large screens, tab bar is hidden, so no offset needed
  // On small screens, position above tab bar height with spacing
  const tabBarHeight = isLargeScreen
    ? 0
    : SPACING.lg + (Platform.OS === 'web' ? SPACING.lg : insets.bottom);
  
  // Add spacing between snackbar and navigation bar (smaller spacing for better visual balance)
  const bottomOffset = tabBarHeight + SPACING.sm;
  
  const snackbarStyle = {
    ...(isLargeScreen
      ? {
          minWidth: 288, // M3: Minimum 288dp for tablet/desktop
          maxWidth: 568, // M3: Maximum 568dp for tablet/desktop
          alignSelf: 'center' as const,
        }
      : {}),
    bottom: bottomOffset,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={duration}
        action={action}
        style={snackbarStyle}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}
