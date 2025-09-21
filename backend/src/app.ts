// Express app setup without server start (for testing)

import express from 'express';
import dotenv from 'dotenv';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { setupErrorHandling } from './middleware';
import { validateEnvironment } from './utils/environment';
import { databaseService } from './services/DatabaseService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Validate required environment variables (but don't exit in test)
try {
  validateEnvironment();
} catch (error) {
  if (process.env.NODE_ENV !== 'test') {
    throw error;
  }
}

const app = express();

// Initialize database connection
if (process.env.NODE_ENV !== 'test') {
  databaseService.connect().catch((error) => {
    logger.error('Failed to initialize database:', error);
    // Don't crash the app, just log the error
  });
}
logger.info('Database service initialized with logging');

// Setup middleware (includes security, CORS, logging, etc.)
setupMiddleware(app);

// Setup API routes
setupRoutes(app);

// Setup error handling (404 and global error handler)
setupErrorHandling(app);

export default app;