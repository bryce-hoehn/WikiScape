import { useQuery } from '@tanstack/react-query';
import { fetchSearchSuggestions } from '../../api';

/**
 * Hook for fetching Wikipedia search suggestions
 */
export default function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => fetchSearchSuggestions(query),
    enabled: !!query && query.length > 2, // Only fetch when query has at least 3 characters
    staleTime: 10 * 60 * 1000, // 10 minutes - suggestions don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}
