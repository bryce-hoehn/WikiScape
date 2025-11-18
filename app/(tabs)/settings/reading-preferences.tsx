import { useFontFamily, useLineHeight, useParagraphSpacing, useReadingWidth } from '@/hooks';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Appbar, List, Menu, Text, useTheme } from 'react-native-paper';

export default function ReadingPreferencesScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { lineHeight, updateLineHeight } = useLineHeight();
  const { paragraphSpacing, updateParagraphSpacing } = useParagraphSpacing();
  const { readingWidth, updateReadingWidth } = useReadingWidth();
  const { fontFamily, updateFontFamily, fontFamilies } = useFontFamily();
  const [fontFamilyMenuVisible, setFontFamilyMenuVisible] = useState(false);

  // Responsive max width for content (max 800px for better readability)
  const maxContentWidth = Math.min(width - 32, 800);

  return (
    <>
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.surface,
        }}
        mode="center-aligned"
      >
        <Appbar.BackAction onPress={() => router.push('/(tabs)/settings')} />
        <Appbar.Content
          title="Reading Preferences"
          titleStyle={{
            fontWeight: '700',
            fontSize: 20,
          }}
        />
      </Appbar.Header>

      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        {/* Reading Preferences Section */}
        <List.Section>
          <List.Subheader>Reading Preferences</List.Subheader>

          {/* Line Height */}
          <List.Item
            title="Line Height"
            description={`${lineHeight.toFixed(1)}x • Adjust spacing between lines of text`}
            left={(props) => <List.Icon {...props} icon="format-line-spacing" />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {lineHeight.toFixed(1)}x
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                1.0x - 2.5x
              </Text>
            </View>
            <Slider
              value={lineHeight}
              onValueChange={updateLineHeight}
              minimumValue={1.0}
              maximumValue={2.5}
              step={0.1}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.outlineVariant}
              thumbTintColor={theme.colors.primary}
            />
          </View>

          {/* Paragraph Spacing */}
          <List.Item
            title="Paragraph Spacing"
            description={`${paragraphSpacing}px • Adjust spacing between paragraphs`}
            left={(props) => <List.Icon {...props} icon="format-paragraph" />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {paragraphSpacing}px
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                0px - 32px
              </Text>
            </View>
            <Slider
              value={paragraphSpacing}
              onValueChange={updateParagraphSpacing}
              minimumValue={0}
              maximumValue={32}
              step={4}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.outlineVariant}
              thumbTintColor={theme.colors.primary}
            />
          </View>

          {/* Reading Width */}
          <List.Item
            title="Reading Width"
            description={`${readingWidth}px • Adjust maximum width of article content`}
            left={(props) => <List.Icon {...props} icon="resize" />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {readingWidth}px
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                400px - 1200px
              </Text>
            </View>
            <Slider
              value={readingWidth}
              onValueChange={updateReadingWidth}
              minimumValue={400}
              maximumValue={1200}
              step={50}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.outlineVariant}
              thumbTintColor={theme.colors.primary}
            />
          </View>

          {/* Font Family */}
          <Menu
            visible={fontFamilyMenuVisible}
            onDismiss={() => setFontFamilyMenuVisible(false)}
            anchorPosition="bottom"
            anchor={
              <List.Item
                title="Font Family"
                description={`${fontFamilies.find((f) => f.value === fontFamily)?.label || 'System Default'} • Choose your preferred font style`}
                left={(props) => <List.Icon {...props} icon="format-font" />}
                right={(props) => <List.Icon {...props} icon="chevron-down" />}
                onPress={() => setFontFamilyMenuVisible(true)}
                titleStyle={{ fontWeight: '500' }}
                descriptionNumberOfLines={2}
              />
            }
          >
            {fontFamilies.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  updateFontFamily(option.value);
                  setFontFamilyMenuVisible(false);
                }}
                title={option.label}
                leadingIcon={fontFamily === option.value ? 'check' : undefined}
              />
            ))}
          </Menu>
        </List.Section>
      </ScrollView>
    </>
  );
}
