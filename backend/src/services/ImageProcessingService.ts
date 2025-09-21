// Image processing service for color extraction and image handling

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { RGB, ColorData, GenerationContext } from '../types/color';
import { extractDominantColors, rgbToHex, rgbToHsl } from '../utils/colorConversion';
import { AccessibilityService } from './AccessibilityService';
import { ColorNamingService } from './ColorNamingService';
import { logger } from '../utils/logger';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  colorCount?: number;
}

export interface ProcessedImageResult {
  processedImagePath: string;
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  format: string;
  fileSize: number;
  dominantColors: RGB[];
  colorPalette: ColorData[];
  processingTime: number;
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    fileSize: number;
  };
}

export class ImageProcessingService {
  private accessibilityService: AccessibilityService;
  private colorNamingService: ColorNamingService;
  private tempDir: string;
  
  // Supported image formats
  private readonly supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'tiff'];
  
  // Default processing options
  private readonly defaultOptions: Required<ImageProcessingOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'jpeg',
    colorCount: 5,
  };

  // File size limits (in bytes)
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly maxPixels = 50 * 1024 * 1024; // 50 megapixels

  constructor(tempDirectory?: string) {
    this.accessibilityService = new AccessibilityService();
    this.colorNamingService = new ColorNamingService();
    this.tempDir = tempDirectory || path.join(process.cwd(), 'temp');
    
    // Ensure temp directory exists
    this.ensureTempDirectory();
  }

  /**
   * Process uploaded image and extract color palette
   */
  public async processImage(
    imagePath: string,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImageResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting image processing', {
        imagePath,
        options,
      });

      // Validate image
      const validation = await this.validateImage(imagePath);
      if (!validation.isValid) {
        throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
      }

      const finalOptions = { ...this.defaultOptions, ...options };
      
      // Process image (resize, optimize, convert format)
      const processedImagePath = await this.optimizeImage(imagePath, finalOptions);
      
      // Extract dominant colors
      const dominantColors = await this.extractDominantColors(processedImagePath, finalOptions.colorCount);
      
      // Convert to color palette
      const colorPalette = await this.createColorPalette(dominantColors);
      
      // Get processed image metadata
      const processedMetadata = await sharp(processedImagePath).metadata();
      const processedStats = await fs.stat(processedImagePath);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Image processing completed', {
        originalPath: imagePath,
        processedPath: processedImagePath,
        dominantColorCount: dominantColors.length,
        paletteColorCount: colorPalette.length,
        processingTime: `${processingTime}ms`,
      });

      return {
        processedImagePath,
        originalSize: {
          width: validation.metadata!.width,
          height: validation.metadata!.height,
        },
        processedSize: {
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
        },
        format: processedMetadata.format || finalOptions.format,
        fileSize: processedStats.size,
        dominantColors,
        colorPalette,
        processingTime,
      };
    } catch (error) {
      logger.error('Error processing image:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate uploaded image file
   */
  public async validateImage(imagePath: string): Promise<ImageValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Check if file exists
      const stats = await fs.stat(imagePath);
      
      // Check file size
      if (stats.size > this.maxFileSize) {
        errors.push(`File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds maximum allowed size (${this.maxFileSize / 1024 / 1024}MB)`);
      }
      
      // Get image metadata
      const metadata = await sharp(imagePath).metadata();
      
      // Check format
      if (!metadata.format || !this.supportedFormats.includes(metadata.format.toLowerCase())) {
        errors.push(`Unsupported image format: ${metadata.format}. Supported formats: ${this.supportedFormats.join(', ')}`);
      }
      
      // Check dimensions
      if (!metadata.width || !metadata.height) {
        errors.push('Unable to determine image dimensions');
      } else {
        const totalPixels = metadata.width * metadata.height;
        
        if (totalPixels > this.maxPixels) {
          errors.push(`Image resolution (${metadata.width}x${metadata.height}) exceeds maximum allowed pixels (${Math.round(this.maxPixels / 1024 / 1024)}MP)`);
        }
        
        // Warnings for very small images
        if (metadata.width < 100 || metadata.height < 100) {
          warnings.push('Image is very small, color extraction may be less accurate');
        }
        
        // Warnings for very large images
        if (metadata.width > 4000 || metadata.height > 4000) {
          warnings.push('Large image detected, processing may take longer');
        }
      }
      
      // Check color space
      if (metadata.space && !['srgb', 'rgb', 'cmyk'].includes(metadata.space.toLowerCase())) {
        warnings.push(`Unusual color space detected: ${metadata.space}. Colors may not be accurate`);
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: metadata.width && metadata.height ? {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format || 'unknown',
          fileSize: stats.size,
        } : undefined,
      };
    } catch (error) {
      errors.push(`Failed to read image file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        isValid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Optimize image (resize, compress, convert format)
   */
  private async optimizeImage(
    imagePath: string,
    options: Required<ImageProcessingOptions>
  ): Promise<string> {
    const outputPath = path.join(this.tempDir, `processed_${uuidv4()}.${options.format}`);
    
    try {
      let pipeline = sharp(imagePath);
      
      // Resize if needed
      pipeline = pipeline.resize(options.maxWidth, options.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      
      // Apply format-specific optimizations
      switch (options.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: options.quality,
            progressive: true,
            mozjpeg: true,
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            compressionLevel: 9,
            progressive: true,
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality: options.quality,
            effort: 6,
          });
          break;
      }
      
      await pipeline.toFile(outputPath);
      
      logger.debug('Image optimization completed', {
        inputPath: imagePath,
        outputPath,
        format: options.format,
        quality: options.quality,
      });
      
      return outputPath;
    } catch (error) {
      logger.error('Error optimizing image:', error);
      throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract dominant colors from processed image
   */
  private async extractDominantColors(imagePath: string, colorCount: number): Promise<RGB[]> {
    try {
      // Get raw pixel data
      const { data, info } = await sharp(imagePath)
        .resize(200, 200, { fit: 'cover' }) // Resize for faster processing
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Convert buffer to RGB array
      const pixels: RGB[] = [];
      for (let i = 0; i < data.length; i += info.channels) {
        pixels.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
        });
      }
      
      // Extract dominant colors using k-means clustering
      const dominantColors = extractDominantColors(pixels, colorCount);
      
      // Filter out colors that are too similar or too extreme
      const filteredColors = this.filterColors(dominantColors);
      
      logger.debug('Dominant color extraction completed', {
        imagePath,
        requestedColors: colorCount,
        extractedColors: dominantColors.length,
        filteredColors: filteredColors.length,
      });
      
      return filteredColors;
    } catch (error) {
      logger.error('Error extracting dominant colors:', error);
      throw new Error(`Color extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Filter out similar or extreme colors
   */
  private filterColors(colors: RGB[]): RGB[] {
    const filtered: RGB[] = [];
    const minDistance = 30; // Minimum color distance
    
    for (const color of colors) {
      // Skip colors that are too dark or too light
      const brightness = (color.r + color.g + color.b) / 3;
      if (brightness < 20 || brightness > 235) {
        continue;
      }
      
      // Skip colors that are too similar to existing ones
      const isSimilar = filtered.some(existing => {
        const distance = Math.sqrt(
          Math.pow(color.r - existing.r, 2) +
          Math.pow(color.g - existing.g, 2) +
          Math.pow(color.b - existing.b, 2)
        );
        return distance < minDistance;
      });
      
      if (!isSimilar) {
        filtered.push(color);
      }
    }
    
    return filtered;
  }

  /**
   * Convert RGB colors to ColorData palette
   */
  private async createColorPalette(dominantColors: RGB[]): Promise<ColorData[]> {
    const palette: ColorData[] = [];
    
    for (let i = 0; i < dominantColors.length; i++) {
      const rgb = dominantColors[i];
      const hex = rgbToHex(rgb);
      const hsl = rgbToHsl(rgb);
      
      // Generate context for color naming
      const context: GenerationContext = {
        prompt: 'Colors extracted from uploaded image',
        mood: 'neutral',
        industry: 'general',
        targetAudience: 'general',
        brandPersonality: [],
      };
      
      // Determine category based on position
      let category: 'primary' | 'secondary' | 'accent';
      if (i === 0) {
        category = 'primary';
      } else if (i < Math.ceil(dominantColors.length / 2)) {
        category = 'secondary';
      } else {
        category = 'accent';
      }
      
      // Create color data
      const colorData: ColorData = {
        hex,
        rgb,
        hsl,
        name: 'Extracted Color',
        category,
        usage: 'Color extracted from image',
        accessibility: {
          contrastWithWhite: 0,
          contrastWithBlack: 0,
          wcagLevel: 'FAIL',
        },
      };
      
      // Enhance with naming service
      colorData.name = this.colorNamingService.generateColorName(colorData, context);
      colorData.usage = this.colorNamingService.generateUsageRecommendation(colorData, context, i);
      
      // Calculate accessibility
      const accessibilityResult = this.accessibilityService.analyzeColorAccessibility(colorData);
      colorData.accessibility = {
        contrastWithWhite: accessibilityResult.contrastWithWhite,
        contrastWithBlack: accessibilityResult.contrastWithBlack,
        wcagLevel: accessibilityResult.wcagLevelWhite !== 'FAIL' 
          ? accessibilityResult.wcagLevelWhite 
          : accessibilityResult.wcagLevelBlack,
      };
      
      palette.push(colorData);
    }
    
    return palette;
  }

  /**
   * Clean up temporary files
   */
  public async cleanupTempFiles(maxAge: number = 3600000): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.debug('Cleaned up temp file', { filePath });
        }
      }
      
      logger.info('Temp file cleanup completed', {
        tempDir: this.tempDir,
        maxAge: `${maxAge}ms`,
      });
    } catch (error) {
      logger.error('Error during temp file cleanup:', error);
    }
  }

  /**
   * Delete specific temporary file
   */
  public async deleteTempFile(filePath: string): Promise<void> {
    try {
      // Ensure the file is in the temp directory for security
      const normalizedPath = path.normalize(filePath);
      const normalizedTempDir = path.normalize(this.tempDir);
      
      if (!normalizedPath.startsWith(normalizedTempDir)) {
        throw new Error('File is not in temp directory');
      }
      
      await fs.unlink(filePath);
      logger.debug('Deleted temp file', { filePath });
    } catch (error) {
      logger.warn('Failed to delete temp file:', error);
    }
  }

  /**
   * Get image metadata without processing
   */
  public async getImageMetadata(imagePath: string): Promise<{
    width: number;
    height: number;
    format: string;
    fileSize: number;
    colorSpace?: string;
    hasAlpha: boolean;
  }> {
    try {
      const [metadata, stats] = await Promise.all([
        sharp(imagePath).metadata(),
        fs.stat(imagePath),
      ]);
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        fileSize: stats.size,
        colorSpace: metadata.space,
        hasAlpha: metadata.hasAlpha || false,
      };
    } catch (error) {
      logger.error('Error getting image metadata:', error);
      throw new Error(`Failed to get image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDirectory(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info('Created temp directory', { tempDir: this.tempDir });
    }
  }

  /**
   * Generate thumbnail from image
   */
  public async generateThumbnail(
    imagePath: string,
    width: number = 200,
    height: number = 200
  ): Promise<string> {
    const thumbnailPath = path.join(this.tempDir, `thumb_${uuidv4()}.jpeg`);
    
    try {
      await sharp(imagePath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      logger.debug('Thumbnail generated', {
        originalPath: imagePath,
        thumbnailPath,
        size: `${width}x${height}`,
      });
      
      return thumbnailPath;
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      throw new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert image to different format
   */
  public async convertFormat(
    imagePath: string,
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 85
  ): Promise<string> {
    const outputPath = path.join(this.tempDir, `converted_${uuidv4()}.${targetFormat}`);
    
    try {
      let pipeline = sharp(imagePath);
      
      switch (targetFormat) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ compressionLevel: 9 });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality, effort: 6 });
          break;
      }
      
      await pipeline.toFile(outputPath);
      
      logger.debug('Format conversion completed', {
        inputPath: imagePath,
        outputPath,
        targetFormat,
        quality,
      });
      
      return outputPath;
    } catch (error) {
      logger.error('Error converting image format:', error);
      throw new Error(`Format conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}