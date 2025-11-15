import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { Platform } from 'react-native';

/**
 * Wikipedia API Configuration and Rate Limiting
 *
 * This module provides rate-limited Axios instances for Wikipedia API calls
 * that comply with Wikipedia's API usage policies:
 *
 * REST API (restAxiosInstance):
 * - Base URL: https://en.wikipedia.org/api/rest_v1
 * - Concurrency: <5 concurrent requests
 * - Rate Limit: <10 requests per second
 * - Use for: Page summaries, mobile sections, thumbnails
 *
 * Action API (actionAxiosInstance):
 * - Base URL: https://en.wikipedia.org/w/api.php
 * - Concurrency: 1 concurrent request (unauthenticated)
 * - Rate Limit: <5 requests per second
 * - Use for: Category members, search, query operations
 *
 * Rate limiting is enforced via interceptors that:
 * - Limit concurrent requests using semaphore pattern
 * - Add minimum delays between requests
 * - Handle 429 (rate limit) responses with automatic retry
 * - Include proper User-Agent headers as required
 */


// Wikipedia API configuration
export const WIKIPEDIA_API_CONFIG = {
  API_USER_AGENT: 'WikipediaExpo/0.1 (bryce.hoehn@mailbox.org)',
  BASE_URL: 'https://en.wikipedia.org/w/api.php',
  WIKIMEDIA_BASE_URL: 'https://api.wikimedia.org',
  REST_API_BASE_URL: 'https://en.wikipedia.org/api/rest_v1',
  CORE_API_BASE_URL: 'https://api.wikimedia.org/core/v1/wikipedia/en',
};

// Set headers for Wikipedia API
const headers: Record<string, string> = {
  'Accept': 'application/json',
  'Api-User-Agent': WIKIPEDIA_API_CONFIG.API_USER_AGENT,
};

if (Platform.OS !== 'web') {
  headers['User-Agent'] = WIKIPEDIA_API_CONFIG.API_USER_AGENT;
}

// REST API Axios instance: <5 concurrent requests, <10 requests per second
export const restAxiosInstance: AxiosInstance = axios.create({
  baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
  headers,
  withCredentials: false
});

// Delay helper
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Simple concurrency limiter
const createConcurrencyLimiter = (maxConcurrent: number = 5) => {
  let currentConcurrent = 0;
  const queue: (() => void)[] = [];

  const processQueue = () => {
    if (queue.length > 0 && currentConcurrent < maxConcurrent) {
      const next = queue.shift();
      if (next) {
        currentConcurrent++;
        next();
      }
    }
  };

  return {
    acquire: () => new Promise<void>((resolve) => {
      queue.push(() => resolve());
      processQueue();
    }),
    release: () => {
      currentConcurrent--;
      processQueue();
    },
  };
};

// REST API limiter: <5 concurrent requests, <10 requests per second
const restApiLimiter = createConcurrencyLimiter(4);

// Action API limiter: 1 concurrent request, <5 requests per second
const actionApiLimiter = createConcurrencyLimiter(1);

// Rate limiting interceptor for REST API
restAxiosInstance.interceptors.request.use(
  async (config) => {
    await restApiLimiter.acquire();
    // Add minimum delay between REST API requests (100ms = 10 req/sec)
    await delay(100);
    return config;
  }
);

restAxiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    restApiLimiter.release();
    return response;
  },
  async (error: unknown) => {
    restApiLimiter.release();

    if (isAxiosError(error) && error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10) * 1000;
      console.warn(`Rate limited by Wikipedia REST API. Retrying after ${retryAfter}ms...`);
      await delay(retryAfter);
      return restAxiosInstance.request(error.config as AxiosRequestConfig);
    }
    return Promise.reject(error);
  }
);

// Action API Axios instance: 1 concurrent request, <5 requests per second
export const actionAxiosInstance: AxiosInstance = axios.create({
  baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
  headers,
});

// Rate limiting interceptor for Action API
actionAxiosInstance.interceptors.request.use(
  async (config) => {
    await actionApiLimiter.acquire();
    // Add minimum delay between Action API requests (200ms = 5 req/sec)
    await delay(200);
    return config;
  }
);

actionAxiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    actionApiLimiter.release();
    return response;
  },
  async (error: unknown) => {
    actionApiLimiter.release();

    if (isAxiosError(error) && error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10) * 1000;
      console.warn(`Rate limited by Wikipedia Action API. Retrying after ${retryAfter}ms...`);
      await delay(retryAfter);
      return actionAxiosInstance.request(error.config as AxiosRequestConfig);
    }
    return Promise.reject(error);
  }
);

// Optimized concurrent fetching
export const fetchConcurrently = async <T, R>(
  items: T[],
  requestFn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results = await Promise.allSettled(
    items.map(item => requestFn(item))
  );

  const fulfilledResults: R[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      fulfilledResults.push(result.value);
    }
  }
  
  return fulfilledResults;
};

