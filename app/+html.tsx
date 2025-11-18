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
        <title>WikiFlow</title>

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
        <meta name="apple-mobile-web-app-title" content="WikiFlow" />
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
              background-color: #F9F9FF;
            }
            body {
              background-color: #F9F9FF;
              margin: 0;
              padding: 0;
            }
            #root {
              background-color: #F9F9FF;
              min-height: 100vh;
            }
            @media (prefers-color-scheme: dark) {
              html, body, #root {
                background-color: #111318;
              }
            }
            * {
              scroll-behavior: smooth;
            }
          `,
          }}
        />
        {/* Set initial background based on system preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              const bgColor = prefersDark ? '#111318' : '#F9F9FF';
              document.documentElement.style.backgroundColor = bgColor;
              document.body.style.backgroundColor = bgColor;
              const root = document.getElementById('root');
              if (root) root.style.backgroundColor = bgColor;
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
