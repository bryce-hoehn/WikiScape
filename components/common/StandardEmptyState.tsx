import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';

interface StandardEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  showSpinner?: boolean;
  suggestions?: Array<{ label: string; action: () => void; icon?: string }>;
}

/**
 * Unified empty state component with consistent styling
 * Replaces various empty state implementations across the app
 */
export default function StandardEmptyState({
  icon = 'book-open-blank-variant',
  title,
  description,
  actionLabel,
  onAction,
  showSpinner = false,
  suggestions = [],
}: StandardEmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl, // Increased from 40 to SPACING.xxl (48dp) for more generous spacing
        minHeight: 400,
      }}
    >
      {showSpinner ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
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
            icon={icon}
            iconColor={theme.colors.onSurfaceVariant}
            size={40}
            style={{ margin: 0 }}
          />
        </View>
      )}

      <Text
        variant="headlineSmall"
        style={{
          textAlign: 'center',
          marginBottom: description ? SPACING.md : 0, // Increased from 12 to SPACING.md (12dp) for consistency
          // fontWeight removed - using variant default
          color: theme.colors.onSurface,
        }}
      >
        {title}
      </Text>

      {description && (
        <Text
          variant="bodyMedium"
          style={{
            textAlign: 'center',
            marginBottom: actionLabel || suggestions.length > 0 ? SPACING.lg : 0, // Increased from 24 to SPACING.lg (24dp) for consistency
            color: theme.colors.onSurfaceVariant,
            lineHeight: 24, // Increased from 20 to 24 for better readability (1.5x ratio)
            maxWidth: 400,
          }}
        >
          {description}
        </Text>
      )}

      {/* Actionable suggestions */}
      {suggestions.length > 0 && (
        <View style={{ width: '100%', maxWidth: 400, marginTop: 8 }}>
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              mode="outlined"
              onPress={suggestion.action}
              icon={suggestion.icon}
              style={{
                marginBottom: SPACING.sm,
                borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
              }}
              contentStyle={{ paddingVertical: SPACING.sm }}
              accessibilityLabel={suggestion.label}
              accessibilityHint={`${suggestion.label} action`}
            >
              {suggestion.label}
            </Button>
          ))}
        </View>
      )}

      {actionLabel && onAction && !suggestions.length && (
        <Button
          mode="contained"
          onPress={onAction}
          style={{
            marginTop: SPACING.base,
            borderRadius: theme.roundness * 0.75, // 12dp equivalent
            paddingHorizontal: SPACING.lg,
          }}
          contentStyle={{ paddingVertical: SPACING.sm }}
          accessibilityLabel={actionLabel}
          accessibilityHint={`${actionLabel} action`}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
