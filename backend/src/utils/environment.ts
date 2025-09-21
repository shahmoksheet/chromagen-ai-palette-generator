// Environment validation utility

import { validateEnvironment as validate } from './validation';
import { logger } from './logger';

export function validateEnvironment(): void {
  try {
    validate();
    logger.info('Environment validation passed');
  } catch (error) {
    logger.error('Environment validation failed:', error);
    throw error;
  }
}

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
}

export function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  
  const numValue = value ? parseInt(value, 10) : defaultValue!;
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  
  return numValue;
}

export function getEnvVarAsBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  
  if (!value) return defaultValue!;
  
  return value.toLowerCase() === 'true';
}