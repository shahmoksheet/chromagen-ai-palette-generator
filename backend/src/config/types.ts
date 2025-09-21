export interface Config {
  port: number;
  nodeEnv: string;
  
  database: {
    url: string;
    ssl?: boolean;
    connectionLimit?: number;
    idleTimeout?: number;
  };

  redis: {
    url: string;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
  };

  ai: {
    openai: {
      apiKey: string;
      organization?: string;
      timeout?: number;
      maxRetries?: number;
    };
    gemini: {
      apiKey: string;
      timeout?: number;
      maxRetries?: number;
    };
  };

  security: {
    jwtSecret: string;
    corsOrigin: string[];
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
    };
  };

  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    uploadDir: string;
  };

  logging: {
    level: string;
    file?: string;
    enableConsole: boolean;
    enableFile: boolean;
  };

  monitoring: {
    healthCheckInterval: number;
    metricsPort: number;
  };

  cdn?: {
    url?: string;
    staticAssetsUrl?: string;
  };
}