// Routes setup

import express from 'express';
import generateRoutes from './generate-simple';
import paletteRoutes from './palettes';
import exportRoutes from './export';
import logsRoutes from './logs';
import healthRoutes from './health';

export function setupRoutes(app: express.Application): void {
  // Simple test route
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'ChromaGen API is working!', 
      timestamp: new Date().toISOString(),
      status: 'ok' 
    });
  });

  // Mount route modules
  app.use('/api', healthRoutes);
  app.use('/api/generate', generateRoutes);
  app.use('/api/palettes', paletteRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/logs', logsRoutes);
}