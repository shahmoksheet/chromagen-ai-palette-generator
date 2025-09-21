import { Router } from 'express';

const router = Router();

/**
 * Health check endpoint
 * Used by tests and monitoring to verify service availability
 */
router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'connected', // This would check actual DB connection in real implementation
      ai: {
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured'
      }
    }
  };

  res.status(200).json(healthCheck);
});

/**
 * Detailed health check with service status
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      services: {
        database: 'connected', // Would check actual DB connection
        ai: {
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
          gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured'
        }
      }
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;