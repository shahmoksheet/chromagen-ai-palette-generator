// Color generation routes

import { Router } from 'express';
import multer from 'multer';
import { generationRateLimit, uploadRateLimit } from '../middleware/security';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { TextGenerationRequestSchema, ImageGenerationRequestSchema } from '../utils/validation';
import { logger } from '../utils/logger';
import { ColorGenerationService } from '../services/ColorGenerationService';
import { ImageProcessingService } from '../services/ImageProcessingService';
import { AccessibilityService } from '../services/AccessibilityService';
import { userRepository, colorPaletteRepository } from '../repositories';
import { databaseService } from '../services/DatabaseService';

// Initialize services (lazy loading to handle test mode)
let colorGenerationService: ColorGenerationService;
let imageProcessingService: ImageProcessingService;
let accessibilityService: AccessibilityService;

function getColorGenerationService(): ColorGenerationService {
  if (!colorGenerationService) {
    colorGenerationService = new ColorGenerationService();
  }
  return colorGenerationService;
}

function getImageProcessingService(): ImageProcessingService {
  if (!imageProcessingService) {
    imageProcessingService = new ImageProcessingService();
  }
  return imageProcessingService;
}

function getAccessibilityService(): AccessibilityService {
  if (!accessibilityService) {
    accessibilityService = new AccessibilityService();
  }
  return accessibilityService;
}

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

const router = Router();

/**
 * POST /api/generate/text
 * Generate color palette from text prompt
 */
router.post(
  '/text',
  generationRateLimit,
  validateBody(TextGenerationRequestSchema),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    logger.info('Text generation request', {
      prompt: req.body.prompt,
      userId: req.body.userId,
      options: req.body.options,
    });

    try {
      // Generate colors using AI service
      const generationResult = await getColorGenerationService().generateFromText(
        req.body.prompt,
        req.body.options || {}
      );

      // Find or create user if userId is provided
      let user = null;
      if (req.body.userId) {
        user = await userRepository.findOrCreateBySessionId(req.body.userId);
      }

      // Generate palette name from prompt
      const paletteName = generatePaletteName(req.body.prompt);

      // Calculate accessibility score using proper service
      const accessibilityScore = getAccessibilityService().calculateAccessibilityScore(generationResult.colors);

      // Save palette to database
      const savedPalette = await colorPaletteRepository.create({
        userId: user?.id,
        name: paletteName,
        prompt: req.body.prompt,
        colors: generationResult.colors,
        accessibilityScore,
      });

      const processingTime = Date.now() - startTime;

      // Log memory usage for monitoring
      const memUsage = process.memoryUsage();
      logger.debug('Memory usage after generation', {
        path: req.path,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      });

      res.json({
        success: true,
        data: {
          id: savedPalette.id,
          name: savedPalette.name,
          prompt: savedPalette.prompt,
          colors: generationResult.colors,
          accessibilityScore: savedPalette.accessibilityScore,
          createdAt: savedPalette.createdAt,
          updatedAt: savedPalette.updatedAt,
          userId: savedPalette.userId,
        },
        processingTime,
        explanation: generationResult.explanation,
        model: generationResult.model,
        confidence: generationResult.confidence,
      });
    } catch (error) {
      logger.error('Text generation failed:', error);
      
      // Return error response
      res.status(500).json({
        success: false,
        error: 'Color generation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime,
      });
    }
  })
);

/**
 * POST /api/generate/image
 * Generate color palette from uploaded image
 */
router.post(
  '/image',
  uploadRateLimit,
  upload.single('image'),
  validateBody(ImageGenerationRequestSchema),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const uploadedFile = (req as any).file;
    
    logger.info('Image generation request', {
      userId: req.body.userId,
      options: req.body.options,
      hasFile: !!uploadedFile,
      fileName: uploadedFile?.originalname,
      fileSize: uploadedFile?.size,
    });

    try {
      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided',
          message: 'Please upload an image file to generate a color palette',
        });
      }

      // Process image and extract colors
      const imageResult = await getImageProcessingService().processImage(
        uploadedFile.path,
        {
          colorCount: req.body.options?.colorCount || 5,
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
        }
      );

      // Generate enhanced palette using AI service
      const generationResult = await getColorGenerationService().generateFromDominantColors(
        imageResult.dominantColors.map(color => `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`),
        req.body.options || {}
      );

      // Find or create user if userId is provided
      let user = null;
      if (req.body.userId) {
        user = await userRepository.findOrCreateBySessionId(req.body.userId);
      }

      // Generate palette name
      const paletteName = `Palette from ${uploadedFile.originalname || 'uploaded image'}`;

      // Calculate accessibility score using proper service
      const accessibilityScore = getAccessibilityService().calculateAccessibilityScore(generationResult.colors);

      // Save palette to database
      const savedPalette = await colorPaletteRepository.create({
        userId: user?.id,
        name: paletteName,
        prompt: `Colors extracted from image: ${uploadedFile.originalname}`,
        colors: generationResult.colors,
        accessibilityScore,
      });

      // Clean up uploaded file
      await getImageProcessingService().deleteTempFile(uploadedFile.path);
      if (imageResult.processedImagePath !== uploadedFile.path) {
        await getImageProcessingService().deleteTempFile(imageResult.processedImagePath);
      }

      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          id: savedPalette.id,
          name: savedPalette.name,
          prompt: savedPalette.prompt,
          colors: generationResult.colors,
          accessibilityScore: savedPalette.accessibilityScore,
          createdAt: savedPalette.createdAt,
          updatedAt: savedPalette.updatedAt,
          userId: savedPalette.userId,
          imageMetadata: {
            originalSize: imageResult.originalSize,
            processedSize: imageResult.processedSize,
            format: imageResult.format,
            dominantColorCount: imageResult.dominantColors.length,
          },
        },
        processingTime,
        explanation: generationResult.explanation,
        model: generationResult.model,
        confidence: generationResult.confidence,
      });
    } catch (error) {
      logger.error('Image generation failed:', error);
      
      // Clean up uploaded file on error
      if (uploadedFile) {
        try {
          await getImageProcessingService().deleteTempFile(uploadedFile.path);
        } catch (cleanupError) {
          logger.warn('Failed to clean up uploaded file:', cleanupError);
        }
      }
      
      // Return error response
      res.status(500).json({
        success: false,
        error: 'Image processing failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime,
      });
    }
  })
);

/**
 * Helper function to generate palette name from prompt
 */
function generatePaletteName(prompt: string): string {
  // Extract key words from prompt and create a meaningful name
  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 3);
  
  if (words.length === 0) {
    return 'Generated Palette';
  }
  
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Palette';
}


export default router;