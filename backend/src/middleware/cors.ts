// CORS configuration middleware

import cors from 'cors';
import { getEnvVar } from '../utils/environment';

const allowedOrigins = [
  getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  'http://localhost:3000',
  'http://localhost:3001', // Backend is running on 3001
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

// Add production origins if specified
if (process.env.PRODUCTION_ORIGIN) {
  allowedOrigins.push(process.env.PRODUCTION_ORIGIN);
}

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Session-ID',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);