import {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

/**
 * Shared response interceptor for error handling
 * Handles rate limiting, network errors, and server errors with retry logic
 */
export const createResponseInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
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
          return instance.request(error.config as InternalAxiosRequestConfig);
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
            return instance.request(config as InternalAxiosRequestConfig);
          }
        }

        // Handle server errors (5xx) with retry and exponential backoff
        if (error.response?.status && error.response.status >= 500) {
          if (config && (config.__retryCount ?? 0) < maxRetries) {
            const backoff = Math.pow(2, config.__retryCount ?? 0) * 1000; // 1s, 2s, 4s
            config.__retryCount = (config.__retryCount ?? 0) + 1;
            await new Promise((resolve) => setTimeout(resolve, backoff));
            return instance.request(config as InternalAxiosRequestConfig);
          }
        }
      }
      return Promise.reject(error);
    }
  );
};

