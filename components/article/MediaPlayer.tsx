import { useAudioPlayer } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import React from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { TNode } from 'react-native-render-html';
import { LAYOUT } from '../../constants/layout';

interface MediaPlayerProps {
  tnode: TNode;
  type: 'video' | 'audio';
}

/**
 * Media player component using expo-video and expo-audio
 * Handles both video and audio elements from Wikipedia articles
 */
export default function MediaPlayer({ tnode, type }: MediaPlayerProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const attrs = (tnode as any)?.attributes || {};

  // Get media source from various possible attributes
  // Wikipedia often uses 'resource' attribute for media files, or data-file-url, data-file, or href in parent <a> tags
  let rawSrc =
    attrs.resource ||
    attrs.src ||
    attrs['data-src'] ||
    attrs['data-file-url'] ||
    attrs['data-file'] ||
    attrs.source ||
    attrs.href ||
    '';
  const rawPoster = attrs.poster || attrs['data-poster'] || '';

  // Check for <source> tags inside the audio/video element (common in HTML5)
  if (!rawSrc && (tnode as any)?.children) {
    try {
      const children = (tnode as any).children || [];
      for (const child of children) {
        if (child.type === 'tag' && (child.name === 'source' || child.name === 'track')) {
          const childAttrs = child.attributes || {};
          const childSrc = childAttrs.src || childAttrs['data-src'] || '';
          if (childSrc) {
            rawSrc = childSrc;
            break;
          }
        }
      }
    } catch (e) {
      // Ignore errors accessing children
    }
  }

  // Also check parent node for href (Wikipedia often wraps media in <a> tags)
  let parentHref = '';
  try {
    let parent: TNode | null | undefined = (tnode as TNode & { parent?: TNode | null })?.parent;
    while (parent && !parentHref) {
      if (parent.attributes?.href) {
        parentHref = parent.attributes.href;
        break;
      }
      parent = (parent as TNode & { parent?: TNode | null })?.parent ?? null;
    }
  } catch (e) {
    // Ignore errors accessing parent
  }

  // Use parent href if no direct src found
  const finalRawSrc = rawSrc || parentHref;

  // Resolve media URL - convert Wikipedia file references to Wikimedia Commons URLs
  const resolveMediaUrl = (raw: string): string => {
    if (!raw) return '';
    let mediaUrl = raw.trim();

    // Filter out invalid protocols like "about:", "javascript:", "data:"
    if (
      mediaUrl.startsWith('about:') ||
      mediaUrl.startsWith('javascript:') ||
      mediaUrl.startsWith('data:')
    ) {
      return '';
    }

    // If it's already a valid full URL with protocol, validate and return
    if (mediaUrl.includes('://')) {
      // Only allow https:// URLs
      if (mediaUrl.startsWith('https://')) {
        return mediaUrl;
      }
      // Block other protocols
      return '';
    }

    // Protocol-relative -> https
    if (mediaUrl.startsWith('//')) {
      mediaUrl = 'https:' + mediaUrl;
      return mediaUrl;
    }

    // Check for File: or Image: patterns anywhere in the URL
    // This handles cases like "./File:name.ogg", "/File:name.ogg", "File:name.ogg", etc.
    const filePatterns = [
      /^(File|Image):(.+)$/i, // "File:name.ogg"
      /^\.\/(File|Image):(.+)$/i, // "./File:name.ogg"
      /^\/(?:wiki\/)?(File|Image):(.+)$/i, // "/File:name.ogg" or "/wiki/File:name.ogg"
      /\/wiki\/(?:File|Image):(.+)$/i, // "/wiki/File:name.ogg" (in full URLs)
    ];

    for (const pattern of filePatterns) {
      const match = mediaUrl.match(pattern);
      if (match) {
        // Extract filename (could be in match[1] or match[2] depending on pattern)
        const fileName = match[match.length - 1].split('#')[0].split('?')[0].trim();
        if (fileName) {
          // Construct direct file URL from Commons
          // Format: https://upload.wikimedia.org/wikipedia/commons/[first char]/[first 2 chars]/[filename]
          // Commons uses the original filename with spaces as underscores in the path
          // The filename in the URL path should match exactly how it's stored (with underscores, not encoded)
          const firstChar = fileName.charAt(0).toUpperCase();
          const secondChar = fileName.charAt(1) || firstChar;
          // Commons stores files with underscores, so ensure filename uses underscores
          // Don't URL-encode the filename in the path - Commons expects the literal filename
          const pathFileName = fileName.replace(/ /g, '_');
          // Only encode characters that are absolutely necessary for URL safety
          // But keep underscores, dashes, dots, and alphanumeric as-is
          const safeFileName = pathFileName
            .split('')
            .map((char) => {
              // Keep safe URL characters as-is
              if (/[a-zA-Z0-9_.-]/.test(char)) {
                return char;
              }
              // Encode only special/unsafe characters
              return encodeURIComponent(char);
            })
            .join('');
          const directFileUrl = `https://upload.wikimedia.org/wikipedia/commons/${firstChar}/${firstChar}${secondChar}/${safeFileName}`;
          return directFileUrl;
        }
      }
    }

    // If it's a relative path without File: prefix, check if it looks like a media file
    // Wikipedia sometimes uses relative paths that point to media files
    if (mediaUrl.startsWith('./') || (mediaUrl.startsWith('/') && !mediaUrl.startsWith('//'))) {
      const rest = mediaUrl.startsWith('./') ? mediaUrl.slice(2) : mediaUrl.slice(1);

      // Check if it's a media file extension (common audio/video formats)
      const mediaExtensions = /\.(ogg|oga|ogv|mp3|mp4|m4a|m4v|webm|wav|flac|aac|opus)$/i;
      if (mediaExtensions.test(rest)) {
        // Construct direct file URL from Commons
        const firstChar = rest.charAt(0).toUpperCase();
        const secondChar = rest.charAt(1) || firstChar;
        const pathFileName = rest.replace(/ /g, '_');
        const safeFileName = pathFileName
          .split('')
          .map((char) => {
            if (/[a-zA-Z0-9_.-]/.test(char)) {
              return char;
            }
            return encodeURIComponent(char);
          })
          .join('');
        const directFileUrl = `https://upload.wikimedia.org/wikipedia/commons/${firstChar}/${firstChar}${secondChar}/${safeFileName}`;
        return directFileUrl;
      }

      // Otherwise treat as wiki article path
      if (mediaUrl.startsWith('./')) {
        mediaUrl = `https://en.wikipedia.org/wiki/${rest}`;
      } else {
        mediaUrl = `https://en.wikipedia.org${mediaUrl}`;
      }
      return mediaUrl;
    }

    // If it already looks like a direct upload url, return as-is (ensure protocol)
    if (mediaUrl.includes('upload.wikimedia.org') || mediaUrl.includes('commons.wikimedia.org')) {
      if (mediaUrl.startsWith('//')) mediaUrl = 'https:' + mediaUrl;
      return mediaUrl;
    }

    // If it's a bare filename with media extension, assume it's a Commons file
    const mediaExtensions = /\.(ogg|oga|ogv|mp3|mp4|m4a|m4v|webm|wav|flac|aac|opus)$/i;
    if (mediaExtensions.test(mediaUrl) && !mediaUrl.includes('/') && !mediaUrl.includes(':')) {
      // Construct direct file URL from Commons
      const firstChar = mediaUrl.charAt(0).toUpperCase();
      const secondChar = mediaUrl.charAt(1) || firstChar;
      const pathFileName = mediaUrl.replace(/ /g, '_');
      const safeFileName = pathFileName
        .split('')
        .map((char) => {
          if (/[a-zA-Z0-9_.-]/.test(char)) {
            return char;
          }
          return encodeURIComponent(char);
        })
        .join('');
      const directFileUrl = `https://upload.wikimedia.org/wikipedia/commons/${firstChar}/${firstChar}${secondChar}/${safeFileName}`;
      return directFileUrl;
    }

    // If it looks like an article title (no extension, no slashes, no colons),
    // it might be a Wikipedia file reference without the File: prefix
    // Try converting it to a Commons URL with common audio extensions
    if (!mediaUrl.includes('/') && !mediaUrl.includes(':') && !mediaUrl.includes('.')) {
      // Common audio file extensions to try
      const audioExtensions = ['.ogg', '.oga', '.mp3', '.wav', '.webm'];
      const fileName = mediaUrl + audioExtensions[0];
      // Construct direct file URL from Commons
      const firstChar = fileName.charAt(0).toUpperCase();
      const secondChar = fileName.charAt(1) || firstChar;
      const pathFileName = fileName.replace(/ /g, '_');
      const safeFileName = pathFileName
        .split('')
        .map((char) => {
          if (/[a-zA-Z0-9_.-]/.test(char)) {
            return char;
          }
          return encodeURIComponent(char);
        })
        .join('');
      const directFileUrl = `https://upload.wikimedia.org/wikipedia/commons/${firstChar}/${firstChar}${secondChar}/${safeFileName}`;
      return directFileUrl;
    }

    // Fallback: return empty string for unrecognized URLs
    return '';
  };

  const src = resolveMediaUrl(finalRawSrc);
  const poster = resolveMediaUrl(rawPoster);

  // Calculate max width for large screens
  const isLargeScreen = windowWidth >= LAYOUT.DESKTOP_BREAKPOINT;
  const maxWidth = isLargeScreen ? Math.min(LAYOUT.ARTICLE_MAX_WIDTH, 900) : windowWidth - 32;
  const playerWidth = typeof maxWidth === 'number' ? maxWidth : windowWidth - 32;

  // Determine aspect ratio (default 16:9 for video, auto for audio)
  const aspectRatio =
    type === 'video'
      ? attrs.width && attrs.height
        ? Number(attrs.width) / Number(attrs.height)
        : 16 / 9
      : undefined;

  const height =
    type === 'video' && aspectRatio ? playerWidth / aspectRatio : type === 'audio' ? 60 : 300;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Always call both hooks unconditionally to satisfy React Hooks rules
  // Pass empty string if src is invalid - hooks will handle it gracefully
  const videoPlayer = useVideoPlayer(src || '', (player) => {
    if (src) {
      player.loop = false;
      player.muted = false;
    }
  });

  const audioPlayer = useAudioPlayer(src || '');

  // Early return after all hooks are called
  if (!src) {
    return null;
  }

  // For web, fall back to native HTML5 elements
  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          width: '100%',
          marginVertical: 16,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: playerWidth,
            maxWidth: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          {type === 'video' ? (
            <video
              controls
              poster={poster || undefined}
              style={{
                width: '100%',
                height: 'auto',
                maxWidth: '100%',
              }}
              preload="metadata"
              crossOrigin="anonymous"
            >
              <source src={src} type="video/mp4" />
              <source src={src} type="video/webm" />
              <source src={src} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <audio
              controls
              style={{
                width: '100%',
              }}
              preload="metadata"
              crossOrigin="anonymous"
            >
              <source src={src} type="audio/mpeg" />
              <source src={src} type="audio/mp3" />
              <source src={src} type="audio/ogg" />
              <source src={src} type="audio/wav" />
              <source src={src} type="audio/webm" />
              Your browser does not support the audio tag.
            </audio>
          )}
        </View>
      </View>
    );
  }

  // For native platforms, use expo-video and expo-audio
  if (type === 'video') {
    return (
      <View
        style={{
          width: '100%',
          marginVertical: 16,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: playerWidth,
            maxWidth: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <VideoView
            player={videoPlayer}
            style={{
              width: playerWidth,
              height: height,
            }}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
            nativeControls
          />
        </View>
      </View>
    );
  } else {
    // Audio player
    return (
      <View
        style={{
          width: '100%',
          marginVertical: 16,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: playerWidth,
            maxWidth: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceVariant,
            padding: 8,
          }}
        >
          <View
            style={{
              width: '100%',
              height: height,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* expo-audio doesn't have a built-in UI component, so we'll use a simple play/pause button */}
            {/* For now, we'll render a placeholder - you may want to create a custom audio player UI */}
            <View
              style={{
                width: '100%',
                height: 60,
                backgroundColor: theme.colors.surface,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.colors.onSurface }}>
                Audio: {src.split('/').pop() || 'Unknown'}
              </Text>
              {/* Note: You'll need to add play/pause controls using player.play() and player.pause() */}
            </View>
          </View>
        </View>
      </View>
    );
  }
}
