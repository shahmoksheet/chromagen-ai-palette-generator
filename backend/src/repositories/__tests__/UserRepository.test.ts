// Tests for UserRepository

import { UserRepository } from '../UserRepository';

// Mock the database service
const mockPrismaClient = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  colorPalette: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  exportHistory: {
    count: jest.fn(),
  },
};

jest.mock('../../services/DatabaseService', () => ({
  databaseService: {
    getClient: () => mockPrismaClient,
  },
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = new UserRepository();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = { sessionId: 'test-session-123' };
      const mockUser = { id: 'user-1', ...userData, createdAt: new Date(), updatedAt: new Date() };

      mockPrismaClient.user.create.mockResolvedValue(mockUser);

      const result = await userRepository.create(userData);

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });

    it('should handle creation errors', async () => {
      mockPrismaClient.user.create.mockRejectedValue(new Error('Database error'));

      await expect(
        userRepository.create({ sessionId: 'test-session' })
      ).rejects.toThrow('Create user failed');
    });
  });

  describe('findById', () => {
    it('should find user by ID successfully', async () => {
      const mockUser = { id: 'user-1', sessionId: 'test-session', createdAt: new Date(), updatedAt: new Date() };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findBySessionId', () => {
    it('should find user by session ID successfully', async () => {
      const mockUser = { id: 'user-1', sessionId: 'test-session', createdAt: new Date(), updatedAt: new Date() };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findBySessionId('test-session');

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'test-session' },
      });
    });
  });

  describe('findOrCreateBySessionId', () => {
    it('should return existing user if found', async () => {
      const mockUser = { id: 'user-1', sessionId: 'test-session', createdAt: new Date(), updatedAt: new Date() };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findOrCreateBySessionId('test-session');

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
    });

    it('should create new user if not found', async () => {
      const mockUser = { id: 'user-1', sessionId: 'test-session', createdAt: new Date(), updatedAt: new Date() };

      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.user.create.mockResolvedValue(mockUser);

      const result = await userRepository.findOrCreateBySessionId('test-session');

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: { sessionId: 'test-session' },
      });
    });
  });

  describe('findByIdWithStats', () => {
    it('should find user with statistics', async () => {
      const mockUserWithStats = {
        id: 'user-1',
        sessionId: 'test-session',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          palettes: 5,
          exports: 10,
        },
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUserWithStats);

      const result = await userRepository.findByIdWithStats('user-1');

      expect(result).toEqual(mockUserWithStats);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          _count: {
            select: {
              palettes: true,
              exports: true,
            },
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = { sessionId: 'new-session' };
      const mockUser = { id: 'user-1', ...updateData, createdAt: new Date(), updatedAt: new Date() };

      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      const result = await userRepository.update('user-1', updateData);

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockUser = { id: 'user-1', sessionId: 'test-session', createdAt: new Date(), updatedAt: new Date() };

      mockPrismaClient.user.delete.mockResolvedValue(mockUser);

      const result = await userRepository.delete('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('findMany', () => {
    it('should find users with pagination', async () => {
      const mockUsers = [
        { id: 'user-1', sessionId: 'session-1', createdAt: new Date(), updatedAt: new Date() },
        { id: 'user-2', sessionId: 'session-2', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaClient.user.count.mockResolvedValue(20);

      const result = await userRepository.findMany({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
      });
    });
  });

  describe('getActivitySummary', () => {
    it('should get user activity summary', async () => {
      const mockRecentPalettes = [
        { id: 'palette-1', name: 'Test Palette', createdAt: new Date() },
      ];

      mockPrismaClient.colorPalette.count.mockResolvedValue(5);
      mockPrismaClient.exportHistory.count.mockResolvedValue(10);
      mockPrismaClient.colorPalette.findMany.mockResolvedValue(mockRecentPalettes);

      const result = await userRepository.getActivitySummary('user-1', 30);

      expect(result).toEqual({
        palettesCreated: 5,
        exportsPerformed: 10,
        recentPalettes: mockRecentPalettes,
      });
    });
  });

  describe('cleanupInactiveUsers', () => {
    it('should cleanup inactive users', async () => {
      mockPrismaClient.user.deleteMany.mockResolvedValue({ count: 3 });

      const result = await userRepository.cleanupInactiveUsers(90);

      expect(result).toBe(3);
      expect(mockPrismaClient.user.deleteMany).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database connection lost'));

      await expect(
        userRepository.findById('user-1')
      ).rejects.toThrow('Find user by ID failed');
    });
  });
});