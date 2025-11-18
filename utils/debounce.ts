/**
 * Debounced function with additional control methods
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  flush(): void;
  cancel(): void;
}

/**
 * Debounce utility function
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function with flush and cancel methods
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  // Store last arguments for flush
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      lastArgs = null;
    }, wait);
  };

  // Add flush method to immediately invoke pending function
  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
    }
  };

  // Add cancel method to cancel pending invocation
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
  };

  return debounced as DebouncedFunction<T>;
}

