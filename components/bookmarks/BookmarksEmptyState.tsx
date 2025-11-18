import { useRouter } from 'expo-router';
import React from 'react';
import StandardEmptyState from '../common/StandardEmptyState';

export default function BookmarksEmptyState() {
  const router = useRouter();

  return (
    <StandardEmptyState
      icon="bookmark-outline"
      title="No Bookmarks Yet"
      description="Articles you bookmark will appear here for easy access later."
      actionLabel="Browse Articles"
      onAction={() => router.push('/')}
    />
  );
}
