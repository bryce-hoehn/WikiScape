import { getUserFriendlyError } from '@/utils/errorHandling';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * Simple error boundary component to catch and handle errors gracefully
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development only
    if (__DEV__) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  resetError = () => {
    // Navigate to home instead of just resetting error
    router.replace('/(tabs)');
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      const errorInfo = getUserFriendlyError(this.state.error);

      return (
        <ErrorBoundaryContent errorInfo={errorInfo} error={this.state.error} resetError={this.resetError} />
      );
    }

    return this.props.children;
  }
}

// Separate component to access theme hook
function ErrorBoundaryContent({ 
  errorInfo, 
  error, 
  resetError 
}: { 
  errorInfo: ReturnType<typeof getUserFriendlyError>; 
  error?: Error; 
  resetError: () => void;
}) {
  const theme = useTheme();

  return (
    <View 
      data-error-boundary="true"
      style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20,
        backgroundColor: theme.colors.background,
      }}
    >
          <Text variant="headlineMedium" style={{ marginBottom: 16, textAlign: 'center' }}>
            Oops!
          </Text>
          <Text
            variant="bodyMedium"
            style={{ marginBottom: 24, textAlign: 'center', opacity: 0.7 }}
          >
            {errorInfo.userFriendlyMessage}
          </Text>
          <Button mode="contained" onPress={resetError}>
            Return to Home
          </Button>
          {__DEV__ && error && (
            <Text variant="bodySmall" style={{ marginTop: 16, opacity: 0.5, textAlign: 'center' }}>
              Dev: {error.message}
            </Text>
          )}
        </View>
      );
}
