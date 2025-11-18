import useAsyncStorage from './useAsyncStorage';

const NSFW_FILTER_KEY = 'nsfw_filter_enabled';

/**
 * Hook for managing NSFW image filter preference
 * Defaults to false (not hidden/blurred)
 * When enabled, automatically ignores Wikipedia's exception list for stricter filtering
 */
export default function useNsfwFilter() {
  const {
    value: isEnabled,
    isLoading: loading,
    updateValue,
  } = useAsyncStorage<boolean>(NSFW_FILTER_KEY, {
    defaultValue: false,
  });

  return {
    isNsfwFilterEnabled: isEnabled,
    setNsfwFilterEnabled: updateValue,
    loading,
  };
}
