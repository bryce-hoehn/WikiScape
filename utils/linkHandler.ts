import { router } from 'expo-router';
import { Linking } from 'react-native';

export type LinkKind = 'article' | 'category' | 'external';

export interface ParsedLink {
  kind: LinkKind;
  id?: string;
  url: string;
}

/**
 * Normalize href to a full URL for parsing
 */
function normalizeHref(href: string): string {
  if (!href) return href;
  let u = href.trim();
  // protocol-relative -> assume https
  if (u.startsWith('//')) u = `https:${u}`;
  return u;
}

const extractIdFromTitle = (title: string): { kind: 'article' | 'category'; id: string } => {
  if (title.startsWith('Category:')) {
    return {
      kind: 'category',
      id: title.replace(/^Category:/, ''),
    };
  }
  return {
    kind: 'article',
    id: title,
  };
};

const parseBareTitle = (href: string): ParsedLink | null => {
  if (!href || href.includes('://') || href.startsWith('/') || href.startsWith('./')) {
    return null;
  }
  const id = href.split('#')[0].split('?')[0];
  return { kind: 'article', id: decodeURIComponent(id), url: href };
};

const parseRelativePath = (href: string): ParsedLink | null => {
  if (!href.startsWith('./')) return null;
  const id = href.slice(2).split('#')[0].split('?')[0];
  return { kind: 'article', id: decodeURIComponent(id), url: href };
};

/**
 * Parse a Wikipedia link using native URL API
 *
 * Handles various Wikipedia link formats including:
 * - Bare titles (e.g., "Albert Einstein")
 * - Relative paths (e.g., "./Albert_Einstein")
 * - Full URLs (e.g., "https://en.wikipedia.org/wiki/Albert_Einstein")
 * - Category links (e.g., "Category:Physicists")
 *
 * @param href - The link href to parse
 * @returns ParsedLink object with kind ('article', 'category', or 'external'), id, and url
 *
 * @example
 * ```ts
 * const link = parseLink("Albert_Einstein");
 * // Returns: { kind: 'article', id: 'Albert Einstein', url: 'Albert_Einstein' }
 *
 * const categoryLink = parseLink("Category:Physicists");
 * // Returns: { kind: 'category', id: 'Physicists', url: 'Category:Physicists' }
 * ```
 */
export function parseLink(href: string): ParsedLink {
  const normalizedHref = normalizeHref(href);

  const bareTitle = parseBareTitle(normalizedHref);
  if (bareTitle) return bareTitle;

  const relativePath = parseRelativePath(normalizedHref);
  if (relativePath) return relativePath;

  try {
    let url: URL;
    try {
      url = new URL(normalizedHref);
    } catch {
      url = new URL(normalizedHref, 'https://en.wikipedia.org');
    }

    const titleParam = url.searchParams.get('title');
    if (titleParam) {
      const decodedTitle = decodeURIComponent(titleParam);
      const { kind, id } = extractIdFromTitle(decodedTitle);
      return { kind, id, url: normalizedHref };
    }

    const wikiMatch = url.pathname.match(/^\/wiki\/(.+)$/);
    if (wikiMatch) {
      const wikiTitle = decodeURIComponent(wikiMatch[1]);
      const { kind, id } = extractIdFromTitle(wikiTitle);
      return { kind, id, url: normalizedHref };
    }

    const categoryMatch = url.pathname.match(/Category:([^\/]+)/);
    if (categoryMatch) {
      return {
        kind: 'category',
        id: decodeURIComponent(categoryMatch[1]),
        url: normalizedHref,
      };
    }

    return { kind: 'external', url: normalizedHref };
  } catch {
    const fallbackBareTitle = parseBareTitle(normalizedHref);
    return fallbackBareTitle || { kind: 'external', url: normalizedHref };
  }
}

// Only HTTPS URLs are allowed for security
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol.toLowerCase() === 'https:';
  } catch {
    return false;
  }
}

/**
 * Follow a Wikipedia link by navigating to it or opening it externally
 *
 * For internal links (articles and categories), navigates using the app router.
 * For external links, opens them in the system browser (only HTTPS URLs are allowed).
 * Silently handles errors to avoid crashes from malformed URLs.
 *
 * @param href - The link href to follow
 *
 * @example
 * ```ts
 * // Navigate to an article
 * followLink("Albert_Einstein");
 *
 * // Navigate to a category
 * followLink("Category:Physicists");
 *
 * // Open external link
 * followLink("https://example.com");
 * ```
 */
export function followLink(href: string): void {
  if (!href) return;
  const parsed = parseLink(href);

  try {
    if (parsed.kind === 'article' && parsed.id) {
      router.push(`/article/${encodeURIComponent(parsed.id)}`);
      return;
    }
    if (parsed.kind === 'category' && parsed.id) {
      router.push(`/subcategory/${encodeURIComponent(parsed.id)}`);
      return;
    }
    // external - only open if it's a valid URL
    if (isValidUrl(parsed.url)) {
      Linking.openURL(parsed.url);
    }
  } catch (error) {
    // Silently ignore errors to avoid crashes from malformed URLs or navigation failures
  }
}

/**
 * Check if a link is an internal Wikipedia link (article or category)
 *
 * @param href - The link href to check
 * @returns True if the link is an internal article or category link, false otherwise
 *
 * @example
 * ```ts
 * isInternal("Albert_Einstein"); // true
 * isInternal("Category:Physicists"); // true
 * isInternal("https://example.com"); // false
 * ```
 */
export function isInternal(href: string): boolean {
  const p = parseLink(href);
  return p.kind === 'article' || p.kind === 'category';
}
