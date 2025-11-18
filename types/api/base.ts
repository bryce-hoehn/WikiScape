/**
 * Base type definitions shared across all Wikipedia API types
 *
 * BASE TYPES vs DOMAIN-SPECIFIC TYPES:
 *
 * Base types are reusable building blocks that define common structures
 * used across multiple domain-specific types. They provide consistency
 * and reduce duplication throughout the type system.
 *
 * Examples of base type usage:
 * - ImageThumbnail is used by Article, FeaturedArticle, Bookmark, etc.
 * - PageMetadata provides common page identification structure
 * - ApiResponse<T> provides consistent API response wrapping
 *
 * When creating new domain types, consider if they can reuse existing
 * base types rather than defining similar structures from scratch.
 */

/**
 * Common image/thumbnail structure used across multiple APIs
 *
 * This interface standardizes how images are represented throughout
 * the application, ensuring consistent property names and structure.
 *
 * Used by: Article, FeaturedArticle, Bookmark, RecommendationItem, etc.
 */
export interface ImageThumbnail {
  source: string;
  width?: number;
  height?: number;
}

/**
 * Common page metadata structure
 */
export interface PageMetadata {
  pageid: number;
  title: string;
  ns?: number;
}

/**
 * Common titles structure for Wikipedia pages
 */
export interface PageTitles {
  canonical: string;
  normalized: string;
  display: string;
}

/**
 * Common namespace structure
 */
export interface PageNamespace {
  id: number;
  text: string;
}

/**
 * Common content URLs structure used across multiple APIs
 *
 * This interface standardizes how content URLs are represented throughout
 * the application, providing consistent desktop and mobile URL structures.
 *
 * Used by: Article, FeaturedArticle, etc.
 */
export interface ContentUrls {
  desktop: {
    page: string;
    revisions?: string;
    edit?: string;
    talk?: string;
  };
  mobile: {
    page: string;
    revisions?: string;
    edit?: string;
    talk?: string;
  };
}

/**
 * Common API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status?: number;
}

/**
 * Base interface for Wikipedia page content with common properties
 */
export interface WikipediaPageBase {
  type?: string;
  title: string;
  displaytitle?: string;
  normalizedtitle?: string;
  pageid?: number;
  lang?: string;
  dir?: string;
  revision?: string;
  tid?: string;
  timestamp?: string;
  description?: string;
  description_source?: string;
  namespace?: PageNamespace;
  wikibase_item?: string;
  titles?: PageTitles;
  thumbnail?: ImageThumbnail;
  originalimage?: ImageThumbnail;
  content_urls?: ContentUrls;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

/**
 * Common error structure for API responses
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Type guard for Axios errors
 */
export function isAxiosError(
  error: unknown
): error is { response?: { status?: number; data?: unknown }; code?: string; message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

/**
 * Category member from Wikipedia Action API
 */
export interface CategoryMember {
  pageid: number;
  title: string;
  ns: number;
}

/**
 * Wikipedia Action API query response structure
 */
export interface WikipediaQueryResponse {
  query?: {
    pages?: Record<string, WikipediaPage>;
    search?: unknown[];
    categorymembers?: CategoryMember[];
  };
}

/**
 * Wikipedia page structure from Action API
 */
export interface WikipediaPage {
  pageid: number;
  title: string;
  ns?: number;
  categories?: Array<{ title: string }>;
  [key: string]: unknown;
}

/**
 * Wikipedia Action API parameters
 */
export interface WikipediaActionApiParams {
  action: string;
  format: string;
  origin?: string;
  [key: string]: unknown;
}
