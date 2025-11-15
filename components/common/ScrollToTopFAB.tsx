import React from 'react';
import { StyleSheet } from 'react-native';
import { AnimatedFAB, useTheme } from 'react-native-paper';

interface ScrollToTopFABProps {
  scrollRef: React.RefObject<any>;
  visible?: boolean;
}

export default function ScrollToTopFAB({
  scrollRef,
  visible = true
}: ScrollToTopFABProps) {
  const theme = useTheme();

  const scrollToTop = () => {
    // For FlashList, we need to use scrollToOffset instead of scrollTo
    if (scrollRef.current && scrollRef.current.scrollToOffset) {
      // FlashList
      scrollRef.current.scrollToOffset({ offset: 0, animated: true });
    } else if (scrollRef.current && scrollRef.current.scrollTo) {
      // ScrollView
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <AnimatedFAB
      icon="arrow-up"
      label="Scroll to top"
      extended={false}
      onPress={scrollToTop}
      visible={visible}
      animateFrom="right"
      iconMode="static"
      style={[styles.fabStyle, { backgroundColor: theme.colors.primary }]}
      color={theme.colors.onPrimary}
    />
  );
}

const styles = StyleSheet.create({
  fabStyle: {
    bottom: 40, // Position above bottom navigation
    right: 16,
    position: 'absolute',
  },
});