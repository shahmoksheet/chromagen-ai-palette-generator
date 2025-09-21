import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios first
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Import after mocking
import { colorAPI, paletteAPI } from '../api';
import axios from 'axios';

// Get the mocked instance
const mockAxiosInstance = (axios.create as any)();

// Mock File for Node.js environment
global.File = class File {
  constructor(public chunks: any[], public name: string, public options: any = {}) {}
  get type() { return this.options.type || ''; }
  get size() { return this.chunks.reduce((acc, chunk) => acc + chunk.length, 0); }
} as any;

describe('API Integration - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('colorAPI', () => {
    it('should call axios instance for text generation', async () => {
      const mockResponse = { data: { id: 'test', colors: [] } };
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await colorAPI.generateFromText({ prompt: 'test' });

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/generate/text', { prompt: 'test' });
    });

    it('should call axios instance for image generation', async () => {
      const mockResponse = { data: { id: 'test', colors: [] } };
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await colorAPI.generateFromImage(mockFile);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/generate/image',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
    });

    it('should call axios instance for health check', async () => {
      const mockResponse = { data: { status: 'ok', timestamp: '2023-01-01' } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await colorAPI.healthCheck();

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });
  });

  describe('paletteAPI', () => {
    it('should call axios instance for palette history', async () => {
      const mockResponse = { data: { palettes: [], total: 0, page: 1, totalPages: 0 } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await paletteAPI.getHistory('user123');

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/palettes/history/user123', {
        params: { page: 1, limit: 20 },
      });
    });

    it('should call axios instance for saving palette', async () => {
      const mockPalette = { name: 'Test', prompt: 'test', colors: [], accessibilityScore: {} };
      const mockResponse = { data: { ...mockPalette, id: 'test123' } };
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await paletteAPI.save(mockPalette as any);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/palettes/save', mockPalette);
    });

    it('should call axios instance for deleting palette', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({});

      await paletteAPI.delete('palette123');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/palettes/palette123');
    });

    it('should call axios instance for exporting palette', async () => {
      const mockBlob = new Blob(['test']);
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await paletteAPI.export('palette123', 'json');

      expect(result).toEqual(mockBlob);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/palettes/palette123/export/json', {
        responseType: 'blob',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors properly', async () => {
      const mockError = {
        response: {
          data: { error: 'Test error', code: 'TEST_ERROR' },
        },
      };
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      await expect(colorAPI.generateFromText({ prompt: 'test' })).rejects.toEqual(mockError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValueOnce(networkError);

      await expect(colorAPI.healthCheck()).rejects.toThrow('Network Error');
    });
  });
});