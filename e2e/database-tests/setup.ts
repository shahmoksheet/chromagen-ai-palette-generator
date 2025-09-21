import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test.db'
    }
  }
});

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
  
  // Run migrations
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  
  console.log('Database test setup completed');
});

afterAll(async () => {
  // Clean up test data
  await prisma.exportHistory.deleteMany();
  await prisma.colorPalette.deleteMany();
  await prisma.user.deleteMany();
  
  // Disconnect
  await prisma.$disconnect();
  
  console.log('Database test cleanup completed');
});

beforeEach(async () => {
  // Clean up before each test
  await prisma.exportHistory.deleteMany();
  await prisma.colorPalette.deleteMany();
  await prisma.user.deleteMany();
});

export { prisma };