/**
 * Main type exports for Wikipedia Expo
 *
 * Import types from specific categories:
 * - import { Article, SearchSuggestion } from '../types/api';
 * - import { SearchOverlayProps } from '../types/components';
 * - import { UseBookmarksReturn } from '../types/hooks';
 * - import { AppTheme, StorageKeys } from '../types/shared';
 */

// Re-export all types from subdirectories for convenience
export * from './api';
export * from './components';
export * from './hooks';
export * from './shared';

/**
 * TYPE RELATIONSHIPS AND ORGANIZATION
 *
 * This project follows a clear separation of concerns for type definitions:
 *
 * 1. API TYPES (./api/)
 *    - External data structures from Wikipedia API
 *    - Raw API responses and data normalization
 *    - Examples: Article, SearchSuggestion, FeaturedContentResponse
 *    - These types should match the actual API response structure
 *
 * 2. COMPONENT TYPES (./components/)
 *    - Props and interfaces for React components
 *    - UI-specific data structures optimized for rendering
 *    - Examples: RecommendationItem, FeedProps, BookmarkCardProps
 *    - These types are often derived from API types but simplified for UI
 *
 * 3. HOOK TYPES (./hooks/)
 *    - Return types and state management for custom hooks
 *    - Hook-specific interfaces and action types
 *    - Examples: HookResponse<T>, UseArticleResponse, UseBookmarksReturn
 *    - These types manage the bridge between API data and component state
 *
 * 4. SHARED TYPES (./shared/)
 *    - Application-wide shared types and utilities
 *    - Navigation, configuration, and common patterns
 *    - Examples: AppTheme, StorageKeys, AppConfig
 *    - These types are used across multiple domains
 *
 * 5. APPLICATION STATE TYPES (root level)
 *    - Internal application state that doesn't come from external APIs
 *    - Examples: Bookmark, OfflineArticle
 *    - These types represent user data and app-specific state
 *
 * 6. THIRD-PARTY TYPES (./third-party/)
 *    - Type definitions for external libraries
 *    - Examples: wtf_wikipedia plugin types
 *    - These types extend third-party library functionality
 *
 * BASE TYPES vs DOMAIN-SPECIFIC TYPES:
 * - Base types (./api/base.ts) provide reusable building blocks
 * - Domain-specific types extend and compose base types
 * - Example: ImageThumbnail (base) is used by Article, FeaturedArticle, etc.
 *
 * API RESPONSE TYPES vs UI STATE TYPES:
 * - API types represent raw external data (may need transformation)
 * - Component types represent optimized UI data structures
 * - Hooks handle the transformation between these two layers
 */

/**
 * Common type utilities
 *
 * Note: Many utility types are already provided by TypeScript:
 * - Partial<T> - makes all properties optional
 * - Required<T> - makes all properties required
 * - Pick<T, K> - picks specific properties
 * - Omit<T, K> - omits specific properties
 * - React.ReactNode - for children props
 * - React.RefObject<T> - for component refs
 */
