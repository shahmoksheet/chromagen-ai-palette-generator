import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { colorAPI, paletteAPI } from '../utils/api';
import { 
  TextGenerationRequest, 
  GenerationResponse, 
  GenerationOptions, 
  ColorPalette, 
  APIError 
} from '../types/api';
import toast from 'react-hot-toast';
import { logError, ErrorLogLevel } from '../utils/errorLogger';

// Query keys for React Query
export const queryKeys = {
  health: ['health'] as const,
  paletteHistory: (userId: string, page?: number, limit?: number) => 
    ['paletteHistory', userId, page, limit] as const,
  palette: (id: string) => ['palette', id] as const,
} as const;

// Health check hook
export const useHealthCheck = (options?: UseQueryOptions<{ status: string; timestamp: string }, APIError>) => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: colorAPI.healthCheck,
    staleTime: 30000, // 30 seconds
    retry: 1,
    ...options,
  });
};

// Color generation hooks
export const useGenerateFromText = (
  options?: UseMutationOptions<GenerationResponse, APIError, TextGenerationRequest>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: colorAPI.generateFromText,
    onSuccess: (data, variables) => {
      toast.success('Color palette generated successfully!');
      
      // Invalidate palette history if userId is provided
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: ['paletteHistory', variables.userId]
        });
      }
    },
    onError: (error: APIError) => {
      console.error('Text generation error:', error);
      
      const recovery = createErrorRecoveryStrategy(error);
      
      // Log error for monitoring
      logError(new Error(error.error), ErrorLogLevel.ERROR, {
        action: 'text_generation_failed',
        metadata: {
          errorCode: error.code,
          canRecover: recovery.canRecover,
          details: error.details,
        },
      });
      
      // Show appropriate user message
      if (recovery.canRecover) {
        toast.error(recovery.userMessage, { duration: 4000 });
      } else {
        toast.error(getErrorMessage(error));
      }
    },
    ...options,
  });
};

export const useGenerateFromImage = (
  options?: UseMutationOptions<
    GenerationResponse, 
    APIError, 
    { file: File; userId?: string; options?: GenerationOptions; onProgress?: (progress: number) => void }
  >
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, userId, options: genOptions, onProgress }) => 
      colorAPI.generateFromImage(file, userId, genOptions, onProgress),
    onSuccess: (data, variables) => {
      toast.success('Color palette generated from image!');
      
      // Invalidate palette history if userId is provided
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: ['paletteHistory', variables.userId]
        });
      }
    },
    onError: (error: APIError) => {
      console.error('Image generation error:', error);
      
      const recovery = createErrorRecoveryStrategy(error);
      
      // Log error for monitoring
      logError(new Error(error.error), ErrorLogLevel.ERROR, {
        action: 'image_generation_failed',
        metadata: {
          errorCode: error.code,
          canRecover: recovery.canRecover,
          details: error.details,
        },
      });
      
      // Show appropriate user message
      if (recovery.canRecover) {
        toast.error(recovery.userMessage, { duration: 4000 });
      } else {
        toast.error(getErrorMessage(error));
      }
    },
    ...options,
  });
};

// Palette management hooks
export const usePaletteHistory = (
  userId: string,
  page = 1,
  limit = 20,
  options?: UseQueryOptions<{
    palettes: ColorPalette[];
    total: number;
    page: number;
    totalPages: number;
  }, APIError>
) => {
  return useQuery({
    queryKey: queryKeys.paletteHistory(userId, page, limit),
    queryFn: () => paletteAPI.getHistory(userId, page, limit),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    ...options,
  });
};

export const usePalette = (
  paletteId: string,
  options?: UseQueryOptions<ColorPalette, APIError>
) => {
  return useQuery({
    queryKey: queryKeys.palette(paletteId),
    queryFn: () => paletteAPI.getById(paletteId),
    enabled: !!paletteId,
    staleTime: 300000, // 5 minutes
    ...options,
  });
};

export const useSavePalette = (
  options?: UseMutationOptions<ColorPalette, APIError, Omit<ColorPalette, 'id' | 'createdAt' | 'updatedAt'>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paletteAPI.save,
    onSuccess: (data) => {
      toast.success('Palette saved successfully!');
      
      // Invalidate all palette history queries
      queryClient.invalidateQueries({
        queryKey: ['paletteHistory']
      });
      
      // Add the new palette to the cache
      queryClient.setQueryData(queryKeys.palette(data.id), data);
    },
    onError: (error: APIError) => {
      console.error('Save palette error:', error);
      
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    },
    ...options,
  });
};

export const useDeletePalette = (
  options?: UseMutationOptions<void, APIError, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paletteAPI.delete,
    onSuccess: (_, paletteId) => {
      toast.success('Palette deleted successfully!');
      
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.palette(paletteId)
      });
      
      // Invalidate palette history
      queryClient.invalidateQueries({
        queryKey: ['paletteHistory']
      });
    },
    onError: (error: APIError) => {
      console.error('Delete palette error:', error);
      
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    },
    ...options,
  });
};

export const useExportPalette = (
  options?: UseMutationOptions<Blob, APIError, { paletteId: string; format: string }>
) => {
  return useMutation({
    mutationFn: ({ paletteId, format }) => paletteAPI.export(paletteId, format),
    onSuccess: (blob, { format }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `palette.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Palette exported as ${format.toUpperCase()}!`);
    },
    onError: (error: APIError) => {
      console.error('Export palette error:', error);
      
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    },
    ...options,
  });
};

// Enhanced error recovery and graceful degradation
const createErrorRecoveryStrategy = (error: APIError) => {
  const strategies = {
    retry: false,
    fallback: null as (() => Promise<any>) | null,
    userMessage: '',
    canRecover: false,
  };

  switch (error.code) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      strategies.retry = true;
      strategies.canRecover = true;
      strategies.userMessage = 'Connection issue detected. We\'ll retry automatically.';
      break;
    
    case 'RATE_LIMIT_EXCEEDED':
      strategies.retry = true;
      strategies.canRecover = true;
      strategies.userMessage = 'Too many requests. Waiting before retry...';
      break;
    
    case 'EXTERNAL_SERVICE_ERROR':
    case 'INVALID_API_KEY':
      strategies.canRecover = true;
      strategies.userMessage = 'Service temporarily unavailable. Trying alternative approach...';
      // Could implement fallback to cached data or alternative service
      break;
    
    default:
      strategies.userMessage = getErrorMessage(error);
  }

  return strategies;
};

// Utility function to get user-friendly error messages
const getErrorMessage = (error: APIError): string => {
  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests. Please wait a moment before trying again.';
    case 'INVALID_API_KEY':
      return 'Service temporarily unavailable. Please try again later.';
    case 'IMAGE_TOO_LARGE':
      return 'Image is too large. Please use an image under 5MB.';
    case 'INVALID_IMAGE_FORMAT':
      return 'Invalid image format. Please use JPG, PNG, or WebP.';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.';
    case 'TIMEOUT':
      return 'Request timed out. Please try again.';
    case 'VALIDATION_ERROR':
      return (error.details as any)?.message || 'Invalid input. Please check your data and try again.';
    case 'NOT_FOUND':
      return 'The requested resource was not found.';
    case 'UNAUTHORIZED':
      return 'You are not authorized to perform this action.';
    case 'FORBIDDEN':
      return 'Access denied. You do not have permission to perform this action.';
    case 'INTERNAL_SERVER_ERROR':
      return 'Internal server error. Please try again later.';
    default:
      return error.error || 'An unexpected error occurred. Please try again.';
  }
};

// Session management utilities
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('chromagen_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('chromagen_session_id', sessionId);
  }
  return sessionId;
};

const generateSessionId = (): string => {
  return 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
};

// Connection status hook
export const useConnectionStatus = () => {
  const { data: healthData, error, isLoading } = useHealthCheck();
  
  return {
    isOnline: !!healthData && !error,
    isLoading,
    lastCheck: healthData?.timestamp,
  };
};