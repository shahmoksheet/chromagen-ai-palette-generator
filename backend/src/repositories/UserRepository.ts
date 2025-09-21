import { databaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  id?: string;
  sessionId: string;
}

export class UserRepository {
  private get prisma() {
    return databaseService.getClient();
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      
      return user;
    } catch (error) {
      logger.error('Failed to find user by ID', { id, error });
      throw error;
    }
  }

  /**
   * Find user by session ID
   */
  async findBySessionId(sessionId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { sessionId },
      });
      
      return user;
    } catch (error) {
      logger.error('Failed to find user by session ID', { sessionId, error });
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          id: userData.id,
          sessionId: userData.sessionId,
        },
      });

      logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('Failed to create user', { userData, error });
      throw error;
    }
  }

  /**
   * Update user's last activity
   */
  async updateLastActivity(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      logger.error('Failed to update user last activity', { id, error });
      throw error;
    }
  }

  /**
   * Find or create user by session ID
   */
  async findOrCreateBySessionId(sessionId: string): Promise<User> {
    try {
      // First try to find existing user
      let user = await this.findBySessionId(sessionId);
      
      if (!user) {
        // Create new user if not found
        user = await this.create({ sessionId });
      }
      
      return user;
    } catch (error) {
      logger.error('Failed to find or create user by session ID', { sessionId, error });
      throw error;
    }
  }

  /**
   * Delete user and all associated data
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      
      logger.info('User deleted successfully', { userId: id });
    } catch (error) {
      logger.error('Failed to delete user', { id, error });
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();