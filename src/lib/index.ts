/**
 * Ponto de entrada unificado para bibliotecas de resiliência
 */

// Storage
export { IndexedDBManager, subscriptionStorage, preferencesStorage, cacheStorage, initializeStorage } from './storage/indexeddb-manager';

// Network
export { ResilientFetcher, fetchWithRetry, loadExternalScript, checkConnectivity, checkExternalResources } from './network/resilient-fetcher';

// Error Handling
export { GlobalErrorHandler } from './error-handling/global-error-handler';
export { globalErrorHandler } from './error-handling/global-error-handler';

// UI Notifications
export { UserNotification } from './ui/user-notifications';
export { userNotification } from './ui/user-notifications';

// Health Monitoring
export { HealthMonitor } from './monitoring/health-monitor';
export { healthMonitor } from './monitoring/health-monitor';

// Security
export { TrustedTypesHandler } from './security/trusted-types-handler';
export { trustedTypesHandler } from './security/trusted-types-handler';

// Tipos
export type { StorageError, RetryOptions, FetchError, NotificationOptions, NotificationAction, HealthMetrics, HealthAlert, HealthCheckResult, TrustedTypesInfo, CSPInfo, CSPViolation } from './types';