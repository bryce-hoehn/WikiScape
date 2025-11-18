import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import { MOTION } from '../../constants/motion';

/**
 * Skip links for keyboard navigation accessibility
 * Allows users to skip directly to main content, bypassing navigation
 * Visible on focus (when tabbing through the page)
 */
export default function SkipLinks() {
  const theme = useTheme();
  const skipLinkRef = useRef<any>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Only show skip links on web
  if (Platform.OS !== 'web') {
    return null;
  }

  useEffect(() => {
    if (Platform.OS === 'web' && skipLinkRef.current) {
      const element = skipLinkRef.current as any;
      
      // Only create style once if it doesn't exist
      if (!styleRef.current) {
      const style = document.createElement('style');
      style.textContent = `
        .skip-link {
          position: absolute;
          top: -100px;
          left: 0;
          z-index: 10000;
          opacity: 0;
          transition: opacity ${MOTION.durationMedium}ms, top ${MOTION.durationMedium}ms;
        }
        .skip-link:focus {
          top: 0;
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
        styleRef.current = style;
      }
      
      element.classList.add('skip-link');
      
      return () => {
        // Only remove style if this is the last component using it
        // For now, we'll keep it since SkipLinks is typically mounted once
        // If multiple instances exist, consider using a shared style or CSS module
      };
    }
  }, []);

  const handlePress = () => {
    if (Platform.OS === 'web') {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        (mainContent as HTMLElement).focus();
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <TouchableRipple
      ref={skipLinkRef}
      style={[styles.skipLink, { backgroundColor: theme.colors.primary }]}
      onPress={handlePress}
      accessibilityLabel="Skip to main content"
      accessibilityHint="Skips navigation and goes directly to the main article feed"
    >
      <Text style={[styles.skipLinkText, { color: theme.colors.onPrimary }]}>
        Skip to main content
      </Text>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  skipLink: {
    padding: 12,
    margin: 8,
    borderRadius: 4,
  },
  skipLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
