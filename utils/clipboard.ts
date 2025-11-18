import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

/**
 * Clipboard utilities
 * Provides copy to clipboard functionality
 */

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when text is copied
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (Platform.OS === 'web') {
    // Web: Use navigator.clipboard if available, fallback to execCommand
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } else {
    // Native: Use expo-clipboard
    await Clipboard.setStringAsync(text);
  }
};

/**
 * Get text from clipboard
 * @returns Promise that resolves with clipboard text
 */
export const getFromClipboard = async (): Promise<string> => {
  if (Platform.OS === 'web') {
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    }
    return '';
  } else {
    return await Clipboard.getStringAsync();
  }
};
