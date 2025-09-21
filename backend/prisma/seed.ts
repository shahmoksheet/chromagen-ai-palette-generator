// Database seed script

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { sessionId: 'demo-user-1' },
    update: {},
    create: {
      sessionId: 'demo-user-1',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { sessionId: 'demo-user-2' },
    update: {},
    create: {
      sessionId: 'demo-user-2',
    },
  });

  console.log('Created demo users:', { user1: user1.id, user2: user2.id });

  // Create sample color palettes
  const palette1 = await prisma.colorPalette.create({
    data: {
      userId: user1.id,
      name: 'Ocean Breeze',
      prompt: 'calming ocean colors for a wellness app',
      colors: [
        {
          hex: '#0077BE',
          rgb: { r: 0, g: 119, b: 190 },
          hsl: { h: 202, s: 100, l: 37 },
          name: 'Ocean Blue',
          category: 'primary',
          usage: 'Main brand color, headers, primary buttons',
          accessibility: {
            contrastWithWhite: 5.2,
            contrastWithBlack: 4.0,
            wcagLevel: 'AA',
          },
        },
        {
          hex: '#00A8CC',
          rgb: { r: 0, g: 168, b: 204 },
          hsl: { h: 191, s: 100, l: 40 },
          name: 'Turquoise',
          category: 'secondary',
          usage: 'Secondary buttons, supporting elements',
          accessibility: {
            contrastWithWhite: 3.8,
            contrastWithBlack: 5.5,
            wcagLevel: 'AA',
          },
        },
        {
          hex: '#7FDBFF',
          rgb: { r: 127, g: 219, b: 255 },
          hsl: { h: 197, s: 100, l: 75 },
          name: 'Light Blue',
          category: 'accent',
          usage: 'Highlights, decorative elements',
          accessibility: {
            contrastWithWhite: 1.8,
            contrastWithBlack: 11.7,
            wcagLevel: 'AAA',
          },
        },
        {
          hex: '#F0F8FF',
          rgb: { r: 240, g: 248, b: 255 },
          hsl: { h: 208, s: 100, l: 97 },
          name: 'Alice Blue',
          category: 'accent',
          usage: 'Background, subtle accents',
          accessibility: {
            contrastWithWhite: 1.0,
            contrastWithBlack: 21.0,
            wcagLevel: 'AAA',
          },
        },
        {
          hex: '#2C3E50',
          rgb: { r: 44, g: 62, b: 80 },
          hsl: { h: 210, s: 29, l: 24 },
          name: 'Dark Blue Gray',
          category: 'primary',
          usage: 'Text, dark elements',
          accessibility: {
            contrastWithWhite: 8.5,
            contrastWithBlack: 2.5,
            wcagLevel: 'AAA',
          },
        },
      ],
      accessibilityScore: {
        overallScore: 'AA',
        passedChecks: 8,
        totalChecks: 10,
        recommendations: [
          'Light Blue may have insufficient contrast for small text',
          'Consider darker alternatives for better accessibility',
        ],
      },
    },
  });

  const palette2 = await prisma.colorPalette.create({
    data: {
      userId: user1.id,
      name: 'Sunset Vibes',
      prompt: 'warm sunset colors for a creative portfolio',
      colors: [
        {
          hex: '#FF6B35',
          rgb: { r: 255, g: 107, b: 53 },
          hsl: { h: 16, s: 100, l: 60 },
          name: 'Vibrant Orange',
          category: 'primary',
          usage: 'Main accent color, call-to-action buttons',
          accessibility: {
            contrastWithWhite: 3.2,
            contrastWithBlack: 6.6,
            wcagLevel: 'AA',
          },
        },
        {
          hex: '#F7931E',
          rgb: { r: 247, g: 147, b: 30 },
          hsl: { h: 32, s: 93, l: 54 },
          name: 'Golden Orange',
          category: 'secondary',
          usage: 'Secondary elements, highlights',
          accessibility: {
            contrastWithWhite: 2.8,
            contrastWithBlack: 7.5,
            wcagLevel: 'AA',
          },
        },
        {
          hex: '#FFD23F',
          rgb: { r: 255, g: 210, b: 63 },
          hsl: { h: 46, s: 100, l: 62 },
          name: 'Sunny Yellow',
          category: 'accent',
          usage: 'Attention-grabbing elements',
          accessibility: {
            contrastWithWhite: 1.9,
            contrastWithBlack: 11.0,
            wcagLevel: 'AAA',
          },
        },
        {
          hex: '#EE4B2B',
          rgb: { r: 238, g: 75, b: 43 },
          hsl: { h: 10, s: 85, l: 55 },
          name: 'Sunset Red',
          category: 'accent',
          usage: 'Error states, important alerts',
          accessibility: {
            contrastWithWhite: 4.1,
            contrastWithBlack: 5.1,
            wcagLevel: 'AA',
          },
        },
      ],
      accessibilityScore: {
        overallScore: 'AA',
        passedChecks: 6,
        totalChecks: 8,
        recommendations: [
          'Ensure sufficient contrast when using on light backgrounds',
          'Test with color blindness simulators',
        ],
      },
    },
  });

  const palette3 = await prisma.colorPalette.create({
    data: {
      userId: user2.id,
      name: 'Forest Harmony',
      prompt: 'natural forest colors for an eco-friendly brand',
      colors: [
        {
          hex: '#2D5016',
          rgb: { r: 45, g: 80, b: 22 },
          hsl: { h: 96, s: 57, l: 20 },
          name: 'Forest Green',
          category: 'primary',
          usage: 'Primary brand color, headers',
          accessibility: {
            contrastWithWhite: 9.8,
            contrastWithBlack: 2.1,
            wcagLevel: 'AAA',
          },
        },
        {
          hex: '#68B684',
          rgb: { r: 104, g: 182, b: 132 },
          hsl: { h: 142, s: 35, l: 56 },
          name: 'Sage Green',
          category: 'secondary',
          usage: 'Secondary elements, backgrounds',
          accessibility: {
            contrastWithWhite: 2.9,
            contrastWithBlack: 7.2,
            wcagLevel: 'AA',
          },
        },
        {
          hex: '#A4C3A2',
          rgb: { r: 164, g: 195, b: 162 },
          hsl: { h: 116, s: 22, l: 70 },
          name: 'Mint Green',
          category: 'accent',
          usage: 'Subtle highlights, borders',
          accessibility: {
            contrastWithWhite: 1.7,
            contrastWithBlack: 12.4,
            wcagLevel: 'AAA',
          },
        },
      ],
      accessibilityScore: {
        overallScore: 'AAA',
        passedChecks: 6,
        totalChecks: 6,
        recommendations: [],
      },
    },
  });

  // Create anonymous palette
  const anonymousPalette = await prisma.colorPalette.create({
    data: {
      name: 'Monochrome Classic',
      prompt: 'classic black and white with gray accents',
      colors: [
        {
          hex: '#000000',
          rgb: { r: 0, g: 0, b: 0 },
          hsl: { h: 0, s: 0, l: 0 },
          name: 'Pure Black',
          category: 'primary',
          usage: 'Text, strong contrasts',
          accessibility: {
            contrastWithWhite: 21.0,
            contrastWithBlack: 1.0,
            wcagLevel: 'AAA',
          },
        },
        {
          hex: '#FFFFFF',
          rgb: { r: 255, g: 255, b: 255 },
          hsl: { h: 0, s: 0, l: 100 },
          name: 'Pure White',
          category: 'primary',
          usage: 'Backgrounds, light elements',
          accessibility: {
            contrastWithWhite: 1.0,
            contrastWithBlack: 21.0,
            wcagLevel: 'AAA',
          },
        },
        {
          hex: '#808080',
          rgb: { r: 128, g: 128, b: 128 },
          hsl: { h: 0, s: 0, l: 50 },
          name: 'Medium Gray',
          category: 'secondary',
          usage: 'Borders, subtle elements',
          accessibility: {
            contrastWithWhite: 5.3,
            contrastWithBlack: 4.0,
            wcagLevel: 'AA',
          },
        },
      ],
      accessibilityScore: {
        overallScore: 'AAA',
        passedChecks: 6,
        totalChecks: 6,
        recommendations: [],
      },
    },
  });

  console.log('Created sample palettes:', {
    palette1: palette1.id,
    palette2: palette2.id,
    palette3: palette3.id,
    anonymousPalette: anonymousPalette.id,
  });

  // Create sample export history
  const exports = await Promise.all([
    prisma.exportHistory.create({
      data: {
        paletteId: palette1.id,
        userId: user1.id,
        format: 'css',
      },
    }),
    prisma.exportHistory.create({
      data: {
        paletteId: palette1.id,
        userId: user1.id,
        format: 'json',
      },
    }),
    prisma.exportHistory.create({
      data: {
        paletteId: palette2.id,
        userId: user1.id,
        format: 'scss',
      },
    }),
    prisma.exportHistory.create({
      data: {
        paletteId: palette3.id,
        userId: user2.id,
        format: 'tailwind',
      },
    }),
    prisma.exportHistory.create({
      data: {
        paletteId: anonymousPalette.id,
        format: 'css',
      },
    }),
  ]);

  console.log(`Created ${exports.length} export history records`);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });