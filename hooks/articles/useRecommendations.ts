import {
  fetchArticleBacklinks,
  fetchArticleBacklinksBatch,
  fetchArticleLinks,
  fetchArticleLinksBatch,
  fetchArticleSummary,
} from '@/api';
import useArticleLinks from '@/hooks/storage/useArticleLinks';
import useVisitedArticles from '@/hooks/storage/useVisitedArticles';
import { RecommendationItem } from '@/types/components';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * Hook for generating article recommendations using Wikipedia's link APIs
 * This provides highly relevant recommendations based on articles that link to or are linked from visited articles
 */
export default function useBacklinkRecommendations() {
  const { visitedArticles } = useVisitedArticles();
  const { getArticleLinks, hasArticleLinks, saveArticleLinks } = useArticleLinks();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Main recommendation function
  // Default limit matches ForYouFeed initial load (30)
  const getRecommendations = useCallback(
    async (limit = 30) => {
      setLoading(true);
      setError(null);

      try {
        if (visitedArticles.length === 0) {
          return [];
        }

        const visitedTitlesSet = new Set(visitedArticles.map((v) => v.title));

        // Step 1: Collect all links from all visited articles
        // Check AsyncStorage first, batch fetch missing links using pipe character (|)
        const articlesNeedingFetch: string[] = [];
        const storedLinksMap: Record<string, string[]> = {};

        // Separate articles into those with stored links and those needing fetch
        for (const article of visitedArticles) {
          if (hasArticleLinks(article.title)) {
            // Article exists in storage, use stored links (may be empty array)
            const storedLinks = getArticleLinks(article.title);
            storedLinksMap[article.title] = storedLinks;
              // Also update React Query cache to keep it in sync
              queryClient.setQueryData(['article-links', article.title], storedLinks);
              queryClient.setQueryData(['article-backlinks', article.title], storedLinks);
          } else {
            // Article not in storage, add to batch fetch list
            articlesNeedingFetch.push(article.title);
          }
            }

        // Batch fetch links for all articles not in storage (follows Wikipedia best practice)
        let fetchedLinksMap: Record<string, string[]> = {};
        if (articlesNeedingFetch.length > 0) {
          try {
            // Batch fetch both backlinks and forward links in parallel
            const [backlinksBatch, forwardLinksBatch] = await Promise.all([
              queryClient.fetchQuery({
                queryKey: ['article-backlinks-batch', articlesNeedingFetch.sort().join('|')],
                queryFn: () => fetchArticleBacklinksBatch(articlesNeedingFetch),
                staleTime: 10 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
              }),
              queryClient.fetchQuery({
                queryKey: ['article-links-batch', articlesNeedingFetch.sort().join('|')],
                queryFn: () => fetchArticleLinksBatch(articlesNeedingFetch),
                staleTime: 10 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
              }),
            ]);

            // Combine backlinks and forward links for each article
            for (const title of articlesNeedingFetch) {
              const backlinks = backlinksBatch[title] || [];
              const forwardLinks = forwardLinksBatch[title] || [];
            const allLinks = Array.from(new Set([...backlinks, ...forwardLinks]));
              fetchedLinksMap[title] = allLinks;

              // Save to AsyncStorage for future use (even if empty, to avoid refetching)
              await saveArticleLinks(title, allLinks);

              // Update React Query cache for individual article queries
              queryClient.setQueryData(['article-backlinks', title], backlinks);
              queryClient.setQueryData(['article-links', title], forwardLinks);
            }
          } catch (error) {
            // If batch fetch fails, fall back to individual fetches
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
              console.warn('Batch fetch failed, falling back to individual fetches:', error);
          }
            // Fallback: fetch individually (slower but more resilient)
            for (const title of articlesNeedingFetch) {
              try {
                const [backlinks, forwardLinks] = await Promise.all([
                  fetchArticleBacklinks(title),
                  fetchArticleLinks(title),
                ]);
                const allLinks = Array.from(new Set([...backlinks, ...forwardLinks]));
                fetchedLinksMap[title] = allLinks;
                await saveArticleLinks(title, allLinks);
              } catch {
                fetchedLinksMap[title] = [];
              }
            }
          }
        }

        // Combine stored and fetched links
        const linkResults = visitedArticles.map((article) => {
          return storedLinksMap[article.title] || fetchedLinksMap[article.title] || [];
        });

        // Flatten all links into a single array and filter out visited articles
        const allCandidates = new Set<string>();
        for (const linkList of linkResults) {
          for (const title of linkList) {
            if (!visitedTitlesSet.has(title)) {
              allCandidates.add(title);
            }
          }
        }

        // Convert Set to array and shuffle using Fisher-Yates algorithm
        const candidateArray = Array.from(allCandidates);
        for (let i = candidateArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidateArray[i], candidateArray[j]] = [candidateArray[j], candidateArray[i]];
        }

        // Select candidates up to limit
        const candidateTitles = candidateArray.slice(0, limit);

        // Step 2: Fetch summaries with early termination for better performance
        // Only fetch summaries for the exact number we need (limit), not all candidates
        const recommendations: RecommendationItem[] = [];
        const summaryPromises: Promise<RecommendationItem | null>[] = [];

        // Fetch summaries in batches to allow early termination
        // Request a few extra to account for potential failures
        const fetchLimit = Math.min(candidateTitles.length, limit + 5);
        
        for (let i = 0; i < fetchLimit && recommendations.length < limit; i++) {
          const title = candidateTitles[i];
          const promise = (async () => {
          try {
            const summaryResponse = await queryClient.fetchQuery({
              queryKey: ['article', title],
              queryFn: async () => {
                const response = await fetchArticleSummary(title);
                return response.article;
              },
              staleTime: 5 * 60 * 1000,
              gcTime: 30 * 60 * 1000,
            });

            if (summaryResponse) {
              return {
                title: summaryResponse.title,
                displaytitle: summaryResponse.displaytitle,
                description: summaryResponse.description,
                extract: summaryResponse.extract,
                thumbnail: summaryResponse.thumbnail,
                pageid: summaryResponse.pageid,
              } as RecommendationItem;
            }
            return null;
          } catch (error) {
            // Return basic recommendation if summary fetch fails
            return {
              title,
              displaytitle: title,
            } as RecommendationItem;
          }
          })();

          summaryPromises.push(promise);
        }

        // Wait for all promises and collect valid recommendations
        const results = await Promise.all(summaryPromises);
        for (const result of results) {
          if (result && recommendations.length < limit) {
            recommendations.push(result);
          }
        }

        return recommendations;
      } catch (error) {
        setError('Failed to fetch recommendations');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [visitedArticles, queryClient, getArticleLinks, hasArticleLinks, saveArticleLinks]
  );

  return {
    getRecommendations,
    visitedArticlesCount: visitedArticles.length,
    loading,
    error,
  };
}
