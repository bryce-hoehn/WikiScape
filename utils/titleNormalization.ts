/**
 * Normalize Wikipedia article titles for API requests
 *
 * Wikipedia titles can have spaces, but API endpoints expect underscores.
 * This function handles:
 * - Spaces -> underscores
 * - URL-encoded spaces (%20) -> underscores
 * - Leading/trailing underscores removal
 *
 * @param title - The article title to normalize
 * @returns Normalized title ready for API requests
 */
export function normalizeWikipediaTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores (Wikipedia format)
    .replace(/%20/g, '_') // Replace URL-encoded spaces with underscores
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}
