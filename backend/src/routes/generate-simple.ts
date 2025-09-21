// Simplified generate routes for testing
import { Router } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger';

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

// Add request logging middleware
router.use((req, res, next) => {
  logger.info('Generate route accessed', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin']
    }
  });
  
  // Add CORS headers explicitly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Simple text generation endpoint for testing
router.post('/text', async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    
    logger.info('Received generation request', { prompt, userId, body: req.body });
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      logger.warn('Invalid prompt provided', { prompt });
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a non-empty string',
        code: 'VALIDATION_ERROR'
      });
    }

    logger.info('Generating palette from text', { prompt: prompt.trim(), userId });

    // Mock response for now
    const mockResponse = {
      id: `palette_${Date.now()}`,
      name: `Palette for "${prompt}"`,
      prompt,
      colors: [
        {
          hex: '#3B82F6',
          rgb: { r: 59, g: 130, b: 246 },
          hsl: { h: 217, s: 91, l: 60 },
          name: 'Primary Blue',
          category: 'primary',
          usage: 'Main brand color, buttons, links',
          accessibility: {
            contrastWithWhite: 3.1,
            contrastWithBlack: 6.8,
            wcagLevel: 'AA'
          }
        },
        {
          hex: '#10B981',
          rgb: { r: 16, g: 185, b: 129 },
          hsl: { h: 160, s: 84, l: 39 },
          name: 'Success Green',
          category: 'secondary',
          usage: 'Success states, positive actions',
          accessibility: {
            contrastWithWhite: 3.9,
            contrastWithBlack: 5.4,
            wcagLevel: 'AA'
          }
        },
        {
          hex: '#F59E0B',
          rgb: { r: 245, g: 158, b: 11 },
          hsl: { h: 38, s: 92, l: 50 },
          name: 'Warning Amber',
          category: 'accent',
          usage: 'Warnings, highlights, call-to-action',
          accessibility: {
            contrastWithWhite: 2.8,
            contrastWithBlack: 7.5,
            wcagLevel: 'AA'
          }
        },
        {
          hex: '#6B7280',
          rgb: { r: 107, g: 114, b: 128 },
          hsl: { h: 220, s: 9, l: 46 },
          name: 'Neutral Gray',
          category: 'neutral',
          usage: 'Text, borders, subtle backgrounds',
          accessibility: {
            contrastWithWhite: 5.2,
            contrastWithBlack: 4.0,
            wcagLevel: 'AA'
          }
        },
        {
          hex: '#F9FAFB',
          rgb: { r: 249, g: 250, b: 251 },
          hsl: { h: 210, s: 20, l: 98 },
          name: 'Light Background',
          category: 'background',
          usage: 'Page backgrounds, cards, containers',
          accessibility: {
            contrastWithWhite: 1.0,
            contrastWithBlack: 20.8,
            wcagLevel: 'AAA'
          }
        }
      ],
      accessibilityScore: {
        overallScore: 'AA',
        passedChecks: 4,
        totalChecks: 5,
        recommendations: [
          'Consider using a darker shade of amber for better contrast with white backgrounds'
        ]
      },
      explanation: `This palette was generated based on your prompt "${prompt}". It includes a professional blue as the primary color, complemented by green for positive actions and amber for highlights. The neutral gray provides excellent readability, while the light background ensures proper contrast throughout your design.`,
      processingTime: Math.floor(Math.random() * 1000) + 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info('Successfully generated palette', { 
      paletteId: mockResponse.id, 
      colorCount: mockResponse.colors.length,
      processingTime: mockResponse.processingTime 
    });
    
    res.json(mockResponse);
  } catch (error) {
    logger.error('Error generating palette from text:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      prompt: req.body.prompt || 'unknown',
      userId: req.body.userId || 'unknown'
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Simple image generation endpoint for testing
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    logger.info('Generating palette from image', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      fileType: req.file?.mimetype
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
        code: 'VALIDATION_ERROR'
      });
    }

    // Mock response for image upload
    const mockResponse = {
      id: `palette_${Date.now()}`,
      name: 'Extracted Image Palette',
      prompt: 'Generated from uploaded image',
      colors: [
        {
          hex: '#8B4513',
          rgb: { r: 139, g: 69, b: 19 },
          hsl: { h: 25, s: 76, l: 31 },
          name: 'Earthy Brown',
          category: 'primary',
          usage: 'Dominant color from image',
          accessibility: {
            contrastWithWhite: 8.2,
            contrastWithBlack: 2.6,
            wcagLevel: 'AA'
          }
        },
        {
          hex: '#228B22',
          rgb: { r: 34, g: 139, b: 34 },
          hsl: { h: 120, s: 61, l: 34 },
          name: 'Forest Green',
          category: 'secondary',
          usage: 'Secondary color from image',
          accessibility: {
            contrastWithWhite: 6.9,
            contrastWithBlack: 3.0,
            wcagLevel: 'AA'
          }
        },
        {
          hex: '#87CEEB',
          rgb: { r: 135, g: 206, b: 235 },
          hsl: { h: 197, s: 71, l: 73 },
          name: 'Sky Blue',
          category: 'accent',
          usage: 'Accent color from image',
          accessibility: {
            contrastWithWhite: 1.8,
            contrastWithBlack: 11.7,
            wcagLevel: 'AA'
          }
        }
      ],
      accessibilityScore: {
        overallScore: 'AA',
        passedChecks: 3,
        totalChecks: 3,
        recommendations: []
      },
      explanation: 'This palette was extracted from your uploaded image, capturing the dominant colors and creating a harmonious scheme based on the visual elements.',
      processingTime: Math.floor(Math.random() * 800) + 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json(mockResponse);
  } catch (error) {
    logger.error('Error generating palette from image:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

export default router;