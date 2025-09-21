import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface OnboardingStep {
  id: string;
  title: string;
  content: React.ReactNode;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    text: string;
    onClick: () => void;
  };
}

export interface OnboardingFlowProps {
  steps: OnboardingStep[];
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  steps,
  isVisible,
  onComplete,
  onSkip,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (!isVisible || !currentStepData?.target) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(currentStepData.target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      
      // Calculate position for overlay
      const rect = element.getBoundingClientRect();
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;
      
      setOverlayPosition({
        x: rect.left + scrollX,
        y: rect.top + scrollY,
        width: rect.width,
        height: rect.height
      });

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, currentStepData, isVisible]);

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    if (currentStepData.action) {
      currentStepData.action.onClick();
    }
    nextStep();
  };

  if (!isVisible) return null;

  const tooltipContent = (
    <div className={`fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentStepData.title}
          </h3>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-gray-700 leading-relaxed">
          {currentStepData.content}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          {/* Step indicator */}
          <div className="flex items-center space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep
                    ? 'bg-indigo-600'
                    : index < currentStep
                    ? 'bg-indigo-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            )}
            
            {currentStepData.action ? (
              <button
                onClick={handleAction}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                {currentStepData.action.text}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                {isLastStep ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-40">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Highlight target element */}
      {targetElement && (
        <div
          className="absolute border-4 border-indigo-500 rounded-lg shadow-lg"
          style={{
            left: overlayPosition.x - 4,
            top: overlayPosition.y - 4,
            width: overlayPosition.width + 8,
            height: overlayPosition.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute"
        style={{
          left: targetElement 
            ? overlayPosition.x + overlayPosition.width + 20
            : '50%',
          top: targetElement 
            ? overlayPosition.y
            : '50%',
          transform: targetElement 
            ? 'none'
            : 'translate(-50%, -50%)'
        }}
      >
        {tooltipContent}
      </div>
    </div>,
    document.body
  );
};

export default OnboardingFlow;