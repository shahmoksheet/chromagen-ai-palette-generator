import { prisma } from './setup';
import { ColorPalette, User, ExportHistory } from '@prisma/client';

describe('Database Integration Tests', () => {
  describe('User Operations', () => {
    test('should create and retrieve user', async () => {
      const userData = {
        sessionId: 'test-session-123',
      };

      const createdUser = await prisma.user.create({
        data: userData,
      });

      expect(createdUser.id).toBeDefined();
      expect(createdUser.sessionId).toBe(userData.sessionId);
      expect(createdUser.createdAt).toBeInstanceOf(Date);

      const retrievedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(retrievedUser).toEqual(createdUser);
    });

    test('should handle unique session ID constraint', async () => {
      const sessionId = 'duplicate-session';

      await prisma.user.create({
        data: { sessionId },
      });

      await expect(
        prisma.user.create({
          data: { sessionId },
        })
      ).rejects.toThrow();
    });
  });

  describe('Color Palette Operations', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: { sessionId: 'palette-test-user' },
      });
    });

    test('should create and retrieve color palette', async () => {
      const paletteData = {
        userId: testUser.id,
        name: 'Test Palette',
        prompt: 'vibrant sunset colors',
        colors: [
          {
            hex: '#FF6B6B',
            rgb: { r: 255, g: 107, b: 107 },
            hsl: { h: 0, s: 100, l: 71 },
            name: 'Coral Red',
            category: 'primary',
            usage: 'Main brand color',
          },
          {
            hex: '#4ECDC4',
            rgb: { r: 78, g: 205, b: 196 },
            hsl: { h: 176, s: 61, l: 55 },
            name: 'Turquoise',
            category: 'secondary',
            usage: 'Accent color',
          },
        ],
        accessibilityScore: {
          overallScore: 'AA',
          contrastRatios: [
            { foreground: '#FF6B6B', background: '#FFFFFF', ratio: 4.5 },
          ],
          colorBlindnessCompatible: true,
          recommendations: ['Good contrast ratios'],
        },
      };

      const createdPalette = await prisma.colorPalette.create({
        data: paletteData,
      });

      expect(createdPalette.id).toBeDefined();
      expect(createdPalette.name).toBe(paletteData.name);
      expect(createdPalette.colors).toEqual(paletteData.colors);
      expect(createdPalette.accessibilityScore).toEqual(paletteData.accessibilityScore);

      const retrievedPalette = await prisma.colorPalette.findUnique({
        where: { id: createdPalette.id },
        include: { user: true },
      });

      expect(retrievedPalette).toBeTruthy();
      expect(retrievedPalette!.user.id).toBe(testUser.id);
    });

    test('should retrieve user palette history', async () => {
      // Create multiple palettes for the user
      const palettes = await Promise.all([
        prisma.colorPalette.create({
          data: {
            userId: testUser.id,
            name: 'Palette 1',
            prompt: 'test prompt 1',
            colors: [{ hex: '#FF0000', name: 'Red' }],
            accessibilityScore: { overallScore: 'AA' },
          },
        }),
        prisma.colorPalette.create({
          data: {
            userId: testUser.id,
            name: 'Palette 2',
            prompt: 'test prompt 2',
            colors: [{ hex: '#00FF00', name: 'Green' }],
            accessibilityScore: { overallScore: 'AAA' },
          },
        }),
      ]);

      const userPalettes = await prisma.colorPalette.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(userPalettes).toHaveLength(2);
      expect(userPalettes[0].name).toBe('Palette 2'); // Most recent first
      expect(userPalettes[1].name).toBe('Palette 1');
    });

    test('should update palette', async () => {
      const palette = await prisma.colorPalette.create({
        data: {
          userId: testUser.id,
          name: 'Original Name',
          prompt: 'original prompt',
          colors: [{ hex: '#FF0000', name: 'Red' }],
          accessibilityScore: { overallScore: 'AA' },
        },
      });

      const updatedPalette = await prisma.colorPalette.update({
        where: { id: palette.id },
        data: {
          name: 'Updated Name',
          colors: [
            { hex: '#FF0000', name: 'Red' },
            { hex: '#00FF00', name: 'Green' },
          ],
        },
      });

      expect(updatedPalette.name).toBe('Updated Name');
      expect(updatedPalette.colors).toHaveLength(2);
      expect(updatedPalette.updatedAt.getTime()).toBeGreaterThan(
        palette.updatedAt.getTime()
      );
    });

    test('should delete palette', async () => {
      const palette = await prisma.colorPalette.create({
        data: {
          userId: testUser.id,
          name: 'To Delete',
          prompt: 'delete test',
          colors: [{ hex: '#FF0000', name: 'Red' }],
          accessibilityScore: { overallScore: 'AA' },
        },
      });

      await prisma.colorPalette.delete({
        where: { id: palette.id },
      });

      const deletedPalette = await prisma.colorPalette.findUnique({
        where: { id: palette.id },
      });

      expect(deletedPalette).toBeNull();
    });
  });

  describe('Export History Operations', () => {
    let testUser: User;
    let testPalette: ColorPalette;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: { sessionId: 'export-test-user' },
      });

      testPalette = await prisma.colorPalette.create({
        data: {
          userId: testUser.id,
          name: 'Export Test Palette',
          prompt: 'export test',
          colors: [{ hex: '#FF0000', name: 'Red' }],
          accessibilityScore: { overallScore: 'AA' },
        },
      });
    });

    test('should create export history record', async () => {
      const exportData = {
        paletteId: testPalette.id,
        format: 'css',
      };

      const exportRecord = await prisma.exportHistory.create({
        data: exportData,
      });

      expect(exportRecord.id).toBeDefined();
      expect(exportRecord.format).toBe('css');
      expect(exportRecord.exportedAt).toBeInstanceOf(Date);
    });

    test('should retrieve export history for palette', async () => {
      // Create multiple export records
      await Promise.all([
        prisma.exportHistory.create({
          data: { paletteId: testPalette.id, format: 'css' },
        }),
        prisma.exportHistory.create({
          data: { paletteId: testPalette.id, format: 'json' },
        }),
        prisma.exportHistory.create({
          data: { paletteId: testPalette.id, format: 'scss' },
        }),
      ]);

      const exportHistory = await prisma.exportHistory.findMany({
        where: { paletteId: testPalette.id },
        orderBy: { exportedAt: 'desc' },
      });

      expect(exportHistory).toHaveLength(3);
      expect(exportHistory.map(e => e.format)).toEqual(['scss', 'json', 'css']);
    });

    test('should cascade delete export history when palette is deleted', async () => {
      await prisma.exportHistory.create({
        data: { paletteId: testPalette.id, format: 'css' },
      });

      await prisma.colorPalette.delete({
        where: { id: testPalette.id },
      });

      const exportHistory = await prisma.exportHistory.findMany({
        where: { paletteId: testPalette.id },
      });

      expect(exportHistory).toHaveLength(0);
    });
  });

  describe('Complex Queries and Relationships', () => {
    test('should perform complex queries with joins', async () => {
      const user = await prisma.user.create({
        data: { sessionId: 'complex-query-user' },
      });

      const palette = await prisma.colorPalette.create({
        data: {
          userId: user.id,
          name: 'Complex Query Palette',
          prompt: 'complex test',
          colors: [{ hex: '#FF0000', name: 'Red' }],
          accessibilityScore: { overallScore: 'AA' },
        },
      });

      await prisma.exportHistory.create({
        data: { paletteId: palette.id, format: 'css' },
      });

      // Query with multiple joins
      const result = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          colorPalettes: {
            include: {
              exportHistory: true,
            },
          },
        },
      });

      expect(result).toBeTruthy();
      expect(result!.colorPalettes).toHaveLength(1);
      expect(result!.colorPalettes[0].exportHistory).toHaveLength(1);
      expect(result!.colorPalettes[0].exportHistory[0].format).toBe('css');
    });

    test('should handle pagination', async () => {
      const user = await prisma.user.create({
        data: { sessionId: 'pagination-user' },
      });

      // Create 15 palettes
      const palettes = await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          prisma.colorPalette.create({
            data: {
              userId: user.id,
              name: `Palette ${i + 1}`,
              prompt: `test prompt ${i + 1}`,
              colors: [{ hex: '#FF0000', name: 'Red' }],
              accessibilityScore: { overallScore: 'AA' },
            },
          })
        )
      );

      // Test pagination
      const page1 = await prisma.colorPalette.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });

      const page2 = await prisma.colorPalette.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 10,
      });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(5);
      expect(page1[0].name).toBe('Palette 15'); // Most recent first
      expect(page2[4].name).toBe('Palette 1'); // Oldest last
    });

    test('should handle concurrent operations', async () => {
      const user = await prisma.user.create({
        data: { sessionId: 'concurrent-user' },
      });

      // Create multiple palettes concurrently
      const concurrentOperations = Array.from({ length: 10 }, (_, i) =>
        prisma.colorPalette.create({
          data: {
            userId: user.id,
            name: `Concurrent Palette ${i + 1}`,
            prompt: `concurrent test ${i + 1}`,
            colors: [{ hex: '#FF0000', name: 'Red' }],
            accessibilityScore: { overallScore: 'AA' },
          },
        })
      );

      const results = await Promise.all(concurrentOperations);

      expect(results).toHaveLength(10);
      results.forEach((palette, index) => {
        expect(palette.name).toBe(`Concurrent Palette ${index + 1}`);
      });

      // Verify all were created
      const allPalettes = await prisma.colorPalette.findMany({
        where: { userId: user.id },
      });

      expect(allPalettes).toHaveLength(10);
    });
  });

  describe('Data Integrity and Constraints', () => {
    test('should enforce foreign key constraints', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      await expect(
        prisma.colorPalette.create({
          data: {
            userId: nonExistentUserId,
            name: 'Invalid Palette',
            prompt: 'invalid test',
            colors: [{ hex: '#FF0000', name: 'Red' }],
            accessibilityScore: { overallScore: 'AA' },
          },
        })
      ).rejects.toThrow();
    });

    test('should handle JSON field validation', async () => {
      const user = await prisma.user.create({
        data: { sessionId: 'json-validation-user' },
      });

      // Valid JSON structure
      const validPalette = await prisma.colorPalette.create({
        data: {
          userId: user.id,
          name: 'Valid JSON Palette',
          prompt: 'json test',
          colors: [
            {
              hex: '#FF0000',
              rgb: { r: 255, g: 0, b: 0 },
              hsl: { h: 0, s: 100, l: 50 },
              name: 'Red',
              category: 'primary',
              usage: 'Main color',
            },
          ],
          accessibilityScore: {
            overallScore: 'AA',
            contrastRatios: [],
            colorBlindnessCompatible: true,
            recommendations: [],
          },
        },
      });

      expect(validPalette.colors).toHaveLength(1);
      expect(validPalette.colors[0]).toHaveProperty('hex', '#FF0000');
      expect(validPalette.accessibilityScore).toHaveProperty('overallScore', 'AA');
    });
  });
});