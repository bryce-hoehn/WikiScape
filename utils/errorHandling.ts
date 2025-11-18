import { isAxiosError } from '@/types/api/base';

export interface ErrorInfo {
  message: string;
  userFriendlyMessage: string;
  canRetry: boolean;
  errorType: 'network' | 'not-found' | 'timeout' | 'server' | 'unknown';
  recoverySteps: string[];
}

const ERROR_MESSAGES: Record<
  number,
  { message: string; canRetry: boolean; recoverySteps: string[] }
> = {
  404: {
    message: 'Article not found. It may have been removed or the title may be incorrect.',
    canRetry: false,
    recoverySteps: [
      'Check if the article title is spelled correctly',
      'Try searching for a similar article',
      'The article may have been moved or deleted',
    ],
  },
  500: {
    message: 'Server error. Please try again in a moment.',
    canRetry: true,
    recoverySteps: [
      'Wait a few moments and try again',
      'The Wikipedia servers may be temporarily unavailable',
    ],
  },
  502: {
    message: 'Server error. Please try again in a moment.',
    canRetry: true,
    recoverySteps: [
      'Wait a few moments and try again',
      'The Wikipedia servers may be temporarily unavailable',
    ],
  },
  503: {
    message: 'Server error. Please try again in a moment.',
    canRetry: true,
    recoverySteps: [
      'Wait a few moments and try again',
      'The Wikipedia servers may be temporarily unavailable',
    ],
  },
};

/**
 * Convert an error into a user-friendly error message with recovery steps
 *
 * Analyzes the error type (network, timeout, server error, etc.) and returns
 * a structured ErrorInfo object with a user-friendly message and recovery steps.
 *
 * @param error - The error to analyze (can be any type)
 * @returns ErrorInfo object containing:
 *   - `message`: The original error message
 *   - `userFriendlyMessage`: A message suitable for displaying to users
 *   - `canRetry`: Whether the operation can be retried
 *   - `errorType`: The type of error ('network', 'not-found', 'timeout', 'server', 'unknown')
 *   - `recoverySteps`: Array of suggested recovery steps
 *
 * @example
 * ```ts
 * try {
 *   await fetchArticle("Albert Einstein");
 * } catch (error) {
 *   const errorInfo = getUserFriendlyError(error);
 *   showError(errorInfo.userFriendlyMessage);
 *   if (errorInfo.canRetry) {
 *     showRetryButton();
 *   }
 * }
 * ```
 */
export function getUserFriendlyError(error: unknown): ErrorInfo {
  if (!error) {
    return {
      message: 'Unknown error',
      userFriendlyMessage: 'Something went wrong. Please try again.',
      canRetry: true,
      errorType: 'unknown',
      recoverySteps: ['Try refreshing the page', 'Close and reopen the app'],
    };
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const code = error.code;

    if (status && ERROR_MESSAGES[status]) {
      const errorInfo = ERROR_MESSAGES[status];
      return {
        message: error.message,
        userFriendlyMessage: errorInfo.message,
        canRetry: errorInfo.canRetry,
        errorType: status === 404 ? 'not-found' : 'server',
        recoverySteps: errorInfo.recoverySteps,
      };
    }

    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return {
        message: error.message,
        userFriendlyMessage: 'Request timed out. Please try again.',
        canRetry: true,
        errorType: 'timeout',
        recoverySteps: ['Check your internet connection speed', 'Try again in a few moments'],
      };
    }

    if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED') {
      return {
        message: error.message,
        userFriendlyMessage:
          'Unable to connect. Please check your internet connection and try again.',
        canRetry: true,
        errorType: 'network',
        recoverySteps: [
          'Check your internet connection',
          'Try switching between Wi-Fi and mobile data',
        ],
      };
    }
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  return {
    message: errorMessage,
    userFriendlyMessage: 'Something went wrong. Please try again.',
    canRetry: true,
    errorType: 'unknown',
    recoverySteps: ['Try refreshing the page', 'Close and reopen the app'],
  };
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const errorInfo = getUserFriendlyError(error);
  return errorInfo.errorType === 'network';
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = getUserFriendlyError(error);
  return errorInfo.canRetry;
}
