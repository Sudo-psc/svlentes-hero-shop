/**
 * 🛠️ Quick Win: Centralized Environment Configuration Manager
 *
 * Consolidates and validates all environment variables in one place.
 * Provides type-safe access and reduces the 282 scattered environment variable usages.
 */

export interface DatabaseConfig {
  url: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  ssl?: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  oauthClientId?: string;
}

export interface PaymentConfig {
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    pricingTableId?: string;
  };
  asaas: {
    environment: 'sandbox' | 'production';
    apiKeySandbox: string;
    apiKeyProd: string;
    webhookToken?: string;
  };
}

export interface ExternalServicesConfig {
  sendpulse: {
    appId: string;
    appSecret: string;
    botId: string;
    clientId?: string;
    clientSecret?: string;
  };
  airtable: {
    apiKey: string;
    baseId: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
  wordpress: {
    apiUrl: string;
    publicUrl: string;
  };
  sanity: {
    projectId: string;
    dataset: string;
  };
}

export interface AppConfig {
  name: string;
  url: string;
  environment: 'development' | 'production';
  whatsappNumber: string;
  enableGithubAuth: boolean;
}

export interface AIConfig {
  openai: {
    apiKey: string;
    model: string;
  };
  langsmith: {
    apiKey: string;
    project: string;
    tracing: boolean;
  };
}

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: any = {};

  private constructor() {
    this.loadConfiguration();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Load and validate all environment configuration
   */
  private loadConfiguration(): void {
    this.config = {
      app: this.loadAppConfig(),
      database: this.loadDatabaseConfig(),
      firebase: this.loadFirebaseConfig(),
      payments: this.loadPaymentConfig(),
      externalServices: this.loadExternalServicesConfig(),
      ai: this.loadAIConfig()
    };

    this.validateConfiguration();
  }

  /**
   * Load application configuration
   */
  private loadAppConfig(): AppConfig {
    return {
      name: 'SV Lentes',
      url: this.getRequiredEnv('NEXT_PUBLIC_APP_URL'),
      environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
      whatsappNumber: this.getRequiredEnv('NEXT_PUBLIC_WHATSAPP_NUMBER'),
      enableGithubAuth: this.getEnvBool('NEXT_PUBLIC_ENABLE_GITHUB_AUTH', true)
    };
  }

  /**
   * Load database configuration
   */
  private loadDatabaseConfig(): DatabaseConfig {
    const url = this.getRequiredEnv('DATABASE_URL');

    return {
      url,
      // Parse connection details from URL for fallback usage
      host: this.parseDbHost(url),
      port: this.parseDbPort(url),
      database: this.parseDbName(url),
      user: this.parseDbUser(url),
      ssl: this.parseDbSsl(url)
    };
  }

  /**
   * Load Firebase configuration
   */
  private loadFirebaseConfig(): FirebaseConfig {
    return {
      apiKey: this.getRequiredEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
      authDomain: this.getRequiredEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      projectId: this.getRequiredEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
      storageBucket: this.getRequiredEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: this.getRequiredEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      appId: this.getRequiredEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
      measurementId: this.getEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'),
      oauthClientId: this.getEnv('NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID')
    };
  }

  /**
   * Load payment configuration
   */
  private loadPaymentConfig(): PaymentConfig {
    return {
      stripe: {
        secretKey: this.getRequiredEnv('STRIPE_SECRET_KEY'),
        publishableKey: this.getRequiredEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
        webhookSecret: this.getRequiredEnv('STRIPE_WEBHOOK_SECRET'),
        pricingTableId: this.getEnv('NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID')
      },
      asaas: {
        environment: this.getEnv('ASAAS_ENV', 'production') as 'sandbox' | 'production',
        apiKeySandbox: this.getRequiredEnv('ASAAS_API_KEY_SANDBOX'),
        apiKeyProd: this.getEnv('ASAAS_API_KEY_PROD'),
        webhookToken: this.getEnv('ASAAS_WEBHOOK_TOKEN')
      }
    };
  }

  /**
   * Load external services configuration
   */
  private loadExternalServicesConfig(): ExternalServicesConfig {
    return {
      sendpulse: {
        appId: this.getRequiredEnv('SENDPULSE_APP_ID'),
        appSecret: this.getRequiredEnv('SENDPULSE_APP_SECRET'),
        botId: this.getRequiredEnv('SENDPULSE_BOT_ID'),
        clientId: this.getEnv('SENDPULSE_CLIENT_ID'),
        clientSecret: this.getEnv('SENDPULSE_CLIENT_SECRET')
      },
      airtable: {
        apiKey: this.getRequiredEnv('AIRTABLE_API_KEY'),
        baseId: this.getRequiredEnv('AIRTABLE_BASE_ID')
      },
      resend: {
        apiKey: this.getRequiredEnv('RESEND_API_KEY'),
        fromEmail: this.getRequiredEnv('NEXT_PUBLIC_EMAIL_FROM')
      },
      wordpress: {
        apiUrl: this.getRequiredEnv('WORDPRESS_API_URL'),
        publicUrl: this.getRequiredEnv('NEXT_PUBLIC_WORDPRESS_URL')
      },
      sanity: {
        projectId: this.getRequiredEnv('NEXT_PUBLIC_SANITY_PROJECT_ID'),
        dataset: this.getRequiredEnv('NEXT_PUBLIC_SANITY_DATASET')
      }
    };
  }

  /**
   * Load AI configuration
   */
  private loadAIConfig(): AIConfig {
    return {
      openai: {
        apiKey: this.getRequiredEnv('OPENAI_API_KEY'),
        model: this.getEnv('OPENAI_MODEL', 'gpt-4o-mini')
      },
      langsmith: {
        apiKey: this.getRequiredEnv('LANGCHAIN_API_KEY'),
        project: this.getRequiredEnv('LANGCHAIN_PROJECT'),
        tracing: this.getEnvBool('LANGCHAIN_TRACING_V2', true)
      }
    };
  }

  /**
   * Get required environment variable
   */
  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get optional environment variable with default
   */
  private getEnv(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
  }

  /**
   * Get boolean environment variable
   */
  private getEnvBool(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }

  /**
   * Parse database connection details from URL
   */
  private parseDbHost(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return undefined;
    }
  }

  private parseDbPort(url: string): number | undefined {
    try {
      const urlObj = new URL(url);
      return urlObj.port ? parseInt(urlObj.port) : undefined;
    } catch {
      return undefined;
    }
  }

  private parseDbName(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1); // Remove leading /
    } catch {
      return undefined;
    }
  }

  private parseDbUser(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      return urlObj.username || undefined;
    } catch {
      return undefined;
    }
  }

  private parseDbSsl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'postgresql:';
    } catch {
      return true; // Default to SSL
    }
  }

  /**
   * Validate critical configuration
   */
  private validateConfiguration(): void {
    // Validate required fields
    const validations = [
      this.validateRequiredField('app.url', this.config.app.url),
      this.validateRequiredField('firebase.projectId', this.config.firebase.projectId),
      this.validateRequiredField('payments.stripe.publishableKey', this.config.payments.stripe.publishableKey),
      this.validateRequiredField('database.url', this.config.database.url)
    ];

    const failedValidations = validations.filter(v => !v.valid);
    if (failedValidations.length > 0) {
      console.error('[EnvironmentManager] Configuration validation failed:', failedValidations);
      if (this.config.app.environment === 'production') {
        throw new Error('Critical configuration validation failed');
      }
    }

    console.log('[EnvironmentManager] Configuration loaded and validated');
  }

  private validateRequiredField(name: string, value: any): { valid: boolean; field: string; value: any } {
    return {
      valid: !!value && value !== 'REPLACE_WITH_' && value !== 'placeholder',
      field: name,
      value
    };
  }

  /**
   * Get configuration by category
   */
  getAppConfig(): AppConfig {
    return this.config.app;
  }

  getFirebaseConfig(): FirebaseConfig {
    return this.config.firebase;
  }

  getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  getPaymentConfig(): PaymentConfig {
    return this.config.payments;
  }

  getExternalServicesConfig(): ExternalServicesConfig {
    return this.config.externalServices;
  }

  getAIConfig(): AIConfig {
    return this.config.ai;
  }

  /**
   * Get specific configuration values
   */
  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  /**
   * Get all configuration for debugging
   */
  getAllConfig(): any {
    // Return sanitized config (no secrets)
    return {
      app: this.config.app,
      firebase: {
        projectId: this.config.firebase.projectId,
        authDomain: this.config.firebase.authDomain
      },
      database: {
        host: this.config.database.host,
        database: this.config.database.database,
        ssl: this.config.database.ssl
      },
      // Add other non-sensitive configs as needed
      environment: this.config.app.environment
    };
  }

  /**
   * Check if all required secrets are properly configured
   */
  checkConfigurationHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for placeholder values
    const placeholderPatterns = [
      'REPLACE_WITH_',
      'placeholder',
      'change_me',
      'your_key_here'
    ];

    Object.entries(process.env).forEach(([key, value]) => {
      if (value && placeholderPatterns.some(pattern => value.includes(pattern))) {
        issues.push(`Environment variable ${key} contains placeholder value`);
        recommendations.push(`Replace placeholder value in ${key}`);
      }
    });

    // Check critical services
    if (!this.config.firebase.apiKey || this.config.firebase.apiKey.length < 20) {
      issues.push('Firebase API key is invalid or missing');
      recommendations.push('Set valid NEXT_PUBLIC_FIREBASE_API_KEY');
    }

    if (!this.config.payments.stripe.secretKey || this.config.payments.stripe.secretKey.startsWith('sk_test_')) {
      if (this.isProduction()) {
        issues.push('Stripe is using test keys in production');
        recommendations.push('Set production Stripe keys');
      }
    }

    const status = issues.length === 0 ? 'healthy' : issues.length <= 3 ? 'warning' : 'critical';

    return {
      status,
      issues,
      recommendations
    };
  }
}

// Global instance for easy access
export const env = EnvironmentManager.getInstance();

// Type-safe getters for common use cases
export const config = {
  app: env.getAppConfig(),
  firebase: env.getFirebaseConfig(),
  database: env.getDatabaseConfig(),
  payments: env.getPaymentConfig(),
  services: env.getExternalServicesConfig(),
  ai: env.getAIConfig(),
  isProduction: () => env.isProduction(),
  isDevelopment: () => env.isDevelopment(),
  health: () => env.checkConfigurationHealth()
};