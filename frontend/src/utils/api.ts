import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { TextGenerationRequest, GenerationResponse, APIError, GenerationOptions, ColorPalette } from '../types/api';

// Retry configuration
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return !error.response || 
           error.code === 'ECONNABORTED' || 
           (error.response.status >= 500 && error.response.status < 600);
  },
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
  timeout: 30000, // 30 seconds for AI generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add retry functionality
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const axiosRetry = async (
  config: AxiosRequestConfig,
  retryConfig: RetryConfig = defaultRetryConfig
): Promise<AxiosResponse> => {
  let lastError: AxiosError;
  
  for (let attempt = 0; attempt <= retryConfig.retries; attempt++) {
    try {
      return await axios(config);
    } catch (error) {
      lastError = error as AxiosError;
      
      if (attempt === retryConfig.retries || !retryConfig.retryCondition(lastError)) {
        throw lastError;
      }
      
      const delay = retryConfig.retryDelay * Math.pow(2, attempt); // Exponential backoff
      console.log(`API request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${retryConfig.retries})`);
      await sleep(delay);
    }
  }
  
  throw lastError!;
};

// Request interceptor for authentication and logging
api.interceptors.request.use(
  (config) => {
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    // Add session ID if available (for user tracking)
    const sessionId = localStorage.getItem('chromagen_session_id');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and performance monitoring
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const duration = Date.now() - (response.config.metadata?.startTime || 0);
    console.log(`API Response: ${response.status} ${response.config.url} (${duration}ms)`);
    
    // Store session ID if provided
    const sessionId = response.headers['x-session-id'];
    if (sessionId) {
      localStorage.setItem('chromagen_session_id', sessionId);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    console.error(`API Response Error: ${error.response?.status || 'Network Error'} ${error.config?.url} (${duration}ms)`, error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle authentication errors
      localStorage.removeItem('chromagen_session_id');
    }
    
    if (error.response?.status === 429) {
      // Handle rate limiting with exponential backoff
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        const delay = parseInt(retryAfter) * 1000;
        console.log(`Rate limited, retrying after ${delay}ms`);
        await sleep(delay);
        return axiosRetry(error.config!);
      }
    }
    
    // Transform error to consistent format
    const apiError: APIError = {
      error: (error.response?.data as any)?.error || error.message || 'An unexpected error occurred',
      code: (error.response?.data as any)?.code || error.code || 'UNKNOWN_ERROR',
      details: (error.response?.data as any)?.details,
    };
    
    return Promise.reject(apiError);
  }
);

// Color generation API functions
export const colorAPI = {
  /**
   * Generate color palette from text prompt
   */
  generateFromText: async (request: TextGenerationRequest): Promise<GenerationResponse> => {
    try {
      const response = await api.post<GenerationResponse>('/generate/text', request);
      return response.data;
    } catch (error) {
      console.error('Text generation failed:', error);
      throw error;
    }
  },

  /**
   * Generate color palette from uploaded image
   */
  generateFromImage: async (
    file: File, 
    userId?: string, 
    options?: GenerationOptions,
    onProgress?: (progress: number) => void
  ): Promise<GenerationResponse> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (userId) {
        formData.append('userId', userId);
      }
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      const response = await api.post<GenerationResponse>('/generate/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
            onProgress?.(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  },

  /**
   * Get health check
   */
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  /**
   * Test API connection
   */
  testConnection: async (): Promise<{ message: string; status: string }> => {
    try {
      const response = await api.get('/test');
      return response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  },
};

// Palette management API functions
export const paletteAPI = {
  /**
   * Get palette history for a user
   */
  getHistory: async (userId: string, page = 1, limit = 20): Promise<{
    palettes: ColorPalette[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    try {
      const response = await api.get(`/palettes/history/${userId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch palette history:', error);
      throw error;
    }
  },

  /**
   * Save a color palette
   */
  save: async (palette: Omit<ColorPalette, 'id' | 'createdAt' | 'updatedAt'>): Promise<ColorPalette> => {
    try {
      const response = await api.post<ColorPalette>('/palettes/save', palette);
      return response.data;
    } catch (error) {
      console.error('Failed to save palette:', error);
      throw error;
    }
  },

  /**
   * Delete a color palette
   */
  delete: async (paletteId: string): Promise<void> => {
    try {
      await api.delete(`/palettes/${paletteId}`);
    } catch (error) {
      console.error('Failed to delete palette:', error);
      throw error;
    }
  },

  /**
   * Export a palette in specified format
   */
  export: async (paletteId: string, format: string): Promise<Blob> => {
    try {
      const response = await api.get(`/palettes/${paletteId}/export/${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export palette:', error);
      throw error;
    }
  },

  /**
   * Get a specific palette by ID
   */
  getById: async (paletteId: string): Promise<ColorPalette> => {
    try {
      const response = await api.get<ColorPalette>(`/palettes/${paletteId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch palette:', error);
      throw error;
    }
  },
};

export default api;