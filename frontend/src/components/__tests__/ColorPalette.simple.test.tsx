import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ColorPalette from '../ColorPalette';
import { ColorPalette as ColorPaletteType } from '../../types/color';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ColorPalette - Basic Tests', () => {
    const mockPalette: ColorPaletteType = {
        id: 'test-1',
        name: 'Test Palette',
        colors: [
            {
                hex: '#FF6B6B',
                rgb: { r: 255, g: 107, b: 107 },
                hsl: { h: 0, s: 100, l: 71 },
                name: 'Red',
                category: 'primary',
                usage: 'Primary color',
                accessibility: {
                    contrastWithWhite: 2.1,
                    contrastWithBlack: 10.0,
                    wcagLevel: 'AA',
                },
            },
        ],
        accessibilityScore: {
            overallScore: 'AA',
            contrastRatios: [],
            colorBlindnessCompatible: true,
            recommendations: [],
            passedChecks: 1,
            totalChecks: 1,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    it('renders palette name', () => {
        render(<ColorPalette palette={mockPalette} />);
        expect(screen.getByText('Test Palette')).toBeInTheDocument();
    });

    it('renders color name', () => {
        render(<ColorPalette palette={mockPalette} />);
        expect(screen.getByText('Red')).toBeInTheDocument();
    });

    it('renders hex color value', () => {
        render(<ColorPalette palette={mockPalette} />);
        expect(screen.getByText('#FF6B6B')).toBeInTheDocument();
    });
});