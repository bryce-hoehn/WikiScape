import { fetchArticleHtml } from '@/api';
import { parseHtml } from '@/utils/articleParsing';
import { followLink, parseLink } from '@/utils/linkHandler';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface HtmlRendererProps {
  html: string;
  maxLines?: number;
  variant?: 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'titleLarge' | 'titleMedium' | 'titleSmall';
  style?: any;
}

/**
 * Simplified HTML renderer that renders all text inline
 *
 * Uses the centralized parseHtml helper so parsing behavior is consistent
 * across the codebase and to avoid direct htmlparser2 imports here.
 */
export default function HtmlRenderer({
  html,
  maxLines,
  variant = 'bodyLarge',
  style,
}: HtmlRendererProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Prefetch article HTML on hover for faster navigation
  const handleLinkHover = useCallback((title: string) => {
    if (Platform.OS !== 'web' || !title) return;
    
    const parsed = parseLink(title);
    // Only prefetch article links, not categories or external links
    if (parsed.kind === 'article' && parsed.id) {
      queryClient.prefetchQuery({
        queryKey: ['article-html', parsed.id],
        queryFn: () => fetchArticleHtml(parsed.id!),
        staleTime: 30 * 60 * 1000, // 30 minutes - matches useArticleHtml config
      });
    }
  }, [queryClient]);

  // Memoize parsed elements to avoid re-parsing on every render
  const { elements, plainText } = useMemo(() => {
    // Validate html input
    if (!html || typeof html !== 'string' || html.trim() === '') {
      return { elements: [], plainText: null };
    }

    try {
      const doc = parseHtml(html);
      const parsedElements = (doc && (doc as any).children) || [];
      return { elements: parsedElements, plainText: null };
    } catch (parseError) {
      // Avoid noisy logging — fallback to plain text rendering when parse fails
      // Use DOM parsing for fallback instead of regex
      try {
        const { textContent } = require('@/utils/articleParsing');
        const fallbackDoc = parseHtml(html);
        const fallbackText = textContent(fallbackDoc).trim();
        return { elements: [], plainText: fallbackText || null };
      } catch {
        // Last resort: simple regex fallback (only when DOM parsing also fails)
        // This is acceptable as a final fallback when DOM parsing fails completely
        const fallbackText = html.replace(/<[^>]*>/g, '').trim();
        return { elements: [], plainText: fallbackText || null };
      }
    }
  }, [html]);

  // Early return for invalid/empty HTML
  if (!html || typeof html !== 'string' || html.trim() === '') {
    return null;
  }

  // Early return for plain text fallback
  if (plainText !== null) {
    if (!plainText) {
      return null;
    }
    return (
      <Text variant={variant} style={style} numberOfLines={maxLines}>
        {plainText}
      </Text>
    );
  }

  // Memoize link press handler to prevent recreating on every render
  const handleLinkPress = useCallback((href: string) => {
    if (!href || typeof href !== 'string') return;
    // Delegate to shared link handler which decides navigation vs external open.
    followLink(href);
  }, []);

  // Memoize rendered content to avoid re-rendering on every render
  // Note: renderNode is recreated on each render but content is memoized
  const content = useMemo(() => {
    // Recursive node renderer that returns inline <Text> elements
    interface HtmlNode {
      type: string;
      data?: string;
      name?: string;
      attribs?: Record<string, string>;
      children?: HtmlNode[];
      [key: string]: unknown;
    }

    const renderNode = (node: HtmlNode, key: string): React.ReactNode => {
      if (node.type === 'text') {
        return node.data;
      }

      if (node.type === 'tag') {
        const children =
          node.children?.map((child: HtmlNode, index: number) =>
            renderNode(child, `${key}-${index}`)
          ) || [];

        switch (node.name) {
          case 'br':
            return '\n';
          case 'strong':
          case 'b':
            return (
              <Text key={key} style={{ fontWeight: 'bold' }}>
                {children}
              </Text>
            );
          case 'em':
          case 'i':
            return (
              <Text key={key} style={{ fontStyle: 'italic' }}>
                {children}
              </Text>
            );
          case 'a': {
            const href = node.attribs?.href;
            if (!href) {
              return <Text key={key}>{children}</Text>;
            }
            return (
              <Text
                key={key}
                style={{ color: theme.colors.primary }}
                onPress={(e: unknown) => {
                  // Prevent default anchor behavior on web
                  if (
                    Platform.OS === 'web' &&
                    e &&
                    typeof e === 'object' &&
                    'preventDefault' in e
                  ) {
                    (
                      e as { preventDefault: () => void; stopPropagation: () => void }
                    ).preventDefault();
                    (
                      e as { preventDefault: () => void; stopPropagation: () => void }
                    ).stopPropagation();
                  }
                  handleLinkPress(href);
                }}
                {...(Platform.OS === 'web' && {
                  onMouseEnter: () => handleLinkHover(href),
                })}
              >
                {children}
              </Text>
            );
          }
          case 'style':
            return null;
          case 'span':
            if (
              node.attribs?.class === 'wikipedia-link' ||
              node.attribs?.class === 'mw-page-title-main'
            ) {
              let articleTitle = '';
              const firstChild = node.children?.[0];
              if (firstChild && firstChild.type === 'text' && firstChild.data) {
                articleTitle = firstChild.data;
              }
              return (
                <Text
                  key={key}
                  style={{ color: theme.colors.primary }}
                  onPress={() => {
                    if (articleTitle) {
                      followLink(articleTitle);
                    }
                  }}
                  {...(Platform.OS === 'web' && {
                    onMouseEnter: () => {
                      if (articleTitle) {
                        handleLinkHover(articleTitle);
                      }
                    },
                  })}
                >
                  {children}
                </Text>
              );
            }
            return children;
          default:
            return children;
        }
      }

      return null;
    };

    return elements.map((node: any, index: number) => renderNode(node, `node-${index}`));
  }, [elements, theme.colors.primary, handleLinkPress, handleLinkHover]);

  // Wrap all in a single Text so they stay inline
  return (
    <Text
      variant={variant}
      style={[{ color: theme.colors.onSurface }, style]}
      numberOfLines={maxLines}
    >
      {content}
    </Text>
  );
}
