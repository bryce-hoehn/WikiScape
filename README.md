# WikiScape

<p align="center">
  <img src="./assets/images/icon.png" alt="wikiscape logo" height=128 width=128 />
</p>

[Demo](https://wikiscape.expo.app/)

A cross-platform Wikipedia reader built with React Native and Expo. This project is my final passion project required for my UX Master's Degree at Kent State. The goal of the project is to provide a more educational alternative to social media platforms like X utilizing the same attention design principles that makes these platforms addictive.

## About This Project

This is an educational project demonstrating UX principles, modern mobile app development, and API integration. I built it to explore:

- How to create intuitive navigation patterns for content discovery
- Ways to personalize content based on user reading habits
- Modern React Native development practices
- Combining theory of information organization with practical interaction design

The app is functional but not been thoroughly tested. Consider it a work in progress and a learning exercise.

## Features

### Content Discovery

- **For You Feed**: Personalized recommendations based on reading history
- **Popular Articles**: Top read articles on Wikipedia
- **Random Articles**: Discover new topics
- **Featured Content**: Daily featured articles, "On This Day" entries, and more
- **Bookmarks**: Save articles for later
- **Dark Mode**: Automatic theme switching
- **Article Navigation**: Easy browsing between related articles
- **Responsive Design**: Works on any device with a web browser

### Search & Browse

- **Smart Search**: Real-time Wikipedia search suggestions
- **Categories**: Browse by topic with visual navigation
- **Trending**: Most-read articles

### Reading Experience

- **Customizable Reading Settings**: Adjust font size, line height, paragraph spacing, and content padding
- **Media Support**: Video and audio players with custom controls for Wikipedia media content
- **Incremental Loading**: Articles load progressively for better performance
- **Image Optimization**: Automatic image optimization and lazy loading

### Accessibility

- **Screen Reader Support**: ARIA labels and accessibility hints throughout
- **Text Customization**: Users can change the global font style and size in settings
- **Reduced Motion**: Reduced motion option
- **High Contrast Themes**: Multiple high contrast themes available
- **Focus Management**: Clear focus indicators for keyboard users
- **Alt Text**: Robust mechanisms for extracting alt text from articles with multiple fallbacks

## Tech Stack

- **React Native** with Expo SDK 54
- **Expo Router** for file-based navigation
- **React Native Paper** for Material Design components
- **TypeScript** for type safety
- **TanStack Query** for API state management
- **AsyncStorage** for local data persistence
- **expo-video** and **expo-av** for media playback
- **react-native-render-html** for article rendering

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo Go app on your phone (for mobile testing)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/bryce-hoehn/WikiScape
   cd WikipediaExpo
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```bash
   npx expo start
   ```

4. Run on your preferred platform:
   - Press `w` for web browser
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan the QR code with Expo Go on your phone

## Project Structure

```
WikiScape/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Main navigation tabs
│   ├── article/            # Article detail screens
│   └── subcategory/        # Category browsing
├── components/             # Reusable UI components
│   ├── article/           # Article rendering components
│   │   ├── media/        # Video/audio players
│   │   ├── renderers/    # HTML renderers
│   │   └── hooks/        # Article-specific hooks
│   ├── common/            # Shared UI components
│   ├── featured/          # Featured content cards
│   └── search/            # Search components
├── hooks/                 # Custom React hooks
│   ├── articles/         # Article-related hooks
│   ├── storage/          # Local storage hooks
│   └── ui/               # UI interaction hooks
├── api/                   # Wikipedia API integrations
├── context/                # React Context providers
├── constants/              # Design system constants
├── utils/                  # Helper functions
└── types/                  # TypeScript definitions
```

## Known Limitations

- Recommendation algorithm is extremely basic
- Error handling could be more robust
- Limited testing
- Large bundle size - initial load will always be slow
- Network speed limited by WikiMedia API rate limits
- The codebase is still being refined as I learn

## Third-Party Libraries

This project uses many excellent open-source libraries. Major dependencies include:

- **Expo** - Development platform and tooling
- **React Native Paper** - Material Design components
- **TanStack Query** - Data fetching and caching
- **React Native Reanimated** - Animations
- **Expo Router** - File-based routing
- **FlashList** - High-performance list rendering
- **expo-video** & **expo-av** - Media playback
- **react-native-render-html** - HTML rendering

All dependencies are listed in `package.json` with their respective licenses. Most use MIT or Apache 2.0 licenses.

## Acknowledgments

- **Wikipedia** for providing the content and APIs that make this project possible
- **Maria Karina Putri** from Noun Project for the scroll icon used in the logo
- All the open-source maintainers whose libraries I've used

## License

MIT License. See LICENSE.
