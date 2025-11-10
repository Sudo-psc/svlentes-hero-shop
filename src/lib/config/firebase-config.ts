/**
 * 🛠️ Quick Win: Firebase Configuration Helper
 *
 * Provides centralized Firebase configuration access
 * replacing scattered environment variable usage throughout the codebase
 */

import { config } from './environment-manager';

/**
 * Get Firebase configuration with type safety
 */
export function getFirebaseConfig() {
  return config.firebase;
}

/**
 * Get Firebase configuration for client-side usage
 * (only includes public-safe values)
 */
export function getPublicFirebaseConfig() {
  const firebaseConfig = config.firebase;

  return {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    measurementId: firebaseConfig.measurementId
  };
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  const config = getPublicFirebaseConfig();

  return !!(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.appId &&
    config.apiKey.length > 20 // Basic validation
  );
}

/**
 * Get OAuth configuration for Google Sign-In
 */
export function getGoogleOAuthConfig() {
  return {
    clientId: config.firebase.oauthClientId
  };
}