import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

interface LoadingFooterProps {
  loading: boolean;
}

export default function LoadingFooter({ loading }: LoadingFooterProps) {
  const theme = useTheme();

  if (!loading) return null;

  return (
    <View
      style={{
        padding: 24,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant, fontWeight: '500' }}
      >
        Loading more recommendations...
      </Text>
    </View>
  );
}
