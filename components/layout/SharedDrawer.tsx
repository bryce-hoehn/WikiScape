import { LAYOUT } from '@/constants/layout';
import { EASING, MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useScrollToTop } from '@/context/ScrollToTopContext';
import { useThemeContext } from '@/context/ThemeProvider';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { Divider, Drawer as RNDrawer, Text, TouchableRipple, useTheme } from 'react-native-paper';

interface SharedDrawerProps {
  children: React.ReactNode;
}

// Separate component for navigation items to handle hover state properly
function NavItem({
  item,
  active,
  backgroundColor,
  iconColor,
  textColor,
  theme,
  onPress,
}: {
  item: { route: string; title: string; icon: string };
  active: boolean;
  backgroundColor: string;
  iconColor: string;
  textColor: string;
  theme: any;
  onPress: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Web hover effect: subtle background change on hover
  const finalBackgroundColor =
    Platform.OS === 'web' && !active && isHovered ? theme.colors.surfaceVariant : backgroundColor;

  return (
    <TouchableRipple
      onPress={onPress}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      })}
      style={{
        marginLeft: 0,
        marginRight: 0,
        borderRadius: theme.roundness * 2, // 8dp equivalent (4dp * 2) - MD3 doesn't specify 24dp, using 8dp
        paddingHorizontal: SPACING.lg, // Increased from SPACING.base (16dp) to SPACING.lg (24dp)
        paddingVertical: SPACING.base, // Increased from SPACING.md (12dp) to SPACING.base (16dp)
        overflow: 'hidden',
        marginVertical: SPACING.xs,
        backgroundColor: finalBackgroundColor,
        ...(Platform.OS === 'web' && {
          transition: `background-color ${MOTION.durationMedium}ms cubic-bezier(${EASING.standard.join(', ')})`,
        }),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons
            name={item.icon as any}
            size={28} // Increased from 24 to 28 for bigger icons
            color={iconColor}
          />
        </View>
        <Text
          variant="titleLarge"
          style={{
            marginLeft: SPACING.md,
            // fontSize, fontWeight, and lineHeight removed - using variant defaults
            color: textColor,
          }}
        >
          {item.title}
        </Text>
      </View>
    </TouchableRipple>
  );
}

export default function SharedDrawer({ children }: SharedDrawerProps) {
  const theme = useTheme();
  const { currentTheme } = useThemeContext();
  const { width, height } = useWindowDimensions();
  const pathname = usePathname();
  const { scrollToTop } = useScrollToTop();
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT; // Desktop breakpoint (840dp)

  // Calculate top padding to align with first category card
  // Appbar.Header height (64px on desktop/web) + FlashList paddingVertical (8px) + card top margin (8px) = 80px
  const headerHeight = SPACING.xxxl; // Standard Appbar.Header height on desktop/web (64dp)
  const listPadding = SPACING.sm; // paddingVertical from FlashList contentContainerStyle
  const cardMargin = SPACING.sm; // margin from category cards
  const topPadding = headerHeight + listPadding + cardMargin;

  const navigationItems = [
    { route: '/(tabs)', pathname: '/', title: 'Home', icon: 'home' },
    { route: '/(tabs)/categories', pathname: '/categories', title: 'Categories', icon: 'category' },
    { route: '/(tabs)/search', pathname: '/search', title: 'Discover', icon: 'explore' },
    { route: '/(tabs)/bookmarks', pathname: '/bookmarks', title: 'Bookmarks', icon: 'bookmark' },
    { route: '/(tabs)/settings', pathname: '/settings', title: 'Settings', icon: 'settings' },
  ];

  const handleNavigation = (route: string, pathname: string) => {
    const isActive = isActiveRoute(route, pathname);
    if (isActive) {
      // Already on this tab, scroll to top
      // The home route ('/(tabs)') is now registered to scroll the currently active feed
      const scrollRoute = pathname === '/' ? '/(tabs)' : route;
      scrollToTop(scrollRoute);
    } else {
      // Navigate to the tab
      router.push(route as any);
    }
  };

  const isActiveRoute = (route: string, itemPathname: string) => {
    // Check exact match for home
    if (itemPathname === '/' && pathname === '/') return true;
    // Check if pathname starts with the item's pathname (for exact matches)
    if (pathname === itemPathname) return true;
    // Also check the route pattern for nested routes
    return pathname?.startsWith(itemPathname + '/') || pathname?.startsWith(route);
  };

  const isActive = (item: (typeof navigationItems)[0]) => {
    return isActiveRoute(item.route, item.pathname);
  };

  // On small screens, just render children (tabs handle navigation)
  if (!isLargeScreen) {
    return <>{children}</>;
  }

  // On large screens, show drawer navigation
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Wide gutter on the left (Bluesky-style) */}
      <View style={{ width: 88, backgroundColor: theme.colors.surface }} />

      {/* Drawer sidebar - fixed position (naturally sticky in flex layout) */}
      <View
        // @ts-expect-error - navigation role is valid for React Native Web but not in TypeScript types
        accessibilityRole="navigation"
        accessibilityLabel="Main navigation"
        style={{
          width: 280,
          height: '100%',
          backgroundColor: theme.colors.surface,
          // No border - MD3 recommends using elevation or subtle dividers for sidebars
          // Sidebar separation is handled by background color contrast
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingLeft: SPACING.base,
            paddingRight: SPACING.md, // Increased right padding to create gap between buttons and divider
            paddingTop: topPadding,
            paddingBottom: SPACING.base,
          }}
          showsVerticalScrollIndicator={false}
        >
          <RNDrawer.Section showDivider={false}>
            {navigationItems.map((item) => {
              const active = isActive(item);
              const isHighContrast =
                currentTheme === 'light-high-contrast' || currentTheme === 'dark-high-contrast';
              const iconColor = active ? theme.colors.primary : theme.colors.onSurfaceVariant;
              const textColor = active ? theme.colors.primary : theme.colors.onSurfaceVariant;
              // For high contrast themes, use a lighter background for better contrast with dark text
              const backgroundColor = active
                ? isHighContrast
                  ? theme.colors.surfaceVariant
                  : theme.colors.primaryContainer
                : 'transparent';

              return (
                <NavItem
                  key={item.route}
                  item={item}
                  active={active}
                  backgroundColor={backgroundColor}
                  iconColor={iconColor}
                  textColor={textColor}
                  theme={theme}
                  onPress={() => handleNavigation(item.route, item.pathname)}
                />
              );
            })}
          </RNDrawer.Section>
        </ScrollView>
      </View>

      {/* Divider between Nav Drawer and feed */}
      <Divider style={{ width: 1, height: '100%' }} />

      {/* Main content */}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
