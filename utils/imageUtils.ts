/**
 * Utility functions for image URL manipulation
 */

/**
 * Get an optimized thumbnail URL for Wikipedia images based on desired width
 * Modifies existing thumbnail URLs to request a different size
 * 
 * @param originalUrl - The original image URL (can be thumbnail or full-size)
 * @param width - Desired width in pixels
 * @returns Modified URL with the requested width, or original URL if not a Wikimedia image
 */
export function getOptimizedThumbnailUrl(originalUrl: string, width: number): string {
  if (!originalUrl || !originalUrl.includes('upload.wikimedia.org')) {
    return originalUrl;
  }

  try {
    const url = new URL(originalUrl);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];

    // If already a thumbnail, modify the width parameter
    if (url.pathname.includes('/thumb/')) {
      // Replace the width in the thumbnail URL (e.g., 220px- -> 800px-)
      return originalUrl.replace(/\d+px-/, `${width}px-`);
    }

    // If it's a full-size image, construct a thumbnail URL
    // Format: /thumb/{path}/{width}px-{filename}/{filename}
    const basePath = pathParts.slice(0, -1).join('/');
    return `https://upload.wikimedia.org${basePath}/thumb/${filename}/${width}px-${filename}`;
  } catch (error) {
    // If URL parsing fails, return original
    return originalUrl;
  }
}

