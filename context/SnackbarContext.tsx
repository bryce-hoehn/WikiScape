import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar } from 'react-native-paper';

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

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<{ label: string; onPress: () => void } | undefined>();
  const [duration, setDuration] = useState(3000);

  const showSnackbar = useCallback((msg: string, options?: SnackbarOptions) => {
    setMessage(msg);
    setAction(options?.action);
    setDuration(options?.duration || 3000);
    setVisible(true);
  }, []);

  const showSuccess = useCallback(
    (msg: string) => {
      showSnackbar(msg, { duration: 3000 });
    },
    [showSnackbar]
  );

  const showError = useCallback(
    (msg: string) => {
      showSnackbar(msg, { duration: 4000 });
    },
    [showSnackbar]
  );

  const showInfo = useCallback(
    (msg: string) => {
      showSnackbar(msg, { duration: 3000 });
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

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar visible={visible} onDismiss={onDismiss} duration={duration} action={action}>
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
