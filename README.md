# WikiFlow

A modern, cross-platform Wikipedia reader built with React Native and Expo. Explore Wikipedia with a beautiful, intuitive interface optimized for mobile devices. Experience the smooth flow of knowledge discovery.

## Features

### 🏠 Home Screen
- **For You Feed**: Personalized article recommendations based on your reading history
- **Hot Articles**: Trending content from Wikipedia's most read API
- **Random Articles**: Discover new topics with random article exploration
- **Featured Content Carousel**: Interactive carousel with "On This Day", "Did You Know", and news cards

### 🔍 Search & Discovery
- **Smart Search**: Real-time search suggestions with Wikipedia's API
- **Featured Content**: Today's featured article, picture of the day, and more
- **Trending Articles**: Most-read articles with daily updates
- **Categories**: Browse Wikipedia by topic categories with visual icons

### 📚 Reading Experience
- **Bookmarks**: Save articles for offline reading with persistent storage
- **Dark Mode**: Comfortable reading in any lighting with automatic theme switching
- **Responsive Design**: Optimized for mobile and tablet screens
- **Article Navigation**: Easy navigation between related articles with backlink recommendations
- **Image Modal**: Full-screen image viewing with pinch-to-zoom
- **Scroll-to-Top FAB**: Floating action button that appears when scrolling down, providing quick navigation back to the top

### 🎨 Modern UI
- **Material Design**: Clean, modern interface using React Native Paper
- **Smooth Animations**: Fluid transitions and interactions with Reanimated
- **Accessibility**: Full accessibility support with screen reader compatibility

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing) with typed routes
- **UI Library**: React Native Paper with Material Design
- **State Management**: React Context + TanStack Query for API state
- **TypeScript**: Full type safety with strict configuration
- **Storage**: AsyncStorage for offline bookmarks
- **Performance**: FlashList for efficient list rendering
- **Animations**: React Native Reanimated for smooth interactions
- **Image Handling**: Expo Image for optimized image loading

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bryce-hoehn/WikiFlow
   cd WikipediaExpo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your preferred platform**
   - Press `a` for Android
   - Press `i` for iOS  
   - Press `w` for web
   - Scan QR code with Expo Go app

## Project Structure

```
WikipediaExpo/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Bottom tab navigation (Home, Categories, Search, Bookmarks, Settings)
│   ├── (zArticleStack)/   # Article detail screens with navigation stack
│   └── (zCategoryStack)/  # Category browsing screens
├── components/            # Reusable UI components
│   ├── article/          # Article display components
│   ├── featured/         # Featured content components
│   ├── home/             # Home screen feed components
│   ├── search/           # Search interface components
│   ├── bookmarks/        # Bookmark management components
│   └── layout/           # Layout and navigation components
├── hooks/                # Custom React hooks
│   ├── articles/         # Article-related hooks
│   ├── content/          # Content fetching hooks
│   ├── search/           # Search functionality hooks
│   └── ui/               # UI interaction hooks
├── api/                  # Wikipedia API integrations
│   ├── articles/         # Article data fetching
│   ├── categories/       # Category browsing
│   ├── featured/         # Featured content
│   └── search/           # Search functionality
├── types/                # TypeScript type definitions
├── context/              # React Context providers (Bookmarks, Preferences, Featured Content)
├── utils/                # Utility functions (HTML parsing, error handling, storage)
├── services/             # Service layer (Bookmark management)
└── assets/               # Images and icons (category icons, app icons)
```

## API Integration

The app integrates with multiple Wikipedia APIs:
- **Featured Content API**: Today's featured article, picture of the day, "On This Day", and news
- **Pageviews API**: Trending articles and most-read content
- **Search API**: Real-time search suggestions and article search
- **Article API**: Article summaries, HTML content, thumbnails, and metadata
- **Categories API**: Category browsing and navigation
- **Backlinks API**: Related article recommendations

## Key Features Implementation

### Article Reading
- HTML content parsing and rendering with custom styles
- Image modal with zoom and pan gestures
- Backlink recommendations for content discovery
- Article thumbnails and metadata display

### Content Discovery
- Multiple feed types (For You, Hot, Random)
- Category-based browsing with visual icons
- Trending articles with pagination
- Featured content carousel with different card types

### User Experience
- Persistent bookmarks with AsyncStorage
- Visited article tracking
- Debounced search for performance
- Error boundaries and loading states
- Responsive design for all screen sizes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Wikipedia for providing the content and APIs
- Expo team for the excellent development platform
- React Native community for the ecosystem
- React Native Paper for the UI components
- TanStack Query for efficient data fetching

---

**WikiFlow** - Where knowledge flows smoothly.
