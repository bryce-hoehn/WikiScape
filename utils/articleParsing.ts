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
export { removeElement, textContent } from 'domutils';

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
