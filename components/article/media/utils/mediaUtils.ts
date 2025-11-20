import { actionAxiosInstance } from '../../../../api/shared';

/**
 * Normalize filename by decoding URI and removing File:/Image: prefix
 */
export function normalizeFileName(fileName: string): string {
  let normalized = fileName;
  try {
    normalized = decodeURIComponent(fileName);
  } catch {
    // If decoding fails, use as-is
  }
  // Remove File: or Image: prefix if present
  normalized = normalized.replace(/^(File|Image):/i, '');
  return normalized;
}

/**
 * Get direct file URL using Wikipedia API fileinfo endpoint
 * This avoids CORS issues by using the API instead of following redirects
 */
export async function getDirectFileUrl(fileName: string): Promise<string> {
  try {
    const cleanFileName = normalizeFileName(fileName);

    // Use Wikipedia API fileinfo endpoint to get direct file URL
    // This endpoint supports CORS and returns the direct upload.wikimedia.org URL
    const response = await actionAxiosInstance.get('', {
      baseURL: 'https://commons.wikimedia.org/w/api.php',
      params: {
        action: 'query',
        titles: `File:${cleanFileName}`,
        prop: 'imageinfo',
        iiprop: 'url',
        format: 'json',
        origin: '*',
      },
    });

    const pages = response.data?.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0] as any;
      const imageInfo = page?.imageinfo?.[0];
      if (imageInfo?.url) {
        return imageInfo.url;
      }
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('Failed to get direct file URL from API:', fileName, error);
    }
  }

  // Fallback: return empty string if API call fails
  return '';
}

/**
 * Resolved media URL type
 */
export type ResolvedMediaUrl = { type: 'url' | 'filename'; value: string } | null;

/**
 * Resolve media URL and get final direct URL
 * Returns filename for File: references (which need API lookup) or direct URL
 */
export function resolveMediaUrl(raw: string): ResolvedMediaUrl {
  if (!raw) return null;
  let mediaUrl = raw.trim();

  // Filter out invalid protocols
  if (
    mediaUrl.startsWith('about:') ||
    mediaUrl.startsWith('javascript:') ||
    mediaUrl.startsWith('data:')
  ) {
    return null;
  }

  // If it's already a valid full URL with protocol, return as-is
  if (mediaUrl.includes('://')) {
    if (mediaUrl.startsWith('https://')) {
      return { type: 'url', value: mediaUrl };
    }
    return null;
  }

  // Protocol-relative -> https
  if (mediaUrl.startsWith('//')) {
    return { type: 'url', value: 'https:' + mediaUrl };
  }

  // Check for File: or Image: patterns
  const filePatterns = [
    /^(File|Image):(.+)$/i,
    /^\.\/(File|Image):(.+)$/i,
    /^\/(?:wiki\/)?(File|Image):(.+)$/i,
    /\/wiki\/(?:File|Image):(.+)$/i,
  ];

  for (const pattern of filePatterns) {
    const match = mediaUrl.match(pattern);
    if (match) {
      const fileName = match[match.length - 1].split('#')[0].split('?')[0].trim();
      if (fileName) {
        return { type: 'filename', value: fileName };
      }
    }
  }

  // If it's a relative path without File: prefix, check if it looks like a media file
  if (mediaUrl.startsWith('./') || (mediaUrl.startsWith('/') && !mediaUrl.startsWith('//'))) {
    const rest = mediaUrl.startsWith('./') ? mediaUrl.slice(2) : mediaUrl.slice(1);
    const mediaExtensions = /\.(ogg|oga|ogv|mp3|mp4|m4a|m4v|webm|wav|flac|aac|opus)$/i;
    if (mediaExtensions.test(rest)) {
      return { type: 'filename', value: rest };
    }
    // Otherwise treat as wiki article path
    if (mediaUrl.startsWith('./')) {
      return { type: 'url', value: `https://en.wikipedia.org/wiki/${rest}` };
    } else {
      return { type: 'url', value: `https://en.wikipedia.org${mediaUrl}` };
    }
  }

  // If it already looks like a direct upload url, return as-is
  if (mediaUrl.includes('upload.wikimedia.org') || mediaUrl.includes('commons.wikimedia.org')) {
    const url = mediaUrl.startsWith('//') ? 'https:' + mediaUrl : mediaUrl;
    return { type: 'url', value: url };
  }

  // If it's a bare filename with media extension, assume it's a Commons file
  const mediaExtensions = /\.(ogg|oga|ogv|mp3|mp4|m4a|m4v|webm|wav|flac|aac|opus)$/i;
  if (mediaExtensions.test(mediaUrl) && !mediaUrl.includes('/') && !mediaUrl.includes(':')) {
    return { type: 'filename', value: mediaUrl };
  }

  // If it looks like an article title (no extension, no slashes, no colons),
  // try converting it to a Commons file with common audio extensions
  if (!mediaUrl.includes('/') && !mediaUrl.includes(':') && !mediaUrl.includes('.')) {
    const audioExtensions = ['.ogg', '.oga', '.mp3', '.wav', '.webm'];
    return { type: 'filename', value: mediaUrl + audioExtensions[0] };
  }

  return null;
}

/**
 * Resolve media URLs - get direct URLs for File: references via API
 */
export async function resolveMediaRedirect(resolved: ResolvedMediaUrl): Promise<string> {
  if (!resolved) return '';
  
  if (resolved.type === 'url') {
    return resolved.value;
  }
  
  // For filenames, use API to get direct URL
  const directUrl = await getDirectFileUrl(resolved.value);
  return directUrl || '';
}

