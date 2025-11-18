import ProgressModal from '@/components/common/ProgressModal';
import { LAYOUT } from '@/constants/layout';
import { useBookmarks } from '@/context/BookmarksContext';
import { useThemeContext } from '@/context/ThemeProvider';
import { useNsfwFilter, useReducedMotion, useVisitedArticles } from '@/hooks';
import {
  exportUserProfile,
  importUserProfile,
  readFileContent,
} from '@/utils/bookmarkImportExport';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import {
  Appbar,
  Button,
  Divider,
  List,
  Menu,
  Modal,
  Portal,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSnackbar } from '../../context/SnackbarContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { currentTheme, setTheme } = useThemeContext();
  const { visitedArticles, loadVisitedArticles } = useVisitedArticles();
  const { setNsfwFilterEnabled } = useNsfwFilter();
  const { reducedMotion, setReducedMotion } = useReducedMotion();
  const { showSuccess, showError } = useSnackbar();
  const { bookmarks, loadBookmarks } = useBookmarks();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  // Responsive max width for content
  const maxContentWidth = Math.min(width - 32, LAYOUT.MAX_CONTENT_WIDTH);

  const themeOptions = [
    { label: 'Automatic', value: 'automatic' },
    { label: 'Light', value: 'light' },
    { label: 'Light Medium Contrast', value: 'light-medium-contrast' },
    { label: 'Light High Contrast', value: 'light-high-contrast' },
    { label: 'Dark', value: 'dark' },
    { label: 'Dark Medium Contrast', value: 'dark-medium-contrast' },
    { label: 'Dark High Contrast', value: 'dark-high-contrast' },
    { label: 'Papyrus', value: 'papyrus' },
  ];

  const getThemeDisplayName = (themeValue: string) => {
    const option = themeOptions.find((opt) => opt.value === themeValue);
    return option ? option.label : 'Automatic';
  };

  const handleExportProfile = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for export (since it's relatively fast)
      setExportProgress(0.3);
      await new Promise((resolve) => setTimeout(resolve, 100));

      setExportProgress(0.6);
      await exportUserProfile();

      setExportProgress(1.0);
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Export completed successfully
      showSuccess(
        `Successfully exported user profile (${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''}, ${visitedArticles.length} history item${visitedArticles.length !== 1 ? 's' : ''}, and settings)`
      );
    } catch {
      showError('Failed to export user profile. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleImportProfile = async () => {
    const confirmAction = async () => {
      setIsImporting(true);
      setImportProgress(0);
      try {
        if (Platform.OS === 'web') {
          // Web: Use file input
          return new Promise<void>((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.onchange = async (e) => {
              const target = e.target as HTMLInputElement;
              const selectedFile = target.files?.[0];
              if (!selectedFile) {
                setIsImporting(false);
                resolve();
                return;
              }

              try {
                setImportProgress(0.2);
                const content = await readFileContent(selectedFile);

                setImportProgress(0.5);
                const result = await importUserProfile(content);

                setImportProgress(0.7);
                // Reload all data
                await loadBookmarks();
                await loadVisitedArticles();

                setImportProgress(0.8);
                // Update settings if imported
                if (result.theme !== null) {
                  await setTheme(result.theme);
                }
                if (result.nsfwFilterEnabled !== null) {
                  await setNsfwFilterEnabled(result.nsfwFilterEnabled);
                }

                setImportProgress(0.95);
                const parts: string[] = [];
                if (result.bookmarks.length > 0) {
                  parts.push(
                    `${result.bookmarks.length} bookmark${result.bookmarks.length !== 1 ? 's' : ''}`
                  );
                }
                if (result.visitedArticles.length > 0) {
                  parts.push(
                    `${result.visitedArticles.length} history item${result.visitedArticles.length !== 1 ? 's' : ''}`
                  );
                }
                if (
                  result.theme !== null ||
                  result.nsfwFilterEnabled !== null ||
                  result.fontSize !== null
                ) {
                  parts.push('settings');
                }

                setImportProgress(1.0);
                await new Promise((resolve) => setTimeout(resolve, 200));

                showSuccess(`Successfully imported user profile (${parts.join(', ')})`);
              } catch {
                showError('Failed to import user profile. Please check the file format.');
              } finally {
                setIsImporting(false);
                setImportProgress(0);
                resolve();
              }
            };
            input.click();
          });
        } else {
          // Mobile: Use document picker
          let DocumentPicker;
          try {
            DocumentPicker = require('expo-document-picker');
          } catch (error) {
            showError(
              'Document picker is not available. Please rebuild the app or restart the development server.'
            );
            setIsImporting(false);
            return;
          }

          const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true,
          });

          if (result.canceled) {
            setIsImporting(false);
            return;
          }

          setImportProgress(0.2);
          const file = { uri: result.assets[0].uri };
          const content = await readFileContent(file);

          setImportProgress(0.5);
          const importResult = await importUserProfile(content);

          setImportProgress(0.7);
          // Reload all data
          await loadBookmarks();
          await loadVisitedArticles();

          setImportProgress(0.8);
          // Update settings if imported
          if (importResult.theme !== null) {
            await setTheme(importResult.theme);
          }
          if (importResult.nsfwFilterEnabled !== null) {
            await setNsfwFilterEnabled(importResult.nsfwFilterEnabled);
          }

          setImportProgress(0.95);
          const parts: string[] = [];
          if (importResult.bookmarks.length > 0) {
            parts.push(
              `${importResult.bookmarks.length} bookmark${importResult.bookmarks.length !== 1 ? 's' : ''}`
            );
          }
          if (importResult.visitedArticles.length > 0) {
            parts.push(
              `${importResult.visitedArticles.length} history item${importResult.visitedArticles.length !== 1 ? 's' : ''}`
            );
          }
          if (
            importResult.theme !== null ||
            importResult.nsfwFilterEnabled !== null ||
            importResult.fontSize !== null
          ) {
            parts.push('settings');
          }

          setImportProgress(1.0);
          await new Promise((resolve) => setTimeout(resolve, 200));

          showSuccess(`Successfully imported user profile (${parts.join(', ')})`);
        }
      } catch {
        showError('Failed to import user profile. Please check the file format.');
      } finally {
        setIsImporting(false);
        setImportProgress(0);
      }
    };

    if (Platform.OS === 'web') {
      confirmAction();
    } else {
      Alert.alert(
        'Import User Profile',
        'This will replace your current bookmarks, reading history, and settings with the imported data. Are you sure you want to continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Import',
            onPress: confirmAction,
          },
        ]
      );
    }
  };

  return (
    <>
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.surface,
        }}
        mode="center-aligned"
      >
        <Appbar.Content
          title="Settings"
          titleStyle={{
            fontWeight: '700',
            fontSize: 20,
          }}
        />
        <Appbar.Action
          icon="help-circle-outline"
          onPress={() => setHelpVisible(true)}
          accessibilityLabel="Help"
          accessibilityHint="Shows help information about settings"
        />
      </Appbar.Header>

      <Portal>
        <Modal
          visible={helpVisible}
          onDismiss={() => setHelpVisible(false)}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 24,
            margin: 20,
            borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
          }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16, fontWeight: '700' }}>
            Settings Help
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 16, lineHeight: 22 }}>
            <Text style={{ fontWeight: '600' }}>Theme:</Text> Choose your preferred color scheme.
            Automatic follows your system settings.
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 16, lineHeight: 22 }}>
            <Text style={{ fontWeight: '600' }}>Hide Sensitive Content:</Text> Blurs sensitive
            images using Wikipedia&apos;s official content filter.
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 16, lineHeight: 22 }}>
            <Text style={{ fontWeight: '600' }}>Reading Preferences:</Text> Customize your reading
            experience with line height, paragraph spacing, reading width, and font family settings.
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 16, lineHeight: 22 }}>
            <Text style={{ fontWeight: '600' }}>Reading History:</Text> View articles you&apos;ve
            recently read. Used for personalized recommendations. Access from the Reading section.
          </Text>
          <Button mode="contained" onPress={() => setHelpVisible(false)} style={{ marginTop: 8 }}>
            Got it
          </Button>
        </Modal>

        <ProgressModal
          visible={isExporting}
          progress={exportProgress}
          message="Exporting user profile..."
          showPercentage={true}
          onCancel={() => {
            setIsExporting(false);
            setExportProgress(0);
          }}
          cancelLabel="Cancel"
        />

        <ProgressModal
          visible={isImporting}
          progress={importProgress}
          message="Importing user profile..."
          showPercentage={true}
          onCancel={() => {
            setIsImporting(false);
            setImportProgress(0);
          }}
          cancelLabel="Cancel"
        />
      </Portal>

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
        {/* App Settings Section */}
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <Menu
            visible={themeMenuVisible}
            onDismiss={() => setThemeMenuVisible(false)}
            anchorPosition="bottom"
            anchor={
              <List.Item
                title="Theme"
                description={`${getThemeDisplayName(currentTheme)} • Choose light, dark, or automatic theme based on system settings`}
                left={(props) => <List.Icon {...props} icon="palette" />}
                right={(props) => <List.Icon {...props} icon="chevron-down" />}
                onPress={() => setThemeMenuVisible(true)}
                titleStyle={{ fontWeight: '500' }}
                descriptionNumberOfLines={2}
              />
            }
          >
            {themeOptions.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  setTheme(option.value as any);
                  setThemeMenuVisible(false);
                }}
                title={option.label}
                leadingIcon={currentTheme === option.value ? 'check' : undefined}
              />
            ))}
          </Menu>
          {/* Temporarily commented out - NSFW filter disabled by default */}
          {/* <List.Item
            title="Hide Sensitive Content"
            description="Blur sensitive images until tapped. Uses Wikipedia's official content filter list. Note: The official filter list may not be all inclusive."
            left={(props) => <List.Icon {...props} icon="eye-off" />}
            right={() => (
              <Switch
                value={isNsfwFilterEnabled}
                onValueChange={setNsfwFilterEnabled}
              />
            )}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={3}
          /> */}
        </List.Section>

        <Divider style={{ marginVertical: 8 }} />

        {/* Accessibility Section */}
        <List.Section>
          <List.Subheader>Accessibility</List.Subheader>
          <List.Item
            title="Reduce Motion"
            description="Disable non-essential animations for a more static experience. Helps reduce motion sensitivity and improves performance."
            left={(props) => <List.Icon {...props} icon="motion-pause" />}
            right={() => <Switch value={reducedMotion} onValueChange={setReducedMotion} />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
        </List.Section>

        <Divider style={{ marginVertical: 8 }} />

        {/* Reading Preferences Section */}
        <List.Section>
          <List.Subheader>Reading</List.Subheader>
          <List.Item
            title="Reading Preferences"
            description="Customize line height, paragraph spacing, reading width, and font family"
            left={(props) => <List.Icon {...props} icon="book-open-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/(tabs)/settings/reading-preferences')}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <List.Item
            title="Reading History"
            description={`${visitedArticles.length} articles visited • View your recently read articles and browsing history`}
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/(tabs)/settings/reading-history')}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
        </List.Section>

        <Divider style={{ marginVertical: 8 }} />

        {/* Data Management Section */}
        <List.Section>
          <List.Subheader>Data & Privacy</List.Subheader>
          <List.Item
            title="User Profile"
            description={`${bookmarks.length} bookmarks, ${visitedArticles.length} history items • Export or import your complete profile`}
            left={(props) => <List.Icon {...props} icon="account-box-outline" />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginBottom: 12,
                lineHeight: 18,
              }}
            >
              Export your complete user profile (bookmarks, reading history, reading progress, and
              settings) to a JSON file for backup, or import from a previously exported file.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <Button
                mode="outlined"
                onPress={handleExportProfile}
                disabled={isExporting || isImporting}
                loading={isExporting}
                icon="export"
                style={{ flex: 1, minWidth: 120 }}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                mode="outlined"
                onPress={handleImportProfile}
                disabled={isExporting || isImporting}
                loading={isImporting}
                icon="import"
                style={{ flex: 1, minWidth: 120 }}
              >
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
            </View>
          </View>
        </List.Section>

        <Divider style={{ marginVertical: 8 }} />

        {/* App Information Section */}
        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description="0.1.0-beta • Beta version"
            left={(props) => <List.Icon {...props} icon="information-outline" />}
            titleStyle={{ fontWeight: '500' }}
          />
          <List.Item
            title="Report Bugs"
            description="Found a bug or have feedback? Report it on GitHub"
            left={(props) => <List.Icon {...props} icon="bug-outline" />}
            right={(props) => <List.Icon {...props} icon="open-in-new" />}
            onPress={() => {
              const url = 'https://github.com/bryce-hoehn/WikiFlow/issues';
              if (Platform.OS === 'web') {
                window.open(url, '_blank', 'noopener,noreferrer');
              } else {
                Linking.openURL(url).catch((err: Error) => {
                  if (typeof __DEV__ !== 'undefined' && __DEV__) {
                    console.error('Failed to open GitHub issues:', err);
                  }
                  showError(
                    'Unable to open GitHub. Please visit: https://github.com/bryce-hoehn/WikiFlow/issues'
                  );
                });
              }
            }}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={2}
          />
          <List.Item
            title="Data Privacy"
            description="Your reading history and bookmarks are stored locally on your device and never shared with external servers. All data remains private."
            left={(props) => <List.Icon {...props} icon="shield-check-outline" />}
            titleStyle={{ fontWeight: '500' }}
            descriptionNumberOfLines={3}
          />
        </List.Section>
      </ScrollView>
    </>
  );
}
