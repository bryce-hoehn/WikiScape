import { Platform } from 'react-native';
import { getApiUserEmail, getAppVersion } from '../../utils/env';

/**
 * Wikipedia API Configuration
 *
 * Shared configuration and utilities for Wikipedia API clients
 */

export const WIKIPEDIA_API_CONFIG = {
  API_USER_AGENT: `Wikiscroll/${getAppVersion()} (${getApiUserEmail()})`,
  BASE_URL: 'https://en.wikipedia.org/w/api.php',
  WIKIMEDIA_BASE_URL: 'https://api.wikimedia.org',
  WIKIMEDIA_PAGEVIEWS_BASE_URL: 'https://wikimedia.org/api/rest_v1', // Pageviews API uses wikimedia.org (not api.wikimedia.org)
  REST_API_BASE_URL: 'https://en.wikipedia.org/api/rest_v1',
  CORE_API_BASE_URL: 'https://api.wikimedia.org/core/v1/wikipedia/en',
};

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const getApiHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (Platform.OS !== 'web') {
    headers['User-Agent'] = WIKIPEDIA_API_CONFIG.API_USER_AGENT;
    headers['Api-User-Agent'] = WIKIPEDIA_API_CONFIG.API_USER_AGENT;
    headers['Accept-Encoding'] = 'gzip, deflate';
  }

  return headers;
};

export const addOriginParam = (config: { params?: Record<string, any> }): void => {
  if (!config.params) {
    config.params = {};
  }
  if (!config.params.origin) {
    config.params.origin = '*';
  }
};
