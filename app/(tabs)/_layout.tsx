import SkipLinks from '@/components/common/SkipLinks';
import AppSidebar from '@/components/layout/AppSidebar';
import ContentWithSidebar from '@/components/layout/ContentWithSidebar';
import SharedDrawer from '@/components/layout/SharedDrawer';
import { LAYOUT } from '@/constants/layout';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function TabLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
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
        </SharedDrawer>
      </ContentWithSidebar>
    </>
  );
}
