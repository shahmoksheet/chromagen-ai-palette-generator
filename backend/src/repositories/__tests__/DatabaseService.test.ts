// Tests for DatabaseService

// Mock Prisma Client
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  user: {
    count: jest.fn(),
  },
  colorPalette: {
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  exportHistory: {
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  $on: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { DatabaseService } from '../../services/DatabaseService';

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    databaseService = DatabaseService.getInstance();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('connection management', () => {
    it('should connect to database successfully', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await databaseService.connect();

      expect(mockPrismaClient.$connect).toHaveBeenCalled();
      expect(databaseService.isHealthy()).toBe(true);
    });

    it('should handle connection errors', async () => {
      mockPrismaClient.$connect.mockRejectedValue(new Error('Connection failed'));

      await expect(databaseService.connect()).rejects.toThrow('Database connection failed');
      expect(databaseService.isHealthy()).toBe(false);
    });

    it('should disconnect from database successfully', async () => {
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await databaseService.disconnect();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
      expect(databaseService.isHealthy()).toBe(false);
    });

    it('should handle disconnection errors', async () => {
      mockPrismaClient.$disconnect.mockRejectedValue(new Error('Disconnection failed'));

      await expect(databaseService.disconnect()).rejects.toThrow('Database disconnection failed');
    });
  });

  describe('health check', () => {
    it('should return healthy status when database is accessible', async () => {
      mockPrismaClient.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await databaseService.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.details.connected).toBe(true);
      expect(result.details.timestamp).toBeDefined();
    });

    it('should return unhealthy status when database is not accessible', async () => {
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('Database error'));

      const result = await databaseService.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.details.connected).toBe(false);
      expect(result.details.error).toBe('Database error');
    });
  });

  describe('transactions', () => {
    it('should execute transaction successfully', async () => {
      const mockResult = { id: 'test-id' };
      mockPrismaClient.$transaction.mockImplementation(async (fn) => {
        return await fn(mockPrismaClient);
      });

      const result = await databaseService.transaction(async (prisma) => {
        return mockResult;
      });

      expect(result).toBe(mockResult);
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      mockPrismaClient.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(
        databaseService.transaction(async () => {
          return {};
        })
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('statistics', () => {
    it('should get database statistics successfully', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockPrismaClient.user.count.mockResolvedValue(10);
      mockPrismaClient.colorPalette.count
        .mockResolvedValueOnce(50) // total palettes
        .mockResolvedValueOnce(5); // palettes today
      mockPrismaClient.exportHistory.count
        .mockResolvedValueOnce(100) // total exports
        .mockResolvedValueOnce(8); // exports today

      const stats = await databaseService.getStats();

      expect(stats).toEqual({
        users: 10,
        palettes: 50,
        exports: 100,
        recentActivity: {
          palettesCreatedToday: 5,
          exportsToday: 8,
        },
      });
    });

    it('should handle statistics errors', async () => {
      mockPrismaClient.user.count.mockRejectedValue(new Error('Stats error'));

      await expect(databaseService.getStats()).rejects.toThrow('Failed to get database stats');
    });
  });

  describe('cleanup', () => {
    it('should cleanup old data successfully', async () => {
      mockPrismaClient.exportHistory.deleteMany.mockResolvedValue({ count: 10 });
      mockPrismaClient.colorPalette.deleteMany.mockResolvedValue({ count: 5 });

      const result = await databaseService.cleanup({
        deleteOldPalettes: true,
        deleteOldExports: true,
        retentionDays: 30,
      });

      expect(result).toEqual({
        deletedPalettes: 5,
        deletedExports: 10,
      });
    });

    it('should handle cleanup with default options', async () => {
      mockPrismaClient.exportHistory.deleteMany.mockResolvedValue({ count: 15 });

      const result = await databaseService.cleanup();

      expect(result).toEqual({
        deletedPalettes: 0,
        deletedExports: 15,
      });
    });

    it('should handle cleanup errors', async () => {
      mockPrismaClient.exportHistory.deleteMany.mockRejectedValue(new Error('Cleanup error'));

      await expect(databaseService.cleanup()).rejects.toThrow('Database cleanup failed');
    });
  });

  describe('client access', () => {
    it('should provide access to Prisma client', () => {
      const client = databaseService.getClient();
      
      expect(client).toBe(mockPrismaClient);
    });
  });
});