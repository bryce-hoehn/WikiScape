import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchArticleThumbnail } from '../../api';
import { ImageThumbnail } from '../../types/api/base';

interface ThumbnailItem {
  thumbnail?: ImageThumbnail;
  pages?: { thumbnail?: ImageThumbnail }[];
  links?: { thumbnail?: ImageThumbnail }[];
  html?: string;
}

/**
 * Hook for loading thumbnails from various content types
 * Extracts complex thumbnail loading logic from FeaturedCarousel
 * Uses React Query for caching thumbnail fetches
 */
export default function useThumbnailLoader(item: ThumbnailItem | null) {
  // Extract title from HTML if needed
  const titleFromHtml = useMemo(() => {
    if (item?.html) {
      return item.html.match(/title="([^"]*)"/)?.[1] || null;
    }
    return null;
  }, [item?.html]);

  // Use React Query to fetch thumbnail when title is extracted from HTML
  const { data: fetchedThumbnail, isLoading: isLoadingThumbnail } = useQuery({
    queryKey: ['article-thumbnail', titleFromHtml],
    queryFn: async () => {
      if (!titleFromHtml) return null;
      const thumb = await fetchArticleThumbnail(titleFromHtml);
      return thumb?.source || null;
    },
    enabled: !!titleFromHtml,
    staleTime: 60 * 60 * 1000, // 1 hour - thumbnails rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
  });

  // Determine thumbnail source based on item type
  const thumbnail = useMemo(() => {
    // Check direct thumbnail first
    if (item?.thumbnail?.source) {
      return item.thumbnail.source;
    }

    // On This Day items
    if (item?.pages) {
      for (const page of item.pages) {
        if (page?.thumbnail?.source) {
          return page.thumbnail.source;
        }
      }
    }
    // In The News items
    else if (item?.links) {
      for (const link of item.links) {
        if (link?.thumbnail?.source) {
          return link.thumbnail.source;
        }
      }
    }
    // Did You Know items - use React Query result
    else if (titleFromHtml && fetchedThumbnail) {
      return fetchedThumbnail;
    }

    return undefined;
  }, [item, titleFromHtml, fetchedThumbnail]);

  // Determine if we're currently loading a thumbnail
  const isLoading = titleFromHtml ? isLoadingThumbnail : false;

  return { thumbnail, isLoading };
}
