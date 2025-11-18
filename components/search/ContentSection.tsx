import { SPACING } from '@/constants/spacing';
import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface ContentSectionProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  skeleton?: React.ReactNode;
}

/**
 * Reusable content section component for SearchScreen
 * Handles title, loading state, and content rendering
 */
export default function ContentSection({
  title,
  children,
  isLoading = false,
  skeleton,
}: ContentSectionProps) {
  const theme = useTheme();

  if (isLoading && skeleton) {
    return skeleton;
  }

  if (!children) {
    return null;
  }

  return (
    <View
      style={{
        width: '100%',
        marginBottom: SPACING.lg,
        backgroundColor: theme.colors.background,
        flex: 1,
      }}
    >
      <Text
        variant="headlineMedium"
        style={{
          marginBottom: SPACING.sm,
          fontWeight: '700', // MD3: Use 700 for headlineMedium emphasis instead of 'bold'
          color: theme.colors.onSurface,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <View style={{ width: '100%', flex: 1 }}>{children}</View>
    </View>
  );
}
