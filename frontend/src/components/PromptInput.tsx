import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Lightbulb, Keyboard } from 'lucide-react';
import { TextGenerationRequest, GenerationResponse } from '../types/api';
import { useScreenSize, useMobileInteractions, getResponsiveTextClasses } from '../utils/responsive';

interface PromptInputProps {
  onSubmit: (request: TextGenerationRequest) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  maxLength?: number;
  showExamples?: boolean;
  onGenerated?: (response: GenerationResponse) => void;
}

const EXAMPLE_PROMPTS = [
  "Energetic palette for fitness brand inspired by tropical sunset",
  "Calming colors for meditation app with ocean vibes",
  "Bold and modern palette for tech startup",
  "Warm autumn colors for cozy coffee shop",
  "Professional corporate colors with trustworthy feel",
  "Vibrant gaming palette with neon accents",
  "Minimalist palette for luxury fashion brand",
  "Nature-inspired colors for eco-friendly product",
];

const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl + Enter', action: 'Submit prompt' },
  { key: 'Ctrl + K', action: 'Clear input' },
  { key: 'Ctrl + E', action: 'Show examples' },
];

const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isLoading,
  placeholder = "Describe your ideal color palette...",
  maxLength = 500,
  showExamples = true,
  onGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [showExamplesList, setShowExamplesList] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Responsive hooks
  const { isMobile, isTablet } = useScreenSize();
  const { getTouchProps } = useMobileInteractions();

  // Update character count and validation
  useEffect(() => {
    setCharCount(prompt.length);
    setIsValid(prompt.trim().length >= 10 && prompt.length <= maxLength);
  }, [prompt, maxLength]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (isValid && !isLoading) {
              handleSubmit();
            }
            break;
          case 'k':
            e.preventDefault();
            handleClear();
            break;
          case 'e':
            e.preventDefault();
            setShowExamplesList(!showExamplesList);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isValid, isLoading, showExamplesList]);

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    const request: TextGenerationRequest = {
      prompt: prompt.trim(),
      userId: generateSessionId(),
      options: {
        colorCount: 6,
        harmonyType: 'complementary',
        accessibilityLevel: 'AA',
        includeNeutrals: true,
      },
    };

    try {
      await onSubmit(request);
    } catch (error) {
      console.error('Failed to generate palette:', error);
    }
  };

  const handleClear = () => {
    setPrompt('');
    textareaRef.current?.focus();
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setShowExamplesList(false);
    textareaRef.current?.focus();
  };

  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getCharCountColor = () => {
    const percentage = charCount / maxLength;
    if (percentage < 0.7) return 'text-gray-500';
    if (percentage < 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
      {/* Main Input Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        data-onboarding="prompt-input"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <h3 className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} font-semibold text-gray-900`}>
              Describe Your Vision
            </h3>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {showExamples && (
              <button
                {...getTouchProps(() => setShowExamplesList(!showExamplesList))}
                className={`flex items-center space-x-1 ${getResponsiveTextClasses('text-xs', 'text-sm', 'text-sm')} text-gray-600 hover:text-gray-900 transition-colors p-2 sm:p-1 rounded-lg hover:bg-gray-100`}
                title="Show example prompts"
              >
                <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
                {!isMobile && <span>Examples</span>}
              </button>
            )}
            {!isMobile && (
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={isLoading}
              className={`w-full ${isMobile ? 'min-h-[100px] max-h-[200px] p-3 text-base' : 'min-h-[120px] max-h-[300px] p-4 text-lg'} border-0 resize-none focus:outline-none placeholder-gray-400 disabled:opacity-50`}
              style={{ lineHeight: '1.5' }}
            />
            
            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="flex items-center space-x-3 text-purple-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-medium">Generating your palette...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4 gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className={`${getResponsiveTextClasses('text-xs', 'text-sm', 'text-sm')} ${getCharCountColor()}`}>
                {charCount}/{maxLength}
              </span>
              {prompt.trim().length > 0 && prompt.trim().length < 10 && (
                <span className={`${getResponsiveTextClasses('text-xs', 'text-sm', 'text-sm')} text-amber-600`}>
                  {isMobile ? 'Min 10 chars' : 'Minimum 10 characters required'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {prompt.length > 0 && (
                <button
                  {...getTouchProps(handleClear)}
                  disabled={isLoading}
                  className={`px-3 py-2 ${getResponsiveTextClasses('text-xs', 'text-sm', 'text-sm')} text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-100`}
                >
                  Clear
                </button>
              )}
              <motion.button
                {...getTouchProps(handleSubmit)}
                disabled={!isValid || isLoading}
                whileHover={isValid && !isLoading && !isMobile ? { scale: 1.02 } : {}}
                whileTap={isValid && !isLoading ? { scale: 0.98 } : {}}
                className={`flex items-center space-x-2 ${isMobile ? 'px-4 py-3 min-h-[48px]' : 'px-6 py-2'} rounded-lg font-medium transition-all ${
                  isValid && !isLoading
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className={getResponsiveTextClasses('text-sm', 'text-base', 'text-base')}>
                  Generate
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Examples Dropdown */}
      <AnimatePresence>
        {showExamplesList && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-3 sm:p-4 border-b border-gray-100">
              <h4 className={`${getResponsiveTextClasses('text-base', 'text-lg', 'text-lg')} font-semibold text-gray-900`}>
                Example Prompts
              </h4>
              <p className={`${getResponsiveTextClasses('text-xs', 'text-sm', 'text-sm')} text-gray-600 mt-1`}>
                {isMobile ? 'Tap any example to use it' : 'Click any example to use it as your prompt'}
              </p>
            </div>
            <div className={`${isMobile ? 'max-h-48' : 'max-h-64'} overflow-y-auto`}>
              {EXAMPLE_PROMPTS.map((example, index) => (
                <motion.button
                  key={index}
                  {...getTouchProps(() => handleExampleClick(example))}
                  whileHover={!isMobile ? { backgroundColor: '#f9fafb' } : {}}
                  className="w-full text-left p-3 sm:p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <span className={`${getResponsiveTextClasses('text-sm', 'text-base', 'text-base')} text-gray-700`}>
                    {example}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts - Desktop Only */}
      <AnimatePresence>
        {showShortcuts && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900">Keyboard Shortcuts</h4>
            </div>
            <div className="p-4">
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <span className="text-gray-700">{shortcut.action}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 rounded border">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 sm:mt-6 text-center px-4 sm:px-0"
      >
        <p className={`${getResponsiveTextClasses('text-xs', 'text-sm', 'text-sm')} text-gray-600`}>
          💡 <strong>Tip:</strong> {isMobile ? 'Be specific for better results' : 'Be specific about mood, industry, or inspiration for better results'}
        </p>
      </motion.div>
    </div>
  );
};

export default PromptInput;