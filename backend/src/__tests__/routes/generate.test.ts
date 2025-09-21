// Tests for generation routes

import '../../utils/testEnvironment'; // Set up test environment
import request from 'supertest';
import app from '../../app';

describe('Generation Routes', () => {
  describe('POST /api/generate/text', () => {
    it('should generate palette from text prompt', async () => {
      const requestBody = {
        prompt: 'warm sunset colors for a beach resort',
        options: {
          colorCount: 5,
          harmonyType: 'complementary',
          accessibilityLevel: 'AA',
        },
      };

      const response = await request(app)
        .post('/api/generate/text')
        .send(requestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          prompt: requestBody.prompt,
          colors: expect.arrayContaining([
            expect.objectContaining({
              hex: expect.any(String),
              rgb: expect.objectContaining({
                r: expect.any(Number),
                g: expect.any(Number),
                b: expect.any(Number),
              }),
              hsl: expect.objectContaining({
                h: expect.any(Number),
                s: expect.any(Number),
                l: expect.any(Number),
              }),
              name: expect.any(String),
              category: expect.stringMatching(/^(primary|secondary|accent)$/),
              usage: expect.any(String),
              accessibility: expect.objectContaining({
                contrastWithWhite: expect.any(Number),
                contrastWithBlack: expect.any(Number),
                wcagLevel: expect.stringMatching(/^(AA|AAA|FAIL)$/),
              }),
            }),
          ]),
          accessibilityScore: expect.objectContaining({
            overallScore: expect.stringMatching(/^(AA|AAA|FAIL)$/),
            contrastRatios: expect.any(Array),
            colorBlindnessCompatible: expect.any(Boolean),
            recommendations: expect.any(Array),
            passedChecks: expect.any(Number),
            totalChecks: expect.any(Number),
          }),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
        processingTime: expect.any(Number),
        explanation: expect.any(String),
        model: expect.any(String),
      });
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/generate/text')
        .send({
          prompt: '', // Invalid: empty prompt
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Request body validation failed',
        code: 'VALIDATION_ERROR',
        details: expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'prompt',
              message: expect.any(String),
            }),
          ]),
        }),
      });
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/generate/text')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Request body validation failed',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should validate prompt length', async () => {
      const longPrompt = 'a'.repeat(501); // Exceeds 500 character limit

      const response = await request(app)
        .post('/api/generate/text')
        .send({ prompt: longPrompt })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Request body validation failed',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('POST /api/generate/image', () => {
    it('should generate palette from image (mock)', async () => {
      const requestBody = {
        options: {
          colorCount: 4,
          accessibilityLevel: 'AAA',
        },
      };

      const response = await request(app)
        .post('/api/generate/image')
        .send(requestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          colors: expect.any(Array),
          accessibilityScore: expect.any(Object),
        }),
        processingTime: expect.any(Number),
        explanation: expect.any(String),
        model: expect.any(String),
      });
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/generate/image')
        .send({})
        .expect(200); // Should work with empty options

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to generation endpoints', async () => {
      // Make multiple requests quickly to trigger rate limit
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/generate/text')
          .send({ prompt: 'test prompt for rate limiting' })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Rate limited responses should have proper error structure
      rateLimitedResponses.forEach(response => {
        expect(response.body).toMatchObject({
          success: false,
          error: expect.stringContaining('Too many'),
          code: 'GENERATION_RATE_LIMIT_EXCEEDED',
          retryAfter: expect.any(Number),
        });
      });
    }, 10000); // Increase timeout for this test
  });
});