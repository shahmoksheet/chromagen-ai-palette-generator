import React, { useState } from 'react';
import AccessibilityPanel from './AccessibilityPanel';
import { ColorPalette, ColorBlindnessType } from '../types/color';

// Demo palette with various accessibility scenarios
const demoPalette: ColorPalette = {
  id: 'demo-accessibility-palette',
  name: 'Accessibility Demo Palette',
  prompt: 'A palette designed to demonstrate various accessibility features and scenarios',
  colors: [
    {
      hex: '#1F2937', // Dark gray - good contrast
      rgb: { r: 31, g: 41, b: 55 },
      hsl: { h: 215, s: 28, l: 17 },
      name: 'Charcoal Gray',
      category: 'primary',
      usage: 'Primary text color, excellent contrast with light backgrounds',
      accessibility: {
        contrastWithWhite: 12.63,
        contrastWithBlack: 1.66,
        wcagLevel: 'AAA',
      },
    },
    {
      hex: '#3B82F6', // Blue - good contrast
      rgb: { r: 59, g: 130, b: 246 },
      hsl: { h: 217, s: 91, l: 60 },
      name: 'Royal Blue',
      category: 'primary',
      usage: 'Links and interactive elements, good contrast with white',
      accessibility: {
        contrastWithWhite: 4.56,
        contrastWithBlack: 4.61,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#10B981', // Green - good contrast
      rgb: { r: 16, g: 185, b: 129 },
      hsl: { h: 160, s: 84, l: 39 },
      name: 'Emerald Green',
      category: 'secondary',
      usage: 'Success messages and positive feedback',
      accessibility: {
        contrastWithWhite: 3.92,
        contrastWithBlack: 5.36,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#F59E0B', // Orange - moderate contrast
      rgb: { r: 245, g: 158, b: 11 },
      hsl: { h: 38, s: 92, l: 50 },
      name: 'Amber Orange',
      category: 'accent',
      usage: 'Warning messages and attention-grabbing elements',
      accessibility: {
        contrastWithWhite: 2.37,
        contrastWithBlack: 8.85,
        wcagLevel: 'FAIL',
      },
    },
    {
      hex: '#EF4444', // Red - good contrast with white
      rgb: { r: 239, g: 68, b: 68 },
      hsl: { h: 0, s: 84, l: 60 },
      name: 'Crimson Red',
      category: 'accent',
      usage: 'Error messages and critical alerts',
      accessibility: {
        contrastWithWhite: 3.58,
        contrastWithBlack: 5.87,
        wcagLevel: 'FAIL',
      },
    },
    {
      hex: '#F3F4F6', // Light gray - background color
      rgb: { r: 243, g: 244, b: 246 },
      hsl: { h: 220, s: 14, l: 96 },
      name: 'Light Gray',
      category: 'secondary',
      usage: 'Background color for cards and sections',
      accessibility: {
        contrastWithWhite: 1.03,
        contrastWithBlack: 20.35,
        wcagLevel: 'FAIL',
      },
    },
  ],
  accessibilityScore: {
    overallScore: 'AA',
    contrastRatios: [
      {
        color1: '#1F2937',
        color2: '#FFFFFF',
        ratio: 12.63,
        level: 'AAA',
        isTextReadable: true,
      },
      {
        color1: '#3B82F6',
        color2: '#FFFFFF',
        ratio: 4.56,
        level: 'AA',
        isTextReadable: true,
      },
      {
        color1: '#10B981',
        color2: '#FFFFFF',
        ratio: 3.92,
        level: 'FAIL',
        isTextReadable: false,
      },
      {
        color1: '#F59E0B',
        color2: '#FFFFFF',
        ratio: 2.37,
        level: 'FAIL',
        isTextReadable: false,
      },
      {
        color1: '#EF4444',
        color2: '#FFFFFF',
        ratio: 3.58,
        level: 'FAIL',
        isTextReadable: false,
      },
      {
        color1: '#F3F4F6',
        color2: '#000000',
        ratio: 20.35,
        level: 'AAA',
        isTextReadable: true,
      },
      // Cross-color combinations
      {
        color1: '#1F2937',
        color2: '#F3F4F6',
        ratio: 12.26,
        level: 'AAA',
        isTextReadable: true,
      },
      {
        color1: '#3B82F6',
        color2: '#1F2937',
        ratio: 2.77,
        level: 'FAIL',
        isTextReadable: false,
      },
    ],
    colorBlindnessCompatible: true,
    recommendations: [
      'The amber orange color has insufficient contrast with white backgrounds. Consider darkening it or using it only on dark backgrounds.',
      'The crimson red color fails WCAG AA standards with white backgrounds. Consider using it sparingly or with sufficient background contrast.',
      'The light gray background provides excellent contrast for dark text.',
      'Consider using the charcoal gray for body text as it exceeds AAA standards.',
      'The royal blue works well for interactive elements and meets AA standards.',
    ],
    passedChecks: 4,
    totalChecks: 8,
  },
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
};

const AccessibilityPanelDemo: React.FC = () => {
  const [currentSimulation, setCurrentSimulation] = useState<ColorBlindnessType | null>(null);

  const handleColorBlindnessToggle = (type: ColorBlindnessType | null) => {
    setCurrentSimulation(type);
    console.log('Color blindness simulation changed to:', type);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Accessibility Panel Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            This demo showcases the AccessibilityPanel component with a palette that includes 
            various accessibility scenarios. The panel demonstrates WCAG compliance checking, 
            color blindness simulation, contrast ratio analysis, and educational tooltips.
          </p>
        </div>

        {/* Current Simulation Status */}
        {currentSimulation && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Active Simulation
            </h2>
            <p className="text-blue-800">
              Currently simulating: <strong>{currentSimulation}</strong>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              The colors in the accessibility panel are now showing how they appear to users with this type of color vision deficiency.
            </p>
          </div>
        )}

        {/* Accessibility Panel */}
        <div className="bg-white rounded-xl shadow-lg">
          <AccessibilityPanel
            palette={demoPalette}
            onColorBlindnessToggle={handleColorBlindnessToggle}
            className="w-full"
          />
        </div>

        {/* Demo Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Features Demonstrated
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                WCAG 2.1 compliance checking (AA/AAA levels)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Color blindness simulation (4 types)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Contrast ratio visualization
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Individual color analysis
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Educational tooltips and explanations
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Accessibility recommendations
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Expandable/collapsible sections
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Test Scenarios
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <strong>Charcoal Gray:</strong> Excellent AAA contrast
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <strong>Royal Blue:</strong> Good AA contrast for links
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <strong>Emerald Green:</strong> Borderline AA contrast
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <strong>Amber Orange:</strong> Fails contrast requirements
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <strong>Crimson Red:</strong> Insufficient contrast with white
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <strong>Light Gray:</strong> Good background color
              </li>
            </ul>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-amber-900 mb-4">
            How to Use This Demo
          </h3>
          <div className="text-amber-800 space-y-2">
            <p>
              <strong>1. Explore Sections:</strong> Click on the section headers to expand/collapse different areas of the accessibility analysis.
            </p>
            <p>
              <strong>2. Test Color Blindness:</strong> Click on the color blindness type buttons to simulate how the palette appears to users with different types of color vision deficiency.
            </p>
            <p>
              <strong>3. Analyze Individual Colors:</strong> Click on any color swatch in the simulation section to see detailed accessibility analysis for that specific color.
            </p>
            <p>
              <strong>4. Review Recommendations:</strong> Read the accessibility recommendations to understand how to improve the palette's accessibility.
            </p>
            <p>
              <strong>5. Hover for Help:</strong> Hover over help icons and labels to see educational tooltips explaining accessibility concepts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanelDemo;