import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Page title */}
        <title>Wikiscroll</title>

        {/* Link the PWA manifest file. */}
        <link rel="manifest" href="/manifest.json" />

        {/* Preconnect to Wikipedia/Wikimedia for faster API and image requests */}
        <link rel="preconnect" href="https://en.wikipedia.org" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="dns-prefetch" href="https://en.wikipedia.org" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />

        {/* Theme color for mobile browsers - matches manifest */}
        <meta name="theme-color" content="#000000" />

        {/* Apple specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wikiscroll" />
        <link rel="apple-touch-icon" href="/icon.png" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Smooth scrolling for better UX on web */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            html {
              scroll-behavior: smooth;
            }
            body {
              margin: 0;
              padding: 0;
              /* Hide scrollbar for Firefox */
              scrollbar-width: none;
              /* Hide scrollbar for IE and Edge */
              -ms-overflow-style: none;
            }
            /* Hide scrollbar for Chrome, Safari and Opera */
            body::-webkit-scrollbar {
              display: none;
            }
            #root {
              min-height: 100vh;
              /* Hide scrollbar for Firefox */
              scrollbar-width: none;
              /* Hide scrollbar for IE and Edge */
              -ms-overflow-style: none;
            }
            /* Hide scrollbar for Chrome, Safari and Opera */
            #root::-webkit-scrollbar {
              display: none;
            }
            /* Ensure all potential white backgrounds are overridden */
            * {
              scroll-behavior: smooth;
            }
            /* Hide scrollbars on all scrollable elements */
            * {
              /* Hide scrollbar for Firefox */
              scrollbar-width: none;
              /* Hide scrollbar for IE and Edge */
              -ms-overflow-style: none;
            }
            /* Hide scrollbar for Chrome, Safari and Opera */
            *::-webkit-scrollbar {
              display: none;
            }
          `,
          }}
        />
        {/* Set initial background immediately based on user's theme preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              // Determine background color based on theme preference
              function getInitialBackgroundColor() {
                try {
                  // Check localStorage for saved theme preference
                  const savedTheme = localStorage.getItem('wikipediaexpo_theme_preference');
                  
                  // Theme color mappings
                  const themeColors = {
                    'light': '#F9F9FF',
                    'light-medium-contrast': '#F9F9FF',
                    'light-high-contrast': '#F9F9FF',
                    'dark': '#111318',
                    'dark-medium-contrast': '#111318',
                    'dark-high-contrast': '#111318',
                    'papyrus': '#F5E6D3'
                  };
                  
                  if (savedTheme && themeColors[savedTheme]) {
                    return themeColors[savedTheme];
                  }
                  
                  // If automatic or no preference, check system preference
                  if (!savedTheme || savedTheme === 'automatic') {
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      return '#111318'; // Dark theme
                    }
                    return '#F9F9FF'; // Light theme (default)
                  }
                  
                  // Fallback to dark theme
                  return '#111318';
                } catch (e) {
                  // If localStorage is not available, check system preference
                  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    return '#111318';
                  }
                  return '#F9F9FF';
                }
              }
              
              const bgColor = getInitialBackgroundColor();
              
              // Set background color immediately
              document.documentElement.style.backgroundColor = bgColor;
              document.body.style.backgroundColor = bgColor;
              const root = document.getElementById('root');
              if (root) {
                root.style.backgroundColor = bgColor;
                root.setAttribute('style', (root.getAttribute('style') || '') + '; background-color: ' + bgColor + ' !important;');
              }
              
              // Create a global style tag immediately to override everything
              let style = document.getElementById('initial-background-style');
              if (!style) {
                style = document.createElement('style');
                style.id = 'initial-background-style';
                style.textContent = 'html, body, #root { background-color: ' + bgColor + ' !important; }';
                document.head.insertBefore(style, document.head.firstChild);
              }
            })();
          `,
          }}
        />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>
        {/* Use static rendering with Expo Router to support running without JavaScript. */}
        <noscript>You need to enable JavaScript to run this app.</noscript>
        {/* The root element for your Expo app. */}
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
