import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { colorPaletteRepository, userRepository } from '../repositories';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError } from '../types/api';

const router = Router();

// Rate limiting for palette operations
const paletteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many palette requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all palette routes
router.use(paletteRateLimit);

// Validation schemas
const SavePaletteSchema = z.object({
  name: z.string().min(1).max(255),
  prompt: z.string().min(1).max(1000),
  colors: z.array(z.object({
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    rgb: z.object({
      r: z.number().min(0).max(255),
      g: z.number().min(0).max(255),
      b: z.number().min(0).max(255),
    }),
    hsl: z.object({
      h: z.number().min(0).max(360),
      s: z.number().min(0).max(100),
      l: z.number().min(0).max(100),
    }),
    name: z.string(),
    category: z.enum(['primary', 'secondary', 'accent', 'neutral']),
    usage: z.string(),
    accessibility: z.object({
      contrastWithWhite: z.number(),
      contrastWithBlack: z.number(),
      wcagLevel: z.enum(['AA', 'AAA', 'FAIL']),
    }),
  })).min(1).max(10),
  accessibilityScore: z.object({
    overallScore: z.enum(['AA', 'AAA', 'FAIL']),
    contrastRatios: z.array(z.object({
      color1: z.string(),
      color2: z.string(),
      ratio: z.number(),
      passes: z.object({
        AA: z.boolean(),
        AAA: z.boolean(),
      }),
    })),
    colorBlindnessCompatible: z.boolean(),
    recommendations: z.array(z.string()),
  }).optional(),
  userId: z.string().uuid().optional(),
});

const HistoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/palettes/history/:userId
 * Retrieve palette history for a user with pagination and filtering
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    // Validate UUID format
    if (!z.string().uuid().safeParse(userId).success) {
      throw new ValidationError('Invalid user ID format');
    }

    // Validate query parameters
    const queryValidation = HistoryQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      throw new ValidationError('Invalid query parameters');
    }

    const { page, limit, search, sortBy, sortOrder } = queryValidation.data;

    logger.info('Retrieving palette history', {
      userId,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });

    // Check if user exists (create if not exists for session-based users)
    let user = await userRepository.findById(userId);
    if (!user) {
      user = await userRepository.create({
        id: userId,
        sessionId: `session_${userId}`,
      });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build filter options
    const filterOptions = {
      userId,
      search,
      sortBy,
      sortOrder,
      limit,
      offset,
    };

    // Get palettes with total count
    const [palettes, totalCount] = await Promise.all([
      colorPaletteRepository.findByUserId(filterOptions),
      colorPaletteRepository.countByUserId(userId, search),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response = {
      palettes: palettes.map(palette => ({
        id: palette.id,
        name: palette.name,
        prompt: palette.prompt,
        colors: palette.colors,
        accessibilityScore: palette.accessibilityScore,
        createdAt: palette.createdAt,
        updatedAt: palette.updatedAt,
        thumbnail: generatePaletteThumbnail(palette.colors),
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit,
      },
    };

    logger.info('Palette history retrieved successfully', {
      userId,
      paletteCount: palettes.length,
      totalCount,
      page,
    });

    res.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to retrieve palette history', {
      userId: req.params.userId,
      error: errorMessage,
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to retrieve palette history' });
  }
});

/**
 * POST /api/palettes/save
 * Save a new palette or update an existing one
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = SavePaletteSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid palette data: ' + validation.error.errors.map(e => e.message).join(', '));
    }

    const paletteData = validation.data;

    logger.info('Saving palette', {
      name: paletteData.name,
      colorCount: paletteData.colors.length,
      userId: paletteData.userId,
    });

    // Create or find user if userId is provided
    let userId = paletteData.userId;
    if (userId) {
      let user = await userRepository.findById(userId);
      if (!user) {
        user = await userRepository.create({
          id: userId,
          sessionId: `session_${userId}`,
        });
      }
    }

    // Generate palette name if not provided
    const paletteName = paletteData.name || generatePaletteName(paletteData.prompt);

    // Save palette to database
    const savedPalette = await colorPaletteRepository.create({
      name: paletteName,
      prompt: paletteData.prompt,
      colors: paletteData.colors,
      accessibilityScore: paletteData.accessibilityScore,
      userId: userId || null,
    });

    logger.info('Palette saved successfully', {
      paletteId: savedPalette.id,
      name: savedPalette.name,
      userId: savedPalette.userId,
    });

    res.status(201).json({
      id: savedPalette.id,
      name: savedPalette.name,
      prompt: savedPalette.prompt,
      colors: savedPalette.colors,
      accessibilityScore: savedPalette.accessibilityScore,
      createdAt: savedPalette.createdAt,
      updatedAt: savedPalette.updatedAt,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to save palette', {
      error: errorMessage,
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to save palette' });
  }
});

/**
 * DELETE /api/palettes/:id
 * Delete a specific palette
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const paletteId = req.params.id;

    // Validate UUID format
    if (!z.string().uuid().safeParse(paletteId).success) {
      throw new ValidationError('Invalid palette ID format');
    }

    logger.info('Deleting palette', { paletteId });

    // Check if palette exists
    const palette = await colorPaletteRepository.findById(paletteId);
    if (!palette) {
      throw new NotFoundError('Palette not found');
    }

    // Delete the palette
    await colorPaletteRepository.delete(paletteId);

    logger.info('Palette deleted successfully', { paletteId });

    res.status(204).send();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete palette', {
      paletteId: req.params.id,
      error: errorMessage,
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to delete palette' });
  }
});

/**
 * GET /api/palettes/:id
 * Get a specific palette by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const paletteId = req.params.id;

    // Validate UUID format
    if (!z.string().uuid().safeParse(paletteId).success) {
      throw new ValidationError('Invalid palette ID format');
    }

    logger.info('Retrieving palette', { paletteId });

    const palette = await colorPaletteRepository.findById(paletteId);
    if (!palette) {
      throw new NotFoundError('Palette not found');
    }

    logger.info('Palette retrieved successfully', { paletteId });

    res.json({
      id: palette.id,
      name: palette.name,
      prompt: palette.prompt,
      colors: palette.colors,
      accessibilityScore: palette.accessibilityScore,
      createdAt: palette.createdAt,
      updatedAt: palette.updatedAt,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to retrieve palette', {
      paletteId: req.params.id,
      error: errorMessage,
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to retrieve palette' });
  }
});

/**
 * PUT /api/palettes/:id
 * Update an existing palette
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const paletteId = req.params.id;

    // Validate UUID format
    if (!z.string().uuid().safeParse(paletteId).success) {
      throw new ValidationError('Invalid palette ID format');
    }

    // Validate request body (partial update)
    const UpdatePaletteSchema = SavePaletteSchema.partial().omit({ userId: true });
    const validation = UpdatePaletteSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid update data: ' + validation.error.errors.map(e => e.message).join(', '));
    }

    logger.info('Updating palette', { paletteId });

    // Check if palette exists
    const existingPalette = await colorPaletteRepository.findById(paletteId);
    if (!existingPalette) {
      throw new NotFoundError('Palette not found');
    }

    // Update the palette
    const updatedPalette = await colorPaletteRepository.update(paletteId, validation.data);

    logger.info('Palette updated successfully', { paletteId });

    res.json({
      id: updatedPalette!.id,
      name: updatedPalette!.name,
      prompt: updatedPalette!.prompt,
      colors: updatedPalette!.colors,
      accessibilityScore: updatedPalette!.accessibilityScore,
      createdAt: updatedPalette!.createdAt,
      updatedAt: updatedPalette!.updatedAt,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update palette', {
      paletteId: req.params.id,
      error: errorMessage,
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update palette' });
  }
});

/**
 * POST /api/palettes/bulk-delete
 * Delete multiple palettes at once
 */
router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const BulkDeleteSchema = z.object({
      paletteIds: z.array(z.string().uuid()).min(1).max(50), // Limit to 50 for safety
      userId: z.string().uuid().optional(),
    });

    const validation = BulkDeleteSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid bulk delete data: ' + validation.error.errors.map(e => e.message).join(', '));
    }

    const { paletteIds, userId } = validation.data;

    logger.info('Bulk deleting palettes', { 
      paletteIds, 
      userId,
      count: paletteIds.length 
    });

    // If userId is provided, verify ownership of all palettes
    if (userId) {
      for (const paletteId of paletteIds) {
        const palette = await colorPaletteRepository.findById(paletteId);
        if (!palette) {
          throw new NotFoundError(`Palette ${paletteId} not found`);
        }
        if (palette.userId !== userId) {
          throw new ValidationError(`Unauthorized to delete palette ${paletteId}`);
        }
      }
    }

    // Delete all palettes
    const deletePromises = paletteIds.map(id => colorPaletteRepository.delete(id));
    await Promise.all(deletePromises);

    logger.info('Bulk delete completed successfully', { 
      deletedCount: paletteIds.length,
      userId 
    });

    res.json({
      success: true,
      deletedCount: paletteIds.length,
      message: `Successfully deleted ${paletteIds.length} palettes`,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to bulk delete palettes', {
      error: errorMessage,
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to bulk delete palettes' });
  }
});

// Helper functions

/**
 * Generate a palette thumbnail (array of hex colors for quick preview)
 */
function generatePaletteThumbnail(colors: any[]): string[] {
  return colors.slice(0, 5).map(color => color.hex);
}

/**
 * Generate a palette name from prompt
 */
function generatePaletteName(prompt: string): string {
  // Extract key words from prompt and create a name
  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 3);
  
  if (words.length === 0) {
    return `Palette ${new Date().toISOString().split('T')[0]}`;
  }
  
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Palette';
}

export default router;