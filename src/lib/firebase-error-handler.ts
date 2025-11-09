/**
 * Firebase Error Handler
 * 
 * Handles common Firebase errors gracefully and provides user-friendly messages
 */

export interface FirebaseErrorConfig {
  retryable: boolean
  userMessage: string
  logMessage: string
  statusCode?: number
}

const FIREBASE_ERROR_CODES: Record<string, FirebaseErrorConfig> = {
  'auth/invalid-api-key': {
    retryable: false,
    userMessage: 'Authentication service is misconfigured. Please contact support.',
    logMessage: 'Invalid Firebase API key',
    statusCode: 401
  },
  'auth/project-not-found': {
    retryable: false,
    userMessage: 'Authentication service is unavailable. Please try again later.',
    logMessage: 'Firebase project not found or disabled',
    statusCode: 404
  },
  'auth/invalid-project-id': {
    retryable: false,
    userMessage: 'Authentication service configuration error.',
    logMessage: 'Invalid Firebase project ID',
    statusCode: 400
  },
  'auth/network-request-failed': {
    retryable: true,
    userMessage: 'Network error. Please check your connection and try again.',
    logMessage: 'Network request to Firebase failed',
    statusCode: 503
  },
  'auth/too-many-requests': {
    retryable: true,
    userMessage: 'Too many attempts. Please wait a moment and try again.',
    logMessage: 'Rate limit exceeded for Firebase requests',
    statusCode: 429
  },
  'getProjectConfig-400': {
    retryable: false,
    userMessage: 'Authentication service is temporarily unavailable.',
    logMessage: 'Firebase getProjectConfig returned 400 - invalid configuration',
    statusCode: 400
  },
  'getProjectConfig-503': {
    retryable: true,
    userMessage: 'Service temporarily unavailable. Please try again.',
    logMessage: 'Firebase getProjectConfig returned 503 - service unavailable',
    statusCode: 503
  }
}

/**
 * Handle Firebase errors and return appropriate error config
 */
export function handleFirebaseError(error: any): FirebaseErrorConfig {
  const errorCode = error?.code || error?.message || 'unknown'
  
  // Check for HTTP status codes in error
  if (error?.status === 400 || errorCode.includes('400')) {
    return FIREBASE_ERROR_CODES['getProjectConfig-400']
  }
  
  if (error?.status === 503 || errorCode.includes('503')) {
    return FIREBASE_ERROR_CODES['getProjectConfig-503']
  }
  
  // Look up error code
  const errorConfig = FIREBASE_ERROR_CODES[errorCode]
  
  if (errorConfig) {
    return errorConfig
  }
  
  // Default error config
  return {
    retryable: false,
    userMessage: 'An unexpected error occurred. Please try again.',
    logMessage: `Unknown Firebase error: ${errorCode}`,
    statusCode: 500
  }
}

/**
 * Log Firebase error with appropriate level
 */
export function logFirebaseError(error: any, context: string = 'Firebase'): void {
  const errorConfig = handleFirebaseError(error)
  
  console.error(`[${context}] ${errorConfig.logMessage}`, {
    code: error?.code,
    message: error?.message,
    status: error?.status,
    retryable: errorConfig.retryable
  })
}

/**
 * Suppress known non-critical Firebase errors in development
 */
export function shouldSuppressError(error: any): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false
  }
  
  const errorCode = error?.code || error?.message || ''
  const suppressedCodes = [
    'auth/project-not-found',
    'auth/invalid-api-key',
    'getProjectConfig-400'
  ]
  
  return suppressedCodes.some(code => errorCode.includes(code))
}

/**
 * Create a mock auth handler for development when Firebase is unavailable
 */
export function createMockAuthHandler() {
  console.warn('[Firebase] Using mock authentication handler')
  
  return {
    currentUser: null,
    signInWithPopup: async () => {
      throw new Error('Firebase authentication is not available. Please configure Firebase or use alternative authentication.')
    },
    signOut: async () => {
      console.log('[Mock Auth] Sign out called')
    },
    onAuthStateChanged: (callback: (user: any) => void) => {
      callback(null)
      return () => {}
    }
  }
}
