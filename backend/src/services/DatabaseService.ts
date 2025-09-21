// Database connection and management service

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'error', 'info', 'warn'],
    });

    // Set up logging
    this.setupLogging();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get Prisma client instance
   */
  public getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Connect to database
   */
  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw new Error(`Database disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if database is connected
   */
  public isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Perform health check
   */
  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        details: {
          connected: true,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Execute transaction
   */
  public async transaction<T>(
    fn: (prisma: any) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async (prisma: any) => {
        return await fn(prisma);
      });
    } catch (error) {
      logger.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<{
    users: number;
    palettes: number;
    exports: number;
    recentActivity: {
      palettesCreatedToday: number;
      exportsToday: number;
    };
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        userCount,
        paletteCount,
        exportCount,
        palettesToday,
        exportsToday,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.colorPalette.count(),
        this.prisma.exportHistory.count(),
        this.prisma.colorPalette.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        this.prisma.exportHistory.count({
          where: {
            exportedAt: {
              gte: today,
            },
          },
        }),
      ]);

      return {
        users: userCount,
        palettes: paletteCount,
        exports: exportCount,
        recentActivity: {
          palettesCreatedToday: palettesToday,
          exportsToday: exportsToday,
        },
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      throw new Error(`Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up old data
   */
  public async cleanup(options: {
    deleteOldPalettes?: boolean;
    deleteOldExports?: boolean;
    retentionDays?: number;
  } = {}): Promise<{
    deletedPalettes: number;
    deletedExports: number;
  }> {
    const {
      deleteOldPalettes = false,
      deleteOldExports = true,
      retentionDays = 90,
    } = options;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedPalettes = 0;
    let deletedExports = 0;

    try {
      if (deleteOldExports) {
        const result = await this.prisma.exportHistory.deleteMany({
          where: {
            exportedAt: {
              lt: cutoffDate,
            },
          },
        });
        deletedExports = result.count;
        logger.info(`Cleaned up ${deletedExports} old export records`);
      }

      if (deleteOldPalettes) {
        // Only delete palettes without user association (anonymous palettes)
        const result = await this.prisma.colorPalette.deleteMany({
          where: {
            userId: null,
            createdAt: {
              lt: cutoffDate,
            },
          },
        });
        deletedPalettes = result.count;
        logger.info(`Cleaned up ${deletedPalettes} old anonymous palettes`);
      }

      return {
        deletedPalettes,
        deletedExports,
      };
    } catch (error) {
      logger.error('Database cleanup failed:', error);
      throw new Error(`Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up database logging
   */
  private setupLogging(): void {
    // Simplified logging setup for now
    logger.info('Database service initialized with logging');
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();