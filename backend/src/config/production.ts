import { Config } from './types';

export const productionConfig: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: 'production',
  
  database: {
    url: process.env.DATABASE_URL!,
    ssl: true,
    connectionLimit: 20,
    idleTimeout: 30000,
  },

  redis: {
    url: process.env.REDIS_URL!,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },

  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      organization: process.env.OPENAI_ORG_ID,
      timeout: 30000,
      maxRetries: 3,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY!,
      timeout: 30000,
      maxRetries: 3,
    },
  },

  security: {
    jwtSecret: process.env.JWT_SECRET!,
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com'],
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadDir: process.env.UPLOAD_DIR || '/app/temp',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || '/app/logs/app.log',
    enableConsole: false,
    enableFile: true,
  },

  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  },

  cdn: {
    url: process.env.CDN_URL,
    staticAssetsUrl: process.env.STATIC_ASSETS_URL,
  },
};