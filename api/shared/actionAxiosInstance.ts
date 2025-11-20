import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { addOriginParam, getApiHeaders } from './config';
import { createResponseInterceptor } from './interceptors';

/**
 * Action API Axios Instance
 *
 * Rate Limits:
 * - 5 requests per second
 * - Sequential (1 at a time)
 *
 * Used for:
 * - Action API (en.wikipedia.org/w/api.php)
 * - Commons Action API (commons.wikimedia.org/w/api.php)
 */

const ACTION_RATE_LIMIT_CONFIG = {
  REQUESTS_PER_SECOND: 5,
  MIN_INTERVAL_MS: 200,
};

let actionLastRequestTime = 0;

export const actionAxiosInstance: AxiosInstance = axios.create({
  headers: getApiHeaders(),
  withCredentials: false,
  timeout: 15000,
});

actionAxiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const now = Date.now();
    const timeSinceLastRequest = now - actionLastRequestTime;

    if (timeSinceLastRequest < ACTION_RATE_LIMIT_CONFIG.MIN_INTERVAL_MS) {
      const waitTime = ACTION_RATE_LIMIT_CONFIG.MIN_INTERVAL_MS - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    addOriginParam(config);

    actionLastRequestTime = Date.now();
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

createResponseInterceptor(actionAxiosInstance);

export const fetchSequentially = async <T, R>(
  items: T[],
  requestFn: (item: T) => Promise<R>
): Promise<R[]> => {
  const fulfilledResults: R[] = [];

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

