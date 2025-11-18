import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utilities
 * Provides haptic feedback for user interactions
 */

/**
 * Light haptic feedback for button presses
 */
export const hapticLight = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Medium haptic feedback for important actions
 */
export const hapticMedium = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Heavy haptic feedback for significant actions
 */
export const hapticHeavy = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Haptic feedback for selection changes
 */
export const hapticSelection = () => {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
};

/**
 * Success notification haptic
 */
export const hapticSuccess = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Warning notification haptic
 */
export const hapticWarning = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Error notification haptic
 */
export const hapticError = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};
