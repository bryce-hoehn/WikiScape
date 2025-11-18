import { useQueryClient } from '@tanstack/react-query';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Linking, Platform, View, useWindowDimensions } from 'react-native';
import { ActivityIndicator, List, Text, useTheme, type MD3Theme } from 'react-native-paper';
import RenderHtml, { HTMLContentModel, HTMLElementModel, TNode } from 'react-native-render-html';
import { fetchArticleHtml } from '../../api';
import { LAYOUT } from '../../constants/layout';
import {
  DEFAULT_SELECTORS_TO_REMOVE,
  extractInfobox,
  extractIntro,
  splitIntoSections,
} from '../../utils/articleParsing';
import { getArticleClassStyles, getArticleTagStyles } from '../../utils/articleStyles';
import { getOptimizedThumbnailUrl } from '../../utils/imageUtils';
import { followLink, parseLink } from '../../utils/linkHandler';
import ResponsiveImage from '../common/ResponsiveImage';
import { CaptionRenderer, ImageRenderer } from './ArticleRenderers';
import ArticleSkeleton from './ArticleSkeleton';

// Lazy load MediaPlayer - only needed when article has video/audio content
const MediaPlayer = React.lazy(() => import('./MediaPlayer'));
/**
 * Sectioned article renderer:
 * - Extracts infobox, intro (content before first <h2>) and remaining <h2> sections.
 * - Renders each part inside a List.Accordion. Introduction accordion is expanded by default.
 * - Sections are parsed on-demand when opened (parseHtml is fast enough < 10ms).
 * - Nested headings (h3/h4) are left inline within section content (not accordions).
 *
 * Sections are parsed on-demand when opened. parseHtml() completes in < 10ms.
 */

interface SectionState {
  id: string;
  heading: string;
  html: string;
  preloaded: boolean; // Whether section has been parsed (for caching)
  error: string | null;
}

interface Props {
  articleHtml: string;
  baseFontSize?: number;
  lineHeight?: number;
  paragraphSpacing?: number;
  fontFamily?: string;
  onSectionsExtracted?: (sections: { id: string; heading: string }[]) => void;
  scrollToSection?: string | null;
  articleTitle?: string; // Article title for NSFW detection
  initialExpandedSections?: string[]; // Sections that should be expanded on load
  onExpandedSectionsChange?: (expandedSections: string[]) => void; // Callback when expanded sections change
  onImagePress?: (image: { uri: string; alt?: string }) => void; // Callback when image is pressed
  scrollViewRef?: React.RefObject<any>; // Reference to parent ScrollView for scroll control
}

function ArticleSectionedRenderer({
  articleHtml,
  baseFontSize = 16,
  lineHeight = 1.6,
  paragraphSpacing = 16,
  fontFamily = 'system',
  onSectionsExtracted,
  scrollToSection,
  articleTitle,
  initialExpandedSections,
  onExpandedSectionsChange,
  onImagePress,
  scrollViewRef,
}: Props) {
  const theme = useTheme();
  const windowDimensions = useWindowDimensions();
  const width = React.useMemo(() => windowDimensions.width, [windowDimensions.width]);
  const primaryColor = theme.colors.primary;
  const queryClient = useQueryClient();

  const handleLinkPress = useCallback((href?: string) => {
    if (!href || typeof href !== 'string') return;
    followLink(href);
  }, []);

  // Prefetch article HTML on hover for faster navigation
  const handleLinkHover = useCallback((href: string) => {
    if (Platform.OS !== 'web' || !href) return;
    
    const parsed = parseLink(href);
    // Only prefetch article links, not categories or external links
    if (parsed.kind === 'article' && parsed.id) {
      queryClient.prefetchQuery({
        queryKey: ['article-html', parsed.id],
        queryFn: () => fetchArticleHtml(parsed.id!),
        staleTime: 30 * 60 * 1000, // 30 minutes - matches useArticleHtml config
      });
    }
  }, [queryClient]);

  const defaultImagePressHandler = useCallback((img: { uri: string; alt?: string }) => {
    if (img?.uri) {
      Linking.openURL(img.uri).catch(() => {
        // Ignore errors opening external URLs
      });
    }
  }, []);
  const renderersProps = useMemo(
    () => ({
      a: {
        onPress: (
          evt: unknown,
          href: string | undefined,
          htmlAttribs: Record<string, string> | undefined,
          target: string | undefined
        ) => {
          if (Platform.OS === 'web' && evt && typeof evt === 'object' && 'preventDefault' in evt) {
            (evt as { preventDefault: () => void; stopPropagation: () => void }).preventDefault();
            (evt as { preventDefault: () => void; stopPropagation: () => void }).stopPropagation();
          }
          if (typeof href === 'string' && !href.includes('/File:') && !href.includes('File:')) {
            handleLinkPress(href);
          }
        },
      },
    }),
    [handleLinkPress]
  );

  const customHTMLElementModels = useMemo(
    () => ({
      audio: HTMLElementModel.fromCustomModel({
        tagName: 'audio',
        contentModel: HTMLContentModel.mixed,
      }),
      video: HTMLElementModel.fromCustomModel({
        tagName: 'video',
        contentModel: HTMLContentModel.mixed,
      }),
      caption: HTMLElementModel.fromCustomModel({
        tagName: 'caption',
        contentModel: HTMLContentModel.textual,
      }),
    }),
    []
  );

  type RendererProps = {
    tnode: TNode;
    TDefaultRenderer: React.ComponentType<any>;
    [key: string]: unknown;
  };

  // Always render ImageRenderer to maintain consistent hook call order
  const imageRendererFn = useCallback(
    (props: RendererProps) => {
      try {
        const tnode = props?.tnode;
        return (
          <ImageRenderer
            tnode={tnode}
            style={{}}
            articleTitle={articleTitle}
            onImagePress={onImagePress || defaultImagePressHandler}
          />
        );
      } catch (err) {
        return (
          <ImageRenderer
            tnode={undefined as any}
            style={{}}
            articleTitle={articleTitle}
            onImagePress={onImagePress || defaultImagePressHandler}
          />
        );
      }
    },
    [articleTitle, onImagePress, defaultImagePressHandler]
  );

  // Custom anchor renderer for web to handle link clicks
  const anchorRendererFn = useCallback(
    (props: RendererProps) => {
      const { tnode, TDefaultRenderer, ...rest } = props;
      const href = tnode?.attributes?.href;

      // Check if the anchor contains an image (common in Wikipedia for linked images)
      const hasImageChild = tnode?.children?.some((child: TNode) => {
        const childWithName = child as TNode & { name?: string };
        return childWithName?.name === 'img';
      });

      // Check if this is a File: link
      const isFileLink = href && (href.includes('/File:') || href.includes('File:'));

      if (Platform.OS === 'web' && href) {
        // If anchor contains an image OR is a File: link, completely prevent navigation
        // (Images in Wikipedia are wrapped in <a> tags linking to the file page)
        if (hasImageChild || isFileLink) {
          // Use a <span> wrapper instead of anchor to completely prevent navigation
          return (
            <View
              style={rest.style as any}
              {...(Platform.OS === 'web'
                ? {
                    onClick: (e: any) => {
                      e?.preventDefault?.();
                      e?.stopPropagation?.();
                    },
                  }
                : {})}
            >
              <TDefaultRenderer {...props} />
            </View>
          );
        }

        // For text links, wrap in a clickable element that prevents default behavior
        return (
          <Text
            style={[rest.style as any, { color: primaryColor }]}
            onPress={() => {
              handleLinkPress(href);
            }}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => handleLinkHover(href),
            })}
          >
            <TDefaultRenderer {...props} />
          </Text>
        );
      }

      // On native, use default renderer with onPress from renderersProps
      return <TDefaultRenderer {...props} />;
    },
    [handleLinkPress, handleLinkHover, primaryColor]
  );

  // Extract video, audio, and caption renderers into stable callbacks
  // Lazy load MediaPlayer with Suspense fallback
  const videoRendererFn = useCallback((props: RendererProps) => {
    try {
      const tnode = props?.tnode;
      if (!tnode) {
        return null;
      }
      return (
        <Suspense fallback={<ActivityIndicator size="small" />}>
          <MediaPlayer tnode={tnode} type="video" />
        </Suspense>
      );
    } catch (err) {
      return null;
    }
  }, []);

  const audioRendererFn = useCallback((props: RendererProps) => {
    try {
      const tnode = props?.tnode;
      if (!tnode) {
        return null;
      }
      return (
        <Suspense fallback={<ActivityIndicator size="small" />}>
          <MediaPlayer tnode={tnode} type="audio" />
        </Suspense>
      );
    } catch (err) {
      return null;
    }
  }, []);

  const captionRendererFn = useCallback((props: RendererProps) => {
    try {
      const tnode = props?.tnode;
      if (!tnode) {
        return null;
      }
      return <CaptionRenderer tnode={tnode} />;
    } catch (err) {
      return null;
    }
  }, []);

  // Memoize renderers to prevent unnecessary re-renders
  // Use useMemo with stable dependencies to avoid re-creating on every render
  const renderers = useMemo(
    () => ({
      // Use a lightweight renderer adapter to call our ImageRenderer which
      // normalizes image URLs for Wikipedia thumbnails and file pages.
      img: imageRendererFn as any,
      a: anchorRendererFn as any,
      video: videoRendererFn as any,
      audio: audioRendererFn as any,
      caption: captionRendererFn as any,
    }),
    [imageRendererFn, anchorRendererFn, videoRendererFn, audioRendererFn, captionRendererFn]
  );

  // Memoize renderersProps to prevent re-creation
  const stableRenderersProps = useMemo(
    () => ({
      a: {
        onPress: (evt: unknown, href: string | undefined) => {
          if (typeof href === 'string') handleLinkPress(href);
        },
      },
    }),
    [handleLinkPress]
  );

  const domVisitors = useMemo(
    () => ({
      onElement: (element: any) => {
        const classAttr = element.attribs?.class || '';
        const classes = classAttr.split(' ');

        let shouldRemove = false;

        for (const selector of DEFAULT_SELECTORS_TO_REMOVE) {
          if (selector.startsWith('.')) {
            const className = selector.slice(1);
            if (classes.includes(className)) {
              shouldRemove = true;
              break;
            }
          }
        }

        // Remove h2 tags since they're already in accordion title
        if (element.name === 'h2') {
          shouldRemove = true;
        }

        if (shouldRemove && element.parent && element.parent.children) {
          const parentChildren = element.parent.children;
          const index = parentChildren.indexOf(element);
          if (index > -1) {
            parentChildren.splice(index, 1);
          }
        }
      },
    }),
    []
  );

  // State for parsed article structure
  const [parsedContent, setParsedContent] = useState<{
    infoboxHtml: string;
    infoboxImage: { src: string; alt: string; width: number; height: number } | null;
    introHtml: string;
    sectionsHtml: { id: string; heading: string; html: string }[];
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Parse HTML asynchronously to avoid blocking UI thread
  useEffect(() => {
    if (!articleHtml) {
      setParsedContent(null);
      return;
    }

    // Check HTML size - for very large HTML, defer parsing
    const htmlSize = articleHtml.length;
    const LARGE_HTML_THRESHOLD = 100 * 1024; // 100KB

    setIsParsing(true);

    const parseArticleHtml = () => {
      try {
        // Parse HTML synchronously (fast for most articles)
        const {
          infoboxHtml: ibHtml,
          infoboxImage: ibImage,
          remaining: noInfobox,
        } = extractInfobox(articleHtml);
        const { introHtml: intro, remaining } = extractIntro(noInfobox);
        const sections = splitIntoSections(remaining);

        // Only update if content actually changed to prevent unnecessary re-renders
        setParsedContent((prev) => {
          // Check if content is the same
          if (
            prev &&
            prev.infoboxHtml === ibHtml &&
            prev.introHtml === intro &&
            prev.sectionsHtml.length === sections.length &&
            prev.sectionsHtml.every(
              (s, i) => s.id === sections[i]?.id && s.heading === sections[i]?.heading
            )
          ) {
            // Content is the same, return previous to prevent re-render
            return prev;
          }

          return {
            infoboxHtml: ibHtml,
            infoboxImage: ibImage,
            introHtml: intro,
            sectionsHtml: sections,
          };
        });
      } catch (error) {
        console.error('Error parsing article HTML:', error);
        // Fallback: create minimal structure
        setParsedContent((prev) => {
          // Only update if different
          if (prev && prev.introHtml === articleHtml && prev.sectionsHtml.length === 0) {
            return prev;
          }
          return {
            infoboxHtml: '',
            infoboxImage: null,
            introHtml: articleHtml,
            sectionsHtml: [],
          };
        });
      } finally {
        setIsParsing(false);
      }
    };

    // For large HTML, defer parsing to avoid blocking UI
    if (htmlSize > LARGE_HTML_THRESHOLD) {
      // Use InteractionManager to defer until after interactions complete
      const handle = InteractionManager.runAfterInteractions(() => {
        // Additional small delay to ensure UI is responsive
        setTimeout(parseArticleHtml, 0);
      });
      return () => handle.cancel();
    } else {
      // For small/medium HTML, parse immediately but yield to UI first
      // Use setTimeout(0) to yield to current render cycle
      const timeoutId = setTimeout(parseArticleHtml, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [articleHtml]);

  // Build initial sections from parsed content
  const initialSections = useMemo<SectionState[]>(() => {
    if (!parsedContent) {
      // Return minimal structure while parsing
      return [
        {
          id: 'intro',
          heading: 'Introduction',
          html: '<p>Loading...</p>',
          preloaded: false,
          error: null,
        },
      ];
    }

    const { infoboxHtml, introHtml, sectionsHtml } = parsedContent;
    const out: SectionState[] = [];
    let idx = 0;

    if (infoboxHtml && infoboxHtml.trim()) {
      out.push({
        id: `infobox`,
        heading: 'Infobox',
        html: infoboxHtml,
        preloaded: false,
        error: null,
      });
      idx++;
    }

    // Intro accordion is open by default
    const introContent =
      introHtml && introHtml.trim() ? introHtml : '<p>No introduction available.</p>';
    out.push({
      id: `intro`,
      heading: 'Introduction',
      html: introContent,
      preloaded: true, // Mark as preloaded since it's expanded by default
      error: null,
    });
    idx++;

    sectionsHtml.forEach((s) => {
      // Only add section if it has HTML content
      if (s.html && s.html.trim().length > 0) {
        out.push({
          id: s.id,
          heading: s.heading,
          html: s.html,
          preloaded: false,
          error: null,
        });
        idx++;
      }
    });

    return out;
  }, [parsedContent]);

  // Use stable initial value for useState to avoid hooks order issues
  const [sections, setSections] = useState<SectionState[]>(() => [
    {
      id: 'intro',
      heading: 'Introduction',
      html: '<p>Loading...</p>',
      preloaded: false,
      error: null,
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(() => {
    // Use initialExpandedSections if provided, otherwise default to intro
    const firstSection = initialExpandedSections?.[0];
    if (firstSection) {
      return firstSection;
    }
    return 'intro'; // Introduction expanded by default
  });

  // Track all expanded sections (for multi-expand support, though currently only one can be expanded)
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    if (initialExpandedSections && initialExpandedSections.length > 0) {
      return initialExpandedSections;
    }
    return ['intro']; // Default to intro expanded
  });

  // Notify parent of extracted sections for TOC
  // Use ref to track previous sections to avoid unnecessary callbacks
  const prevSectionsRef = useRef<string>('');
  const onSectionsExtractedRef = useRef(onSectionsExtracted);
  const onExpandedSectionsChangeRef = useRef(onExpandedSectionsChange);

  // Keep refs in sync with callbacks
  useEffect(() => {
    onSectionsExtractedRef.current = onSectionsExtracted;
  }, [onSectionsExtracted]);

  useEffect(() => {
    onExpandedSectionsChangeRef.current = onExpandedSectionsChange;
  }, [onExpandedSectionsChange]);

  useEffect(() => {
    if (onSectionsExtractedRef.current && sections.length > 0) {
      const sectionsKey = sections.map((s) => s.id).join(',');
      // Only call if sections actually changed
      if (sectionsKey !== prevSectionsRef.current) {
        prevSectionsRef.current = sectionsKey;
        onSectionsExtractedRef.current(sections.map((s) => ({ id: s.id, heading: s.heading })));
      }
    }
  }, [sections]); // Removed onSectionsExtracted from dependencies

  // Handle scroll to section requests
  useEffect(() => {
    if (scrollToSection) {
      setExpandedId(scrollToSection);
    }
  }, [scrollToSection]);

  // Track if we've initialized expanded sections to avoid resetting on user interactions
  const hasInitializedExpanded = useRef(false);
  const previousArticleTitle = useRef(articleTitle);

  // Reset initialization flag when article title changes (new article loaded)
  useEffect(() => {
    if (previousArticleTitle.current !== articleTitle) {
      hasInitializedExpanded.current = false;
      previousArticleTitle.current = articleTitle;
    }
  }, [articleTitle]);

  // If articleHtml changes, reset sections (consolidated effect)
  // Use a ref to track previous initialSections to prevent unnecessary updates
  const prevInitialSectionsRef = useRef<SectionState[]>([]);
  const prevArticleHtmlRef = useRef<string>('');
  
  useEffect(() => {
    // Only update sections if articleHtml actually changed (new article loaded)
    const articleChanged = prevArticleHtmlRef.current !== articleHtml;
    
    if (articleChanged) {
      prevArticleHtmlRef.current = articleHtml;
      // Reset sections when article changes
      prevInitialSectionsRef.current = initialSections;
    setSections(initialSections);

      // Reset expanded sections when article changes
      hasInitializedExpanded.current = false;
      const firstSection = initialExpandedSections?.[0];
      if (firstSection) {
        setExpandedId(firstSection);
        setExpandedSections(initialExpandedSections);
      } else {
        setExpandedId('intro');
        setExpandedSections(['intro']);
      }
      hasInitializedExpanded.current = true;
    } else {
      // Only update sections if initialSections actually changed (by comparing IDs and headings)
      const sectionsChanged = 
        prevInitialSectionsRef.current.length !== initialSections.length ||
        prevInitialSectionsRef.current.some((prevSec, idx) => {
          const currSec = initialSections[idx];
          return !currSec || prevSec.id !== currSec.id || prevSec.heading !== currSec.heading;
        });

      if (sectionsChanged) {
        prevInitialSectionsRef.current = initialSections;
        setSections(initialSections);
      }

      // Only restore expanded sections on initial load
      // Don't reset if user has already interacted with accordions
      if (!hasInitializedExpanded.current) {
        const firstSection = initialExpandedSections?.[0];
        if (firstSection) {
          setExpandedId(firstSection);
          setExpandedSections(initialExpandedSections);
        } else {
          setExpandedId('intro');
          setExpandedSections(['intro']);
        }
        hasInitializedExpanded.current = true;
      }
    }
  }, [articleHtml, initialSections, initialExpandedSections]); // Include articleHtml to detect article changes

  const onAccordionPress = useCallback(
    (id: string) => {
      const wasExpanded = expandedId === id;

      // Toggle expansion
      const newExpandedId = wasExpanded ? null : id;
      setExpandedId(newExpandedId);
      const newExpandedSections = wasExpanded
        ? expandedSections.filter((s) => s !== id)
        : [...expandedSections.filter((s) => s !== id), id];
      setExpandedSections(newExpandedSections);

      // Notify parent (use ref to avoid dependency)
      // Use setTimeout to avoid potential re-render loops during state updates
      if (onExpandedSectionsChangeRef.current) {
        setTimeout(() => {
          onExpandedSectionsChangeRef.current?.(newExpandedSections);
        }, 0);
      }
    },
    [expandedId, expandedSections]
  );

  const elevationLevel5 = (theme.colors as any).elevation?.level5;
  const stableTheme = useMemo((): MD3Theme => {
    const surfaceContainerHighest =
      elevationLevel5 || (theme.colors as any).surfaceContainerHighest;
    const colors = {
      ...theme.colors,
      surfaceContainerHighest,
    };
    return {
      ...theme,
      colors,
      roundness: theme.roundness,
    } as MD3Theme;
  }, [
    theme.colors.onSurface,
    theme.colors.onSurfaceVariant,
    theme.colors.primary,
    elevationLevel5,
    theme.colors.outlineVariant,
    theme.colors.surfaceVariant,
    theme.roundness,
  ]);

  // Memoize tag and class styles to prevent unnecessary re-renders
  // Use stable theme object that only changes when actual values change
  const tagsStyles = useMemo(
    () => getArticleTagStyles(stableTheme, baseFontSize, lineHeight, paragraphSpacing, fontFamily),
    [stableTheme, baseFontSize, lineHeight, paragraphSpacing, fontFamily]
  );

  const classesStyles = useMemo(
    () => getArticleClassStyles(stableTheme, baseFontSize),
    [stableTheme, baseFontSize]
  );

  // Memoize content width to prevent unnecessary recalculations
  const contentWidth = useMemo(() => width - 32, [width]);

  // Memoize static props that are passed to RenderHtml to prevent re-renders
  const systemFonts = useMemo(() => ['Arial', 'Georgia', 'Courier New'], []);
  const ignoredDomTags = useMemo(() => ['script', 'style', 'map', 'link', 'meta', 'math'], []);
  const defaultTextProps = useMemo(() => ({ selectable: true }), []);

  // Memoize renderSectionBody to prevent unnecessary re-renders
  const renderSectionBody = useCallback(
    (sec: SectionState) => {
      // If there's a parse error, show fallback text
      if (sec.error) {
        return <Text variant="bodyMedium">Content unavailable</Text>;
      }

      // Use RenderHtml for actual rich rendering with theme-aware styles
      return (
        <RenderHtml
          source={{ html: sec.html || '' }}
          contentWidth={contentWidth}
          defaultTextProps={defaultTextProps}
          systemFonts={systemFonts}
          ignoredDomTags={ignoredDomTags}
          customHTMLElementModels={customHTMLElementModels}
          domVisitors={domVisitors}
          tagsStyles={tagsStyles as any}
          classesStyles={classesStyles as any}
          renderers={renderers}
          renderersProps={stableRenderersProps}
        />
      );
    },
    [
      contentWidth,
      defaultTextProps,
      systemFonts,
      ignoredDomTags,
      tagsStyles,
      classesStyles,
      customHTMLElementModels,
      domVisitors,
      renderers,
      stableRenderersProps,
    ]
  );

  // Calculate max image width for large screens
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;
  const maxImageWidth = isLargeScreen ? Math.min(LAYOUT.ARTICLE_MAX_WIDTH, 900) : '100%';

  // Calculate desired thumbnail width for main infobox image based on container width
  // Must be called before early return to maintain hook order
  const infoboxThumbnailWidth = useMemo(() => {
    if (typeof maxImageWidth === 'number') {
      // For large screens, use the max image width (up to 1200px for high-res displays)
      return Math.min(maxImageWidth, 1200);
    }
    // For smaller screens, use window width (with some padding consideration)
    return Math.min(width - 32, 800); // Account for padding, max 800px
  }, [maxImageWidth, width]);

  // Get optimized thumbnail URL for the main infobox image
  // Must be called before early return to maintain hook order
  const optimizedInfoboxImageUrl = useMemo(() => {
    if (!parsedContent?.infoboxImage?.src) return null;
    return getOptimizedThumbnailUrl(parsedContent.infoboxImage.src, infoboxThumbnailWidth);
  }, [parsedContent?.infoboxImage?.src, infoboxThumbnailWidth]);

  // Show skeleton while parsing
  if (isParsing || !parsedContent) {
    return <ArticleSkeleton />;
  }

  return (
    <View>
      {/* Display infobox image at the top if available - full width, no padding */}
      {parsedContent?.infoboxImage && optimizedInfoboxImageUrl && (
        <View
          style={{
            marginBottom: 16,
            alignItems: 'center', // Center the image container on large screens
          }}
        >
          <View
            style={{
              width: typeof maxImageWidth === 'number' ? maxImageWidth : '100%',
              maxWidth: typeof maxImageWidth === 'number' ? maxImageWidth : '100%',
            }}
          >
            <ResponsiveImage
              source={{
                source: optimizedInfoboxImageUrl,
                width: parsedContent.infoboxImage.width,
                height: parsedContent.infoboxImage.height,
              }}
              contentFit="cover"
              alt={parsedContent.infoboxImage.alt}
              title={articleTitle}
              onPress={onImagePress}
              style={{
                borderRadius: 0,
              }}
            />
          </View>
        </View>
      )}

      {/* Content with horizontal padding */}
      <View style={{ paddingHorizontal: 8 }}>
        <List.Section style={{ paddingHorizontal: 0 }}>
          {sections.map((sec) => {
            return (
              <View key={sec.id}>
                <List.Accordion
                  title={sec.heading}
                  expanded={expandedId === sec.id}
                  onPress={() => onAccordionPress(sec.id)}
                  left={(props) => null}
                  style={{
                    backgroundColor: 'transparent',
                    marginLeft: 0,
                    marginRight: 0,
                    paddingLeft: 0,
                    paddingRight: 0,
                    width: '100%',
                  }}
                  titleStyle={{
                    fontWeight: '700',
                    fontSize: 18,
                    width: '100%',
                  }}
                  theme={{
                    colors: {
                      background: 'transparent',
                    },
                  }}
                >
                  <View style={{ paddingLeft: 0 }}>
                    {/* Use opacity and pointerEvents to hide when collapsed while keeping components mounted */}
                    <View 
                      style={{ 
                        opacity: expandedId === sec.id ? 1 : 0,
                        height: expandedId === sec.id ? undefined : 0,
                        overflow: expandedId === sec.id ? 'visible' : 'hidden',
                        pointerEvents: expandedId === sec.id ? 'auto' : 'none',
                      }}
                    >
                      {sec.html && !sec.error && renderSectionBody(sec)}
                      {sec.error && (
                      <Text variant="bodyMedium">Content unavailable</Text>
                    )}
                      {!sec.html && !sec.error && (
                      <Text variant="bodyMedium">No content available</Text>
                    )}
                    </View>
                  </View>
                </List.Accordion>
              </View>
            );
          })}
        </List.Section>
      </View>
    </View>
  );
}

// Remove memo wrapper to avoid potential hook count issues
// The component is already optimized with useMemo and useCallback internally
export default ArticleSectionedRenderer;
