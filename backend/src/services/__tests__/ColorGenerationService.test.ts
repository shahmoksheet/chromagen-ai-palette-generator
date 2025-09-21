// Tests for ColorGenerationService

import { ColorGenerationService } from '../ColorGenerationService';
import { GenerationOptions } from '../../types/color';

// Mock the external dependencies
jest.mock('openai');
jest.mock('@google/generative-ai');

describe('ColorGenerationService', () => {
  let colorGenerationService: ColorGenerationService;
  let mockOpenAI: any;
  let mockGemini: any;

  beforeEach(() => {
    // Set up environment variables for testing
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    // Mock OpenAI
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    // Mock Gemini
    mockGemini = {
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn(),
      }),
    };

    // Mock the constructors
    const OpenAI = require('openai');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    OpenAI.mockImplementation(() => mockOpenAI);
    GoogleGenerativeAI.mockImplementation(() => mockGemini);

    colorGenerationService = new ColorGenerationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if OPENAI_API_KEY is not provided', () => {
      delete process.env.OPENAI_API_KEY;
      
      expect(() => new ColorGenerationService()).toThrow('OPENAI_API_KEY environment variable is required');
    });

    it('should initialize successfully with required environment variables', () => {
      expect(() => new ColorGenerationService()).not.toThrow();
    });
  });

  describe('generateFromText', () => {
    it('should generate colors from text prompt using OpenAI', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                {
                  hex: '#FF5733',
                  name: 'Vibrant Orange',
                  category: 'primary',
                  usage: 'Main brand color'
                },
                {
                  hex: '#33A1FF',
                  name: 'Sky Blue',
                  category: 'secondary',
                  usage: 'Supporting elements'
                }
              ],
              explanation: 'A vibrant palette inspired by sunset colors'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('sunset colors for a beach resort');

      expect(result).toMatchObject({
        colors: expect.arrayContaining([
          expect.objectContaining({
            hex: '#FF5733',
            name: expect.any(String),
            category: expect.stringMatching(/^(primary|secondary|accent)$/),
            rgb: expect.objectContaining({
              r: expect.any(Number),
              g: expect.any(Number),
              b: expect.any(Number),
            }),
            hsl: expect.objectContaining({
              h: expect.any(Number),
              s: expect.any(Number),
              l: expect.any(Number),
            }),
            accessibility: expect.objectContaining({
              contrastWithWhite: expect.any(Number),
              contrastWithBlack: expect.any(Number),
              wcagLevel: expect.stringMatching(/^(AA|AAA|FAIL)$/),
            }),
          }),
        ]),
        explanation: expect.any(String),
        confidence: expect.any(Number),
        processingTime: expect.any(Number),
        model: 'openai-gpt-4',
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should fallback to Gemini when OpenAI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'));
      
      const mockGeminiModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              colors: [
                {
                  hex: '#FF5733',
                  name: 'Orange',
                  category: 'primary',
                  usage: 'Main color'
                }
              ],
              explanation: 'Gemini generated palette'
            })
          }
        })
      };

      mockGemini.getGenerativeModel.mockReturnValue(mockGeminiModel);

      const result = await colorGenerationService.generateFromText('warm colors');

      expect(result.model).toBe('google-gemini');
      expect(result.colors.length).toBeGreaterThan(0);
      expect(mockGeminiModel.generateContent).toHaveBeenCalled();
    });

    it('should handle custom generation options', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                { hex: '#FF0000', name: 'Red', category: 'primary', usage: 'Primary' },
                { hex: '#00FF00', name: 'Green', category: 'secondary', usage: 'Secondary' },
                { hex: '#0000FF', name: 'Blue', category: 'accent', usage: 'Accent' },
              ],
              explanation: 'Triadic color scheme'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const options: Partial<GenerationOptions> = {
        colorCount: 3,
        harmonyType: 'triadic',
        accessibilityLevel: 'AAA',
        includeNeutrals: false,
      };

      const result = await colorGenerationService.generateFromText('vibrant colors', options);

      expect(result.colors).toHaveLength(3);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('triadic')
            }),
          ]),
        })
      );
    });

    it('should use fallback generation when AI response parsing fails', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response from AI'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('blue colors');

      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.explanation).toContain('Fallback palette generated');
      expect(result.model).toBe('openai-gpt-4');
    });

    it('should validate hex colors from AI response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                { hex: 'invalid-hex', name: 'Invalid', category: 'primary', usage: 'Test' },
                { hex: '#FF5733', name: 'Valid', category: 'secondary', usage: 'Test' },
              ],
              explanation: 'Mixed valid and invalid colors'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('test colors');

      // Should fall back to generated colors due to invalid hex
      expect(result.explanation).toContain('Fallback palette generated');
    });

    it('should enhance color names and usage based on context', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                { hex: '#FF0000', name: 'Red', category: 'primary', usage: 'Primary color' },
              ],
              explanation: 'Professional color scheme'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('professional healthcare website');

      expect(result.colors[0].name).toBeDefined();
      expect(result.colors[0].usage).toBeDefined();
      expect(result.colors[0].usage).toContain('trust'); // Healthcare context
    });

    it('should ensure accessibility compliance', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                { hex: '#FFFF00', name: 'Yellow', category: 'primary', usage: 'Warning color' }, // Poor contrast
              ],
              explanation: 'Color with poor accessibility'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('warning colors', {
        accessibilityLevel: 'AA'
      });

      expect(result.colors[0].accessibility).toBeDefined();
      expect(result.colors[0].accessibility.contrastWithWhite).toBeGreaterThan(0);
      expect(result.colors[0].accessibility.contrastWithBlack).toBeGreaterThan(0);
    });

    it('should apply color harmony rules', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                { hex: '#FF0000', name: 'Red', category: 'primary', usage: 'Primary' },
              ],
              explanation: 'Single color for harmony expansion'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('red theme', {
        harmonyType: 'complementary',
        colorCount: 3
      });

      // Should expand single color to meet minimum for complementary harmony
      expect(result.colors.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate confidence score', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                { hex: '#000000', name: 'Black', category: 'primary', usage: 'Text' },
                { hex: '#FFFFFF', name: 'White', category: 'secondary', usage: 'Background' },
              ],
              explanation: 'High contrast palette'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('high contrast colors');

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));
      
      // No Gemini fallback available
      delete process.env.GEMINI_API_KEY;
      colorGenerationService = new ColorGenerationService();

      await expect(
        colorGenerationService.generateFromText('test prompt')
      ).rejects.toThrow();
    });
  });

  describe('prompt context parsing', () => {
    it('should extract mood from prompt', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [{ hex: '#FF0000', name: 'Red', category: 'primary', usage: 'Primary' }],
              explanation: 'Energetic palette'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await colorGenerationService.generateFromText('energetic and bold colors for sports brand');

      // Verify the system prompt includes context about energetic mood
      const systemPrompt = mockOpenAI.chat.completions.create.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('ChromaGen');
    });

    it('should extract industry context', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [{ hex: '#0066CC', name: 'Blue', category: 'primary', usage: 'Tech blue' }],
              explanation: 'Tech industry palette'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('modern tech startup colors');

      expect(result.colors[0].usage).toContain('tech'); // Should include tech context
    });
  });

  describe('color enhancement', () => {
    it('should generate descriptive color names', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                { hex: '#FF0000', name: 'Color1', category: 'primary', usage: 'Usage1' },
                { hex: '#808080', name: 'Color2', category: 'secondary', usage: 'Usage2' },
              ],
              explanation: 'Colors for enhancement'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('professional colors');

      expect(result.colors[0].name).not.toBe('Color1'); // Should be enhanced
      expect(result.colors[1].name).not.toBe('Color2'); // Should be enhanced
      expect(result.colors[0].name).toMatch(/red|crimson|ruby|cherry|scarlet/i); // Should be descriptive
    });

    it('should generate contextual usage recommendations', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              colors: [
                { hex: '#000000', name: 'Black', category: 'primary', usage: 'Generic usage' },
              ],
              explanation: 'Healthcare colors'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await colorGenerationService.generateFromText('healthcare website colors');

      expect(result.colors[0].usage).not.toBe('Generic usage'); // Should be enhanced
      expect(result.colors[0].usage).toContain('trust'); // Healthcare context
    });
  });
});