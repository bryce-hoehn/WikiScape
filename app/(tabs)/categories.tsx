import CollapsibleHeader from '@/components/common/CollapsibleHeader';
import { LAYOUT } from '@/constants/layout';
import { getHoverStyles } from '@/constants/motion';
import { useScrollToTop } from '@/context/ScrollToTopContext';
import { useReducedMotion } from '@/hooks';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, View, useWindowDimensions } from 'react-native';
import { Card, Text, useTheme, type MD3Theme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const rootCategories = {
  'Academic disciplines': require('../../assets/images/categories/Academic disciplines.jpg'),
  Behavior: require('../../assets/images/categories/Behavior.jpg'),
  Business: require('../../assets/images/categories/Business.jpg'),
  Communication: require('../../assets/images/categories/Communication.jpg'),
  Concepts: require('../../assets/images/categories/Concepts.png'),
  Culture: require('../../assets/images/categories/Culture.jpg'),
  Economy: require('../../assets/images/categories/Economy.jpg'),
  Education: require('../../assets/images/categories/Education.jpg'),
  Energy: require('../../assets/images/categories/Energy.jpg'),
  Engineering: require('../../assets/images/categories/Engineering.jpg'),
  Entities: require('../../assets/images/categories/Entities.png'),
  'Food and drink': require('../../assets/images/categories/Food and Drink.jpg'),
  Geography: require('../../assets/images/categories/Geography.jpeg'),
  Government: require('../../assets/images/categories/Government.jpg'),
  Humanities: require('../../assets/images/categories/Humanities.jpg'),
  Information: require('../../assets/images/categories/Information.jpg'),
  Knowledge: require('../../assets/images/categories/Knowledge.jpg'),
  Language: require('../../assets/images/categories/Language.jpg'),
  Law: require('../../assets/images/categories/Law.jpg'),
  Life: require('../../assets/images/categories/Life.jpg'),
  Lists: require('../../assets/images/categories/Lists.png'),
  'Mass media': require('../../assets/images/categories/Mass media.jpg'),
  Mathematics: require('../../assets/images/categories/Mathematics.png'),
  Nature: require('../../assets/images/categories/Nature.jpg'),
  People: require('../../assets/images/categories/People.jpg'),
  Philosophy: require('../../assets/images/categories/Philosophy.jpg'),
  Politics: require('../../assets/images/categories/Politics.jpg'),
  Religion: require('../../assets/images/categories/Religion.png'),
  Science: require('../../assets/images/categories/Science.png'),
  Society: require('../../assets/images/categories/Society.jpg'),
  Technology: require('../../assets/images/categories/Technology.jpg'),
  Time: require('../../assets/images/categories/Time.jpg'),
  Universe: require('../../assets/images/categories/Universe.jpg'),
} as const;

const HEADER_HEIGHT = 60;

// Separate component for category items to handle hover state
function CategoryItem({
  item,
  cardHeight,
  theme,
}: {
  item: [string, any];
  cardHeight: number;
  theme: MD3Theme;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { reducedMotion } = useReducedMotion();

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  return (
    <Card
      style={{
        flex: 1,
        margin: 8,
        borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
        elevation: isHovered && Platform.OS === 'web' ? 3 : 1,
        overflow: 'hidden',
        ...(Platform.OS === 'web' &&
          getHoverStyles(isHovered, reducedMotion, { scale: 1.02 })),
      }}
      onPress={() => router.push(`/subcategory/${encodeURIComponent(item[0])}`)}
      {...(Platform.OS === 'web' && {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${item[0]} category`}
      accessibilityHint={`Opens articles in the ${item[0]} category`}
    >
      <Image
        source={item[1]}
        style={{
          height: cardHeight,
          width: '100%',
          borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
        }}
        alt={`${item[0]} category image`}
        accessibilityLabel={`${item[0]} category`}
        accessibilityHint={`Image representing the ${item[0]} category`}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          // Use theme scrim color with 30% opacity
          backgroundColor: theme.colors.scrim + '4D', // 30% opacity (0x4D in hex = 77/255 ≈ 0.3)
          borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
        }}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      >
        <Text
          variant="titleLarge"
          style={{
            fontWeight: '700',
            color: '#FFFFFF', // Always white for contrast with image background
            textAlign: 'center',
            paddingHorizontal: 8,
            // Add black border/outline using text shadow
            textShadowColor: '#000000',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 5,
          }}
          numberOfLines={2}
          accessibilityRole="text"
        >
          {item[0]}
        </Text>
      </View>
    </Card>
  );
}

export default function CategoriesScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { registerScrollRef, scrollToTop } = useScrollToTop();
  const scrollY = useRef(new Animated.Value(0)).current;
  const flashListRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const wasFocusedRef = useRef(false);

  // Register scroll ref for scroll-to-top functionality
  useEffect(() => {
    registerScrollRef('/(tabs)/categories', {
      scrollToTop: () => {
        if (flashListRef.current) {
          flashListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      },
    });
  }, [registerScrollRef]);

  // Listen for tab press from bottom nav bar - scroll to top if already focused
  useFocusEffect(
    useCallback(() => {
      // If we were already focused before, this means the user pressed the tab again
      if (wasFocusedRef.current) {
        scrollToTop('/(tabs)/categories');
      }
      // Mark as focused for next time
      wasFocusedRef.current = true;
    }, [scrollToTop])
  );

  // Calculate responsive grid columns and max width
  const numColumns =
    width >= LAYOUT.XLARGE_BREAKPOINT ? 4 : width >= LAYOUT.DESKTOP_BREAKPOINT ? 3 : 2;
  const categoriesMaxWidth = useMemo(() => Math.max(LAYOUT.MAX_GRID_WIDTH, 1600), []); // Increased width for categories
  const maxContentWidth = useMemo(
    () => Math.min(width - 32, categoriesMaxWidth),
    [width, categoriesMaxWidth]
  );
  const horizontalPadding = useMemo(
    () => (width > categoriesMaxWidth ? (width - categoriesMaxWidth) / 2 + 8 : 8),
    [width, categoriesMaxWidth]
  );

  // Responsive card height - taller on larger screens
  const cardHeight = useMemo(() => (width >= LAYOUT.DESKTOP_BREAKPOINT ? 140 : 96), [width]);

  const renderCategoryItem = useCallback(
    ({ item }: { item: [string, any] }) => (
      <CategoryItem item={item} cardHeight={cardHeight} theme={theme} />
    ),
    [cardHeight, theme]
  );

  const totalHeaderHeight = HEADER_HEIGHT + insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Collapsible Header */}
      <CollapsibleHeader scrollY={scrollY} headerHeight={totalHeaderHeight}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: insets.top,
          }}
        >
          <Text
            style={{
              fontWeight: '700',
              fontSize: 20,
              color: theme.colors.onSurface,
            }}
          >
            Categories
          </Text>
        </View>
      </CollapsibleHeader>

      <FlashList
        ref={flashListRef}
        data={Object.entries(rootCategories)}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item[0]}
        numColumns={numColumns}
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          paddingTop: totalHeaderHeight + 8,
          paddingHorizontal: horizontalPadding,
          paddingVertical: 8,
          flexGrow: 1,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%',
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      />
    </View>
  );
}
