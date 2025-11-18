/**
 * Main API exports for Wikipedia Expo
 *
 * Import from specific domains:
 * - import { fetchArticleByTitle } from './articles';
 * - import { fetchCategoryPages } from './categories';
 * - import { fetchSearchSuggestions } from './search';
 * - import { fetchFeaturedContent } from './featured';
 * - import { WIKIPEDIA_API_CONFIG } from './config';
 */

// Re-export all API functions from consolidated files
export * from './articles';
export * from './categories';
export * from './featured';
export * from './search';
