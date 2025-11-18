# WikiFlow

<p align="center">
  <img src="./assets/images/icon.png" alt="wikiflow logo" />
</p>

[Demo](https://wikiflow.expo.app/)

A cross-platform Wikipedia reader built with React Native and Expo. This project is my final passion project required for my UX Master's Degree at Kent State. The goal of the project is to provide a more educational alternative to social media platforms like X utilizing the same attention design principles that makes these platforms addictive.

## About This Project

This is an educational project demonstrating UX principles, modern mobile app development, and API integration. I built it to explore:

- How to create intuitive navigation patterns for content discovery
- Ways to personalize content based on user reading habits
- Modern React Native development practices
- Combining theory of information organization with practical interaction design

The app is functional but has not been thoroughly tested. Consider it a work in progress and a learning exercise.

## Features

### Content Discovery

- **For You Feed**: Personalized recommendations based on reading history
- **Popular Articles**: Top read articles on Wikipedia
- **Random Articles**: Discover new topics
- **Featured Content**: Daily featured articles, "On This Day" entries, and more

### Reading Experience

- **Bookmarks**: Save articles for later
- **Dark Mode**: Automatic theme switching
- **Article Navigation**: Easy browsing between related articles
- **Responsive Design**: Works on any device with a web browser

### Search & Browse

- **Smart Search**: Real-time Wikipedia search suggestions
- **Categories**: Browse by topic with visual navigation
- **Trending**: Most-read articles

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

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo Go app on your phone (for mobile testing)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/bryce-hoehn/WikiFlow
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
WikipediaExpo/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Main navigation tabs
│   └── article/            # Article detail screens
├── components/             # Reusable UI components
├── hooks/                 # Custom React hooks
├── api/                   # Wikipedia API integrations
├── context/                # React Context providers
├── utils/                  # Helper functions
└── types/                  # TypeScript definitions
```

## API Integration

This app uses Wikipedia's public APIs:

- Featured Content API
- Pageviews API
- Search API
- Article API
- Categories API

All content is provided by Wikipedia under their standard licensing terms.

## Known Limitations

- Recommendation algorithm is extremely basic
- Probably still needs some performance optimization
- Error handling could be more robust
- Limited testing
- Media player does not work
- API calls are directly to Wikimedia's public API and thus abide by their rate limits
- The codebase is still being refined as I learn

## Third-Party Libraries

This project uses many excellent open-source libraries. Major dependencies include:

- **Expo** - Development platform and tooling
- **React Native Paper** - Material Design components
- **TanStack Query** - Data fetching and caching
- **React Native Reanimated** - Animations
- **Expo Router** - File-based routing
- **FlashList** - High-performance list rendering

All dependencies are listed in `package.json` with their respective licenses. Most use MIT or Apache 2.0 licenses.

## Acknowledgments

- **Wikipedia** for providing the content and APIs that make this project possible
- **Expo** team for the excellent development platform
- **React Native** community for the ecosystem and support
- **komsiatun** from Noun Project for the book icon used in the logo
- All the open-source maintainers whose libraries I've used

## License

MIT License. See LICENSE.
