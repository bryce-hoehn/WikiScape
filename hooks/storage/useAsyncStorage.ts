import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseAsyncStorageOptions<T> {
  defaultValue: T;
  validator?: (value: T) => boolean;
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

/**
 * Generic hook for managing AsyncStorage values
 *
 * Handles loading, saving, and validation automatically. Provides a reactive
 * interface to AsyncStorage with automatic persistence and data validation.
 *
 * @template T - The type of value stored in AsyncStorage
 * @param key - The AsyncStorage key to use
 * @param options - Configuration options:
 *   - `defaultValue`: The default value if no stored value exists
 *   - `validator`: Optional function to validate loaded values
 *   - `serializer`: Optional custom serialization function (defaults to JSON.stringify)
 *   - `deserializer`: Optional custom deserialization function (defaults to JSON.parse)
 * @returns Object containing:
 *   - `value`: The current value (starts with defaultValue)
 *   - `isLoading`: Whether the initial load is in progress
 *   - `updateValue`: Function to update the value and persist to storage
 *
 * @example
 * ```tsx
 * const { value, isLoading, updateValue } = useAsyncStorage('theme', {
 *   defaultValue: 'light',
 *   validator: (v) => v === 'light' || v === 'dark'
 * });
 *
 * // Update value
 * updateValue('dark');
 * ```
 */
export default function useAsyncStorage<T>(key: string, options: UseAsyncStorageOptions<T>) {
  const {
    defaultValue,
    validator,
    serializer = (value: T) => JSON.stringify(value),
    deserializer = (value: string) => JSON.parse(value) as T,
  } = options;

  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to check if two values are deeply equal (for arrays/objects)
  const isDeepEqual = useCallback((a: T, b: T): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    // For arrays, compare element by element
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => {
        const bItem = (b as any)[index];
        if (typeof item === 'object' && item !== null && typeof bItem === 'object' && bItem !== null) {
          return JSON.stringify(item) === JSON.stringify(bItem);
        }
        return item === bItem;
      });
    }
    
    // For objects, use JSON comparison (simple but effective for this use case)
    if (typeof a === 'object' && typeof b === 'object') {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch {
        return false;
      }
    }
    
    return false;
  }, []);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) {
          try {
            const parsed = deserializer(stored);
            // Validate parsed value structure if validator is provided
            if (!validator || validator(parsed)) {
              // Only update if the value actually changed (deep comparison)
              setValue((prev) => {
                if (isDeepEqual(prev, parsed)) {
                  return prev; // Return same reference if values are equal
                }
                return parsed;
              });
            } else {
              // Clear corrupted data
              await AsyncStorage.removeItem(key);
            }
          } catch (parseError) {
            // Clear corrupted data
            await AsyncStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Silently handle load errors
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key, validator, deserializer, isDeepEqual]);

  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      return new Promise<void>((resolve, reject) => {
        setValue((prev) => {
          const computedValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
          
          if (validator && !validator(computedValue)) {
            // Resolve immediately if validation fails (no state change)
            setTimeout(() => resolve(), 0);
            return prev; // Don't update if validation fails
          }

          // Only update if the value actually changed (deep comparison)
          // This prevents unnecessary re-renders when the new value is the same as the old
          if (isDeepEqual(prev, computedValue)) {
            // Value hasn't changed, resolve but don't update state or storage
            setTimeout(() => resolve(), 0);
            return prev; // Return same reference
          }

          // Persist to storage asynchronously
          AsyncStorage.setItem(key, serializer(computedValue))
            .then(() => {
              resolve(); // Resolve after storage operation completes
            })
            .catch(() => {
              // Silently handle save errors, but still resolve
              resolve();
            });

          return computedValue;
        });
      });
    },
    [key, validator, serializer, isDeepEqual]
  );

  return useMemo(
    () => ({
      value,
      isLoading,
      updateValue,
    }),
    [value, isLoading, updateValue]
  );
}
