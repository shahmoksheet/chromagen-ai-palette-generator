// Simple server entry point
import app from './app-simple';

const PORT = process.env.PORT || 3333;

const server = app.listen(PORT, () => {
  console.log(`🚀 ChromaGen API server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API test: http://localhost:${PORT}/api/test`);
  console.log(`🎨 Generate: http://localhost:${PORT}/api/generate/text`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default server;