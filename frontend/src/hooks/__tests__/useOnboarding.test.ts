import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from '../useOnboarding';
import { OnboardingStep } from '../../components/OnboardingFlow';

const mockSteps: OnboardingStep[] = [
  {
    id: 'step1',
    title: 'Step 1',
    content: 'First step content'
  },
  {
    id: 'step2',
    title: 'Step 2',
    content: 'Second step content'
  }
];

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.gtag for analytics
Object.defineProperty(window, 'gtag', {
  value: jest.fn(),
  writable: true
});

describe('useOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    expect(result.current.isVisible).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.steps).toEqual(mockSteps);
    expect(result.current.hasCompletedOnboarding).toBe(false);
  });

  it('checks localStorage for completion status on mount', () => {
    localStorageMock.getItem.mockReturnValue('true');

    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('chromagen-onboarding-completed');
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });

  it('auto-starts onboarding when not completed and autoStart is true', (done) => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: true })
    );

    // Initially not visible
    expect(result.current.isVisible).toBe(false);

    // Should become visible after timeout
    setTimeout(() => {
      expect(result.current.isVisible).toBe(true);
      done();
    }, 1100);
  });

  it('does not auto-start when already completed', () => {
    localStorageMock.getItem.mockReturnValue('true');

    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: true })
    );

    expect(result.current.isVisible).toBe(false);
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });

  it('starts onboarding manually', () => {
    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    act(() => {
      result.current.startOnboarding();
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('completes onboarding and saves to localStorage', () => {
    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    act(() => {
      result.current.startOnboarding();
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.completeOnboarding();
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('chromagen-onboarding-completed', 'true');
  });

  it('skips onboarding and saves to localStorage', () => {
    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    act(() => {
      result.current.startOnboarding();
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.skipOnboarding();
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('chromagen-onboarding-completed', 'true');
  });

  it('resets onboarding state', () => {
    localStorageMock.getItem.mockReturnValue('true');

    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    expect(result.current.hasCompletedOnboarding).toBe(true);

    act(() => {
      result.current.resetOnboarding();
    });

    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.isVisible).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('chromagen-onboarding-completed');
  });

  it('uses custom storage key', () => {
    const customKey = 'custom-onboarding-key';
    
    renderHook(() => 
      useOnboarding({ 
        steps: mockSteps, 
        autoStart: false,
        storageKey: customKey
      })
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith(customKey);
  });

  it('tracks completion with analytics when gtag is available', () => {
    const mockGtag = jest.fn();
    (window as any).gtag = mockGtag;

    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    act(() => {
      result.current.startOnboarding();
    });

    act(() => {
      result.current.completeOnboarding();
    });

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_completed', {
      event_category: 'engagement',
      event_label: 'user_education'
    });
  });

  it('tracks skip with analytics when gtag is available', () => {
    const mockGtag = jest.fn();
    (window as any).gtag = mockGtag;

    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    act(() => {
      result.current.startOnboarding();
    });

    act(() => {
      result.current.skipOnboarding();
    });

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_skipped', {
      event_category: 'engagement',
      event_label: 'user_education',
      value: 0
    });
  });

  it('handles missing gtag gracefully', () => {
    delete (window as any).gtag;

    const { result } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: false })
    );

    act(() => {
      result.current.startOnboarding();
    });

    // Should not throw error
    act(() => {
      result.current.completeOnboarding();
    });

    expect(result.current.hasCompletedOnboarding).toBe(true);
  });

  it('cleans up timeout on unmount', () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => 
      useOnboarding({ steps: mockSteps, autoStart: true })
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    jest.useRealTimers();
  });
});