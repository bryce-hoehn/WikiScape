import { selectAll } from "css-select";
import { removeElement } from "domutils";
import { Image } from "expo-image";
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

// Custom caption renderer for table captions
export const CaptionRenderer = ({ tnode }: { tnode: any }) => {
  const theme = useTheme();
  
  const textContent = tnode.children
    ?.map((child: any) => child.data || '')
    .join('')
    .trim();

  if (!textContent) {
    return null;
  }

  return (
    <Text
      selectable
      style={{
        textAlign: 'center',
        padding: 8,
        fontStyle: 'italic',
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
        lineHeight: 18,
      }}
    >
      {textContent}
    </Text>
  );
};

// Custom image renderer using Expo Image with comprehensive URL resolution
export const ImageRenderer = ({ 
  tnode, 
  style, 
  onImagePress 
}: { 
  tnode: any; 
  style: any; 
  onImagePress: (image: { uri: string; alt?: string }) => void 
}) => {
  const src = tnode.attributes?.src;
  const alt = tnode.attributes?.alt || '';

  const resolveImageUrl = (src: string) => {
    let imageUrl = src;

    // Fix protocol-relative URLs (//upload.wikimedia.org/...)
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    
    // Fix relative Wikipedia image URLs (/wiki/File:...)
    if (imageUrl.startsWith('/')) {
      imageUrl = 'https://en.wikipedia.org' + imageUrl;
    }
    
    // Fix relative paths without leading slash (./File:...)
    if (imageUrl.startsWith('./')) {
      imageUrl = 'https://en.wikipedia.org/wiki' + imageUrl.slice(1);
    }

    // Handle Wikipedia file URLs - convert to direct image URL
    if (imageUrl.includes('/wiki/File:') || imageUrl.includes('/wiki/Image:')) {
      // Convert Wikipedia file page URL to direct image URL
      const fileName = imageUrl.includes('/wiki/File:') ? imageUrl.split('/wiki/File:')[1] : imageUrl.split('/wiki/Image:')[1];
      if (fileName) {
        const cleanFileName = fileName.split('#')[0].split('?')[0];
        // Use Wikimedia Commons direct URL
        imageUrl = `https://upload.wikimedia.org/wikipedia/commons/${cleanFileName}`;
      }
    }

    // Handle thumbnails and scaled images
    if (imageUrl.includes('/thumb/')) {
      // Remove /thumb/ part to get original image
      imageUrl = imageUrl.replace('/thumb/', '/');
      const parts = imageUrl.split('/');
      // Remove thumbnail filename
      imageUrl = parts.slice(0, -1).join('/');
    }

    // Special handling for Wikimedia map tiles and dynamic images
    if (imageUrl.includes('osm-intl') || imageUrl.includes('maps.wikimedia.org')) {
      // These are dynamic map tiles - they should work as-is with the full URL
    }

    return imageUrl;
  };

  const imageUrl = resolveImageUrl(src || "");

  const handleImagePress = () => {
    onImagePress({ uri: imageUrl, alt });
  };

  return (
    <View style={{ width: '100%', marginVertical: 8 }}>
      <TouchableOpacity
        onPress={handleImagePress}
        activeOpacity={0.7}
        accessibilityLabel={`View image: ${alt || 'Article image'}`}
        accessibilityHint="Opens image in full screen view"
        accessibilityRole="button"
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: '100%',
            height: undefined,
            aspectRatio: tnode.attributes.width / tnode.attributes.height || 1.5
          }}
          contentFit="contain"
          alt={alt}
          accessibilityLabel={alt || 'Article image'}
          accessibilityHint="Article image, tap to view full screen"
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * DOM visitor function to clean up Wikipedia-specific elements
 * Removes edit icons, hatnotes, and navigation boxes while keeping content
 */
export const createDomVisitors = () => {
  const cleanCss = (element: any) => {
    try {
      // Define selectors for elements to remove (keeping infoboxes, external links, and references)
      const selectorsToRemove = [
        '.mw-editsection',     // Edit section links
        '.hatnote',            // Hatnotes (disambiguation links)
        '.navbox',             // Navigation boxes
        '.catlinks',           // Category links at bottom
        '.printfooter',        // Print footer
        '.portal',             // Portal boxes
        '.portal-bar',
        '.sister-bar',
        '.sistersitebox',       // Sister site boxes
        '.sidebar',
        '.shortdescription',
        '.nomobile',
        '.mw-empty-elt',
        '.mw-valign-text-top',
        '.plainlinks',
      ];

      // Process each selector
      selectorsToRemove.forEach((selector) => {
        const elements = selectAll(selector, element);
        elements.forEach((el: any) => {
          try {
            if (el.parentNode) {
              removeElement(el);
            }
          } catch (error) {
            console.warn(`Failed to remove element with selector "${selector}":`, error);
          }
        });
      });

    } catch (error) {
      console.warn('Error in onElement DOM visitor:', error);
    }
  };

  return {
    onElement: cleanCss,
  };
};