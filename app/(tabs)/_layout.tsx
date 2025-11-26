import SkipLinks from '@/components/common/SkipLinks';
import AppSidebar from '@/components/layout/AppSidebar';
import ContentWithSidebar from '@/components/layout/ContentWithSidebar';
import SharedDrawer from '@/components/layout/SharedDrawer';
import { COMPONENT_HEIGHTS, LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;

  // Common screen options
  const commonScreenOptions = {
    headerShown: false,
  };

  return (
    <>
      <SkipLinks />
      <ContentWithSidebar sidebar={<AppSidebar />}>
        <SharedDrawer>
          <View
            {...(!isLargeScreen && {
              accessibilityRole: 'navigation' as any,
              accessibilityLabel: 'Tab navigation',
            })}
            style={{ flex: 1 }}
          >
            <Tabs
              screenOptions={{
                ...commonScreenOptions,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                // Hide tab bar on large screens (drawer handles navigation)
                tabBarStyle: isLargeScreen
                  ? {
                      display: 'none',
                      height: 0,
                    }
                  : {
                      backgroundColor: theme.colors.surface,
                      borderTopWidth: 0,
                      // Add safe area padding for iOS PWA home indicator
                      paddingBottom: Platform.OS === 'web' ? Math.max(insets.bottom, SPACING.sm) : insets.bottom,
                      height: COMPONENT_HEIGHTS.STANDARD + (Platform.OS === 'web' ? Math.max(insets.bottom, SPACING.sm) : insets.bottom),
                      // Ensure tab bar is visible and positioned correctly on web mobile browsers
                      ...(Platform.OS === 'web' && {
                        position: 'fixed' as any,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                      }),
                    },
              }}
            >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, size }) => (
                  <MaterialIcons name="home" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="categories"
              options={{
                title: 'Categories',
                tabBarIcon: ({ color, size }) => (
                  <MaterialIcons name="category" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="search"
              options={{
                title: 'Discover',
                tabBarIcon: ({ color, size }) => (
                  <MaterialIcons name="explore" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="bookmarks"
              options={{
                title: 'Bookmarks',
                tabBarIcon: ({ color, size }) => (
                  <MaterialIcons name="bookmark" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
                tabBarIcon: ({ color, size }) => (
                  <MaterialIcons name="settings" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="settings/reading-preferences"
              options={{
                href: null, // Hide from tab bar
              }}
            />
            <Tabs.Screen
              name="settings/reading-history"
              options={{
                href: null, // Hide from tab bar
              }}
            />
            </Tabs>
          </View>
        </SharedDrawer>
      </ContentWithSidebar>
    </>
  );
}
