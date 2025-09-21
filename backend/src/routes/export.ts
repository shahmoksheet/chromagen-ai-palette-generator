import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { colorPaletteRepository } from '../repositories';
import { exportService } from '../services/ExportService';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError } from '../types/api';
import { ExportFormat } from '../types/color';

const router = Router();

// Rate limiting for export operations
const exportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 export requests per windowMs
  message: 'Too many export requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all export routes
router.use(exportRateLimit);

// Validation schemas
const ExportParamsSchema = z.object({
  id: z.string().uuid('Invalid palette ID format'),
  format: z.enum(['css', 'scss', 'json', 'ase', 'sketch', 'figma', 'tailwind'] as const),
});

const ExportQuerySchema = z.object({
  download: z.enum(['true', 'false']).optional().default('true'),
  preview: z.enum(['true', 'false']).optional().default('false'),
});

/**
 * GET /api/export/:id/:format
 * Export a palette in the specified format
 */
router.get('/:id/:format', async (req: Request, res: Response) => {
  try {
    // Validate parameters
    const paramsValidation = ExportParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      throw new ValidationError('Invalid request parameters: ' + paramsValidation.error.errors.map(e => e.message).join(', '));
    }

    const queryValidation = ExportQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      throw new ValidationError('Invalid query parameters: ' + queryValidation.error.errors.map(e => e.message).join(', '));
    }

    const { id, format } = paramsValidation.data;
    const { download, preview } = queryValidation.data;

    logger.info('Export request received', { 
      paletteId: id, 
      format, 
      download: download === 'true',
      preview: preview === 'true' 
    });

    // Get the palette from database
    const palette = await colorPaletteRepository.findById(id);
    if (!palette) {
      throw new NotFoundError('Palette not found');
    }

    // Convert database palette to ColorPaletteData format
    const paletteData = {
      id: palette.id,
      name: palette.name,
      prompt: palette.prompt || undefined,
      colors: palette.colors,
      accessibilityScore: palette.accessibilityScore,
      userId: palette.userId || undefined,
      createdAt: palette.createdAt,
      updatedAt: palette.updatedAt,
    };

    // Generate export data
    const exportData = await exportService.exportPalette(paletteData, format as ExportFormat);

    // Track export in history (optional - could be added to database)
    logger.info('Palette exported successfully', {
      paletteId: id,
      format,
      filename: exportData.filename,
      contentLength: exportData.content.length,
    });

    // If preview mode, return content as JSON
    if (preview === 'true') {
      return res.json({
        success: true,
        data: {
          format: exportData.format,
          filename: exportData.filename,
          content: exportData.content,
          mimeType: exportData.mimeType,
          size: exportData.content.length,
        },
      });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(exportData.content, 'utf8'));

    // For binary formats, we might need to handle differently
    if (format === 'ase') {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    // Send the file content
    res.send(exportData.content);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to export palette', {
      paletteId: req.params.id,
      format: req.params.format,
      error: errorMessage,
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to export palette' });
  }
});

/**
 * GET /api/export/formats
 * Get list of supported export formats with descriptions
 */
router.get('/formats', async (req: Request, res: Response) => {
  try {
    const supportedFormats = [
      {
        format: 'css',
        name: 'CSS',
        description: 'CSS custom properties and utility classes',
        mimeType: 'text/css',
        extension: '.css',
        features: ['CSS Variables', 'Utility Classes', 'RGB Values'],
      },
      {
        format: 'scss',
        name: 'SCSS/Sass',
        description: 'Sass variables and mixins',
        mimeType: 'text/scss',
        extension: '.scss',
        features: ['SCSS Variables', 'Color Maps', 'Utility Mixins'],
      },
      {
        format: 'json',
        name: 'JSON',
        description: 'Structured JSON data with full palette information',
        mimeType: 'application/json',
        extension: '.json',
        features: ['Complete Data', 'Accessibility Info', 'Metadata'],
      },
      {
        format: 'tailwind',
        name: 'Tailwind CSS',
        description: 'Tailwind CSS configuration with color scales',
        mimeType: 'application/javascript',
        extension: '.js',
        features: ['Color Scales', 'Tailwind Config', 'Shade Variations'],
      },
      {
        format: 'ase',
        name: 'Adobe ASE',
        description: 'Adobe Swatch Exchange format',
        mimeType: 'application/octet-stream',
        extension: '.ase',
        features: ['Adobe Compatible', 'Photoshop', 'Illustrator'],
      },
      {
        format: 'sketch',
        name: 'Sketch Palette',
        description: 'Sketch app color palette format',
        mimeType: 'application/json',
        extension: '.json',
        features: ['Sketch Compatible', 'Color Library', 'Design Systems'],
      },
      {
        format: 'figma',
        name: 'Figma Tokens',
        description: 'Figma design tokens format',
        mimeType: 'application/json',
        extension: '.json',
        features: ['Design Tokens', 'Figma Compatible', 'Team Libraries'],
      },
    ];

    res.json({
      success: true,
      data: {
        formats: supportedFormats,
        totalFormats: supportedFormats.length,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get export formats', { error: errorMessage });
    res.status(500).json({ error: 'Failed to get export formats' });
  }
});

/**
 * POST /api/export/batch
 * Export multiple palettes in specified formats
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const BatchExportSchema = z.object({
      paletteIds: z.array(z.string().uuid()).min(1).max(10), // Limit to 10 palettes
      formats: z.array(z.enum(['css', 'scss', 'json', 'ase', 'sketch', 'figma', 'tailwind'] as const)).min(1),
      zipFile: z.boolean().optional().default(false),
    });

    const validation = BatchExportSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid batch export data: ' + validation.error.errors.map(e => e.message).join(', '));
    }

    const { paletteIds, formats, zipFile } = validation.data;

    logger.info('Batch export request received', { 
      paletteCount: paletteIds.length,
      formats,
      zipFile 
    });

    const exportResults = [];

    // Process each palette
    for (const paletteId of paletteIds) {
      const palette = await colorPaletteRepository.findById(paletteId);
      if (!palette) {
        logger.warn('Palette not found during batch export', { paletteId });
        continue;
      }

      const paletteData = {
        id: palette.id,
        name: palette.name,
        prompt: palette.prompt || undefined,
        colors: palette.colors,
        accessibilityScore: palette.accessibilityScore,
        userId: palette.userId || undefined,
        createdAt: palette.createdAt,
        updatedAt: palette.updatedAt,
      };

      // Export in each requested format
      for (const format of formats) {
        try {
          const exportData = await exportService.exportPalette(paletteData, format);
          exportResults.push({
            paletteId,
            paletteName: palette.name,
            format,
            filename: exportData.filename,
            content: exportData.content,
            mimeType: exportData.mimeType,
            size: exportData.content.length,
          });
        } catch (exportError) {
          logger.error('Failed to export palette in batch', {
            paletteId,
            format,
            error: exportError instanceof Error ? exportError.message : 'Unknown error',
          });
        }
      }
    }

    logger.info('Batch export completed', { 
      totalExports: exportResults.length,
      successfulPalettes: new Set(exportResults.map(r => r.paletteId)).size 
    });

    // If zipFile is requested, we would create a ZIP here
    // For now, return individual files
    res.json({
      success: true,
      data: {
        exports: exportResults,
        totalExports: exportResults.length,
        processedPalettes: new Set(exportResults.map(r => r.paletteId)).size,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to process batch export', { error: errorMessage });

    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to process batch export' });
  }
});

export default router;