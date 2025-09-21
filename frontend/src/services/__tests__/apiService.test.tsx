import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useHealthCheck,
  useGenerateFromText,
  useGenerateFromImage,
  usePaletteHistory,
  useSavePalette,
  useDeletePalette,
  useExportPalette,
  getSessionId,
} from '../apiService';
import { colorAPI, paletteAPI } from '../../utils/api';
import { TextGenerationRequest, GenerationResponse, ColorPalette } from '../../types/api';

// Mock the entire api module
vi.mock('../../utils/api', () => ({
  colorAPI: {
    healthCheck: vi.fn(),
    generateFromText: vi.fn(),
    generateFromImage: vi.fn(),
  },
  paletteAPI: {
    getHistory: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    export: vi.fn(),
    getById: vi.fn(),
  },
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('API Service Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('useHealthCheck', () => {
    it('should fetch health status successfully', async () => {
      const mockResponse = { status: 'ok', timestamp: '2023-01-01T00:00:00Z' };
      vi.mocked(colorAPI.healthCheck).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHealthCheck(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(colorAPI.healthCheck).toHaveBeenCalled();
    });

    it('should handle health check errors', async () => {
      const mockError = new Error('Network error');
      vi.mocked(colorAPI.healthCheck).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useHealthCheck(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useGenerateFromText', () => {
    it('should generate palette from text successfully', async () => {
      const mockRequest: TextGenerationRequest = {
        prompt: 'ocean sunset',
        userId: 'user123',
      };

      const mockResponse: GenerationResponse = {
        id: 'palette123',
        name: 'Ocean Sunset',
        prompt: 'ocean sunset',
        colors: [],
        accessibilityScore: {
          overallScore: 'AA',
          contrastRatios: [],
          colorBlindnessCompatible: true,
          recommendations: [],
        },
        processingTime: 1500,
        explanation: 'Generated palette',
        model: 'gpt-4',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      vi.mocked(colorAPI.generateFromText).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useGenerateFromText(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(colorAPI.generateFromText).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle text generation errors', async () => {
      const mockRequest: TextGenerationRequest = {
        prompt: 'invalid prompt',
      };

      const mockError = {
        error: 'Invalid prompt',
        code: 'VALIDATION_ERROR',
      };

      vi.mocked(colorAPI.generateFromText).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useGenerateFromText(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useGenerateFromImage', () => {
    it('should generate palette from image successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse: GenerationResponse = {
        id: 'palette456',
        name: 'Image Palette',
        prompt: 'Generated from image',
        colors: [],
        accessibilityScore: {
          overallScore: 'AA',
          contrastRatios: [],
          colorBlindnessCompatible: true,
          recommendations: [],
        },
        processingTime: 2000,
        explanation: 'Generated from uploaded image',
        model: 'vision-model',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      vi.mocked(colorAPI.generateFromImage).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useGenerateFromImage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ file: mockFile, userId: 'user123' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(colorAPI.generateFromImage).toHaveBeenCalledWith(
        mockFile,
        'user123',
        undefined,
        undefined
      );
    });
  });

  describe('usePaletteHistory', () => {
    it('should fetch palette history successfully', async () => {
      const mockResponse = {
        palettes: [] as ColorPalette[],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => usePaletteHistory('user123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith('/palettes/history/user123', {
        params: { page: 1, limit: 20 },
      });
    });

    it('should not fetch when userId is empty', () => {
      const { result } = renderHook(() => usePaletteHistory(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('useSavePalette', () => {
    it('should save palette successfully', async () => {
      const mockPalette: Omit<ColorPalette, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Palette',
        prompt: 'test prompt',
        colors: [],
        accessibilityScore: {
          overallScore: 'AA',
          contrastRatios: [],
          colorBlindnessCompatible: true,
          recommendations: [],
        },
      };

      const mockResponse: ColorPalette = {
        ...mockPalette,
        id: 'palette789',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useSavePalette(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockPalette);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith('/palettes/save', mockPalette);
    });
  });

  describe('useDeletePalette', () => {
    it('should delete palette successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({});

      const { result } = renderHook(() => useDeletePalette(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('palette123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAxios.delete).toHaveBeenCalledWith('/palettes/palette123');
    });
  });

  describe('useExportPalette', () => {
    it('should export palette successfully', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/json' });
      mockedAxios.get.mockResolvedValueOnce({ data: mockBlob });

      // Mock URL.createObjectURL and related methods
      const mockUrl = 'blob:test-url';
      global.URL.createObjectURL = vi.fn(() => mockUrl);
      global.URL.revokeObjectURL = vi.fn();

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      document.createElement = vi.fn(() => mockLink as any);
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      const { result } = renderHook(() => useExportPalette(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ paletteId: 'palette123', format: 'json' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('/palettes/palette123/export/json', {
        responseType: 'blob',
      });
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.download).toBe('palette.json');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('getSessionId', () => {
    it('should return existing session ID from localStorage', () => {
      const existingSessionId = 'existing_session_123';
      localStorageMock.getItem.mockReturnValue(existingSessionId);

      const sessionId = getSessionId();

      expect(sessionId).toBe(existingSessionId);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('chromagen_session_id');
    });

    it('should generate new session ID when none exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const sessionId = getSessionId();

      expect(sessionId).toMatch(/^session_[a-z0-9]+_\d+$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('chromagen_session_id', sessionId);
    });
  });
});