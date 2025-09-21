import { databaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export interface ColorPalette {
  id: string;
  userId: string | null;
  name: string;
  prompt: string | null;
  colors: any;
  accessibilityScore: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateColorPaletteData {
  name: string;
  prompt: string;
  colors: any;
  accessibilityScore?: any;
  userId?: string | null;
}

export interface PaletteFilterOptions {
  userId: string;
  search?: string;
  sortBy: 'createdAt' | 'name' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

export class ColorPaletteRepository {
  private get prisma() {
    return databaseService.getClient();
  }

  /**
   * Find palette by ID
   */
  async findById(id: string): Promise<ColorPalette | null> {
    try {
      const palette = await this.prisma.colorPalette.findUnique({
        where: { id },
      });
      
      if (!palette) return null;

      // Parse JSON fields
      return {
        ...palette,
        colors: JSON.parse(palette.colors),
        accessibilityScore: palette.accessibilityScore ? JSON.parse(palette.accessibilityScore) : null,
      };
    } catch (error) {
      logger.error('Failed to find palette by ID', { id, error });
      throw error;
    }
  }

  /**
   * Find palettes by user ID with filtering and pagination
   */
  async findByUserId(options: PaletteFilterOptions): Promise<ColorPalette[]> {
    try {
      const whereClause: any = {
        userId: options.userId,
      };

      // Add search filter
      if (options.search) {
        whereClause.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { prompt: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      const palettes = await this.prisma.colorPalette.findMany({
        where: whereClause,
        orderBy: {
          [options.sortBy]: options.sortOrder,
        },
        take: options.limit,
        skip: options.offset,
      });
      
      return palettes;
    } catch (error) {
      logger.error('Failed to find palettes by user ID', { options, error });
      throw error;
    }
  }

  /**
   * Count palettes by user ID with optional search
   */
  async countByUserId(userId: string, search?: string): Promise<number> {
    try {
      const whereClause: any = {
        userId,
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { prompt: { contains: search, mode: 'insensitive' } },
        ];
      }

      const count = await this.prisma.colorPalette.count({
        where: whereClause,
      });

      return count;
    } catch (error) {
      logger.error('Failed to count palettes by user ID', { userId, search, error });
      throw error;
    }
  }

  /**
   * Create a new color palette
   */
  async create(paletteData: CreateColorPaletteData): Promise<ColorPalette> {
    try {
      const palette = await this.prisma.colorPalette.create({
        data: {
          name: paletteData.name,
          prompt: paletteData.prompt,
          colors: JSON.stringify(paletteData.colors), // Serialize for SQLite
          accessibilityScore: paletteData.accessibilityScore ? JSON.stringify(paletteData.accessibilityScore) : null,
          userId: paletteData.userId || null,
        },
      });

      // Parse JSON fields back for return
      const result = {
        ...palette,
        colors: JSON.parse(palette.colors),
        accessibilityScore: palette.accessibilityScore ? JSON.parse(palette.accessibilityScore) : null,
      };

      logger.info('Color palette created successfully', { paletteId: palette.id });
      return result;
    } catch (error) {
      logger.error('Failed to create color palette', { paletteData, error });
      throw error;
    }
  }

  /**
   * Update an existing color palette
   */
  async update(id: string, updateData: Partial<CreateColorPaletteData>): Promise<ColorPalette | null> {
    try {
      const palette = await this.prisma.colorPalette.update({
        where: { id },
        data: updateData,
      });

      logger.info('Color palette updated successfully', { paletteId: id });
      return palette;
    } catch (error) {
      logger.error('Failed to update color palette', { id, updateData, error });
      throw error;
    }
  }

  /**
   * Delete a color palette
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.colorPalette.delete({
        where: { id },
      });
      
      logger.info('Color palette deleted successfully', { paletteId: id });
    } catch (error) {
      logger.error('Failed to delete color palette', { id, error });
      throw error;
    }
  }

  /**
   * Find recent palettes (for homepage/dashboard)
   */
  async findRecent(limit: number = 10): Promise<ColorPalette[]> {
    try {
      const palettes = await this.prisma.colorPalette.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
      
      return palettes;
    } catch (error) {
      logger.error('Failed to find recent palettes', { limit, error });
      throw error;
    }
  }
}

// Export singleton instance
export const colorPaletteRepository = new ColorPaletteRepository();