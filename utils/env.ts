import Constants from 'expo-constants';

/**
 * Environment Configuration Utility
 *
 * Centralized access to environment variables and app configuration.
 * Uses expo-constants for app config and process.env for EXPO_PUBLIC_* variables.
 */

/**
 * Get the app version from expo-constants
 * @returns The app version string (e.g., "0.1.0-beta")
 */
export const getAppVersion = (): string => {
  return Constants.expoConfig?.version || '0.1.0';
};

/**
 * Get an environment variable with optional default value
 * Only EXPO_PUBLIC_* variables are available in client-side code
 * @param key - The environment variable key (without EXPO_PUBLIC_ prefix)
 * @param defaultValue - Optional default value if variable is not set
 * @returns The environment variable value or default
 */
export const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  const fullKey = `EXPO_PUBLIC_${key}`;
  return process.env[fullKey] || defaultValue;
};

/**
 * Check if running in development mode
 * @returns True if __DEV__ is true
 */
export const isDev = (): boolean => {
  return typeof __DEV__ !== 'undefined' && __DEV__;
};

/**
 * Get app name from expo-constants
 * @returns The app name string
 */
export const getAppName = (): string => {
  return Constants.expoConfig?.name || 'WikiFlow';
};

/**
 * Get app slug from expo-constants
 * @returns The app slug string
 */
export const getAppSlug = (): string => {
  return Constants.expoConfig?.slug || 'wikiflow';
};

/**
 * Get API User Agent email from environment variable
 * Falls back to default email if not set
 * @returns The API user email string
 */
export const getApiUserEmail = (): string => {
  return process.env.EXPO_PUBLIC_API_USER_EMAIL || 'bryce.hoehn@mailbox.org';
};

