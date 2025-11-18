import React from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  error?: Error;
  recoverySteps?: string[];
}

/**
 * Unified error state component with consistent styling and error handling
 */
export default function ErrorState({
  title = 'Something Went Wrong',
  message,
  onRetry,
  retryLabel = 'Return to Home',
  showDetails = false,
  error,
  recoverySteps = [],
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      data-error-state="true"
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        variant="headlineMedium"
        style={{
          marginBottom: 16,
          textAlign: 'center',
          color: theme.colors.onSurface,
        }}
      >
        {title}
      </Text>

      <Text
        variant="bodyMedium"
        style={{
          marginBottom: recoverySteps.length > 0 ? 16 : 24,
          textAlign: 'center',
          color: theme.colors.onSurfaceVariant,
          lineHeight: 22,
          maxWidth: 400,
        }}
      >
        {message}
      </Text>

      {/* Recovery Steps */}
      {recoverySteps.length > 0 && (
        <View style={{ marginBottom: 24, maxWidth: 400 }}>
          <Text
            variant="labelMedium"
            style={{
              marginBottom: 8,
              color: theme.colors.onSurface,
              fontWeight: '600',
            }}
          >
            Try these steps:
          </Text>
          {recoverySteps.map((step, index) => (
            <View
              key={index}
              style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}
            >
              <Text style={{ marginRight: 8, color: theme.colors.primary, fontWeight: '600' }}>
                {index + 1}.
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  flex: 1,
                  color: theme.colors.onSurfaceVariant,
                  lineHeight: 20,
                }}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}

      {onRetry && (
        <Button mode="contained" onPress={onRetry} icon="home">
          {retryLabel}
        </Button>
      )}

      {showDetails && error && __DEV__ && (
        <Text
          variant="bodySmall"
          style={{
            marginTop: 16,
            opacity: 0.5,
            textAlign: 'center',
            color: theme.colors.onSurfaceVariant,
            maxWidth: 400,
          }}
        >
          Dev: {error.message}
        </Text>
      )}
    </View>
  );
}
