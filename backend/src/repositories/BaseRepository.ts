// Base repository class with common database operations

import { PrismaClient } from '@prisma/client';
import { databaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = databaseService.getClient();
  }

  /**
   * Execute operation with error handling
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.error(`${operationName} failed:`, error);
      throw new Error(`${operationName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build pagination options
   */
  protected buildPaginationOptions(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit,
    };
  }

  /**
   * Build sort options
   */
  protected buildSortOptions(sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc') {
    return {
      [sortBy]: sortOrder,
    };
  }

  /**
   * Calculate total pages
   */
  protected calculateTotalPages(totalCount: number, limit: number): number {
    return Math.ceil(totalCount / limit);
  }
}