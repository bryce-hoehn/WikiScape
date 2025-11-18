import { useCallback } from 'react';
import { useBookmarks } from '../../context/BookmarksContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { RecommendationItem } from '../../types/components';

/**
 * Shared hook for bookmark toggle functionality
 * Eliminates duplicate bookmark toggle logic across components
 */
export default function useBookmarkToggle() {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { showSuccess } = useSnackbar();

  const handleBookmarkToggle = useCallback(
    async (item: RecommendationItem) => {
      const bookmarked = isBookmarked(item.title);

      try {
        if (bookmarked) {
          await removeBookmark(item.title);
          showSuccess('Article removed from bookmarks');
        } else {
          await addBookmark(item.title, item.thumbnail, item.description);
          showSuccess('Article bookmarked');
        }
      } catch (error) {
        // Error handling is done by the context
      }
    },
    [addBookmark, removeBookmark, isBookmarked, showSuccess]
  );

  return {
    handleBookmarkToggle,
    isBookmarked,
  };
}
