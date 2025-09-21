import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../app';
import { colorPaletteRepository } from '../../repositories';

// Mock the repositories and services
jest.mock('../../repositories');
jest.mock('../../utils/logger');

const mockColorPaletteRepository = colorPaletteRepository as jest.Mocked<typeof colorPaletteRepository>;

describe('Export API', () => {
  const mockPaletteId = uuidv4();
  
  const mockPalette = {
    id: mockPaletteId,
    userId: 'test-user-id',
    name: 'Test Export Palette',
    prompt: 'A test palette for export functionality',
    colors: [
      {
        hex: '#FF6B35',
        rgb: { r: 255, g: 107, b: 53 },
        hsl: { h: 16, s: 100, l: 60 },
        name: 'Sunset Orange',
        category: 'primary' as const,
        usage: 'Primary brand color',
        accessibility: {
          contrastWithWhite: 3.2,
          contrastWithBlack: 6.5,
          wcagLevel: 'AA' as const,
        },
      },
      {
        hex: '#2C3E50',
        rgb: { r: 44, g: 62, b: 80 },
        hsl: { h: 210, s: 29, l: 24 },
        name: 'Deep Navy',
        category: 'neutral' as const,
        usage: 'Text and backgrounds',
        accessibility: {
          contrastWithWhite: 15.3,
          contrastWithBlack: 1.4,
          wcagLevel: 'AAA' as const,
        },
      },
    ],
    accessibilityScore: {
      overallScore: 'AA' as const,
      contrastRatios: [],
      colorBlindnessCompatible: true,
      recommendations: [],
      passedChecks: 8,
      totalChecks: 10,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/export/:id/:format', () => {
    it('should export palette in CSS format', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);

      const response = await request(app)
        .get(`/api/export/${mockPaletteId}/css`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/css; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('test-export-palette.css');
      expect(response.text).toContain(':root {');
      expect(response.text).toContain('--color-sunset-orange: #FF6B35;');
    });

    it('should export palette in JSON format', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);

      const response = await request(app)
        .get(`/api/export/${mockPaletteId}/json`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('test-export-palette.json');
      
      // Parse the response as JSON to validate structure
      const jsonData = JSON.parse(response.text);
      expect(jsonData.name).toBe('Test Export Palette');
      expect(jsonData.colors).toHaveLength(2);
    });

    it('should export palette in SCSS format', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);

      const response = await request(app)
        .get(`/api/export/${mockPaletteId}/scss`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/scss; charset=utf-8');
      expect(response.text).toContain('$sunset-orange: #FF6B35;');
      expect(response.text).toContain('@mixin bg-color');
    });

    it('should export palette in Tailwind format', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);

      const response = await request(app)
        .get(`/api/export/${mockPaletteId}/tailwind`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/javascript; charset=utf-8');
      expect(response.text).toContain('module.exports = {');
      expect(response.text).toContain('theme: {');
      expect(response.text).toContain("'sunset-orange': {");
    });

    it('should return preview mode when requested', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);

      const response = await request(app)
        .get(`/api/export/${mockPaletteId}/css`)
        .query({ preview: 'true' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.success).toBe(true);
      expect(response.body.data.format).toBe('css');
      expect(response.body.data.filename).toBe('test-export-palette.css');
      expect(response.body.data.content).toContain(':root {');
    });

    it('should return 404 for non-existent palette', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/export/${mockPaletteId}/css`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Palette not found');
    });

    it('should validate palette ID format', async () => {
      const response = await request(app)
        .get('/api/export/invalid-uuid/css');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid request parameters');
    });

    it('should validate export format', async () => {
      const response = await request(app)
        .get(`/api/export/${mockPaletteId}/invalid-format`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid request parameters');
    });

    it('should handle all supported formats', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);

      const formats = ['css', 'scss', 'json', 'tailwind', 'ase', 'sketch', 'figma'];
      
      for (const format of formats) {
        const response = await request(app)
          .get(`/api/export/${mockPaletteId}/${format}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-disposition']).toContain('attachment');
      }
    });
  });

  describe('GET /api/export/formats', () => {
    it('should return list of supported formats', async () => {
      const response = await request(app)
        .get('/api/export/formats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.formats).toBeInstanceOf(Array);
      expect(response.body.data.totalFormats).toBeGreaterThan(0);
      
      // Check that all expected formats are present
      const formatNames = response.body.data.formats.map((f: any) => f.format);
      expect(formatNames).toContain('css');
      expect(formatNames).toContain('scss');
      expect(formatNames).toContain('json');
      expect(formatNames).toContain('tailwind');
      
      // Check format structure
      const cssFormat = response.body.data.formats.find((f: any) => f.format === 'css');
      expect(cssFormat).toHaveProperty('name');
      expect(cssFormat).toHaveProperty('description');
      expect(cssFormat).toHaveProperty('mimeType');
      expect(cssFormat).toHaveProperty('extension');
      expect(cssFormat).toHaveProperty('features');
    });
  });

  describe('POST /api/export/batch', () => {
    const secondPaletteId = uuidv4();
    const secondMockPalette = {
      ...mockPalette,
      id: secondPaletteId,
      name: 'Second Test Palette',
    };

    it('should export multiple palettes in multiple formats', async () => {
      mockColorPaletteRepository.findById
        .mockResolvedValueOnce(mockPalette)
        .mockResolvedValueOnce(secondMockPalette);

      const batchRequest = {
        paletteIds: [mockPaletteId, secondPaletteId],
        formats: ['css', 'json'],
        zipFile: false,
      };

      const response = await request(app)
        .post('/api/export/batch')
        .send(batchRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exports).toHaveLength(4); // 2 palettes × 2 formats
      expect(response.body.data.processedPalettes).toBe(2);
      
      // Check that all combinations are present
      const exports = response.body.data.exports;
      expect(exports.some((e: any) => e.paletteId === mockPaletteId && e.format === 'css')).toBe(true);
      expect(exports.some((e: any) => e.paletteId === mockPaletteId && e.format === 'json')).toBe(true);
      expect(exports.some((e: any) => e.paletteId === secondPaletteId && e.format === 'css')).toBe(true);
      expect(exports.some((e: any) => e.paletteId === secondPaletteId && e.format === 'json')).toBe(true);
    });

    it('should handle missing palettes gracefully', async () => {
      mockColorPaletteRepository.findById
        .mockResolvedValueOnce(mockPalette)
        .mockResolvedValueOnce(null); // Second palette not found

      const batchRequest = {
        paletteIds: [mockPaletteId, secondPaletteId],
        formats: ['css'],
        zipFile: false,
      };

      const response = await request(app)
        .post('/api/export/batch')
        .send(batchRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exports).toHaveLength(1); // Only first palette exported
      expect(response.body.data.processedPalettes).toBe(1);
    });

    it('should validate batch request data', async () => {
      const invalidRequest = {
        paletteIds: [], // Empty array
        formats: ['css'],
      };

      const response = await request(app)
        .post('/api/export/batch')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid batch export data');
    });

    it('should limit number of palettes in batch', async () => {
      const tooManyPalettes = Array.from({ length: 15 }, () => uuidv4());
      
      const invalidRequest = {
        paletteIds: tooManyPalettes,
        formats: ['css'],
      };

      const response = await request(app)
        .post('/api/export/batch')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid batch export data');
    });

    it('should validate format names in batch request', async () => {
      const invalidRequest = {
        paletteIds: [mockPaletteId],
        formats: ['invalid-format'],
      };

      const response = await request(app)
        .post('/api/export/batch')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid batch export data');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to export endpoints', async () => {
      // Use a unique palette ID for rate limiting test
      const rateLimitTestPaletteId = uuidv4();
      mockColorPaletteRepository.findById.mockResolvedValue({
        ...mockPalette,
        id: rateLimitTestPaletteId,
      });

      // Make multiple requests quickly to test rate limiting
      const requests = Array.from({ length: 55 }, () =>
        request(app).get(`/api/export/${rateLimitTestPaletteId}/css`)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Use a different palette ID to avoid rate limiting conflicts
      const errorTestPaletteId = uuidv4();
      mockColorPaletteRepository.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/export/${errorTestPaletteId}/css`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to export palette');
    });

    it('should handle invalid query parameters', async () => {
      // Use a different palette ID to avoid rate limiting conflicts
      const queryTestPaletteId = uuidv4();
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);

      const response = await request(app)
        .get(`/api/export/${queryTestPaletteId}/css`)
        .query({ preview: 'invalid-boolean' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid query parameters');
    });
  });
});