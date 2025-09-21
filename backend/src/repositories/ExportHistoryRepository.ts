// Export history repository for database operations

import { ExportHistory, Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateExportHistoryData {
  paletteId: string;
  userId?: string;
  format: string;
}

export interface ExportHistoryWithDetails extends ExportHistory {
  palette: {
    id: string;
    name: string;
    colors: any;
  };
  user?: {
    id: string;
    sessionId: string;
  } | null;
}

export interface ExportHistoryFilters {
  userId?: string;
  paletteId?: string;
  format?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class ExportHistoryRepository extends BaseRepository {
  /**
   * Create a new export history record
   */
  public async create(data: CreateExportHistoryData): Promise<ExportHistory> {
    return this.executeWithErrorHandling(async () => {
      return await this.prisma.exportHistory.create({
        data,
      });
    }, 'Create export history');
  }

  /**
   * Find export by ID
   */
  public async findById(id: string): Promise<ExportHistory | null> {
    return this.executeWithErrorHandling(async () => {
      return await this.prisma.exportHistory.findUnique({
        where: { id },
      });
    }, 'Find export by ID');
  }

  /**
   * Find export by ID with details
   */
  public async findByIdWithDetails(id: string): Promise<ExportHistoryWithDetails | null> {
    return this.executeWithErrorHandling(async () => {
      return await this.prisma.exportHistory.findUnique({
        where: { id },
        include: {
          palette: {
            select: {
              id: true,
              name: true,
              colors: true,
            },
          },
          user: {
            select: {
              id: true,
              sessionId: true,
            },
          },
        },
      });
    }, 'Find export by ID with details');
  }

  /**
   * Find exports by user ID
   */
  public async findByUserId(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      format?: string;
    } = {}
  ): Promise<{
    exports: ExportHistoryWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, sortBy = 'exportedAt', sortOrder = 'desc', format } = options;

    return this.executeWithErrorHandling(async () => {
      const where: Prisma.ExportHistoryWhereInput = {
        userId,
        ...(format && { format }),
      };

      const [exports, total] = await Promise.all([
        this.prisma.exportHistory.findMany({
          where,
          ...this.buildPaginationOptions(page, limit),
          orderBy: this.buildSortOptions(sortBy, sortOrder),
          include: {
            palette: {
              select: {
                id: true,
                name: true,
                colors: true,
              },
            },
            user: {
              select: {
                id: true,
                sessionId: true,
              },
            },
          },
        }),
        this.prisma.exportHistory.count({ where }),
      ]);

      return {
        exports,
        pagination: {
          page,
          limit,
          total,
          totalPages: this.calculateTotalPages(total, limit),
        },
      };
    }, 'Find exports by user ID');
  }

  /**
   * Find exports by palette ID
   */
  public async findByPaletteId(
    paletteId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    exports: ExportHistoryWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, sortBy = 'exportedAt', sortOrder = 'desc' } = options;

    return this.executeWithErrorHandling(async () => {
      const where: Prisma.ExportHistoryWhereInput = {
        paletteId,
      };

      const [exports, total] = await Promise.all([
        this.prisma.exportHistory.findMany({
          where,
          ...this.buildPaginationOptions(page, limit),
          orderBy: this.buildSortOptions(sortBy, sortOrder),
          include: {
            palette: {
              select: {
                id: true,
                name: true,
                colors: true,
              },
            },
            user: {
              select: {
                id: true,
                sessionId: true,
              },
            },
          },
        }),
        this.prisma.exportHistory.count({ where }),
      ]);

      return {
        exports,
        pagination: {
          page,
          limit,
          total,
          totalPages: this.calculateTotalPages(total, limit),
        },
      };
    }, 'Find exports by palette ID');
  }

  /**
   * Find exports with filters
   */
  public async findMany(
    filters: ExportHistoryFilters = {},
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    exports: ExportHistoryWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, sortBy = 'exportedAt', sortOrder = 'desc' } = options;
    const { userId, paletteId, format, dateFrom, dateTo } = filters;

    return this.executeWithErrorHandling(async () => {
      const where: Prisma.ExportHistoryWhereInput = {
        ...(userId && { userId }),
        ...(paletteId && { paletteId }),
        ...(format && { format }),
        ...(dateFrom && {
          exportedAt: {
            gte: dateFrom,
          },
        }),
        ...(dateTo && {
          exportedAt: {
            ...((dateFrom && { gte: dateFrom }) || {}),
            lte: dateTo,
          },
        }),
      };

      const [exports, total] = await Promise.all([
        this.prisma.exportHistory.findMany({
          where,
          ...this.buildPaginationOptions(page, limit),
          orderBy: this.buildSortOptions(sortBy, sortOrder),
          include: {
            palette: {
              select: {
                id: true,
                name: true,
                colors: true,
              },
            },
            user: {
              select: {
                id: true,
                sessionId: true,
              },
            },
          },
        }),
        this.prisma.exportHistory.count({ where }),
      ]);

      return {
        exports,
        pagination: {
          page,
          limit,
          total,
          totalPages: this.calculateTotalPages(total, limit),
        },
      };
    }, 'Find exports with filters');
  }

  /**
   * Delete export record
   */
  public async delete(id: string): Promise<ExportHistory> {
    return this.executeWithErrorHandling(async () => {
      return await this.prisma.exportHistory.delete({
        where: { id },
      });
    }, 'Delete export');
  }

  /**
   * Get export statistics
   */
  public async getStatistics(): Promise<{
    total: number;
    byFormat: Record<string, number>;
    byUser: number;
    anonymous: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
    popularFormats: Array<{ format: string; count: number }>;
  }> {
    return this.executeWithErrorHandling(async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        total,
        byUser,
        anonymous,
        todayCount,
        weekCount,
        monthCount,
        formatStats,
      ] = await Promise.all([
        this.prisma.exportHistory.count(),
        this.prisma.exportHistory.count({
          where: {
            userId: { not: null },
          },
        }),
        this.prisma.exportHistory.count({
          where: {
            userId: null,
          },
        }),
        this.prisma.exportHistory.count({
          where: {
            exportedAt: { gte: today },
          },
        }),
        this.prisma.exportHistory.count({
          where: {
            exportedAt: { gte: weekAgo },
          },
        }),
        this.prisma.exportHistory.count({
          where: {
            exportedAt: { gte: monthAgo },
          },
        }),
        this.prisma.exportHistory.groupBy({
          by: ['format'],
          _count: {
            format: true,
          },
          orderBy: {
            _count: {
              format: 'desc',
            },
          },
        }),
      ]);

      const byFormat: Record<string, number> = {};
      const popularFormats = formatStats.map(stat => ({
        format: stat.format,
        count: stat._count.format,
      }));

      formatStats.forEach(stat => {
        byFormat[stat.format] = stat._count.format;
      });

      return {
        total,
        byFormat,
        byUser,
        anonymous,
        todayCount,
        weekCount,
        monthCount,
        popularFormats,
      };
    }, 'Get export statistics');
  }

  /**
   * Get most exported palettes
   */
  public async getMostExportedPalettes(limit: number = 10): Promise<Array<{
    paletteId: string;
    paletteName: string;
    exportCount: number;
    lastExported: Date;
  }>> {
    return this.executeWithErrorHandling(async () => {
      const result = await this.prisma.exportHistory.groupBy({
        by: ['paletteId'],
        _count: {
          paletteId: true,
        },
        _max: {
          exportedAt: true,
        },
        orderBy: {
          _count: {
            paletteId: 'desc',
          },
        },
        take: limit,
      });

      // Get palette names
      const paletteIds = result.map(r => r.paletteId);
      const palettes = await this.prisma.colorPalette.findMany({
        where: {
          id: { in: paletteIds },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const paletteMap = new Map(palettes.map(p => [p.id, p.name]));

      return result.map(r => ({
        paletteId: r.paletteId,
        paletteName: paletteMap.get(r.paletteId) || 'Unknown',
        exportCount: r._count.paletteId,
        lastExported: r._max.exportedAt!,
      }));
    }, 'Get most exported palettes');
  }

  /**
   * Clean up old export records
   */
  public async cleanup(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return this.executeWithErrorHandling(async () => {
      const result = await this.prisma.exportHistory.deleteMany({
        where: {
          exportedAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    }, 'Cleanup old export records');
  }
}