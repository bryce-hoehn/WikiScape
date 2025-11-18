/**
 * Component-specific type definitions for Wikipedia Expo
 */

import { ImageThumbnail } from '../api/base';
import { Bookmark } from '../bookmarks';

/**
 * Standardized data structure for recommendation cards
 */
export interface RecommendationItem {
  title: string;
  displaytitle?: string;
  description?: string;
  extract?: string; // Full article summary/extract
  thumbnail?: ImageThumbnail;
  pageid?: number;
  // Additional properties for compatibility with various data sources
  articleTitle?: string;
  page?: {
    title: string;
    thumbnail?: ImageThumbnail;
  };
  links?: {
    title: string;
    thumbnail?: ImageThumbnail;
  }[];
  pages?: {
    title: string;
    thumbnail?: ImageThumbnail;
  }[];
  story?: string;
  html?: string;
  text?: string;
  year?: number;
}

/**
 * Props for feed components that display article lists
 */
export interface FeedItemProps {
  item: RecommendationItem;
  index: number;
}

/**
 * Props for bookmark toggle functionality
 */
export interface BookmarkToggleProps {
  item: RecommendationItem;
  onBookmarkToggle: (item: RecommendationItem) => void;
  isBookmarked: (title: string) => boolean;
}

/**
 * Props for recommendation cards
 */
export interface RecommendationCardProps {
  item: RecommendationItem;
  index: number;
  isBookmarked: (title: string) => boolean;
  onBookmarkToggle: (item: RecommendationItem) => void;
  onRemove?: (title: string) => void;
}

/**
 * Props for feed components
 */
export interface FeedProps {
  data: RecommendationItem[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  loadMore: () => void;
  renderEmptyState: () => React.ReactElement | null;
  keyExtractor: (item: RecommendationItem) => string;
  renderItem?: ({ item, index }: { item: RecommendationItem; index: number }) => React.ReactElement;
}

/**
 * Props for carousel components
 */
export interface CarouselProps {
  items: RecommendationItem[];
  itemWidth: number;
  progress?: import('react-native-reanimated').SharedValue<number>;
}

/**
 * Props for trending components
 */
export interface TrendingProps {
  data: RecommendationItem[];
  totalPages: number;
  progress?: import('react-native-reanimated').SharedValue<number>;
}

/**
 * Props for article section rendering
 */
export interface ArticleSectionRendererProps {
  articleHtml: string;
  thumbnail?: ImageThumbnail;
  onImagePress?: (imageUri: string, alt?: string) => void;
}

/**
 * Props for text with links rendering
 */
export interface TextWithLinksRendererProps {
  text: string;
  variant?: 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'titleLarge' | 'titleMedium' | 'titleSmall';
}

/**
 * Props for HTML rendering
 */
export interface HtmlRendererProps {
  html: string;
  style?: React.CSSProperties;
}

/**
 * Props for bookmark cards
 */
export interface BookmarkCardProps {
  item: Bookmark;
  onRemoveBookmark: (title: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

/**
 * Props for recent articles list
 */
export interface RecentArticlesListProps {
  recentVisitedArticles: RecommendationItem[];
  onSuggestionClick: (title: string) => void;
}

/**
 * Props for search overlay component
 */
export interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
}
