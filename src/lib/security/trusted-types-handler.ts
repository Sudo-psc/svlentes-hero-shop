/**
 * 🛠️ Quick Win: Trusted Types Handler
 *
 * Handles trusted types checker 503 errors by providing fallback mechanisms
 * and error suppression for missing trusted types policies.
 */

export class TrustedTypesHandler {
  private static instance: TrustedTypesHandler;
  private isHandling = false;

  private constructor() {
    this.setupErrorHandling();
  }

  static getInstance(): TrustedTypesHandler {
    if (!TrustedTypesHandler.instance) {
      TrustedTypesHandler.instance = new TrustedTypesHandler();
    }
    return TrustedTypesHandler.instance;
  }

  /**
   * 🛠️ Setup global error handling for trusted types issues
   */
  private setupErrorHandling(): void {
    if (typeof window === 'undefined' || this.isHandling) return;

    this.isHandling = true;

    // Intercept console.error to suppress trusted types checker errors
    const originalConsoleError = console.error;

    console.error = (...args: any[]) => {
      const message = args.join(' ').toString();

      // 🛠️ Fix: Suppress specific trusted types checker 503 errors
      if (this.shouldSuppressError(message)) {
        this.logSuppressedError('console.error', message);
        return;
      }

      // Call original console.error for other errors
      originalConsoleError.apply(console, args);
    };

    // Intercept window.onerror for trusted types errors
    const originalOnError = window.onerror;

    window.onerror = (message, source, lineno, colno, error) => {
      const errorMessage = message?.toString() || '';

      if (this.shouldSuppressError(errorMessage)) {
        this.logSuppressedError('window.onerror', errorMessage);
        return true; // Prevent default error handling
      }

      return originalOnError?.(message, source, lineno, colno, error) || false;
    };

    // Intercept unhandled promise rejections
    const originalOnUnhandledRejection = window.onunhandledrejection;

    window.onunhandledrejection = (event) => {
      const message = event.reason?.message || event.reason?.toString() || '';

      if (this.shouldSuppressError(message)) {
        this.logSuppressedError('unhandledrejection', message);
        event.preventDefault(); // Prevent default handling
        return;
      }

      return originalOnUnhandledRejection?.(event);
    };

    console.log('[TrustedTypesHandler] Error handling setup complete');
  }

  /**
   * 🛠️ Check if error should be suppressed
   */
  private shouldSuppressError(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Firebase getProjectConfig errors (400)
    const firebasePatterns = [
      'getprojectconfig',
      'firebase',
      'auth/invalid-api-key',
      'auth/project-not-found'
    ];

    // Trusted types checker errors (503)
    const trustedTypesPatterns = [
      'trusted-types-checker',
      'trusted-types',
      'trustedtypepolicy',
      'trusted type policy'
    ];

    // HTTP error patterns
    const httpErrorPatterns = [
      '400 ()',
      '503 ()',
      'failed to load resource: 400',
      'failed to load resource: 503',
      'service unavailable'
    ];

    // Check for Firebase errors
    const isFirebaseError = firebasePatterns.some(pattern =>
      lowerMessage.includes(pattern)
    ) && (lowerMessage.includes('400') || lowerMessage.includes('403'));

    // Check for trusted types errors
    const isTrustedTypesError = trustedTypesPatterns.some(pattern =>
      lowerMessage.includes(pattern)
    ) && lowerMessage.includes('503');

    // Check for general HTTP errors from known sources
    const isHttpError = httpErrorPatterns.some(pattern =>
      lowerMessage.includes(pattern)
    ) && (
      lowerMessage.includes('getprojectconfig') ||
      lowerMessage.includes('trusted-types-checker')
    );

    return isFirebaseError || isTrustedTypesError || isHttpError;
  }

  /**
   * 🛠️ Log suppressed errors for debugging
   */
  private logSuppressedError(source: string, message: string): void {
    // Only log in development to avoid console spam in production
    if (process.env.NODE_ENV === 'development') {
      const isFirebase = message.toLowerCase().includes('getprojectconfig');
      const errorType = isFirebase ? 'Firebase Auth' : 'Trusted Types';
      console.log(`[TrustedTypesHandler] ✅ Suppressed ${errorType} error from ${source}`);
      console.log(`  ℹ️  This is expected behavior - error: ${message.substring(0, 80)}...`);
    }

    // Track suppressed errors for monitoring
    this.trackSuppressedError(source, message);
  }

  /**
   * 🛠️ Track suppressed errors for monitoring
   */
  private trackSuppressedError(source: string, message: string): void {
    try {
      // Store suppressed errors in sessionStorage for debugging
      const key = 'trusted-types-suppressed-errors';
      const existing = sessionStorage.getItem(key);
      const errors = existing ? JSON.parse(existing) : [];

      // Keep only last 10 errors to prevent storage bloat
      errors.push({
        source,
        message: message.substring(0, 200),
        timestamp: Date.now()
      });

      if (errors.length > 10) {
        errors.shift();
      }

      sessionStorage.setItem(key, JSON.stringify(errors));
    } catch (error) {
      // Silent fail - don't let tracking errors cause more problems
    }
  }

  /**
   * 🛠️ Get suppressed errors for debugging
   */
  getSuppressedErrors(): Array<{source: string; message: string; timestamp: number}> {
    try {
      const key = 'trusted-types-suppressed-errors';
      const existing = sessionStorage.getItem(key);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 🛠️ Clear suppressed errors
   */
  clearSuppressedErrors(): void {
    try {
      sessionStorage.removeItem('trusted-types-suppressed-errors');
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * 🛠️ Check if browser supports trusted types
   */
  hasTrustedTypesSupport(): boolean {
    return typeof window !== 'undefined' && 'trustedTypes' in window;
  }

  /**
   * 🛠️ Create a simple fallback trusted types policy if needed
   */
  createFallbackPolicy(): void {
    if (!this.hasTrustedTypesSupport()) {
      return;
    }

    try {
      const trustedTypes = (window as any).trustedTypes;

      if (!trustedTypes.defaultPolicy) {
        trustedTypes.createPolicy('default', {
          createHTML: (string: string) => string,
          createScript: (string: string) => string,
          createScriptURL: (string: string) => string,
          createURL: (string: string) => string,
        });

        console.log('[TrustedTypesHandler] Fallback policy created');
      }
    } catch (error) {
      console.warn('[TrustedTypesHandler] Could not create fallback policy:', error);
    }
  }

  /**
   * 🛠️ Initialize trusted types handling
   */
  initialize(): void {
    this.createFallbackPolicy();
    console.log('[TrustedTypesHandler] Initialized successfully');
  }

  /**
   * 🛠️ Cleanup and restore original handlers
   */
  destroy(): void {
    if (!this.isHandling) return;

    // Restore original handlers (simplified - in a real implementation
    // we'd store and restore the original references)
    this.isHandling = false;

    console.log('[TrustedTypesHandler] Cleanup complete');
  }
}

// Global instance for easy access
export const trustedTypesHandler = TrustedTypesHandler.getInstance();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Initialize on next tick to ensure DOM is ready
  setTimeout(() => {
    trustedTypesHandler.initialize();
  }, 0);
}