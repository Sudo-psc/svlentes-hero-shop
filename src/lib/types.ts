/**
 * Tipos compartilhados entre as bibliotecas de resiliência
 */

// Storage
export interface StorageError extends Error {
  isStorageError: boolean;
  fallbackUsed: boolean;
}

// Network
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error, response?: Response) => boolean;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  timeout?: number;
}

export interface FetchError extends Error {
  status?: number;
  isRetryable: boolean;
  attempt: number;
  totalAttempts: number;
}

// UI Notifications
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  icon?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface NotificationAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
  destructive?: boolean;
}

// Health Monitoring
export interface HealthMetrics {
  timestamp: number;
  performance: {
    loadTime: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
    firstInputDelay?: number;
  };
  resources: {
    jsErrors: number;
    networkErrors: number;
    storageErrors: number;
    totalErrors: number;
  };
  connectivity: {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  storage: {
    used: number;
    quota?: number;
    usage: number;
    fallbackActive: boolean;
  };
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

export interface HealthAlert {
  id: string;
  type: 'performance' | 'errors' | 'storage' | 'connectivity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'critical';
  score: number; // 0-100
  metrics: HealthMetrics;
  alerts: HealthAlert[];
  recommendations: string[];
}

// Security
export interface TrustedTypesInfo {
  supported: boolean;
  enabled: boolean;
  policyNames: string[];
  defaultPolicy: string | null;
  errors: string[];
}

export interface CSPInfo {
  enabled: boolean;
  directives: Record<string, string[]>;
  violations: CSPViolation[];
  selfAllowed: boolean;
  trustedTypesRequired: boolean;
  errors?: string[];
}

export interface CSPViolation {
  violatedDirective: string;
  sample: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: number;
}

// Error Handling
export interface ErrorContext {
  url: string;
  userAgent: string;
  timestamp: number;
  online: boolean;
  errorSource: string;
  userId?: string;
  sessionId: string;
}

export interface ErrorReport {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'storage' | 'script' | 'promise' | 'unknown';
  recoverable: boolean;
  recoveryAttempted: boolean;
  recoverySucceeded?: boolean;
}