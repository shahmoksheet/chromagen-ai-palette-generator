// Test environment setup

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PORT = '3001';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.MAX_FILE_SIZE = '5242880';
process.env.UPLOAD_DIR = './uploads';

export {};