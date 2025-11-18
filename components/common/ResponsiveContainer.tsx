import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

/**
 * Responsive container that centers content and limits width on larger screens
 * Similar to Twitter's layout - full width on mobile, max width on desktop
 */
export default function ResponsiveContainer({
  children,
  maxWidth = 600,
}: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();

  // On screens wider than maxWidth, center the content
  const shouldCenter = width > maxWidth;

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.innerContainer,
          shouldCenter && {
            maxWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
  },
  innerContainer: {
    flex: 1,
  },
});
