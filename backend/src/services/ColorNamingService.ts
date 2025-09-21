// Color naming and enhancement service

import { ColorData, GenerationContext } from '../types/color';
import { hexToRgb, rgbToHsl } from '../utils/colorConversion';

export class ColorNamingService {
  // Comprehensive color name database
  private colorNames: Record<string, { hue: number[]; saturation: number[]; lightness: number[]; names: string[] }> = {
    // Reds
    red: { hue: [350, 10], saturation: [50, 100], lightness: [30, 70], names: ['Crimson', 'Ruby', 'Cherry', 'Scarlet', 'Burgundy'] },
    pink: { hue: [330, 350], saturation: [30, 80], lightness: [60, 90], names: ['Rose', 'Blush', 'Coral', 'Salmon', 'Magenta'] },
    
    // Oranges
    orange: { hue: [10, 40], saturation: [50, 100], lightness: [40, 80], names: ['Tangerine', 'Peach', 'Apricot', 'Amber', 'Copper'] },
    
    // Yellows
    yellow: { hue: [40, 70], saturation: [50, 100], lightness: [50, 90], names: ['Gold', 'Lemon', 'Canary', 'Honey', 'Mustard'] },
    
    // Greens
    green: { hue: [70, 150], saturation: [30, 100], lightness: [20, 80], names: ['Emerald', 'Forest', 'Mint', 'Sage', 'Olive'] },
    
    // Cyans
    cyan: { hue: [150, 200], saturation: [40, 100], lightness: [40, 80], names: ['Teal', 'Turquoise', 'Aqua', 'Seafoam', 'Jade'] },
    
    // Blues
    blue: { hue: [200, 250], saturation: [40, 100], lightness: [30, 80], names: ['Navy', 'Azure', 'Cobalt', 'Sapphire', 'Steel'] },
    
    // Purples
    purple: { hue: [250, 300], saturation: [40, 100], lightness: [30, 80], names: ['Violet', 'Lavender', 'Plum', 'Indigo', 'Amethyst'] },
    
    // Magentas
    magenta: { hue: [300, 330], saturation: [50, 100], lightness: [40, 80], names: ['Fuchsia', 'Orchid', 'Berry', 'Wine', 'Maroon'] },
    
    // Neutrals
    gray: { hue: [0, 360], saturation: [0, 15], lightness: [20, 80], names: ['Charcoal', 'Silver', 'Slate', 'Ash', 'Pearl'] },
    white: { hue: [0, 360], saturation: [0, 10], lightness: [90, 100], names: ['Ivory', 'Cream', 'Snow', 'Pearl', 'Alabaster'] },
    black: { hue: [0, 360], saturation: [0, 20], lightness: [0, 15], names: ['Ebony', 'Onyx', 'Charcoal', 'Jet', 'Obsidian'] },
  };

  // Context-specific modifiers
  private contextModifiers: Record<string, string[]> = {
    professional: ['Corporate', 'Executive', 'Business', 'Professional'],
    energetic: ['Vibrant', 'Electric', 'Dynamic', 'Energetic'],
    calm: ['Serene', 'Peaceful', 'Tranquil', 'Soft'],
    elegant: ['Sophisticated', 'Refined', 'Elegant', 'Luxurious'],
    playful: ['Bright', 'Cheerful', 'Playful', 'Fun'],
    modern: ['Contemporary', 'Modern', 'Sleek', 'Minimalist'],
    traditional: ['Classic', 'Traditional', 'Timeless', 'Heritage'],
  };

  // Industry-specific color associations
  private industryColors: Record<string, { preferred: string[]; modifiers: string[] }> = {
    healthcare: {
      preferred: ['blue', 'green', 'white'],
      modifiers: ['Trustworthy', 'Clean', 'Medical', 'Healing'],
    },
    tech: {
      preferred: ['blue', 'gray', 'cyan'],
      modifiers: ['Digital', 'Tech', 'Innovation', 'Future'],
    },
    finance: {
      preferred: ['blue', 'green', 'gray'],
      modifiers: ['Stable', 'Secure', 'Professional', 'Reliable'],
    },
    education: {
      preferred: ['blue', 'green', 'orange'],
      modifiers: ['Academic', 'Learning', 'Knowledge', 'Growth'],
    },
    food: {
      preferred: ['red', 'orange', 'yellow', 'green'],
      modifiers: ['Fresh', 'Appetizing', 'Natural', 'Organic'],
    },
    retail: {
      preferred: ['red', 'orange', 'purple'],
      modifiers: ['Attractive', 'Shopping', 'Trendy', 'Fashion'],
    },
  };

  /**
   * Generate an enhanced name for a color based on its properties and context
   */
  public generateColorName(color: ColorData, context?: GenerationContext): string {
    const { hsl } = color;
    
    // Find the base color family
    const baseColorFamily = this.findColorFamily(hsl);
    
    // Get base names for this color family
    const baseNames = this.colorNames[baseColorFamily]?.names || ['Color'];
    
    // Select appropriate base name
    let baseName = this.selectBaseName(baseNames, hsl, context);
    
    // Add contextual modifiers
    baseName = this.addContextualModifiers(baseName, hsl, context);
    
    // Add descriptive modifiers based on color properties
    baseName = this.addDescriptiveModifiers(baseName, hsl);
    
    return baseName;
  }

  /**
   * Generate usage recommendations based on color properties and context
   */
  public generateUsageRecommendation(
    color: ColorData, 
    context?: GenerationContext, 
    index?: number
  ): string {
    const { category, accessibility, hsl } = color;
    
    let usage = this.getBasicUsageByCategory(category);
    
    // Add accessibility-specific recommendations
    usage = this.addAccessibilityRecommendations(usage, accessibility);
    
    // Add context-specific recommendations
    if (context) {
      usage = this.addContextualUsage(usage, context, hsl);
    }
    
    // Add color-specific recommendations
    usage = this.addColorSpecificUsage(usage, hsl);
    
    return usage;
  }

  /**
   * Find the color family (red, blue, green, etc.) for a given HSL color
   */
  private findColorFamily(hsl: { h: number; s: number; l: number }): string {
    // Handle grayscale colors
    if (hsl.s < 15) {
      if (hsl.l > 90) return 'white';
      if (hsl.l < 15) return 'black';
      return 'gray';
    }
    
    // Find matching color family by hue
    for (const [family, definition] of Object.entries(this.colorNames)) {
      if (family === 'gray' || family === 'white' || family === 'black') continue;
      
      const [minHue, maxHue] = definition.hue;
      const [minSat, maxSat] = definition.saturation;
      const [minLight, maxLight] = definition.lightness;
      
      // Handle hue wraparound (e.g., red spans 350-10)
      const hueMatch = minHue <= maxHue 
        ? hsl.h >= minHue && hsl.h <= maxHue
        : hsl.h >= minHue || hsl.h <= maxHue;
      
      if (hueMatch && 
          hsl.s >= minSat && hsl.s <= maxSat &&
          hsl.l >= minLight && hsl.l <= maxLight) {
        return family;
      }
    }
    
    // Fallback: determine by hue only
    if (hsl.h >= 350 || hsl.h < 10) return 'red';
    if (hsl.h >= 10 && hsl.h < 40) return 'orange';
    if (hsl.h >= 40 && hsl.h < 70) return 'yellow';
    if (hsl.h >= 70 && hsl.h < 150) return 'green';
    if (hsl.h >= 150 && hsl.h < 200) return 'cyan';
    if (hsl.h >= 200 && hsl.h < 250) return 'blue';
    if (hsl.h >= 250 && hsl.h < 300) return 'purple';
    if (hsl.h >= 300 && hsl.h < 330) return 'magenta';
    if (hsl.h >= 330 && hsl.h < 350) return 'pink';
    
    return 'color';
  }

  /**
   * Select the most appropriate base name from available options
   */
  private selectBaseName(
    baseNames: string[], 
    hsl: { h: number; s: number; l: number }, 
    context?: GenerationContext
  ): string {
    // If we have context, try to match industry preferences
    if (context?.industry && this.industryColors[context.industry]) {
      const industryPrefs = this.industryColors[context.industry];
      // Use industry-specific modifiers if available
      if (industryPrefs.modifiers.length > 0) {
        return baseNames[0]; // Use first base name, will add industry modifier later
      }
    }
    
    // Select based on color properties
    if (hsl.s > 80 && hsl.l > 60) {
      // Bright, saturated colors - use more vibrant names
      return baseNames[Math.min(1, baseNames.length - 1)];
    } else if (hsl.s < 30) {
      // Muted colors - use more subdued names
      return baseNames[Math.min(2, baseNames.length - 1)];
    } else if (hsl.l < 30) {
      // Dark colors - use deeper names
      return baseNames[Math.min(3, baseNames.length - 1)];
    }
    
    return baseNames[0];
  }

  /**
   * Add contextual modifiers based on mood, industry, etc.
   */
  private addContextualModifiers(
    baseName: string, 
    hsl: { h: number; s: number; l: number }, 
    context?: GenerationContext
  ): string {
    if (!context) return baseName;
    
    // Add mood-based modifiers
    if (context.mood && this.contextModifiers[context.mood]) {
      const modifiers = this.contextModifiers[context.mood];
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      return `${modifier} ${baseName}`;
    }
    
    // Add industry-specific modifiers
    if (context.industry && this.industryColors[context.industry]) {
      const industryData = this.industryColors[context.industry];
      if (industryData.modifiers.length > 0) {
        const modifier = industryData.modifiers[Math.floor(Math.random() * industryData.modifiers.length)];
        return `${modifier} ${baseName}`;
      }
    }
    
    return baseName;
  }

  /**
   * Add descriptive modifiers based on color properties
   */
  private addDescriptiveModifiers(
    baseName: string, 
    hsl: { h: number; s: number; l: number }
  ): string {
    const modifiers: string[] = [];
    
    // Lightness modifiers
    if (hsl.l > 80) {
      modifiers.push('Light');
    } else if (hsl.l < 20) {
      modifiers.push('Dark');
    } else if (hsl.l < 40) {
      modifiers.push('Deep');
    }
    
    // Saturation modifiers
    if (hsl.s > 80) {
      modifiers.push('Vibrant');
    } else if (hsl.s < 20) {
      modifiers.push('Muted');
    } else if (hsl.s < 40) {
      modifiers.push('Soft');
    }
    
    // Combine modifiers (max 1 to avoid overly long names)
    if (modifiers.length > 0) {
      const modifier = modifiers[0];
      // Avoid duplicate modifiers
      if (!baseName.toLowerCase().includes(modifier.toLowerCase())) {
        return `${modifier} ${baseName}`;
      }
    }
    
    return baseName;
  }

  /**
   * Get basic usage recommendations by color category
   */
  private getBasicUsageByCategory(category: string): string {
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
   * Add accessibility-specific usage recommendations
   */
  private addAccessibilityRecommendations(
    usage: string, 
    accessibility: { wcagLevel: string; contrastWithWhite: number; contrastWithBlack: number }
  ): string {
    if (accessibility.wcagLevel === 'AAA') {
      usage += ', excellent for text on any background';
    } else if (accessibility.wcagLevel === 'AA') {
      if (accessibility.contrastWithWhite >= 4.5) {
        usage += ', suitable for text on light backgrounds';
      } else if (accessibility.contrastWithBlack >= 4.5) {
        usage += ', suitable for text on dark backgrounds';
      } else {
        usage += ', good for text with appropriate background contrast';
      }
    } else {
      usage += ', best used for decorative elements only (insufficient text contrast)';
    }
    
    return usage;
  }

  /**
   * Add context-specific usage recommendations
   */
  private addContextualUsage(
    usage: string, 
    context: GenerationContext, 
    hsl: { h: number; s: number; l: number }
  ): string {
    // Industry-specific recommendations
    if (context.industry) {
      switch (context.industry) {
        case 'healthcare':
          usage += ', conveys trust and cleanliness in medical contexts';
          break;
        case 'tech':
          usage += ', adds modern technological feel to digital interfaces';
          break;
        case 'finance':
          usage += ', projects stability and professionalism in financial services';
          break;
        case 'education':
          usage += ', promotes learning and knowledge in educational materials';
          break;
        case 'food':
          usage += ', enhances appetite appeal in food and restaurant branding';
          break;
        case 'retail':
          usage += ', attracts attention and encourages purchasing decisions';
          break;
      }
    }
    
    // Mood-specific recommendations
    if (context.mood) {
      switch (context.mood) {
        case 'energetic':
          usage += ', energizes and motivates users';
          break;
        case 'calm':
          usage += ', creates peaceful and relaxing atmosphere';
          break;
        case 'professional':
          usage += ', maintains professional and business-appropriate tone';
          break;
        case 'playful':
          usage += ', adds fun and engaging personality';
          break;
        case 'elegant':
          usage += ', provides sophisticated and refined appearance';
          break;
      }
    }
    
    return usage;
  }

  /**
   * Add color-specific usage recommendations based on color psychology
   */
  private addColorSpecificUsage(
    usage: string, 
    hsl: { h: number; s: number; l: number }
  ): string {
    // Red family (0-30, 330-360)
    if ((hsl.h >= 0 && hsl.h <= 30) || (hsl.h >= 330 && hsl.h <= 360)) {
      usage += ', creates urgency and draws attention';
    }
    // Orange family (30-60)
    else if (hsl.h >= 30 && hsl.h <= 60) {
      usage += ', promotes enthusiasm and creativity';
    }
    // Yellow family (60-90)
    else if (hsl.h >= 60 && hsl.h <= 90) {
      usage += ', stimulates optimism and mental clarity';
    }
    // Green family (90-150)
    else if (hsl.h >= 90 && hsl.h <= 150) {
      usage += ', suggests growth, nature, and balance';
    }
    // Blue family (150-250)
    else if (hsl.h >= 150 && hsl.h <= 250) {
      usage += ', builds trust and promotes calmness';
    }
    // Purple family (250-300)
    else if (hsl.h >= 250 && hsl.h <= 300) {
      usage += ', conveys creativity and luxury';
    }
    // Pink/Magenta family (300-330)
    else if (hsl.h >= 300 && hsl.h <= 330) {
      usage += ', adds warmth and approachability';
    }
    
    return usage;
  }

  /**
   * Get color psychology insights for a given color
   */
  public getColorPsychology(hsl: { h: number; s: number; l: number }): {
    emotions: string[];
    associations: string[];
    culturalMeanings: string[];
  } {
    const emotions: string[] = [];
    const associations: string[] = [];
    const culturalMeanings: string[] = [];
    
    // Determine color family and add appropriate psychology
    if ((hsl.h >= 0 && hsl.h <= 30) || (hsl.h >= 330 && hsl.h <= 360)) {
      // Red
      emotions.push('passion', 'energy', 'urgency', 'excitement');
      associations.push('fire', 'blood', 'love', 'danger');
      culturalMeanings.push('luck (China)', 'celebration', 'warning');
    } else if (hsl.h >= 30 && hsl.h <= 60) {
      // Orange
      emotions.push('enthusiasm', 'creativity', 'warmth', 'confidence');
      associations.push('sunset', 'autumn', 'citrus', 'energy');
      culturalMeanings.push('spirituality (Buddhism)', 'harvest', 'adventure');
    } else if (hsl.h >= 60 && hsl.h <= 90) {
      // Yellow
      emotions.push('happiness', 'optimism', 'clarity', 'attention');
      associations.push('sun', 'gold', 'wisdom', 'caution');
      culturalMeanings.push('prosperity (Asia)', 'enlightenment', 'cowardice (Western)');
    } else if (hsl.h >= 90 && hsl.h <= 150) {
      // Green
      emotions.push('growth', 'harmony', 'freshness', 'stability');
      associations.push('nature', 'money', 'health', 'environment');
      culturalMeanings.push('fertility', 'renewal', 'jealousy');
    } else if (hsl.h >= 150 && hsl.h <= 250) {
      // Blue
      emotions.push('trust', 'calmness', 'reliability', 'professionalism');
      associations.push('sky', 'ocean', 'technology', 'corporate');
      culturalMeanings.push('protection (Middle East)', 'immortality', 'sadness');
    } else if (hsl.h >= 250 && hsl.h <= 300) {
      // Purple
      emotions.push('luxury', 'creativity', 'mystery', 'spirituality');
      associations.push('royalty', 'magic', 'wisdom', 'transformation');
      culturalMeanings.push('nobility', 'mourning (Thailand)', 'femininity');
    } else if (hsl.h >= 300 && hsl.h <= 330) {
      // Pink/Magenta
      emotions.push('love', 'compassion', 'nurturing', 'playfulness');
      associations.push('romance', 'femininity', 'youth', 'tenderness');
      culturalMeanings.push('good health (Korea)', 'marriage', 'innocence');
    }
    
    return { emotions, associations, culturalMeanings };
  }
}