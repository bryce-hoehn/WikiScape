/**
 * Utility functions for extracting alt text from Wikipedia images
 * Wikipedia images can have alt text in multiple places:
 * 1. alt attribute (primary)
 * 2. title attribute (common fallback)
 * 3. data-title attribute
 * 4. Parent <a> tag's title attribute
 * 5. Filename extracted from URL (last resort)
 */

/**
 * Extract filename from a Wikipedia image URL
 * Handles various URL formats:
 * - https://upload.wikimedia.org/wikipedia/commons/thumb/.../File:name.jpg
 * - File:name.jpg
 * - /wiki/File:name.jpg
 * - name.jpg
 */
export function extractFilenameFromUrl(url: string): string {
  if (!url) return '';

  // Try to extract from File: prefix first
  const fileMatch = url.match(/File:([^/?#]+)/i);
  if (fileMatch) {
    return decodeURIComponent(fileMatch[1])
      .replace(/_/g, ' ')
      .replace(/\.[^.]+$/, '');
  }

  // Extract from URL path (last segment before query/hash)
  const urlMatch = url.match(/\/([^/?#]+\.(jpg|jpeg|png|gif|webp|svg))(?:\?|#|$)/i);
  if (urlMatch) {
    return decodeURIComponent(urlMatch[1])
      .replace(/_/g, ' ')
      .replace(/\.[^.]+$/, '');
  }

  // Fallback: use last part of path
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0];
  if (lastPart) {
    return decodeURIComponent(lastPart)
      .replace(/_/g, ' ')
      .replace(/\.[^.]+$/, '');
  }

  return '';
}

/**
 * Extract alt text from image attributes and parent context
 * @param attrs - Image element attributes
 * @param parentAttrs - Parent element attributes (e.g., from <a> tag)
 * @param imageUrl - Image URL for filename fallback
 */
export function extractAltText(
  attrs: Record<string, any>,
  parentAttrs?: Record<string, any>,
  imageUrl?: string
): string {
  // 1. Primary: alt attribute
  if (attrs?.alt && typeof attrs.alt === 'string' && attrs.alt.trim()) {
    return attrs.alt.trim();
  }

  // 2. Fallback: title attribute
  if (attrs?.title && typeof attrs.title === 'string' && attrs.title.trim()) {
    return attrs.title.trim();
  }

  // 3. Fallback: data-title attribute
  if (
    attrs?.['data-title'] &&
    typeof attrs['data-title'] === 'string' &&
    attrs['data-title'].trim()
  ) {
    return attrs['data-title'].trim();
  }

  // 4. Fallback: parent <a> tag's title attribute
  if (parentAttrs?.title && typeof parentAttrs.title === 'string' && parentAttrs.title.trim()) {
    return parentAttrs.title.trim();
  }

  // 5. Last resort: extract filename from URL
  if (imageUrl) {
    const filename = extractFilenameFromUrl(imageUrl);
    if (filename) {
      return filename;
    }
  }

  // Final fallback
  return 'Article image';
}
