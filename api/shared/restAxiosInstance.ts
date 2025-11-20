import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import { getApiHeaders } from './config';
import { createResponseInterceptor } from './interceptors';

/**
 * REST API Axios Instance
 *
 * Rate Limits:
 * - 10 requests per second
 * - Up to 5 concurrent requests
 *
 * Used for:
 * - REST API (en.wikipedia.org/api/rest_v1)
 * - Featured Content API (api.wikimedia.org)
 * - Pageviews API (wikimedia.org/api/rest_v1)
 */

const REST_RATE_LIMIT_CONFIG = {
  REQUESTS_PER_SECOND: 10,
  MIN_INTERVAL_MS: 100,
  MAX_CONCURRENT: 5,
};

let restLastRequestTime = 0;
let restConcurrentRequests = 0;
const restRequestQueue: Array<() => void> = [];

const processRestQueue = () => {
  while (restConcurrentRequests < REST_RATE_LIMIT_CONFIG.MAX_CONCURRENT && restRequestQueue.length > 0) {
    const resolve = restRequestQueue.shift();
    if (resolve) {
      restConcurrentRequests++;
      resolve();
    }
  }
};

export const restAxiosInstance: AxiosInstance = axios.create({
  headers: getApiHeaders(),
  withCredentials: false,
  timeout: 15000,
});

restAxiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const now = Date.now();
    const timeSinceLastRequest = now - restLastRequestTime;
    if (timeSinceLastRequest < REST_RATE_LIMIT_CONFIG.MIN_INTERVAL_MS) {
      const waitTime = REST_RATE_LIMIT_CONFIG.MIN_INTERVAL_MS - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    if (restConcurrentRequests >= REST_RATE_LIMIT_CONFIG.MAX_CONCURRENT) {
      await new Promise<void>((resolve) => {
        restRequestQueue.push(resolve);
        processRestQueue();
      });
    } else {
      restConcurrentRequests++;
    }

    restLastRequestTime = Date.now();
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

restAxiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    restConcurrentRequests = Math.max(0, restConcurrentRequests - 1);
    processRestQueue();
    return response;
  },
  async (error: unknown) => {
    restConcurrentRequests = Math.max(0, restConcurrentRequests - 1);
    processRestQueue();
    return Promise.reject(error);
  }
);

createResponseInterceptor(restAxiosInstance);

export const fetchConcurrently = async <T, R>(
  items: T[],
  requestFn: (item: T) => Promise<R>,
  maxConcurrent: number = REST_RATE_LIMIT_CONFIG.MAX_CONCURRENT
): Promise<R[]> => {
  const results: Array<PromiseSettledResult<R>> = [];
  
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const batchPromises = batch.map((item) => requestFn(item));
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }

  return results
    .filter((result): result is PromiseFulfilledResult<R> => result.status === 'fulfilled')
    .map((result) => result.value);
};

