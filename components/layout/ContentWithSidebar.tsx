import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Card, Divider, Text, useTheme } from 'react-native-paper';
import { LAYOUT } from '../../constants/layout';

interface ContentWithSidebarProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

/**
 * Layout component that shows a right sidebar on large screens
 * Similar to Twitter's layout with main content and "What's happening" section
 */
export default function ContentWithSidebar({ children, sidebar }: ContentWithSidebarProps) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const showSidebar = width >= LAYOUT.SIDEBAR_BREAKPOINT;

  if (!showSidebar) {
    // On smaller screens, just show the main content
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Main content area */}
      <View style={{ flex: 1 }}>{children}</View>

      {/* Divider between Sidebar and feed */}
      <Divider style={{ width: 1, height: '100%' }} />

      {/* Right sidebar - fixed position (naturally sticky in flex layout) */}
      <View
        style={{
          width: LAYOUT.SIDEBAR_WIDTH,
          // No border - MD3 recommends using elevation or subtle dividers for sidebars
          // Sidebar separation is handled by background color contrast
          backgroundColor: theme.colors.surface,
        }}
      >
        <View
          style={{
            flex: 1,
            padding: 16,
            gap: 16,
            backgroundColor: theme.colors.surface,
          }}
        >
          {sidebar ? (
            sidebar
          ) : (
            // Default sidebar content if none provided
            <Card>
              <Card.Content>
                <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                  What's happening
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Sidebar content goes here
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </View>
    </View>
  );
}
