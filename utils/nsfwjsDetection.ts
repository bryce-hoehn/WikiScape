/**
 * NSFWJS-based ML detection for NSFW content
 * Uses TensorFlow.js to classify images on the client side
 * Reference: https://github.com/infinitered/nsfwjs
 *
 * Web only: Uses HTMLImageElement with nsfwjs.classify()
 * React Native: ML detection is not available, falls back to bad image list only
 */

import { Platform } from 'react-native';

// Suppress TensorFlow.js kernel registration warnings (web only)
// These are harmless but noisy messages about kernels being registered
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalLog = console.log;

  // Filter out TensorFlow.js kernel registration messages
  const shouldSuppress = (message: any): boolean => {
    if (typeof message !== 'string') return false;
    return (
      (message.includes('kernel') && message.includes('already registered')) ||
      (message.includes('backend') && message.includes('already registered')) ||
      message.includes('Platform node has already been set') ||
      message.includes('was already registered')
    );
  };

  console.warn = (...args: any[]) => {
    // Check if first argument matches suppression pattern
    const firstArg = args[0];
    if (typeof firstArg === 'string' && shouldSuppress(firstArg)) {
      return; // Suppress this message
    }
    originalWarn.apply(console, args);
  };

  console.log = (...args: any[]) => {
    // Check if first argument matches suppression pattern
    const firstArg = args[0];
    if (typeof firstArg === 'string' && shouldSuppress(firstArg)) {
      return; // Suppress this message
    }
    originalLog.apply(console, args);
  };
}

// TensorFlow.js and nsfwjs imports are conditionally loaded only when NSFW filter is enabled
// Since NSFW filter is disabled by default, these imports are commented out to reduce bundle size
// Uncomment these if NSFW filter is re-enabled:
// import * as tf from '@tensorflow/tfjs';
// import * as nsfwjs from 'nsfwjs';

// Model loading state
// Type definitions commented out since imports are disabled
// let model: nsfwjs.NSFWJS | null = null;
// let modelLoadingPromise: Promise<nsfwjs.NSFWJS> | null = null;
const model: any = null;
let modelLoadingPromise: Promise<any> | null = null;
let modelLoadError: Error | null = null;

// Threshold for NSFW classification (0.0 to 1.0)
// Images with NSFW class probability above this threshold are considered NSFW
const NSFW_THRESHOLD = 0.7;

// NSFW class names from nsfwjs
const NSFW_CLASSES = ['Hentai', 'Porn', 'Sexy'];

/**
 * Load the NSFWJS model (lazy loading, cached after first load)
 * Web only - returns null on React Native
 */
async function loadModel(): Promise<any | null> {
  // Only load on web
  if (Platform.OS !== 'web') {
    return null;
  }

  // Return cached model if already loaded
  if (model) {
    return model;
  }

  // Return existing loading promise if model is currently loading
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  // Start loading the model
  modelLoadingPromise = (async () => {
    try {
      // Enable production mode for better performance
      // tf.enableProdMode(); // Commented out - TensorFlow not loaded

      // Load the model (uses 'mobilenet_v2' by default, which is smaller and faster)
      // const loadedModel = await nsfwjs.load(); // Commented out - nsfwjs not loaded
      // Return null since NSFW filter is disabled
      throw new Error('NSFWJS model loading is disabled - NSFW filter is not enabled');
    } catch (error) {
      modelLoadError = error as Error;
      modelLoadingPromise = null;
      throw error;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Check if an image is NSFW using nsfwjs ML model
 * Web only - returns false on React Native (relies on bad image list)
 *
 * @param imageUrl - The image URL to check
 * @returns Promise<boolean> - true if image is NSFW, false otherwise
 */
export async function isNsfwImageWithML(imageUrl: string): Promise<boolean> {
  // NSFW filter is disabled, so ML detection always returns false
  // If NSFW filter is re-enabled, uncomment the imports and restore the original implementation
  return false;
}

// are not exported as they're not used (NSFW filter is disabled)
// If NSFW filter is re-enabled, uncomment these functions
