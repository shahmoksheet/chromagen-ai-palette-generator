// Validation schemas using Zod

import { z } from 'zod';

// Color validation schemas
export const RGBSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
});

export const HSLSchema = z.object({
  h: z.number().min(0).max(360),
  s: z.number().min(0).max(100),
  l: z.number().min(0).max(100),
});

export const ColorDataSchema = z.object({
  hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
  rgb: RGBSchema,
  hsl: HSLSchema,
  name: z.string().min(1).max(50),
  category: z.enum(['primary', 'secondary', 'accent']),
  usage: z.string().max(200),
  accessibility: z.object({
    contrastWithWhite: z.number().min(1).max(21),
    contrastWithBlack: z.number().min(1).max(21),
    wcagLevel: z.enum(['AA', 'AAA', 'FAIL']),
  }),
});

// Generation options validation
export const GenerationOptionsSchema = z.object({
  colorCount: z.number().min(3).max(10).default(5),
  harmonyType: z.enum(['complementary', 'triadic', 'analogous', 'monochromatic', 'tetradic']).default('complementary'),
  accessibilityLevel: z.enum(['AA', 'AAA']).default('AA'),
  includeNeutrals: z.boolean().default(true),
});

// Request validation schemas
export const TextGenerationRequestSchema = z.object({
  prompt: z.string()
    .min(5, 'Prompt must be at least 5 characters long')
    .max(500, 'Prompt must be less than 500 characters')
    .refine(
      (prompt) => prompt.trim().length > 0,
      'Prompt cannot be empty or only whitespace'
    ),
  userId: z.string().optional(),
  options: GenerationOptionsSchema.partial().optional(),
});

export const ImageGenerationRequestSchema = z.object({
  userId: z.string().optional(),
  options: GenerationOptionsSchema.partial().optional(),
});

export const SavePaletteRequestSchema = z.object({
  palette: z.object({
    name: z.string().min(1).max(100),
    prompt: z.string().max(500).optional(),
    colors: z.array(ColorDataSchema).min(3).max(10),
    accessibilityScore: z.object({
      overallScore: z.enum(['AA', 'AAA', 'FAIL']),
      contrastRatios: z.array(z.object({
        color1: z.string(),
        color2: z.string(),
        ratio: z.number().min(1).max(21),
        level: z.enum(['AA', 'AAA', 'FAIL']),
        isTextReadable: z.boolean(),
      })),
      colorBlindnessCompatible: z.boolean(),
      recommendations: z.array(z.string()),
      passedChecks: z.number().min(0),
      totalChecks: z.number().min(0),
    }),
    userId: z.string().optional(),
  }),
  userId: z.string().optional(),
});

// Query parameter validation
export const PaginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().min(1)),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().min(1).max(50)),
});

export const PaletteHistoryQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().min(1)),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().min(1).max(50)),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Export validation
export const ExportFormatSchema = z.enum(['css', 'scss', 'json', 'ase', 'sketch', 'figma', 'tailwind']);

export const ExportRequestSchema = z.object({
  id: z.string().cuid('Invalid palette ID'),
  format: ExportFormatSchema,
});

// File upload validation
export const FileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string().refine(
    (mimetype) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimetype),
    'Only JPEG, PNG, WebP, and GIF images are allowed'
  ),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  buffer: z.instanceof(Buffer),
});

// Environment validation
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3001'),
  DATABASE_URL: z.string().url('Invalid database URL'),
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').optional(),
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('5242880'),
  UPLOAD_DIR: z.string().default('./uploads'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
});

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
    }
    throw error;
  }
}

export function validateEnvironment(): void {
  try {
    EnvironmentSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
      
      // Don't exit during tests
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      } else {
        throw new Error('Environment validation failed in test environment');
      }
    }
    throw error;
  }
}

// Type exports for use in other files
export type TextGenerationRequest = z.infer<typeof TextGenerationRequestSchema>;
export type ImageGenerationRequest = z.infer<typeof ImageGenerationRequestSchema>;
export type SavePaletteRequest = z.infer<typeof SavePaletteRequestSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type PaletteHistoryQuery = z.infer<typeof PaletteHistoryQuerySchema>;
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;