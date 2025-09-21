import { useState, useEffect } from 'react';
import { OnboardingStep } from '../components/OnboardingFlow';

export interface UseOnboardingOptions {
  storageKey?: string;
  autoStart?: boolean;
  steps: OnboardingStep[];
}

export interface UseOnboardingReturn {
  isVisible: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  hasCompletedOnboarding: boolean;
}

const DEFAULT_STORAGE_KEY = 'chromagen-onboarding-completed';

export const useOnboarding = ({
  storageKey = DEFAULT_STORAGE_KEY,
  autoStart = true,
  steps
}: UseOnboardingOptions): UseOnboardingReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem(storageKey) === 'true';
    setHasCompletedOnboarding(completed);
    
    // Auto-start onboarding if not completed and autoStart is true
    if (!completed && autoStart) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [storageKey, autoStart]);

  const startOnboarding = () => {
    setCurrentStep(0);
    setIsVisible(true);
  };

  const completeOnboarding = () => {
    setIsVisible(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem(storageKey, 'true');
    
    // Track completion for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_completed', {
        event_category: 'engagement',
        event_label: 'user_education'
      });
    }
  };

  const skipOnboarding = () => {
    setIsVisible(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem(storageKey, 'true');
    
    // Track skip for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_skipped', {
        event_category: 'engagement',
        event_label: 'user_education',
        value: currentStep
      });
    }
  };

  const resetOnboarding = () => {
    localStorage.removeItem(storageKey);
    setHasCompletedOnboarding(false);
    setIsVisible(false);
    setCurrentStep(0);
  };

  return {
    isVisible,
    currentStep,
    steps,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    hasCompletedOnboarding
  };
};