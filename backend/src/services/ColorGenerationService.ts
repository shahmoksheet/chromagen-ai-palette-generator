// AI-powered color generation service

import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  ColorData, 
  GenerationOptions, 
  AIGenerationResult, 
  GenerationContext,
  ColorHarmonyRule 
} from '../types/color';
import { AccessibilityService } from './AccessibilityService';
import { ColorNamingService } from './ColorNamingService';
import { 
  generateColorHarmony, 
  hexToRgb, 
  rgbToHsl, 
  rgbToHex,
  hslToRgb,
  isValidHexColor 
} from '../utils/colorConversion';
import { logger } from '../utils/logger';
import { ExternalServiceError } from '../types/api';

export class ColorGenerationService {
  private gemini: GoogleGenerativeAI;
  private accessibilityService: AccessibilityService;
  private colorNamingService: ColorNamingService;

  // Color harmony rules for different types
  private harmonyRules: Record<string, ColorHarmonyRule> = {
    complementary: {
      type: 'complementary',
      angles: [180],
      description: 'Colors opposite on the color wheel, creating high contrast and vibrant look',
      minColors: 2,
      maxColors: 4,
    },
    triadic: {
      type: 'triadic',
      angles: [120, 240],
      description: 'Three colors evenly spaced on the color wheel, offering vibrant yet balanced palettes',
      minColors: 3,
      maxColors: 6,
    },
    analogous: {
      type: 'analogous',
      angles: [30, -30],
      description: 'Colors next to each other on the color wheel, creating harmonious and pleasing combinations',
      minColors: 3,
      maxColors: 5,
    },
    monochromatic: {
      type: 'monochromatic',
      angles: [],
      description: 'Different shades, tints, and tones of a single color, creating elegant and cohesive palettes',
      minColors: 3,
      maxColors: 7,
    },
    tetradic: {
      type: 'tetradic',
      angles: [90, 180, 270],
      description: 'Four colors forming a rectangle on the color wheel, offering rich and diverse palettes',
      minColors: 4,
      maxColors: 6,
    },
  };

  constructor() {
    // Initialize Gemini as primary service
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      logger.info('Gemini API initialized successfully');
    } else {
      logger.error('Gemini API key not found');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.accessibilityService = new AccessibilityService();
    this.colorNamingService = new ColorNamingService();
  }

  /**
   * Generate color palette from text prompt
   */
  public async generateFromText(
    prompt: string, 
    options: Partial<GenerationOptions> = {}
  ): Promise<AIGenerationResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting text-based color generation', { prompt, options });

      // Set default options
      const generationOptions: GenerationOptions = {
        colorCount: options.colorCount || 5,
        harmonyType: options.harmonyType || 'complementary',
        accessibilityLevel: options.accessibilityLevel || 'AA',
        includeNeutrals: options.includeNeutrals ?? true,
      };

      // Parse the prompt to extract context
      const context = this.parsePromptContext(prompt);
      
      // Generate colors using AI
      let colors: ColorData[];
      let explanation: string;
      let model: string;

      // Check if we're using a test/demo API key
      if (process.env.GEMINI_API_KEY === 'AIzaSyACwUsGFi8xeDh9pX-qlyxkX2urJQmkC6Y' || 
          process.env.NODE_ENV === 'development') {
        logger.info('Using mock color generation for development');
        const mockResult = this.generateMockColors(prompt, generationOptions);
        colors = mockResult.colors;
        explanation = mockResult.explanation;
        model = 'mock-gemini-dev';
      } else {
        // Use Gemini API
        logger.info('Using Gemini API for color generation');
        const aiResult = await this.generateWithGemini(prompt, generationOptions, context);
        colors = aiResult.colors;
        explanation = aiResult.explanation;
        model = 'google-gemini-1.5-flash';
      }

      // Apply color harmony rules
      colors = this.applyColorHarmony(colors, generationOptions.harmonyType);

      // Ensure accessibility compliance
      colors = await this.ensureAccessibilityCompliance(colors, generationOptions.accessibilityLevel);

      // Add color names and usage recommendations
      colors = this.enhanceColorData(colors, context);

      const processingTime = Date.now() - startTime;

      logger.info('Text-based color generation completed', {
        prompt,
        colorCount: colors.length,
        harmonyType: generationOptions.harmonyType,
        processingTime: `${processingTime}ms`,
        model,
      });

      return {
        colors,
        explanation,
        confidence: this.calculateConfidence(colors, context),
        processingTime,
        model,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Text-based color generation failed', {
        prompt,
        error: errorMessage,
        processingTime: `${processingTime}ms`,
      });
      throw error;
    }
  }



  /**
   * Generate mock colors for development/testing
   */
  private generateMockColors(
    prompt: string, 
    options: GenerationOptions
  ): { colors: ColorData[]; explanation: string } {
    logger.info('Generating mock colors for development');

    // Mock color palettes based on common themes
    const mockPalettes: Record<string, { colors: string[]; explanation: string }> = {
      ocean: {
        colors: ['#0077BE', '#00A8CC', '#40E0D0', '#87CEEB', '#F0F8FF'],
        explanation: 'A calming ocean-inspired palette with various shades of blue and turquoise, perfect for creating a serene and trustworthy atmosphere.'
      },
      sunset: {
        colors: ['#FF6B35', '#F7931E', '#FFD23F', '#EE4B2B', '#C41E3A'],
        explanation: 'A warm sunset palette featuring vibrant oranges, yellows, and reds that evoke energy and warmth.'
      },
      forest: {
        colors: ['#228B22', '#32CD32', '#90EE90', '#006400', '#8FBC8F'],
        explanation: 'A natural forest palette with various greens that represent growth, harmony, and environmental consciousness.'
      },
      modern: {
        colors: ['#2D3748', '#4A5568', '#718096', '#A0AEC0', '#E2E8F0'],
        explanation: 'A modern, minimalist palette with sophisticated grays perfect for contemporary design and professional applications.'
      },
      vibrant: {
        colors: ['#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE'],
        explanation: 'A vibrant, energetic palette with bold colors that create visual impact and excitement.'
      }
    };

    // Determine which palette to use based on prompt keywords
    const promptLower = prompt.toLowerCase();
    let selectedPalette = mockPalettes.modern; // default

    if (promptLower.includes('ocean') || promptLower.includes('water') || promptLower.includes('blue')) {
      selectedPalette = mockPalettes.ocean;
    } else if (promptLower.includes('sunset') || promptLower.includes('warm') || promptLower.includes('orange')) {
      selectedPalette = mockPalettes.sunset;
    } else if (promptLower.includes('forest') || promptLower.includes('nature') || promptLower.includes('green')) {
      selectedPalette = mockPalettes.forest;
    } else if (promptLower.includes('vibrant') || promptLower.includes('bright') || promptLower.includes('bold')) {
      selectedPalette = mockPalettes.vibrant;
    }

    // Convert to ColorData format
    const colors: ColorData[] = selectedPalette.colors.slice(0, options.colorCount).map((hex, index) => {
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb);

      const categories: ('primary' | 'secondary' | 'accent' | 'neutral')[] = ['primary', 'secondary', 'accent', 'neutral'];
      const category = categories[index % categories.length];

      return {
        hex: hex.toUpperCase(),
        rgb,
        hsl,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} Color`,
        category,
        usage: `Perfect for ${category} elements in your design`,
        accessibility: {
          contrastWithWhite: 0, // Will be calculated later
          contrastWithBlack: 0,  // Will be calculated later
          wcagLevel: 'FAIL',     // Will be calculated later
        },
      };
    });

    return {
      colors,
      explanation: selectedPalette.explanation
    };
  }

  /**
   * Generate colors using Gemini API
   */
  private async generateWithGemini(
    prompt: string,
    options: GenerationOptions,
    context: GenerationContext
  ): Promise<{ colors: ColorData[]; explanation: string }> {
    try {
      const model = this.gemini.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });
      
      const geminiPrompt = `Generate a ${options.colorCount}-color palette for: "${prompt}"

Requirements:
- Use ${options.harmonyType} color harmony
- Meet WCAG ${options.accessibilityLevel} accessibility standards
- Include primary, secondary, and accent colors
- Consider mood: ${context.mood}, industry: ${context.industry}

Respond with ONLY this exact JSON format (no markdown, no extra text):
{
  "colors": [
    {
      "hex": "#FF5733",
      "name": "Vibrant Orange", 
      "category": "primary",
      "usage": "Main brand color for headers and buttons"
    }
  ],
  "explanation": "Brief explanation of color choices and harmony"
}`;

      logger.info('Sending request to Gemini API');
      
      const result = await model.generateContent(geminiPrompt);
      const response = result.response;
      
      if (!response) {
        throw new Error('No response from Gemini API');
      }
      
      const text = response.text();
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      logger.info('Received response from Gemini API');
      
      // Clean the response text to extract JSON
      let cleanedText = text.trim();
      
      // Remove markdown code blocks if present
      if (cleanedText.includes('```json')) {
        const jsonStart = cleanedText.indexOf('```json') + 7;
        const jsonEnd = cleanedText.indexOf('```', jsonStart);
        cleanedText = cleanedText.substring(jsonStart, jsonEnd).trim();
      } else if (cleanedText.includes('```')) {
        const jsonStart = cleanedText.indexOf('```') + 3;
        const jsonEnd = cleanedText.indexOf('```', jsonStart);
        cleanedText = cleanedText.substring(jsonStart, jsonEnd).trim();
      }
      
      // Try to find JSON in the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      try {
        const parsed = JSON.parse(cleanedText);
        
        if (!parsed.colors || !Array.isArray(parsed.colors)) {
          throw new Error('Invalid colors array in response');
        }

        const colors: ColorData[] = parsed.colors.map((color: any, index: number) => {
          if (!color.hex || !color.hex.match(/^#[0-9A-Fa-f]{6}$/)) {
            throw new Error(`Invalid hex color: ${color.hex}`);
          }

          const rgb = this.hexToRgb(color.hex);
          const hsl = this.rgbToHsl(rgb);

          return {
            hex: color.hex.toUpperCase(),
            rgb,
            hsl,
            name: color.name || `Color ${index + 1}`,
            category: color.category || 'accent',
            usage: color.usage || 'General use',
            accessibility: {
              contrastWithWhite: 0, // Will be calculated later
              contrastWithBlack: 0,  // Will be calculated later
              wcagLevel: 'FAIL',     // Will be calculated later
            },
          };
        });

        return {
          colors,
          explanation: parsed.explanation || 'AI-generated color palette using Gemini',
        };

      } catch (parseError) {
        logger.error('Failed to parse Gemini response', { 
          response: cleanedText.substring(0, 500),
          error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        });
        throw new Error('Failed to parse AI response');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Gemini API error', { error: errorMessage });
      
      // Return fallback colors
      logger.warn('Using fallback color generation');
      return this.generateFallbackColors(prompt);
    }
  }

  // Helper methods for color conversion
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  }

  private rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }



  /**
   * Build system prompt for Gemini
   */
  private buildGeminiSystemPrompt(options: GenerationOptions, context: GenerationContext): string {
    return `You are ChromaGen, an expert color palette generator. Generate a ${options.colorCount}-color palette using ${options.harmonyType} color harmony that meets WCAG ${options.accessibilityLevel} accessibility standards.

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{
  "colors": [
    {
      "hex": "#FF5733",
      "name": "Vibrant Orange",
      "category": "primary",
      "usage": "Main brand color, headers, call-to-action buttons"
    }
  ],
  "explanation": "Detailed explanation of color choices and harmony principles used"
}

Requirements:
- Generate exactly ${options.colorCount} colors
- Use ${options.harmonyType} color harmony principles
- Include primary (1-2), secondary (1-2), and accent (1-3) colors
- All hex codes must be valid 6-digit format (#RRGGBB)
- Meet WCAG ${options.accessibilityLevel} contrast requirements
- Provide meaningful color names and usage recommendations
- Consider the mood: ${context.mood}, industry: ${context.industry}

Respond with ONLY the JSON object, no additional text.`;
  }

  /**
   * Parse AI response to extract colors and explanation
   */
  private parseAIResponse(response: string): { colors: ColorData[]; explanation: string } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.colors || !Array.isArray(parsed.colors)) {
        throw new Error('Invalid colors array in AI response');
      }

      const colors: ColorData[] = parsed.colors.map((color: any, index: number) => {
        if (!color.hex || !isValidHexColor(color.hex)) {
          throw new Error(`Invalid hex color: ${color.hex}`);
        }

        const rgb = hexToRgb(color.hex);
        const hsl = rgbToHsl(rgb);

        return {
          hex: color.hex.toUpperCase(),
          rgb,
          hsl,
          name: color.name || `Color ${index + 1}`,
          category: color.category || 'accent',
          usage: color.usage || 'General use',
          accessibility: {
            contrastWithWhite: 0, // Will be calculated later
            contrastWithBlack: 0,  // Will be calculated later
            wcagLevel: 'FAIL',     // Will be calculated later
          },
        };
      });

      return {
        colors,
        explanation: parsed.explanation || 'AI-generated color palette',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to parse AI response', { response, error: errorMessage });
      
      // Fallback: generate colors using color theory
      return this.generateFallbackColors(response);
    }
  }

  /**
   * Generate fallback colors when AI parsing fails
   */
  private generateFallbackColors(prompt: string): { colors: ColorData[]; explanation: string } {
    logger.info('Using fallback color generation');

    // Extract color keywords from prompt
    const colorKeywords = this.extractColorKeywords(prompt);
    const baseColor = colorKeywords.length > 0 ? colorKeywords[0] : '#3B82F6'; // Default blue

    // Generate harmony-based colors
    const harmonyType: 'complementary' = 'complementary';
    const harmonyColors = generateColorHarmony(baseColor, harmonyType);
    
    const colors: ColorData[] = harmonyColors.slice(0, 5).map((hex, index) => {
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb);

      return {
        hex: hex.toUpperCase(),
        rgb,
        hsl,
        name: `Generated Color ${index + 1}`,
        category: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'accent',
        usage: 'Fallback generated color',
        accessibility: {
          contrastWithWhite: 0,
          contrastWithBlack: 0,
          wcagLevel: 'FAIL',
        },
      };
    });

    return {
      colors,
      explanation: 'Fallback palette generated using color theory principles when AI parsing failed.',
    };
  }

  /**
   * Parse prompt to extract context information
   */
  private parsePromptContext(prompt: string): GenerationContext {
    const lowerPrompt = prompt.toLowerCase();
    
    // Extract mood keywords
    const moodKeywords = ['calm', 'energetic', 'professional', 'playful', 'elegant', 'bold', 'warm', 'cool'];
    const mood = moodKeywords.find(keyword => lowerPrompt.includes(keyword)) || 'neutral';

    // Extract industry keywords
    const industryKeywords = ['tech', 'healthcare', 'finance', 'education', 'retail', 'food', 'travel'];
    const industry = industryKeywords.find(keyword => lowerPrompt.includes(keyword)) || 'general';

    // Extract target audience
    const audienceKeywords = ['children', 'teens', 'adults', 'seniors', 'professionals'];
    const targetAudience = audienceKeywords.find(keyword => lowerPrompt.includes(keyword)) || 'general';

    // Extract brand personality
    const personalityKeywords = ['modern', 'traditional', 'innovative', 'trustworthy', 'creative', 'reliable'];
    const brandPersonality = personalityKeywords.filter(keyword => lowerPrompt.includes(keyword));

    return {
      prompt,
      mood,
      industry,
      targetAudience,
      brandPersonality,
    };
  }

  /**
   * Apply color harmony rules to the generated colors
   */
  private applyColorHarmony(colors: ColorData[], harmonyType: string): ColorData[] {
    if (colors.length === 0) return colors;

    const rule = this.harmonyRules[harmonyType];
    if (!rule) return colors;

    // If we have too many colors, trim to the rule's max
    if (colors.length > rule.maxColors) {
      colors = colors.slice(0, rule.maxColors);
    }

    // If we have too few colors, generate additional ones based on the first color
    if (colors.length < rule.minColors) {
      const baseColor = colors[0].hex;
      const harmonyColors = generateColorHarmony(baseColor, harmonyType as 'complementary' | 'triadic' | 'analogous' | 'monochromatic' | 'tetradic');
      
      // Add missing colors
      const needed = rule.minColors - colors.length;
      for (let i = 0; i < needed && i < harmonyColors.length - 1; i++) {
        const hex = harmonyColors[i + 1];
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb);

        colors.push({
          hex: hex.toUpperCase(),
          rgb,
          hsl,
          name: `Harmony Color ${colors.length + 1}`,
          category: 'accent',
          usage: 'Generated for color harmony',
          accessibility: {
            contrastWithWhite: 0,
            contrastWithBlack: 0,
            wcagLevel: 'FAIL',
          },
        });
      }
    }

    return colors;
  }

  /**
   * Ensure colors meet accessibility compliance
   */
  private async ensureAccessibilityCompliance(
    colors: ColorData[], 
    level: 'AA' | 'AAA'
  ): Promise<ColorData[]> {
    // Calculate accessibility metrics for each color
    colors.forEach(color => {
      const analysis = this.accessibilityService.analyzeColorAccessibility(color);
      color.accessibility = {
        contrastWithWhite: analysis.contrastWithWhite,
        contrastWithBlack: analysis.contrastWithBlack,
        wcagLevel: analysis.wcagLevelWhite === 'FAIL' && analysis.wcagLevelBlack === 'FAIL' 
          ? 'FAIL' 
          : analysis.wcagLevelWhite === 'AAA' || analysis.wcagLevelBlack === 'AAA' 
            ? 'AAA' 
            : 'AA',
      };
    });

    // If any colors fail accessibility, try to adjust them
    const adjustedColors = colors.map(color => {
      if (color.accessibility.wcagLevel === 'FAIL') {
        const suggestions = this.accessibilityService.suggestColorAdjustments(color, level);
        
        if (suggestions.adjustmentNeeded) {
          // Use the darker version if it has better contrast
          const darkerRgb = hexToRgb(suggestions.darkerVersion);
          const darkerHsl = rgbToHsl(darkerRgb);
          
          return {
            ...color,
            hex: suggestions.darkerVersion,
            rgb: darkerRgb,
            hsl: darkerHsl,
            name: `${color.name} (Adjusted)`,
            usage: `${color.usage} (accessibility improved)`,
          };
        }
      }
      
      return color;
    });

    // Recalculate accessibility after adjustments
    adjustedColors.forEach(color => {
      const analysis = this.accessibilityService.analyzeColorAccessibility(color);
      color.accessibility = {
        contrastWithWhite: analysis.contrastWithWhite,
        contrastWithBlack: analysis.contrastWithBlack,
        wcagLevel: analysis.wcagLevelWhite === 'FAIL' && analysis.wcagLevelBlack === 'FAIL' 
          ? 'FAIL' 
          : analysis.wcagLevelWhite === 'AAA' || analysis.wcagLevelBlack === 'AAA' 
            ? 'AAA' 
            : 'AA',
      };
    });

    return adjustedColors;
  }

  /**
   * Enhance color data with better names and usage recommendations
   */
  private enhanceColorData(colors: ColorData[], context: GenerationContext): ColorData[] {
    return colors.map((color, index) => {
      // Generate better color names based on hue and context
      const enhancedName = this.generateColorName(color, context);
      
      // Generate usage recommendations based on category and context
      const enhancedUsage = this.generateUsageRecommendation(color, context, index);

      return {
        ...color,
        name: enhancedName,
        usage: enhancedUsage,
      };
    });
  }

  /**
   * Generate descriptive color names using ColorNamingService
   */
  private generateColorName(color: ColorData, context: GenerationContext): string {
    return this.colorNamingService.generateColorName(color, context);
  }

  /**
   * Generate usage recommendations using ColorNamingService
   */
  private generateUsageRecommendation(
    color: ColorData, 
    context: GenerationContext, 
    index: number
  ): string {
    return this.colorNamingService.generateUsageRecommendation(color, context, index);
  }

  /**
   * Extract color keywords from prompt
   */
  private extractColorKeywords(prompt: string): string[] {
    const colorMap: Record<string, string> = {
      red: '#FF0000', blue: '#0000FF', green: '#00FF00', yellow: '#FFFF00',
      orange: '#FFA500', purple: '#800080', pink: '#FFC0CB', brown: '#A52A2A',
      black: '#000000', white: '#FFFFFF', gray: '#808080', grey: '#808080',
    };

    const lowerPrompt = prompt.toLowerCase();
    return Object.keys(colorMap).filter(color => lowerPrompt.includes(color))
      .map(color => colorMap[color]);
  }

  /**
   * Generate color palette from dominant colors (for image processing)
   */
  public async generateFromDominantColors(
    dominantColors: string[],
    options: Partial<GenerationOptions> = {}
  ): Promise<AIGenerationResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting dominant color-based generation', {
        dominantColorCount: dominantColors.length,
        options,
      });

      const generationOptions: GenerationOptions = {
        colorCount: options.colorCount || 5,
        harmonyType: options.harmonyType || 'complementary',
        accessibilityLevel: options.accessibilityLevel || 'AA',
        includeNeutrals: options.includeNeutrals ?? true,
      };
      
      // Use dominant colors as base and generate complementary colors
      const baseColors = dominantColors.slice(0, Math.min(3, dominantColors.length));
      const expandedColors = this.expandFromDominantColors(baseColors, generationOptions);
      
      // Convert to ColorData format
      const colorData = await this.convertToColorData(expandedColors, {
        prompt: 'Generated from image colors',
        mood: 'neutral',
        industry: 'general',
        targetAudience: 'general',
        brandPersonality: [],
        dominantColors: baseColors.map(hex => ({
          hex,
          rgb: hexToRgb(hex),
          hsl: rgbToHsl(hexToRgb(hex)),
          name: 'Extracted Color',
          category: 'primary' as const,
          usage: 'Extracted from image',
          accessibility: {
            contrastWithWhite: 0,
            contrastWithBlack: 0,
            wcagLevel: 'FAIL' as const,
          },
        })),
      });
      
      const explanation = `Generated palette based on ${dominantColors.length} dominant colors extracted from your image. The palette uses ${generationOptions.harmonyType} color harmony to create a cohesive and visually appealing combination.`;
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Dominant color-based generation completed', {
        originalColorCount: dominantColors.length,
        finalColorCount: colorData.length,
        processingTime: `${processingTime}ms`,
      });

      return {
        colors: colorData,
        explanation,
        confidence: 0.85, // High confidence for image-based generation
        processingTime,
        model: 'dominant-color-expansion',
      };
    } catch (error) {
      logger.error('Error in dominant color-based generation:', error);
      throw new Error('Failed to generate palette from dominant colors');
    }
  }

  /**
   * Expand palette from dominant colors
   */
  private expandFromDominantColors(
    dominantColors: string[],
    options: GenerationOptions
  ): string[] {
    const expandedColors = [...dominantColors];
    
    // Generate complementary and harmony colors
    for (const color of dominantColors) {
      const harmonyColors = generateColorHarmony(color, options.harmonyType);
      
      for (const harmonyColor of harmonyColors) {
        if (!expandedColors.includes(harmonyColor)) {
          expandedColors.push(harmonyColor);
        }
      }
    }
    
    // Add neutral colors if requested
    if (options.includeNeutrals) {
      const neutrals = ['#FFFFFF', '#F5F5F5', '#CCCCCC', '#666666', '#333333', '#000000'];
      for (const neutral of neutrals) {
        if (!expandedColors.includes(neutral) && expandedColors.length < options.colorCount) {
          expandedColors.push(neutral);
        }
      }
    }
    
    return this.adjustColorCount(expandedColors, options.colorCount);
  }

  /**
   * Adjust color count to match requirements
   */
  private adjustColorCount(colors: string[], targetCount: number): string[] {
    if (colors.length === targetCount) {
      return colors;
    }
    
    if (colors.length > targetCount) {
      // Remove colors, keeping the most diverse ones
      return this.selectDiverseColors(colors, targetCount);
    }
    
    // Add more colors by generating variations
    const additionalColors = [];
    const baseColor = colors[0];
    
    for (let i = colors.length; i < targetCount; i++) {
      const variation = this.generateColorVariation(baseColor, i);
      additionalColors.push(variation);
    }
    
    return [...colors, ...additionalColors];
  }

  /**
   * Select diverse colors from a larger set
   */
  private selectDiverseColors(colors: string[], count: number): string[] {
    if (colors.length <= count) {
      return colors;
    }
    
    const selected = [colors[0]]; // Always keep the first color
    const remaining = colors.slice(1);
    
    // Select colors that are most different from already selected ones
    while (selected.length < count && remaining.length > 0) {
      let maxDistance = 0;
      let bestColorIndex = 0;
      
      for (let i = 0; i < remaining.length; i++) {
        const color = remaining[i];
        const minDistanceToSelected = Math.min(
          ...selected.map(selectedColor => this.calculateColorDistance(color, selectedColor))
        );
        
        if (minDistanceToSelected > maxDistance) {
          maxDistance = minDistanceToSelected;
          bestColorIndex = i;
        }
      }
      
      selected.push(remaining[bestColorIndex]);
      remaining.splice(bestColorIndex, 1);
    }
    
    return selected;
  }

  /**
   * Calculate color distance for diversity selection
   */
  private calculateColorDistance(hex1: string, hex2: string): number {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  /**
   * Generate color variation
   */
  private generateColorVariation(baseColor: string, variation: number): string {
    const rgb = hexToRgb(baseColor);
    const hsl = rgbToHsl(rgb);
    
    // Create variations by adjusting lightness and saturation
    const lightnessDelta = (variation % 3 - 1) * 20; // -20, 0, +20
    const saturationDelta = (Math.floor(variation / 3) % 3 - 1) * 15; // -15, 0, +15
    
    const newHsl = {
      h: hsl.h,
      s: Math.max(0, Math.min(100, hsl.s + saturationDelta)),
      l: Math.max(10, Math.min(90, hsl.l + lightnessDelta)),
    };
    
    const newRgb = hslToRgb(newHsl);
    return rgbToHex(newRgb);
  }

  /**
   * Convert hex colors to ColorData format
   */
  private async convertToColorData(
    hexColors: string[],
    context: GenerationContext
  ): Promise<ColorData[]> {
    const colorData: ColorData[] = [];
    
    for (let i = 0; i < hexColors.length; i++) {
      const hex = hexColors[i];
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb);
      
      // Determine color category
      const category = this.determineColorCategory(i, hexColors.length);
      
      // Generate color name and usage
      const name = this.generateColorName({ hex, rgb, hsl } as ColorData, context);
      const usage = this.generateColorUsage(category, context);
      
      // Calculate accessibility info
      const accessibility = this.accessibilityService.analyzeColorAccessibility({
        hex,
        rgb,
        hsl,
        name,
        category,
        usage,
        accessibility: {
          contrastWithWhite: 0,
          contrastWithBlack: 0,
          wcagLevel: 'FAIL',
        },
      });
      
      colorData.push({
        hex,
        rgb,
        hsl,
        name,
        category,
        usage,
        accessibility: {
          contrastWithWhite: accessibility.contrastWithWhite,
          contrastWithBlack: accessibility.contrastWithBlack,
          wcagLevel: accessibility.wcagLevelWhite !== 'FAIL' ? accessibility.wcagLevelWhite : accessibility.wcagLevelBlack,
        },
      });
    }
    
    return colorData;
  }

  /**
   * Determine color category based on position
   */
  private determineColorCategory(
    index: number,
    totalColors: number
  ): 'primary' | 'secondary' | 'accent' {
    if (index === 0) return 'primary';
    if (index < Math.ceil(totalColors / 2)) return 'secondary';
    return 'accent';
  }

  /**
   * Generate color usage recommendation
   */
  private generateColorUsage(
    category: 'primary' | 'secondary' | 'accent',
    context: GenerationContext
  ): string {
    switch (category) {
      case 'primary':
        return 'Main brand color, headers, primary buttons, key elements';
      case 'secondary':
        return 'Supporting elements, secondary buttons, section backgrounds';
      case 'accent':
        return 'Highlights, call-to-action elements, decorative accents, links';
      default:
        return 'General purpose color for various design elements';
    }
  }

  /**
   * Calculate confidence score for generated colors
   */
  private calculateConfidence(colors: ColorData[], context: GenerationContext): number {
    let confidence = 0.8; // Base confidence

    // Increase confidence if colors meet accessibility standards
    const accessibleColors = colors.filter(color => color.accessibility.wcagLevel !== 'FAIL');
    confidence += (accessibleColors.length / colors.length) * 0.15;

    // Increase confidence if we have good color distribution
    const categories = new Set(colors.map(color => color.category));
    if (categories.size >= 2) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate mock response for testing
   */
  private generateMockResponse(
    prompt: string,
    options: GenerationOptions
  ): { colors: ColorData[]; explanation: string } {
    const mockColors: ColorData[] = [
      {
        hex: '#2563EB',
        rgb: { r: 37, g: 99, b: 235 },
        hsl: { h: 219, s: 83, l: 53 },
        name: 'Royal Blue',
        category: 'primary',
        usage: 'Primary brand color, headers, call-to-action buttons',
        accessibility: {
          contrastWithWhite: 5.74,
          contrastWithBlack: 3.66,
          wcagLevel: 'AA',
        },
      },
      {
        hex: '#10B981',
        rgb: { r: 16, g: 185, b: 129 },
        hsl: { h: 160, s: 84, l: 39 },
        name: 'Emerald Green',
        category: 'secondary',
        usage: 'Success states, positive feedback, accent elements',
        accessibility: {
          contrastWithWhite: 3.36,
          contrastWithBlack: 6.25,
          wcagLevel: 'AA',
        },
      },
      {
        hex: '#F59E0B',
        rgb: { r: 245, g: 158, b: 11 },
        hsl: { h: 38, s: 92, l: 50 },
        name: 'Amber',
        category: 'accent',
        usage: 'Warning states, highlights, interactive elements',
        accessibility: {
          contrastWithWhite: 2.37,
          contrastWithBlack: 8.85,
          wcagLevel: 'AA',
        },
      },
      {
        hex: '#6B7280',
        rgb: { r: 107, g: 114, b: 128 },
        hsl: { h: 220, s: 9, l: 46 },
        name: 'Cool Gray',
        category: 'neutral',
        usage: 'Body text, secondary information, borders',
        accessibility: {
          contrastWithWhite: 4.54,
          contrastWithBlack: 4.62,
          wcagLevel: 'AA',
        },
      },
      {
        hex: '#F3F4F6',
        rgb: { r: 243, g: 244, b: 246 },
        hsl: { h: 220, s: 14, l: 96 },
        name: 'Light Gray',
        category: 'neutral',
        usage: 'Background, subtle borders, disabled states',
        accessibility: {
          contrastWithWhite: 1.03,
          contrastWithBlack: 20.35,
          wcagLevel: 'AAA',
        },
      },
    ];

    const explanation = `Mock palette generated for testing purposes based on the prompt: "${prompt}". This palette uses ${options.harmonyType} color harmony and meets ${options.accessibilityLevel} accessibility standards.`;

    return {
      colors: mockColors.slice(0, options.colorCount),
      explanation,
    };
  }
}