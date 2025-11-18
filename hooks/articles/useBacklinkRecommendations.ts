import { fetchArticleBacklinks, fetchArticleLinks, fetchArticleSummary } from '@/api';
import useVisitedArticles from '@/hooks/storage/useVisitedArticles';
import { RecommendationItem } from '@/types/components';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * Hook for generating article recommendations using Wikipedia's linkshere API
 * This provides highly relevant recommendations based on articles that link to visited articles
 */
export default function useBacklinkRecommendations() {
  const { visitedArticles } = useVisitedArticles();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get a random visited article
  const getRandomVisitedArticle = useCallback(() => {
    if (visitedArticles.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * visitedArticles.length);
    return visitedArticles[randomIndex];
  }, [visitedArticles]);

  // Get a random backlink from a visited article
  // Uses React Query for caching
  const getRandomBacklink = useCallback(
    async (visitedArticleTitle: string) => {
      try {
        // Use React Query to fetch and cache backlinks
        const backlinkTitles = await queryClient.fetchQuery({
          queryKey: ['article-backlinks', visitedArticleTitle],
          queryFn: () => fetchArticleBacklinks(visitedArticleTitle),
          staleTime: 10 * 60 * 1000, // 10 minutes - backlinks don't change often
          gcTime: 30 * 60 * 1000, // 30 minutes
        });

        if (backlinkTitles.length === 0) {
          return null;
        }

        // Pick a random backlink
        const randomIndex = Math.floor(Math.random() * backlinkTitles.length);
        const randomBacklinkTitle = backlinkTitles[randomIndex];

        // Skip if this is already a visited article
        if (visitedArticles.some((visited) => visited.title === randomBacklinkTitle)) {
          return null;
        }

        return randomBacklinkTitle;
      } catch (error) {
        return null;
      }
    },
    [visitedArticles, queryClient]
  );

  // Get a random forward link from a visited article
  // Uses React Query for caching
  const getRandomForwardlink = useCallback(
    async (visitedArticleTitle: string) => {
      try {
        // Use React Query to fetch and cache forward links
        const forwardLinkTitles = await queryClient.fetchQuery({
          queryKey: ['article-links', visitedArticleTitle],
          queryFn: () => fetchArticleLinks(visitedArticleTitle),
          staleTime: 10 * 60 * 1000, // 10 minutes - links don't change often
          gcTime: 30 * 60 * 1000, // 30 minutes
        });

        if (forwardLinkTitles.length === 0) {
          return null;
        }

        // Pick a random forward link
        const randomIndex = Math.floor(Math.random() * forwardLinkTitles.length);
        const randomForwardLinkTitle = forwardLinkTitles[randomIndex];

        // Skip if this is already a visited article
        if (visitedArticles.some((visited) => visited.title === randomForwardLinkTitle)) {
          return null;
        }

        return randomForwardLinkTitle;
      } catch (error) {
        return null;
      }
    },
    [visitedArticles, queryClient]
  );

  // Main recommendation function using backlinks OR forward links (not both)
  const getRecommendations = useCallback(
    async (limit = 10) => {
      setLoading(true);
      setError(null);

      try {
        if (visitedArticles.length === 0) {
          return [];
        }

        const processedTitles = new Set<string>();
        const visitedTitlesSet = new Set(visitedArticles.map((v) => v.title));

        // Step 1: Collect candidate titles in parallel (backlinks OR forward links, not both)
        const candidateTitles: string[] = [];
        const maxSourceArticles = Math.min(visitedArticles.length, Math.ceil(limit / 2)); // Use multiple source articles

        // Randomly select source articles and decide backlink vs forward link
        const sourceArticles = [...visitedArticles]
          .sort(() => Math.random() - 0.5)
          .slice(0, maxSourceArticles);

        // Fetch all link lists in parallel
        const linkPromises = sourceArticles.map(async (article) => {
          // Randomly choose backlinks OR forward links (50/50)
          const useBacklinks = Math.random() > 0.5;

          try {
            if (useBacklinks) {
              const backlinks = await queryClient.fetchQuery({
                queryKey: ['article-backlinks', article.title],
                queryFn: () => fetchArticleBacklinks(article.title),
                staleTime: 10 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
              });
              return backlinks;
            } else {
              const forwardLinks = await queryClient.fetchQuery({
                queryKey: ['article-links', article.title],
                queryFn: () => fetchArticleLinks(article.title),
                staleTime: 10 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
              });
              return forwardLinks;
            }
          } catch (error) {
            return [];
          }
        });

        const linkResults = await Promise.all(linkPromises);

        // Flatten and shuffle all candidate titles
        const allCandidates = linkResults
          .flat()
          .filter((title) => !visitedTitlesSet.has(title))
          .sort(() => Math.random() - 0.5);

        // Select unique candidates up to limit
        for (const title of allCandidates) {
          if (candidateTitles.length >= limit) break;
          if (!processedTitles.has(title)) {
            processedTitles.add(title);
            candidateTitles.push(title);
          }
        }

        // Step 2: Fetch all summaries in parallel (major performance improvement)
        const summaryPromises = candidateTitles.map(async (title) => {
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
        });

        const results = await Promise.all(summaryPromises);
        const recommendations = results.filter((r): r is RecommendationItem => r !== null);

        return recommendations.slice(0, limit);
      } catch (error) {
        setError('Failed to fetch recommendations');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [visitedArticles, queryClient]
  );

  return {
    getRecommendations,
    visitedArticlesCount: visitedArticles.length,
    loading,
    error,
  };
}
