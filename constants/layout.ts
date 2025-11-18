/**
 * Layout constants for responsive design
 * Aligned with Material Design 3 breakpoints and grid system
 * 
 * Window size classes per MD3:
 * - Compact: Under 600dp (phones in portrait)
 * - Medium: 600–839dp (tablets in portrait, foldables unfolded in portrait)
 * - Expanded: 840–1199dp (phones in landscape, tablets in landscape, desktop)
 * - Large: 1200–1599dp (desktop)
 * - Extra-large: 1600+dp (desktop, ultra-wide monitors)
 * 
 * Reference: https://m3.material.io/foundations/layout/applying-layout/window-size-classes
 */

export const LAYOUT = {
  // Maximum content width for centered layouts (Twitter-style)
  // Custom value for optimal content reading width
  MAX_CONTENT_WIDTH: 1200,

  // Maximum width for grid layouts (categories with 2 columns)
  // Custom value for grid-based layouts
  MAX_GRID_WIDTH: 1400,

  // Optimal reading width for articles (600-800px range)
  // Custom value for optimal article reading experience
  ARTICLE_MAX_WIDTH: 800,

  // Breakpoint for very large screens (>1600px)
  // MD3: Extra-large window size class starts at 1600dp
  // Reference: https://m3.material.io/foundations/layout/applying-layout/window-size-classes
  XLARGE_BREAKPOINT: 1600,

  // Drawer width on large screens
  // MD3: Navigation drawer standard width is 320dp
  // Reference: https://m3.material.io/components/navigation-drawer
  DRAWER_WIDTH: 320,

  // Right sidebar width on large screens
  // Custom value for application-specific sidebar
  SIDEBAR_WIDTH: 480,

  // Material Design 3 breakpoints
  // MD3: Medium window size class starts at 600dp
  // Reference: https://m3.material.io/foundations/layout/applying-layout/window-size-classes
  TABLET_BREAKPOINT: 600, // MD3 medium breakpoint (tablets in portrait)

  // MD3: Expanded window size class starts at 840dp
  // Reference: https://m3.material.io/foundations/layout/applying-layout/window-size-classes
  DESKTOP_BREAKPOINT: 840, // MD3 expanded breakpoint (desktop, tablets in landscape)

  // Breakpoint for showing right sidebar (larger screens)
  // Custom value for application-specific sidebar visibility
  SIDEBAR_BREAKPOINT: 1280,

  // Material Design 3 grid columns
  // MD3: Grid system uses 4 columns on mobile, 8 on tablet, 12 on desktop
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/parts-of-layout
  GRID_COLUMNS_MOBILE: 4, // 4-column grid on mobile (compact)
  GRID_COLUMNS_TABLET: 8, // 8-column grid on tablet (medium)
  GRID_COLUMNS_DESKTOP: 12, // 12-column grid on desktop (expanded+)
} as const;
