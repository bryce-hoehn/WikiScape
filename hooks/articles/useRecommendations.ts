import {
  fetchArticleBacklinks,
  fetchArticleBacklinksBatch,
  fetchArticleLinks,
  fetchArticleLinksBatch,
  fetchArticleSummariesBatch,
  fetchArticleSummary,
} from '@/api';
import useArticleLinks from '@/hooks/storage/useArticleLinks';
import useVisitedArticles from '@/hooks/storage/useVisitedArticles';
import { Article } from '@/types/api';
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

        // Step 2: Batch fetch summaries for all candidates at once (much faster)
        const fetchLimit = Math.min(candidateTitles.length, limit + 5);
        const titlesToFetch = candidateTitles.slice(0, fetchLimit);
        
        let summariesMap: Record<string, Article | null> = {};
        try {
          summariesMap = await queryClient.fetchQuery({
            queryKey: ['article-summaries-batch', titlesToFetch.sort().join('|')],
            queryFn: () => fetchArticleSummariesBatch(titlesToFetch),
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
          });
        } catch (error) {
          // If batch fails, fall back to individual fetches
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('Batch summary fetch failed, falling back to individual fetches:', error);
          }
          for (const title of titlesToFetch) {
            try {
              const response = await queryClient.fetchQuery({
                queryKey: ['article', title],
                queryFn: async () => {
                  const response = await fetchArticleSummary(title);
                  return response.article;
                },
                staleTime: 5 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
              });
              if (response) {
                summariesMap[title] = response;
              }
            } catch {
              summariesMap[title] = null;
            }
          }
        }

        // Convert summaries to recommendations
        const recommendations: RecommendationItem[] = [];
        for (const title of titlesToFetch) {
          if (recommendations.length >= limit) break;
          
          const article = summariesMap[title];
          if (article) {
            recommendations.push({
              title: article.title,
              displaytitle: article.displaytitle || article.title,
              description: article.description,
              extract: article.extract,
              thumbnail: article.thumbnail,
              pageid: article.pageid,
            } as RecommendationItem);
          } else {
            // Include basic recommendation even if fetch failed
            recommendations.push({
              title,
              displaytitle: title,
            } as RecommendationItem);
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
