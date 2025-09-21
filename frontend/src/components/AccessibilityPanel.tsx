import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye,
    EyeOff,
    Info,
    AlertTriangle,
    CheckCircle,
    XCircle,
    HelpCircle,
    BarChart3,
    Palette,
    Users
} from 'lucide-react';
import {
    ColorPalette as ColorPaletteType,
    Color,
    ColorBlindnessType,
    ContrastRatio
} from '../types/color';
import {
    simulateColorBlindness,
    getAccessibilityStatusIcon,
    formatContrastRatio,
    getColorBlindnessDescription,
    analyzeColorAccessibility
} from '../utils/accessibility';

interface AccessibilityPanelProps {
    palette: ColorPaletteType;
    className?: string;
    onColorBlindnessToggle?: (type: ColorBlindnessType | null) => void;
}

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs ${positionClasses[position]}`}
                    >
                        {content}
                        <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
                            style={{
                                [position === 'top' ? 'top' : position === 'bottom' ? 'bottom' : position === 'left' ? 'left' : 'right']:
                                    position === 'top' || position === 'bottom' ? 'calc(100% - 4px)' : 'calc(50% - 4px)',
                                [position === 'top' || position === 'bottom' ? 'left' : 'top']: '50%',
                                transform: 'translateX(-50%) rotate(45deg)'
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
    palette,
    className = '',
    onColorBlindnessToggle,
}) => {
    const [activeColorBlindness, setActiveColorBlindness] = useState<ColorBlindnessType | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
    const [selectedColor, setSelectedColor] = useState<Color | null>(null);

    const colorBlindnessTypes: { type: ColorBlindnessType; label: string; description: string }[] = [
        {
            type: 'protanopia',
            label: 'Protanopia',
            description: 'Red-blind (affects ~1% of men). Difficulty distinguishing red from green.'
        },
        {
            type: 'deuteranopia',
            label: 'Deuteranopia',
            description: 'Green-blind (affects ~1% of men). Most common form of color blindness.'
        },
        {
            type: 'tritanopia',
            label: 'Tritanopia',
            description: 'Blue-blind (rare, affects ~0.01% of people). Difficulty with blue-yellow spectrum.'
        },
        {
            type: 'achromatopsia',
            label: 'Achromatopsia',
            description: 'Complete color blindness (very rare). Sees only in grayscale.'
        },
    ];

    const toggleSection = useCallback((section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    }, []);

    const handleColorBlindnessToggle = useCallback((type: ColorBlindnessType) => {
        const newType = activeColorBlindness === type ? null : type;
        setActiveColorBlindness(newType);
        onColorBlindnessToggle?.(newType);
    }, [activeColorBlindness, onColorBlindnessToggle]);

    const getSimulatedColors = useCallback((colors: Color[]): Color[] => {
        if (!activeColorBlindness) return colors;

        return colors.map(color => ({
            ...color,
            hex: simulateColorBlindness(color.hex, activeColorBlindness),
        }));
    }, [activeColorBlindness]);

    const getContrastVisualization = (ratio: ContrastRatio) => {
        const { icon, color, label } = getAccessibilityStatusIcon(ratio.level);

        return (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: ratio.color1 }}
                        />
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: ratio.color2 }}
                        />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                            {formatContrastRatio(ratio.ratio)}
                        </div>
                        <div className="text-xs text-gray-600">
                            {ratio.color1} on {ratio.color2}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span
                        className="text-lg"
                        style={{ color }}
                    >
                        {icon}
                    </span>
                    <span className="text-sm font-medium" style={{ color }}>
                        {label}
                    </span>
                </div>
            </div>
        );
    };

    const simulatedColors = getSimulatedColors(palette.colors);
    const { accessibilityScore } = palette;

    return (
        <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Users className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Accessibility Analysis</h2>
                            <p className="text-sm text-gray-600">WCAG compliance and color blindness testing</p>
                        </div>
                    </div>

                    <Tooltip content="This panel helps ensure your color palette is accessible to all users, including those with visual impairments.">
                        <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip>
                </div>
            </div>

            {/* Overview Section */}
            <div className="p-6">
                <button
                    onClick={() => toggleSection('overview')}
                    className="flex items-center justify-between w-full text-left"
                >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                        Accessibility Overview
                    </h3>
                    <motion.div
                        animate={{ rotate: expandedSections.has('overview') ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </button>

                <AnimatePresence>
                    {expandedSections.has('overview') && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 space-y-4"
                        >
                            {/* Overall Score */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Overall Score</p>
                                            <p className="text-2xl font-bold text-gray-900">{accessibilityScore.overallScore}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${accessibilityScore.overallScore === 'AAA' ? 'bg-green-100' :
                                                accessibilityScore.overallScore === 'AA' ? 'bg-yellow-100' : 'bg-red-100'
                                            }`}>
                                            {accessibilityScore.overallScore === 'AAA' ? (
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            ) : accessibilityScore.overallScore === 'AA' ? (
                                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-600" />
                                            )}
                                        </div>
                                    </div>
                                    <Tooltip content="AAA is the highest level of WCAG compliance, AA is acceptable for most uses, FAIL means improvements are needed.">
                                        <p className="text-xs text-gray-500 mt-2 cursor-help">
                                            WCAG 2.1 Compliance Level
                                        </p>
                                    </Tooltip>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Contrast Tests</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {accessibilityScore.passedChecks}/{accessibilityScore.totalChecks}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                            <BarChart3 className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <Tooltip content="Number of color combinations that pass WCAG contrast requirements for text readability.">
                                        <p className="text-xs text-gray-500 mt-2 cursor-help">
                                            Passed / Total Tests
                                        </p>
                                    </Tooltip>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Color Blind Friendly</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {accessibilityScore.colorBlindnessCompatible ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${accessibilityScore.colorBlindnessCompatible ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                            {accessibilityScore.colorBlindnessCompatible ? (
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-600" />
                                            )}
                                        </div>
                                    </div>
                                    <Tooltip content="Whether the color palette remains distinguishable for users with common forms of color blindness.">
                                        <p className="text-xs text-gray-500 mt-2 cursor-help">
                                            Distinguishable Colors
                                        </p>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Recommendations */}
                            {accessibilityScore.recommendations.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                                        <Info className="w-4 h-4 mr-2" />
                                        Recommendations
                                    </h4>
                                    <ul className="space-y-1">
                                        {accessibilityScore.recommendations.map((recommendation, index) => (
                                            <li key={index} className="text-sm text-amber-800">
                                                • {recommendation}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Color Blindness Simulation Section */}
            <div className="p-6 border-t border-gray-200">
                <button
                    onClick={() => toggleSection('colorblindness')}
                    className="flex items-center justify-between w-full text-left"
                >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Eye className="w-5 h-5 mr-2 text-purple-600" />
                        Color Blindness Simulation
                    </h3>
                    <motion.div
                        animate={{ rotate: expandedSections.has('colorblindness') ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </button>

                <AnimatePresence>
                    {expandedSections.has('colorblindness') && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 space-y-4"
                        >
                            {/* Color Blindness Type Buttons */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {colorBlindnessTypes.map(({ type, label, description }) => (
                                    <Tooltip key={type} content={description}>
                                        <button
                                            onClick={() => handleColorBlindnessToggle(type)}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${activeColorBlindness === type
                                                    ? 'bg-purple-100 border-purple-300 text-purple-800'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    </Tooltip>
                                ))}
                            </div>

                            {/* Clear Simulation Button */}
                            {activeColorBlindness && (
                                <button
                                    onClick={() => handleColorBlindnessToggle(activeColorBlindness)}
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <EyeOff className="w-4 h-4" />
                                    <span>Clear Simulation</span>
                                </button>
                            )}

                            {/* Simulated Color Preview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {simulatedColors.map((color, index) => (
                                    <div key={index} className="space-y-2">
                                        <div
                                            className="w-full h-16 rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                                            style={{ backgroundColor: color.hex }}
                                            onClick={() => setSelectedColor(color)}
                                        />
                                        <div className="text-center">
                                            <p className="text-xs font-medium text-gray-900">{palette.colors[index].name}</p>
                                            <p className="text-xs text-gray-600 font-mono">{color.hex}</p>
                                            {activeColorBlindness && (
                                                <p className="text-xs text-gray-500">
                                                    Original: {palette.colors[index].hex}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {activeColorBlindness && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Viewing as:</strong> {getColorBlindnessDescription(activeColorBlindness)}
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        This simulation shows how your palette appears to users with {activeColorBlindness}.
                                        Ensure important information isn't conveyed through color alone.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Contrast Analysis Section */}
            <div className="p-6 border-t border-gray-200">
                <button
                    onClick={() => toggleSection('contrast')}
                    className="flex items-center justify-between w-full text-left"
                >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Palette className="w-5 h-5 mr-2 text-green-600" />
                        Contrast Analysis
                    </h3>
                    <motion.div
                        animate={{ rotate: expandedSections.has('contrast') ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </button>

                <AnimatePresence>
                    {expandedSections.has('contrast') && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 space-y-4"
                        >
                            <div className="space-y-3">
                                {accessibilityScore.contrastRatios.map((ratio, index) => (
                                    <div key={index}>
                                        {getContrastVisualization(ratio)}
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Understanding Contrast Ratios</h4>
                                <div className="text-sm text-gray-700 space-y-1">
                                    <p><strong>AAA (7:1):</strong> Enhanced contrast for users with low vision</p>
                                    <p><strong>AA (4.5:1):</strong> Minimum contrast for normal text</p>
                                    <p><strong>AA Large (3:1):</strong> Minimum contrast for large text (18pt+)</p>
                                    <p><strong>Fail (&lt;3:1):</strong> Insufficient contrast for accessibility</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Individual Color Analysis */}
            {selectedColor && (
                <div className="p-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Color Analysis: {selectedColor.name}
                    </h3>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-4 mb-4">
                            <div
                                className="w-16 h-16 rounded-lg border border-gray-200"
                                style={{ backgroundColor: selectedColor.hex }}
                            />
                            <div>
                                <p className="font-semibold text-gray-900">{selectedColor.name}</p>
                                <p className="text-sm text-gray-600 font-mono">{selectedColor.hex}</p>
                                <p className="text-sm text-gray-600">{selectedColor.category} color</p>
                            </div>
                        </div>

                        {(() => {
                            const analysis = analyzeColorAccessibility(selectedColor);
                            return (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Contrast with White</p>
                                            <p className="text-lg font-bold text-gray-700">
                                                {formatContrastRatio(analysis.contrastWithWhite)}
                                            </p>
                                            <p className="text-xs text-gray-600">{analysis.wcagLevelWhite}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Contrast with Black</p>
                                            <p className="text-lg font-bold text-gray-700">
                                                {formatContrastRatio(analysis.contrastWithBlack)}
                                            </p>
                                            <p className="text-xs text-gray-600">{analysis.wcagLevelBlack}</p>
                                        </div>
                                    </div>

                                    {analysis.recommendations.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <h5 className="font-medium text-amber-900 mb-1">Recommendations</h5>
                                            <ul className="text-sm text-amber-800 space-y-1">
                                                {analysis.recommendations.map((rec, index) => (
                                                    <li key={index}>• {rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <button
                        onClick={() => setSelectedColor(null)}
                        className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Close Analysis
                    </button>
                </div>
            )}
        </div>
    );
};

export default AccessibilityPanel;