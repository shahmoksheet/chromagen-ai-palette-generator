import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../app';
import { colorPaletteRepository, userRepository } from '../../repositories';

// Mock the repositories
jest.mock('../../repositories');
jest.mock('../../utils/logger');

const mockColorPaletteRepository = colorPaletteRepository as jest.Mocked<typeof colorPaletteRepository>;
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('Palette Management API', () => {
  const mockUserId = uuidv4();
  const mockPaletteId = uuidv4();
  
  const mockPalette = {
    id: mockPaletteId,
    userId: mockUserId,
    name: 'Test Palette',
    prompt: 'A beautiful sunset palette',
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
    ],
    accessibilityScore: {
      overallScore: 'AA' as const,
      contrastRatios: [],
      colorBlindnessCompatible: true,
      recommendations: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: mockUserId,
    sessionId: `session_${mockUserId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/palettes/history/:userId', () => {
    it('should retrieve palette history with pagination', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockColorPaletteRepository.findByUserId.mockResolvedValue([mockPalette]);
      mockColorPaletteRepository.countByUserId.mockResolvedValue(1);

      const response = await request(app)
        .get(`/api/palettes/history/${mockUserId}`)
        .query({ page: '1', limit: '20' });

      expect(response.status).toBe(200);
      expect(response.body.palettes).toHaveLength(1);
      expect(response.body.pagination.totalCount).toBe(1);
      expect(response.body.palettes[0].id).toBe(mockPaletteId);
    });

    it('should create user if not exists', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockColorPaletteRepository.findByUserId.mockResolvedValue([]);
      mockColorPaletteRepository.countByUserId.mockResolvedValue(0);

      const response = await request(app)
        .get(`/api/palettes/history/${mockUserId}`);

      expect(response.status).toBe(200);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        id: mockUserId,
        sessionId: `session_${mockUserId}`,
      });
    });

    it('should handle search filtering', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockColorPaletteRepository.findByUserId.mockResolvedValue([mockPalette]);
      mockColorPaletteRepository.countByUserId.mockResolvedValue(1);

      const response = await request(app)
        .get(`/api/palettes/history/${mockUserId}`)
        .query({ search: 'sunset' });

      expect(response.status).toBe(200);
      expect(mockColorPaletteRepository.findByUserId).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'sunset',
        })
      );
    });

    it('should validate invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/palettes/history/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid user ID format');
    });
  });

  describe('POST /api/palettes/save', () => {
    const validPaletteData = {
      name: 'Test Palette',
      prompt: 'A beautiful sunset palette',
      colors: [
        {
          hex: '#FF6B35',
          rgb: { r: 255, g: 107, b: 53 },
          hsl: { h: 16, s: 100, l: 60 },
          name: 'Sunset Orange',
          category: 'primary',
          usage: 'Primary brand color',
          accessibility: {
            contrastWithWhite: 3.2,
            contrastWithBlack: 6.5,
            wcagLevel: 'AA',
          },
        },
      ],
      userId: mockUserId,
    };

    it('should save a new palette', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockColorPaletteRepository.create.mockResolvedValue(mockPalette);

      const response = await request(app)
        .post('/api/palettes/save')
        .send(validPaletteData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(mockPaletteId);
      expect(response.body.name).toBe('Test Palette');
    });

    it('should create user if not exists when saving palette', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockColorPaletteRepository.create.mockResolvedValue(mockPalette);

      const response = await request(app)
        .post('/api/palettes/save')
        .send(validPaletteData);

      expect(response.status).toBe(201);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should validate palette data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        colors: [], // Invalid: no colors
      };

      const response = await request(app)
        .post('/api/palettes/save')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid palette data');
    });
  });

  describe('DELETE /api/palettes/:id', () => {
    it('should delete an existing palette', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);
      mockColorPaletteRepository.delete.mockResolvedValue();

      const response = await request(app)
        .delete(`/api/palettes/${mockPaletteId}`);

      expect(response.status).toBe(204);
      expect(mockColorPaletteRepository.delete).toHaveBeenCalledWith(mockPaletteId);
    });

    it('should return 404 for non-existent palette', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/palettes/${mockPaletteId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Palette not found');
    });

    it('should validate palette ID format', async () => {
      const response = await request(app)
        .delete('/api/palettes/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid palette ID format');
    });
  });

  describe('GET /api/palettes/:id', () => {
    it('should retrieve a specific palette', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);

      const response = await request(app)
        .get(`/api/palettes/${mockPaletteId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(mockPaletteId);
      expect(response.body.name).toBe('Test Palette');
    });

    it('should return 404 for non-existent palette', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/palettes/${mockPaletteId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Palette not found');
    });
  });

  describe('PUT /api/palettes/:id', () => {
    const updateData = {
      name: 'Updated Palette Name',
      colors: [
        {
          hex: '#FF6B35',
          rgb: { r: 255, g: 107, b: 53 },
          hsl: { h: 16, s: 100, l: 60 },
          name: 'Updated Orange',
          category: 'primary',
          usage: 'Updated usage',
          accessibility: {
            contrastWithWhite: 3.2,
            contrastWithBlack: 6.5,
            wcagLevel: 'AA',
          },
        },
      ],
    };

    it('should update an existing palette', async () => {
      const updatedPalette = { ...mockPalette, ...updateData };
      mockColorPaletteRepository.findById.mockResolvedValue(mockPalette);
      mockColorPaletteRepository.update.mockResolvedValue(updatedPalette);

      const response = await request(app)
        .put(`/api/palettes/${mockPaletteId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Palette Name');
      expect(mockColorPaletteRepository.update).toHaveBeenCalledWith(mockPaletteId, updateData);
    });

    it('should return 404 for non-existent palette', async () => {
      mockColorPaletteRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/palettes/${mockPaletteId}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Palette not found');
    });
  });

  describe('POST /api/palettes/bulk-delete', () => {
    const paletteIds = [uuidv4(), uuidv4()];

    it('should delete multiple palettes', async () => {
      const bulkDeleteData = {
        paletteIds,
        userId: mockUserId,
      };

      // Mock finding palettes for ownership verification
      mockColorPaletteRepository.findById
        .mockResolvedValueOnce({ ...mockPalette, id: paletteIds[0] })
        .mockResolvedValueOnce({ ...mockPalette, id: paletteIds[1] });
      
      mockColorPaletteRepository.delete.mockResolvedValue();

      const response = await request(app)
        .post('/api/palettes/bulk-delete')
        .send(bulkDeleteData);

      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(2);
      expect(mockColorPaletteRepository.delete).toHaveBeenCalledTimes(2);
    });

    it('should validate ownership when userId provided', async () => {
      const bulkDeleteData = {
        paletteIds: [paletteIds[0]],
        userId: mockUserId,
      };

      // Mock palette with different owner
      mockColorPaletteRepository.findById.mockResolvedValue({
        ...mockPalette,
        userId: 'different-user-id',
      });

      const response = await request(app)
        .post('/api/palettes/bulk-delete')
        .send(bulkDeleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unauthorized to delete');
    });

    it('should validate request data', async () => {
      const invalidData = {
        paletteIds: [], // Empty array
      };

      const response = await request(app)
        .post('/api/palettes/bulk-delete')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid bulk delete data');
    });
  });
});