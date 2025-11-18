import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import { Platform } from 'react-native';
import { getApiUserEmail, getAppVersion } from '../../utils/env';

/**
 * Wikipedia API Configuration
 *
 * Single Axios instance for all Wikipedia API calls with client-side rate limiting
 * Wikipedia's public APIs are generally tolerant of reasonable usage
 */

// Wikipedia API configuration
export const WIKIPEDIA_API_CONFIG = {
  API_USER_AGENT: `WikiFlow/${getAppVersion()} (${getApiUserEmail()})`,
  BASE_URL: 'https://en.wikipedia.org/w/api.php',
  WIKIMEDIA_BASE_URL: 'https://api.wikimedia.org',
  WIKIMEDIA_PAGEVIEWS_BASE_URL: 'https://wikimedia.org/api/rest_v1', // Pageviews API uses wikimedia.org (not api.wikimedia.org)
  REST_API_BASE_URL: 'https://en.wikipedia.org/api/rest_v1',
  CORE_API_BASE_URL: 'https://api.wikimedia.org/core/v1/wikipedia/en',
};

// Utility: simple delay helper used by retry/backoff logic
export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Rate limiting configuration (200 requests per second = 5ms between requests)
const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_SECOND: 200,
  MIN_INTERVAL_MS: 5, // 1000ms / 200 = 5ms minimum between requests
};

// Simple rate limiting state
let lastRequestTime = 0;

// Set headers for Wikipedia API
const headers: Record<string, string> = {
  Accept: 'application/json',
};

if (Platform.OS !== 'web') {
  headers['Api-User-Agent'] = WIKIPEDIA_API_CONFIG.API_USER_AGENT;
  headers['User-Agent'] = WIKIPEDIA_API_CONFIG.API_USER_AGENT;
}

// Single Axios instance for all Wikipedia API calls
// Increased timeout and centralized instance to reduce intermittent network failures.
export const axiosInstance: AxiosInstance = axios.create({
  headers,
  withCredentials: false,
  timeout: 15000, // Increased to 15s to mitigate intermittent network issues
});

// Add rate limiting and default params to request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_CONFIG.MIN_INTERVAL_MS) {
      const waitTime = RATE_LIMIT_CONFIG.MIN_INTERVAL_MS - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Add origin=* parameter to all requests (for CORS/API compatibility)
    if (!config.params) {
      config.params = {};
    }
    if (!config.params.origin) {
      config.params.origin = '*';
    }

    lastRequestTime = Date.now();
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Handle rate limit errors gracefully with improved retry logic, plus retries for network errors.
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (isAxiosError(error)) {
      const config = (error.config as InternalAxiosRequestConfig & { __retryCount?: number }) || {};
      config.__retryCount = config.__retryCount ?? 0;
      const maxRetries = 3;

      // Handle rate limiting (429) using 'Retry-After' when available
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10) * 1000;
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return axiosInstance.request(error.config as InternalAxiosRequestConfig);
      }

      // Network errors / timeouts (no response) - retry with exponential backoff
      const isNetworkError =
        !error.response ||
        error.code === 'ECONNABORTED' ||
        (error.message && error.message.toLowerCase().includes('network error'));
      if (isNetworkError) {
        if (config && (config.__retryCount ?? 0) < maxRetries) {
          const backoff = Math.pow(2, config.__retryCount ?? 0) * 500; // 500ms, 1s, 2s
          config.__retryCount = (config.__retryCount ?? 0) + 1;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          return axiosInstance.request(config as InternalAxiosRequestConfig);
        }
      }

      // Handle server errors (5xx) with retry and exponential backoff
      if (error.response?.status && error.response.status >= 500) {
        if (config && (config.__retryCount ?? 0) < maxRetries) {
          const backoff = Math.pow(2, config.__retryCount ?? 0) * 1000; // 1s, 2s, 4s
          config.__retryCount = (config.__retryCount ?? 0) + 1;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          return axiosInstance.request(config as InternalAxiosRequestConfig);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Rate-limited concurrent fetching
export const fetchConcurrently = async <T, R>(
  items: T[],
  requestFn: (item: T) => Promise<R>
): Promise<R[]> => {
  const fulfilledResults: R[] = [];

  // Process items sequentially with rate limiting
  for (const item of items) {
    try {
      const result = await requestFn(item);
      fulfilledResults.push(result);
    } catch (error) {
      // Skip failed requests but continue with others
    }
  }

  return fulfilledResults;
};
