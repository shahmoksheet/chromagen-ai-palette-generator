import React, { useState } from 'react';
import ExportDropdown from './ExportDropdown';
import { ColorPalette, ExportFormat } from '../types/color';
import { Palette, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

// Demo palette with comprehensive color data
const demoPalette: ColorPalette = {
  id: 'demo-export-palette',
  name: 'Professional Brand Palette',
  prompt: 'A sophisticated palette for modern brand identity with excellent accessibility',
  colors: [
    {
      hex: '#1E293B', // Slate 800
      rgb: { r: 30, g: 41, b: 59 },
      hsl: { h: 217, s: 33, l: 17 },
      name: 'Deep Slate',
      category: 'primary',
      usage: 'Primary text color, headers, and main brand elements',
      accessibility: {
        contrastWithWhite: 15.25,
        contrastWithBlack: 1.37,
        wcagLevel: 'AAA',
      },
    },
    {
      hex: '#3B82F6', // Blue 500
      rgb: { r: 59, g: 130, b: 246 },
      hsl: { h: 217, s: 91, l: 60 },
      name: 'Brand Blue',
      category: 'primary',
      usage: 'Primary buttons, links, and interactive elements',
      accessibility: {
        contrastWithWhite: 4.56,
        contrastWithBlack: 4.61,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#10B981', // Emerald 500
      rgb: { r: 16, g: 185, b: 129 },
      hsl: { h: 160, s: 84, l: 39 },
      name: 'Success Green',
      category: 'secondary',
      usage: 'Success states, positive feedback, and confirmation messages',
      accessibility: {
        contrastWithWhite: 3.92,
        contrastWithBlack: 5.36,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#F59E0B', // Amber 500
      rgb: { r: 245, g: 158, b: 11 },
      hsl: { h: 38, s: 92, l: 50 },
      name: 'Warning Amber',
      category: 'accent',
      usage: 'Warning states, attention-grabbing elements, and highlights',
      accessibility: {
        contrastWithWhite: 2.37,
        contrastWithBlack: 8.85,
        wcagLevel: 'FAIL',
      },
    },
    {
      hex: '#EF4444', // Red 500
      rgb: { r: 239, g: 68, b: 68 },
      hsl: { h: 0, s: 84, l: 60 },
      name: 'Error Red',
      category: 'accent',
      usage: 'Error states, destructive actions, and critical alerts',
      accessibility: {
        contrastWithWhite: 3.58,
        contrastWithBlack: 5.87,
        wcagLevel: 'FAIL',
      },
    },
    {
      hex: '#6B7280', // Gray 500
      rgb: { r: 107, g: 114, b: 128 },
      hsl: { h: 220, s: 9, l: 46 },
      name: 'Neutral Gray',
      category: 'secondary',
      usage: 'Secondary text, borders, and subtle UI elements',
      accessibility: {
        contrastWithWhite: 5.74,
        contrastWithBlack: 3.66,
        wcagLevel: 'AA',
      },
    },
    {
      hex: '#F3F4F6', // Gray 100
      rgb: { r: 243, g: 244, b: 246 },
      hsl: { h: 220, s: 14, l: 96 },
      name: 'Light Background',
      category: 'secondary',
      usage: 'Background color for cards, sections, and subtle containers',
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
        color1: '#1E293B',
        color2: '#FFFFFF',
        ratio: 15.25,
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
    ],
    colorBlindnessCompatible: true,
    recommendations: [
      'Consider darkening the warning amber color for better contrast with white backgrounds.',
      'The error red color should be used carefully on white backgrounds.',
      'Excellent overall accessibility with most colors meeting AA standards.',
    ],
    passedChecks: 5,
    totalChecks: 7,
  },
  createdAt: new Date('2024-01-20T14:30:00Z'),
  updatedAt: new Date('2024-01-20T14:30:00Z'),
};

interface ExportEvent {
  id: string;
  type: 'success' | 'error';
  format: ExportFormat;
  filename?: string;
  error?: string;
  timestamp: Date;
}

const ExportDropdownDemo: React.FC = () => {
  const [exportEvents, setExportEvents] = useState<ExportEvent[]>([]);

  const handleExportSuccess = (format: ExportFormat, filename: string) => {
    const event: ExportEvent = {
      id: `${Date.now()}-success`,
      type: 'success',
      format,
      filename,
      timestamp: new Date(),
    };
    
    setExportEvents(prev => [event, ...prev].slice(0, 10));
    console.log('Export successful:', { format, filename });
  };

  const handleExportError = (format: ExportFormat, error: string) => {
    const event: ExportEvent = {
      id: `${Date.now()}-error`,
      type: 'error',
      format,
      error,
      timestamp: new Date(),
    };
    
    setExportEvents(prev => [event, ...prev].slice(0, 10));
    console.error('Export failed:', { format, error });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Export Dropdown Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            This demo showcases the ExportDropdown component with a professional brand palette. 
            Test all export formats, preview functionality, and export history tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Palette Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Palette className="w-6 h-6 text-purple-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{demoPalette.name}</h2>
                    <p className="text-sm text-gray-600">{demoPalette.colors.length} colors</p>
                  </div>
                </div>
                
                {/* Export Dropdown */}
                <ExportDropdown
                  palette={demoPalette}
                  onExportSuccess={handleExportSuccess}
                  onExportError={handleExportError}
                  className="flex-shrink-0"
                />
              </div>

              {/* Color Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {demoPalette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div
                      className="h-20 w-full"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">
                        {color.name}
                      </h3>
                      <p className="text-xs text-gray-600 font-mono mb-2">
                        {color.hex}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          color.category === 'primary' 
                            ? 'bg-blue-100 text-blue-800'
                            : color.category === 'secondary'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {color.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          color.accessibility.wcagLevel === 'AAA'
                            ? 'bg-green-100 text-green-800'
                            : color.accessibility.wcagLevel === 'AA'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {color.accessibility.wcagLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Palette Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Palette Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Overall Score:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {demoPalette.accessibilityScore.overallScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Accessibility:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {demoPalette.accessibilityScore.passedChecks}/{demoPalette.accessibilityScore.totalChecks} passed
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Color Blind Friendly:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {demoPalette.accessibilityScore.colorBlindnessCompatible ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Events Log */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                Export Activity
              </h3>
              
              {exportEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No exports yet. Try exporting the palette above!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {exportEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border ${
                        event.type === 'success'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {event.type === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${
                              event.type === 'success' ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {event.format.toUpperCase()} Export
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          
                          {event.type === 'success' ? (
                            <p className="text-sm text-green-700 mt-1 truncate">
                              {event.filename}
                            </p>
                          ) : (
                            <p className="text-sm text-red-700 mt-1">
                              {event.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Formats Info */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Export Formats
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">CSS Variables</span>
                  <span className="text-gray-900 font-medium">.css</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SCSS Variables</span>
                  <span className="text-gray-900 font-medium">.scss</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">JSON Data</span>
                  <span className="text-gray-900 font-medium">.json</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tailwind Config</span>
                  <span className="text-gray-900 font-medium">.js</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Adobe ASE</span>
                  <span className="text-gray-900 font-medium">.ase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sketch Palette</span>
                  <span className="text-gray-900 font-medium">.sketchpalette</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Figma Tokens</span>
                  <span className="text-gray-900 font-medium">.json</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">
            How to Use the Export Dropdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Export Options</h4>
              <ul className="space-y-1 text-sm">
                <li>• Click the Export button to open the dropdown</li>
                <li>• Choose from 7 different export formats</li>
                <li>• Each format is optimized for specific use cases</li>
                <li>• Download files directly to your computer</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Preview & History</h4>
              <ul className="space-y-1 text-sm">
                <li>• Click the eye icon to preview export content</li>
                <li>• Copy content directly from the preview</li>
                <li>• View recent export history in the dropdown</li>
                <li>• Track export activity in the sidebar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDropdownDemo;