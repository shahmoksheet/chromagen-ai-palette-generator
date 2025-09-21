// Integration tests for the API server

import '../utils/testEnvironment'; // Set up test environment
import request from 'supertest';
import app from '../app';

describe('API Server Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: '1.0.0',
        memory: expect.objectContaining({
          rss: expect.any(String),
          heapUsed: expect.any(String),
          heapTotal: expect.any(String),
        }),
      });
    });
  });

  describe('API Info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'ChromaGen API',
        version: '1.0.0',
        description: expect.any(String),
        endpoints: expect.any(Object),
        rateLimit: expect.any(Object),
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('not found'),
        code: 'ROUTE_NOT_FOUND',
      });
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/generate/text')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
      });
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });
});