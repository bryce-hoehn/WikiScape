import { useFeaturedContent } from '@/context/FeaturedContentContext';
import { router } from 'expo-router';
import React from 'react';
import { getUserFriendlyError } from '../../utils/errorHandling';
import ErrorState from '../common/ErrorState';

/**
 * Fallback UI component for when featured content fails to load.
 * Provides a user-friendly message and a button to return home.
 */
export default function FeaturedContentError() {
  const { error } = useFeaturedContent();
  const errorInfo = getUserFriendlyError(error || new Error('Failed to load featured content'));

  const handleReturnHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <ErrorState
      title="Unable to Load Content"
      message={errorInfo.userFriendlyMessage}
      onRetry={handleReturnHome}
      retryLabel="Return to Home"
      showDetails={false}
      recoverySteps={errorInfo.recoverySteps}
    />
  );
}
