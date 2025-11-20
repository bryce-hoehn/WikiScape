import { SPACING } from '@/constants/spacing';
import { TYPOGRAPHY } from '@/constants/typography';
import { useAccordionBehavior, useFontFamily, useFontSize, useLineHeight, useParagraphSpacing, useReadingWidth } from '@/hooks';
import { DEFAULT_FONT_SIZE, MAX_FONT_SIZE, MIN_FONT_SIZE } from '@/hooks/storage/useFontSize';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Appbar, IconButton, List, Menu, Switch, Text, useTheme } from 'react-native-paper';

export default function ReadingPreferencesScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { fontSize, updateFontSize, resetFontSize } = useFontSize();
  const { lineHeight, updateLineHeight, resetLineHeight } = useLineHeight();
  const { paragraphSpacing, updateParagraphSpacing, resetParagraphSpacing } = useParagraphSpacing();
  const { readingPadding, updateReadingPadding, resetReadingPadding } = useReadingWidth();
  const { fontFamily, updateFontFamily, fontFamilies } = useFontFamily();
  const { accordionAutoClose, setAccordionAutoClose } = useAccordionBehavior();
  const [fontFamilyMenuVisible, setFontFamilyMenuVisible] = useState(false);

  // Responsive max width for content (max 800px for better readability)
  const maxContentWidth = Math.min(width - SPACING.xl, 800);

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
            // MD3: Center-aligned app bars use 22sp title
            // Reference: https://m3.material.io/components/app-bars/overview
            fontWeight: '500', // MD3: Medium weight (500) for app bar titles
            fontSize: TYPOGRAPHY.appBarTitle,
          }}
        />
      </Appbar.Header>

      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          padding: SPACING.base,
          paddingBottom: SPACING.xl,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        {/* Reading Preferences Section */}
        <List.Section>
          <List.Subheader>Reading Preferences</List.Subheader>

          {/* Font Size */}
          <List.Item
            title="Font Size"
            description={`${fontSize}px • Adjust the size of article text`}
            left={(props) => <List.Icon {...props} icon="format-size" />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <View style={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING.base }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: SPACING.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                  {fontSize}px
                </Text>
                {fontSize !== DEFAULT_FONT_SIZE && (
                  <IconButton
                    icon="restore"
                    size={20}
                    iconColor={theme.colors.primary}
                    onPress={resetFontSize}
                    accessibilityLabel="Reset to default"
                    style={{ margin: 0 }}
                  />
                )}
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {MIN_FONT_SIZE}px - {MAX_FONT_SIZE}px
              </Text>
            </View>
            <Slider
              value={fontSize}
              onValueChange={updateFontSize}
              minimumValue={MIN_FONT_SIZE}
              maximumValue={MAX_FONT_SIZE}
              step={2}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.outlineVariant}
              thumbTintColor={theme.colors.primary}
            />
          </View>

          {/* Line Height */}
          <List.Item
            title="Line Height"
            description={`${lineHeight.toFixed(1)}x • Adjust spacing between lines of text`}
            left={(props) => <List.Icon {...props} icon="format-line-spacing" />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <View style={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING.base }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: SPACING.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                  {lineHeight.toFixed(1)}x
                </Text>
                {lineHeight !== 1.6 && (
                  <IconButton
                    icon="restore"
                    size={20}
                    iconColor={theme.colors.primary}
                    onPress={resetLineHeight}
                    accessibilityLabel="Reset to default"
                    style={{ margin: 0 }}
                  />
                )}
              </View>
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
          <View style={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING.base }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: SPACING.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                  {paragraphSpacing}px
                </Text>
                {paragraphSpacing !== 16 && (
                  <IconButton
                    icon="restore"
                    size={20}
                    iconColor={theme.colors.primary}
                    onPress={resetParagraphSpacing}
                    accessibilityLabel="Reset to default"
                    style={{ margin: 0 }}
                  />
                )}
              </View>
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

          {/* Reading Padding */}
          <List.Item
            title="Content Padding"
            description={`${readingPadding}px • Adjust horizontal padding around article content`}
            left={(props) => <List.Icon {...props} icon="format-horizontal-align-center" />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <View style={{ paddingHorizontal: SPACING.base, paddingBottom: SPACING.base }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: SPACING.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                  {readingPadding}px
                </Text>
                {readingPadding !== 16 && (
                  <IconButton
                    icon="restore"
                    size={20}
                    iconColor={theme.colors.primary}
                    onPress={resetReadingPadding}
                    accessibilityLabel="Reset to default"
                    style={{ margin: 0 }}
                  />
                )}
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                0px - 200px
              </Text>
            </View>
            <Slider
              value={readingPadding}
              onValueChange={updateReadingPadding}
              minimumValue={0}
              maximumValue={200}
              step={8}
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

          {/* Accordion Behavior */}
          <List.Item
            title="Auto-close Sections"
            description={accordionAutoClose 
              ? "Opening a new section automatically closes others" 
              : "Multiple sections can be open at the same time"}
            left={(props) => <List.Icon {...props} icon="menu-swap" />}
            right={() => (
              <Switch
                value={accordionAutoClose}
                onValueChange={setAccordionAutoClose}
                accessibilityLabel="Auto-close sections"
              />
            )}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
        </List.Section>
      </ScrollView>
    </>
  );
}
