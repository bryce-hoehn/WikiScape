import { selectAll, selectOne } from 'css-select';
import { render } from 'dom-serializer';
import type { Element } from 'domhandler';
import { getChildren, removeElement, textContent } from 'domutils';
import { parseDocument } from 'htmlparser2';
import { extractAltText } from './imageAltText';

// Re-export commonly used utilities for consistent imports across the codebase
export { selectAll, selectOne } from 'css-select';
export { render } from 'dom-serializer';
export type { Element } from 'domhandler';
export { getChildren, removeElement, textContent } from 'domutils';
export { parseDocument } from 'htmlparser2';

export const DEFAULT_SELECTORS_TO_REMOVE = [
  '.mw-editsection',
  '.hatnote',
  '.navbox',
  '.catlinks',
  '.printfooter',
  '.portal',
  '.portal-bar',
  '.sister-bar',
  '.sistersitebox',
  '.sidebar',
  '.shortdescription',
  '.nomobile',
  '.mw-empty-elt',
  '.mw-valign-text-top',
  '.plainlinks',
  'style',
];

/**
 * Synchronous wrapper around htmlparser2.parseDocument so callers import a single shared helper.
 * Keeping the parsing centralized avoids scattering direct htmlparser2 imports across the codebase.
 */
export function parseHtml(html: string) {
  if (!html || typeof html !== 'string') {
    throw new Error('Invalid HTML input');
  }
  try {
    const doc = parseDocument(html);
    return doc;
  } catch (err) {
    throw err;
  }
}

/**
 * Unified parser that parses HTML once and extracts all article structure.
 * Returns DOM nodes instead of HTML strings to avoid expensive serialization.
 * This eliminates triple parsing and defers serialization until needed.
 */
export interface ParsedArticleStructure {
  dom: ReturnType<typeof parseDocument>;
  infoboxElement: Element | null;
  infoboxImage: { src: string; alt: string; width: number; height: number } | null;
  introElementNodes: Element[];
  sectionElements: Array<{ element: Element; heading: string; id: string }>;
}

export function parseArticleStructure(html: string): ParsedArticleStructure {
  if (!html || typeof html !== 'string') {
    throw new Error('Invalid HTML input');
  }

  try {
    // Single parse - reuse this DOM for all extractions
    const dom = parseHtml(html);

    // Find body element (Wikipedia HTML has body)
    const body = selectOne('body', dom) || dom;
    const bodyChildren = getChildren(body).filter(
      (node): node is Element => node.type === 'tag'
    ) as Element[];

    // Extract infobox
    const infoboxElement = selectOne('.infobox', body) as Element | null;
    let infoboxImage: { src: string; alt: string; width: number; height: number } | null = null;

    if (infoboxElement) {
      // Extract image from infobox DOM directly (no re-parse needed)
      const imgElement = selectOne('img', [infoboxElement]) as Element | null;
      if (imgElement && imgElement.attribs) {
        const attrs = imgElement.attribs;
        let src = attrs.src || attrs['data-src'] || '';

        // Handle protocol-relative URLs
        if (src.startsWith('//')) {
          src = 'https:' + src;
        }

        // Handle relative URLs
        if (src.startsWith('/') && !src.startsWith('//')) {
          src = 'https://en.wikipedia.org' + src;
        }

        const width = parseInt(attrs.width || '400', 10);
        const height = parseInt(attrs.height || '300', 10);
        const alt = extractAltText(attrs, undefined, src);

        infoboxImage = { src, alt, width, height };

        // Remove the image row from infobox
        let nodeToRemove = imgElement;
        let current: any = imgElement;
        while (current && current.parent) {
          if (current.name === 'tr' || (current.name === 'td' && current.parent?.name === 'tr')) {
            nodeToRemove = current.name === 'tr' ? current : current.parent;
            break;
          }
          current = current.parent;
        }
        removeElement(nodeToRemove);
      }
      
      // Remove the infobox from the DOM to prevent it from appearing in intro/sections
      removeElement(infoboxElement);
    }

    // Find all section elements
    const sectionElements = bodyChildren.filter((child: any) => child.name === 'section');

    let introElementNodes: Element[] = [];
    let sectionElementsWithHeading: Array<{ element: Element; heading: string; id: string }> = [];

    if (sectionElements.length === 0) {
      // No sections, fall back to h2-based approach
      const h2Elements = selectAll('h2', body);
      if (h2Elements.length === 0) {
        // No h2s, all content is intro (infobox already removed from DOM)
        introElementNodes = bodyChildren;
      } else {
        // Find first h2 and split there
        const firstH2 = h2Elements.find((el) => 'name' in el && 'attribs' in el) as Element | undefined;
        if (!firstH2) {
          introElementNodes = bodyChildren;
        } else {
          let firstH2Index = -1;
          for (let i = 0; i < bodyChildren.length; i++) {
            const child = bodyChildren[i];
            if (child === firstH2) {
              firstH2Index = i;
              break;
            }
            // Check if this child element contains the h2
            const childH2s: Element[] = selectAll('h2', [child]).filter((el): el is Element => 'name' in el && 'attribs' in el);
            if (childH2s.includes(firstH2)) {
              firstH2Index = i;
              break;
            }
          }

          if (firstH2Index > -1) {
            // Intro: everything before first h2 (infobox already removed from DOM)
            introElementNodes = bodyChildren.slice(0, firstH2Index);

            // Sections: each h2 and its content
            h2Elements.forEach((h2, idx) => {
              if (!('name' in h2) || !('attribs' in h2) || !('tagName' in h2)) return;
              const h2Element = h2 as unknown as Element;
              const heading = textContent(h2Element).trim() || 'Section';
              let h2ContainerIndex = -1;
              for (let i = 0; i < bodyChildren.length; i++) {
                const child = bodyChildren[i];
                if (child === h2Element) {
                  h2ContainerIndex = i;
                  break;
                }
                // Check if this child element contains the h2
                const childH2s: Element[] = selectAll('h2', [child]).filter((el): el is Element => 'name' in el && 'attribs' in el);
                if (childH2s.includes(h2Element)) {
                  h2ContainerIndex = i;
                  break;
                }
              }

              if (h2ContainerIndex === -1) return;

              const nextH2 = h2Elements[idx + 1];
              let endIndex = bodyChildren.length;
              if (nextH2 && 'name' in nextH2 && 'attribs' in nextH2 && 'tagName' in nextH2) {
                const nextH2Element = nextH2 as unknown as Element;
              for (let i = h2ContainerIndex + 1; i < bodyChildren.length; i++) {
                const child = bodyChildren[i];
                if (child === nextH2Element) {
                  endIndex = i;
                  break;
                }
                // Check if this child element contains the next h2
                const childH2s: Element[] = selectAll('h2', [child]).filter((el): el is Element => 'name' in el && 'attribs' in el);
                if (childH2s.includes(nextH2Element)) {
                  endIndex = i;
                  break;
                }
              }
            }

            const sectionNodes = bodyChildren.slice(h2ContainerIndex, endIndex);
            if (sectionNodes.length > 0) {
              // Create a container element for this section
              const sectionContainer = parseDocument('');
              sectionContainer.children = sectionNodes;
              sectionElementsWithHeading.push({
                element: sectionContainer as any,
                heading,
                id: `section-${idx}`,
              });
            }
          });
          }
        }
      }
    } else {
      // Process sections
      let firstH2SectionIndex = -1;
      for (let i = 0; i < sectionElements.length; i++) {
        const sectionH2s = selectAll('h2', [sectionElements[i]]);
        if (sectionH2s.length > 0) {
          firstH2SectionIndex = i;
          break;
        }
      }

      if (firstH2SectionIndex === -1) {
        // No h2 found, all sections are intro (infobox already removed from DOM)
        introElementNodes = sectionElements;
      } else {
        // Intro: sections before first h2 section (infobox already removed from DOM)
        introElementNodes = sectionElements.slice(0, firstH2SectionIndex);

        // Sections: each section with an h2
        let sectionIdx = 0;
        sectionElements.slice(firstH2SectionIndex).forEach((section: Element) => {
          const sectionH2s = selectAll('h2', [section]);
          if (sectionH2s.length > 0) {
            const heading = textContent(sectionH2s[0]).trim() || 'Section';
            sectionElementsWithHeading.push({
              element: section,
              heading,
              id: `section-${sectionIdx}`,
            });
            sectionIdx++;
          }
        });
      }
    }

    return {
      dom,
      infoboxElement,
      infoboxImage,
      introElementNodes,
      sectionElements: sectionElementsWithHeading,
    };
  } catch (err) {
    // Fallback: return minimal structure
    return {
      dom: parseDocument(''),
      infoboxElement: null,
      infoboxImage: null,
      introElementNodes: [],
      sectionElements: [],
    };
  }
}

/**
 * Extract the main image from the infobox
 */
export function extractInfoboxImage(
  infoboxHtml: string
): { src: string; alt: string; width: number; height: number } | null {
  try {
    const dom = parseHtml(infoboxHtml);

    // Find the first img element in the infobox
    const imgElement = selectOne('img', dom.children) as Element | null;

    if (!imgElement || !imgElement.attribs) {
      return null;
    }

    const attrs = imgElement.attribs;
    let src = attrs.src || attrs['data-src'] || '';

    // Handle protocol-relative URLs
    if (src.startsWith('//')) {
      src = 'https:' + src;
    }

    // Handle relative URLs
    if (src.startsWith('/') && !src.startsWith('//')) {
      src = 'https://en.wikipedia.org' + src;
    }

    // Keep thumbnails as-is - they're already optimized and browser handles WebP negotiation
    // No need to convert to full-size images

    const width = parseInt(attrs.width || '400', 10);
    const height = parseInt(attrs.height || '300', 10);

    // Extract alt text from multiple sources
    const alt = extractAltText(attrs, undefined, src);

    return { src, alt, width, height };
  } catch (err) {
    return null;
  }
}

/**
 * Extract infobox table from HTML using DOM parsing and extract its image
 */
export function extractInfobox(html: string) {
  try {
    const dom = parseHtml(html);

    // Use css-select to find the infobox table (captures entire element with all children)
    const infoboxElement = selectOne('.infobox', dom.children);

    if (!infoboxElement) {
      return { infoboxHtml: '', infoboxImage: null, remaining: html };
    }

    // Serialize the infobox element to HTML
    const infoboxHtml = render(infoboxElement);

    // Extract the main image from the infobox
    const infoboxImage = extractInfoboxImage(infoboxHtml);

    // Remove the image and its container from the infobox if we extracted it
    if (infoboxImage) {
      // Find and remove the first image and its parent row/cell from the infobox
      const imgElements = selectAll('img', [infoboxElement]);
      if (imgElements.length > 0) {
        const firstImg = imgElements[0];
        // Try to remove the entire row containing the image
        let nodeToRemove = firstImg;
        let current: any = firstImg;

        // Traverse up to find the tr (table row) or td (table cell)
        while (current && current.parent) {
          if (current.name === 'tr' || (current.name === 'td' && current.parent?.name === 'tr')) {
            nodeToRemove = current.name === 'tr' ? current : current.parent;
            break;
          }
          current = current.parent;
        }

        // Remove the node (row or image itself)
        removeElement(nodeToRemove);
      }
    }

    // Re-serialize the infobox without the image
    const infoboxHtmlWithoutImage = render(infoboxElement);

    // Remove the infobox from the main DOM
    removeElement(infoboxElement);

    // Serialize the remaining DOM back to HTML
    const remaining = render(dom);

    return { infoboxHtml: infoboxHtmlWithoutImage, infoboxImage, remaining };
  } catch (err) {
    // If parsing fails, return original HTML
    return { infoboxHtml: '', infoboxImage: null, remaining: html };
  }
}

/**
 * Extract intro content (everything before the first h2)
 * Wikipedia uses <section> tags: section 0 is intro, subsequent sections contain h2 headings
 */
export function extractIntro(html: string) {
  try {
    const dom = parseHtml(html);

    // Find body element (Wikipedia HTML has body)
    const body = selectOne('body', dom) || dom;
    const bodyChildren = getChildren(body);

    // Find all section elements
    const sections = bodyChildren.filter((child: any) => child.name === 'section');

    if (sections.length === 0) {
      // No sections, fall back to h2-based approach
      const h2Elements = selectAll('h2', body);
      if (h2Elements.length === 0) {
        return { introHtml: html, remaining: '' };
      }
      // Find first h2 and split there
      const firstH2 = h2Elements[0];
      let firstH2Index = -1;
      for (let i = 0; i < bodyChildren.length; i++) {
        if (bodyChildren[i] === firstH2 || selectAll('h2', [bodyChildren[i]]).includes(firstH2)) {
          firstH2Index = i;
          break;
        }
      }
      if (firstH2Index === -1) {
        return { introHtml: html, remaining: '' };
      }
      const introNodes = bodyChildren.slice(0, firstH2Index);
      const remainingNodes = bodyChildren.slice(firstH2Index);
      const introDom = parseDocument('');
      introDom.children = introNodes;
      const remainingDom = parseDocument('');
      remainingDom.children = remainingNodes;
      return {
        introHtml: render(introDom),
        remaining: render(remainingDom),
      };
    }

    // Find first section that contains an h2
    let firstH2SectionIndex = -1;
    for (let i = 0; i < sections.length; i++) {
      const sectionH2s = selectAll('h2', [sections[i]]);
      if (sectionH2s.length > 0) {
        firstH2SectionIndex = i;
        break;
      }
    }

    if (firstH2SectionIndex === -1) {
      // No h2 found in any section, return all as intro
      return { introHtml: html, remaining: '' };
    }

    // Intro: all sections before the first one with an h2 (typically section 0)
    const introSections = sections.slice(0, firstH2SectionIndex);
    const introDom = parseDocument('');
    introDom.children = introSections;
    const introHtml = render(introDom);

    // Remaining: all sections from first h2 section onwards
    const remainingSections = sections.slice(firstH2SectionIndex);
    const remainingDom = parseDocument('');
    remainingDom.children = remainingSections;
    const remainingHtml = render(remainingDom);

    return {
      introHtml,
      remaining: remainingHtml,
    };
  } catch (err) {
    return { introHtml: html, remaining: '' };
  }
}

/**
 * Split content into sections based on <section> tags
 * Wikipedia uses <section> elements: each section with an h2 is a section heading
 */
export function splitIntoSections(html: string) {
  const sections: { id: string; heading: string; html: string }[] = [];
  if (!html || html.trim() === '') return sections;

  try {
    const dom = parseHtml(html);

    // Find body element (Wikipedia HTML has body)
    const body = selectOne('body', dom) || dom;
    const bodyChildren = getChildren(body);

    // Find all section elements
    const sectionElements = bodyChildren.filter((child: any) => child.name === 'section');

    if (sectionElements.length === 0) {
      // No sections, fall back to h2-based approach
      const h2Elements = selectAll('h2', body);
      if (h2Elements.length === 0) {
        sections.push({ id: 'section-0', heading: 'Content', html });
        return sections;
      }

      // For each h2, create a section
      h2Elements.forEach((h2, idx) => {
        const heading = textContent(h2).trim() || 'Section';
        // Find which child contains this h2
        let h2Container: any = null;
        let h2ContainerIndex = -1;
        for (let i = 0; i < bodyChildren.length; i++) {
          if (bodyChildren[i] === h2) {
            h2ContainerIndex = i;
            break;
          }
          if (selectAll('h2', [bodyChildren[i]]).includes(h2)) {
            h2Container = bodyChildren[i];
            h2ContainerIndex = i;
            break;
          }
        }

        if (h2ContainerIndex === -1) return;

        // Find next h2's container
        const nextH2 = h2Elements[idx + 1];
        let endIndex = bodyChildren.length;
        if (nextH2) {
          for (let i = h2ContainerIndex + 1; i < bodyChildren.length; i++) {
            if (bodyChildren[i] === nextH2 || selectAll('h2', [bodyChildren[i]]).includes(nextH2)) {
              endIndex = i;
              break;
            }
          }
        }

        const sectionNodes = bodyChildren.slice(h2ContainerIndex, endIndex);
        if (sectionNodes.length === 0) return;

        const sectionDom = parseDocument('');
        sectionDom.children = sectionNodes;
        const sectionHtml = render(sectionDom);

        if (sectionHtml && sectionHtml.trim().length > 0) {
          sections.push({
            id: `section-${idx}`,
            heading,
            html: sectionHtml,
          });
        }
      });

      return sections;
    }

    // Process each section that contains an h2
    let sectionIdx = 0;
    sectionElements.forEach((section) => {
      const sectionH2s = selectAll('h2', [section]);

      if (sectionH2s.length > 0) {
        // This section has an h2 - it's a section heading
        const heading = textContent(sectionH2s[0]).trim() || 'Section';

        // Render the entire section as the section content
        const sectionDom = parseDocument('');
        sectionDom.children = [section];
        const sectionHtml = render(sectionDom);

        if (sectionHtml && sectionHtml.trim().length > 0) {
          sections.push({
            id: `section-${sectionIdx}`,
            heading,
            html: sectionHtml,
          });
          sectionIdx++;
        }
      }
    });

    return sections;
  } catch (err) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Error splitting into sections:', err);
    }
    sections.push({ id: 'section-0', heading: 'Content', html });
    return sections;
  }
}

/**
 * Extract all images from article HTML
 * Returns an array of image objects with uri and alt text
 * Uses the same logic as ImageRenderer for consistency
 */
export function extractAllImages(html: string): Array<{ uri: string; alt?: string }> {
  if (!html || typeof html !== 'string') {
    return [];
  }

  try {
    const dom = parseHtml(html);
    const body = selectOne('body', dom) || dom;
    const imgElements = selectAll('img', body);

    const images: Array<{ uri: string; alt?: string }> = [];

    // Helper to extract best src from srcset (same logic as ImageRenderer)
    const extractBestSrcFromSrcset = (srcset: string): string => {
      try {
        const candidates = String(srcset)
          .split(',')
          .map((c: string) => c.trim())
          .filter(Boolean);
        if (candidates.length === 0) return '';

        let bestCandidate = candidates[candidates.length - 1];
        let bestResolution = 0;

        for (const candidate of candidates) {
          const parts = candidate.trim().split(/\s+/);
          if (parts.length < 2) continue;

          const descriptor = parts[parts.length - 1];
          const xMatch = descriptor.match(/(\d+)x/);
          if (xMatch) {
            const resolution = parseInt(xMatch[1], 10);
            if (resolution > bestResolution) {
              bestResolution = resolution;
              bestCandidate = candidate;
            }
          }
        }

        return bestCandidate.split(/\s+/)[0];
      } catch {
        return '';
      }
    };

    // Helper to check if image src is invalid
    const isInvalidImageSrc = (src: string): boolean => {
      if (!src) return true;
      return (
        src.startsWith('data:') ||
        src.includes('placeholder') ||
        src.includes('1x1') ||
        src.includes('transparent')
      );
    };

    // Helper to normalize protocol
    const normalizeProtocol = (url: string): string => {
      if (url.startsWith('//')) {
        return 'https:' + url;
      }
      return url;
    };

    // Helper to resolve relative paths
    const resolveRelativePath = (url: string): string => {
      if (url.startsWith('./')) {
        return `https://en.wikipedia.org/wiki/${url.slice(2)}`;
      }
      if (url.startsWith('/') && !url.startsWith('//')) {
        return `https://en.wikipedia.org${url}`;
      }
      return url;
    };

    // Helper to convert Wiki file page to Commons URL
    const convertWikiFilePageToCommons = (url: string): string | null => {
      const fileMatch = url.match(/\/wiki\/(?:File|Image):(.+)$/i);
      if (!fileMatch) return null;

      const fileName = fileMatch[1].split('#')[0].split('?')[0];
      if (!fileName) return null;

      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
    };

    // Helper to resolve image URL fully (same logic as ImageRenderer)
    const resolveImageUrlFull = (raw: string): string => {
      if (!raw) return '';

      let resolvedUrl = normalizeProtocol(raw);
      resolvedUrl = resolveRelativePath(resolvedUrl);

      const commonsUrl = convertWikiFilePageToCommons(resolvedUrl);
      if (commonsUrl) return commonsUrl;

      // Keep thumbnails as-is - they're already optimized
      if (resolvedUrl.includes('upload.wikimedia.org')) {
        return normalizeProtocol(resolvedUrl);
      }

      return resolvedUrl;
    };

    for (const imgNode of imgElements) {
      // Type guard: ensure it's an Element with attribs
      if (!('attribs' in imgNode) || !('name' in imgNode) || !imgNode.attribs) continue;
      const imgElement = imgNode as unknown as Element;
      const attrs = imgElement.attribs;

      // Get raw source (same logic as ImageRenderer)
      const getRawSrcFull = (): string => {
        const directSrc = attrs.src || attrs['data-src'] || attrs['data-image'] || '';
        if (directSrc && !isInvalidImageSrc(directSrc)) {
          return directSrc;
        }

        if (attrs.srcset) {
          const srcsetSrc = extractBestSrcFromSrcset(attrs.srcset);
          if (srcsetSrc && !isInvalidImageSrc(srcsetSrc)) {
            return srcsetSrc;
          }
        }

        return '';
      };

      const rawSrc = getRawSrcFull();
      if (!rawSrc || isInvalidImageSrc(rawSrc)) {
        continue;
      }

      // Resolve URL fully (same as ImageRenderer)
      const imageUrl = resolveImageUrlFull(rawSrc);

      // Skip if still invalid
      if (
        !imageUrl ||
        (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))
      ) {
        continue;
      }

      // Extract parent attributes for alt text (same as ImageRenderer)
      const parent = imgElement.parent;
      const parentAttrs =
        parent && 'attribs' in parent && parent.type === 'tag' ? parent.attribs : undefined;

      // Extract alt text using the fully resolved URL (same as ImageRenderer)
      const alt = extractAltText(attrs, parentAttrs, imageUrl);

      // Add to array if not already present (avoid duplicates)
      if (!images.some((img) => img.uri === imageUrl)) {
        images.push({ uri: imageUrl, alt });
      }
    }

    return images;
  } catch (err) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Error extracting images:', err);
    }
    return [];
  }
}
