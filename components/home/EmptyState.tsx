import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';

interface EmptyStateProps {
  type?: 'welcome' | 'loading' | 'no-history';
  onRefresh?: () => void;
  // Custom props for more flexibility
  icon?: string;
  title?: string;
  description?: string;
  showSpinner?: boolean;
  suggestions?: Array<{ label: string; action: () => void; icon?: string }>;
}

export default function EmptyState({
  type,
  onRefresh,
  icon,
  title,
  description,
  showSpinner = false,
  suggestions,
}: EmptyStateProps) {
  const theme = useTheme();

  const getConfig = () => {
    // Use custom props if provided
    if (icon || title || description) {
      return {
        icon: icon || 'book-open-blank-variant',
        title: title || 'Welcome to Wikipedia Expo',
        description:
          description ||
          'Start exploring articles to get personalized recommendations tailored to your interests.',
      };
    }

    // Fall back to type-based config
    switch (type) {
      default:
        return {
          icon: 'book-open-blank-variant',
          title: 'Welcome to Wikipedia Expo',
          description:
            'Start exploring articles to get personalized recommendations tailored to your interests.',
        };
    }
  };

  const config = getConfig();

  // Default suggestions for welcome state
  const defaultSuggestions =
    suggestions ||
    (type === 'welcome' || !type
      ? [
          {
            label: 'Browse Popular Articles',
            action: () => router.push('/(tabs)'),
            icon: 'trending-up',
          },
          {
            label: 'Explore Categories',
            action: () => router.push('/(tabs)/categories'),
            icon: 'folder-outline',
          },
          {
            label: 'Try Random Article',
            action: () => router.push('/(tabs)'),
            icon: 'shuffle',
          },
        ]
      : []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl, // Increased from 40 to SPACING.xxl (48dp) for more generous spacing
        minHeight: 500,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
            borderRadius: theme.roundness * 7, // 28dp equivalent (4dp * 7) - MD3 maximum standard value
          backgroundColor: theme.colors.surfaceVariant,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: SPACING.lg, // Increased from 24 to SPACING.lg (24dp) for consistency
        }}
      >
        <IconButton
          icon={config.icon}
          iconColor={theme.colors.onSurfaceVariant}
          size={40}
          style={{ margin: 0 }}
        />
      </View>
      <Text
        variant="headlineSmall"
        style={{
          textAlign: 'center',
          marginBottom: SPACING.base, // Increased from 16 to SPACING.base (16dp) for consistency
          // fontWeight removed - using variant default
          color: theme.colors.onSurface,
        }}
      >
        {config.title}
      </Text>
      <Text
        variant="bodyLarge"
        style={{
          textAlign: 'center',
          marginBottom: SPACING.xl, // Increased from 32 to SPACING.xl (32dp) for more spacing
          color: theme.colors.onSurfaceVariant,
          lineHeight: 26, // Increased from 24 to 26 for better readability (1.5x ratio)
        }}
      >
        {config.description}
      </Text>

      {/* Actionable suggestions */}
      {defaultSuggestions.length > 0 && !showSpinner && (
        <View style={{ width: '100%', maxWidth: 400, gap: SPACING.md }}>
          {defaultSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              mode="outlined"
              onPress={suggestion.action}
              icon={suggestion.icon}
              style={{
                borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
              }}
              contentStyle={{ paddingVertical: SPACING.sm }}
            >
              {suggestion.label}
            </Button>
          ))}
        </View>
      )}

      {showSpinner && <ActivityIndicator size="large" color={theme.colors.primary} />}
    </View>
  );
}
