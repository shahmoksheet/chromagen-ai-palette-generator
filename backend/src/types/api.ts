// Backend API type definitions

import { Request, Response } from 'express';
import { ColorPaletteData, GenerationOptions, ExportFormat } from './color';

// Request body types
export interface TextGenerationRequest {
  prompt: string;
  userId?: string;
  options?: Partial<GenerationOptions>;
}

export interface ImageGenerationRequest {
  userId?: string;
  options?: Partial<GenerationOptions>;
}

export interface SavePaletteRequest {
  palette: Omit<ColorPaletteData, 'id' | 'createdAt' | 'updatedAt'>;
  userId?: string;
}

// Extended Express types
export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

export interface TypedRequest<T = any> extends Request {
  body: T;
  userId?: string;
  sessionId?: string;
}

export interface TypedResponse<T = any> extends Response {
  json: (body: APIResponse<T>) => this;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GenerationResponse extends APIResponse<ColorPaletteData> {
  processingTime: number;
  explanation: string;
  model: string;
}

// Error types
export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends APIError {
  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', { service });
    this.name = 'ExternalServiceError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// Middleware types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface CacheConfig {
  ttl: number;
  max: number;
  updateAgeOnGet: boolean;
}

// Service interfaces
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime?: number;
}

export interface DatabaseQuery {
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
  include?: Record<string, boolean>;
}