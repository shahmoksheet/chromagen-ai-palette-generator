/**
 * @vitest-environment jsdom
 */

// Integration tests for error handling system

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import OfflineIndicator from '../OfflineIndicator';

// Mock the error logger to avoid issues in test environment
vi.mock('../../utils/errorLogger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarning: vi.fn(),
  ErrorLogLevel: {
    ERROR: 'error',
    INFO: 'info',
    WARN: 'warn',
  },
}));

// Mock the offline detection hook
vi.mock('../../hooks/useOfflineDetection', () => ({
  useOfflineDetection: () => ({
    isOnline: true,
    wasOffline: false,
    offlineDuration: 0,
    isSlowConnection: false,
    networkStatus: null,
    retry: vi.fn(),
  }),
}));

describe('Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error boundary without errors', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render offline indicator', () => {
    // Mock offline state
    vi.mocked(require('../../hooks/useOfflineDetection').useOfflineDetection).mockReturnValue({
      isOnline: false,
      wasOffline: true,
      offlineDuration: 5000,
      isSlowConnection: false,
      networkStatus: null,
      retry: vi.fn(),
    });

    render(<OfflineIndicator showDetails={true} />);

    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('should show reconnected message', () => {
    // Mock reconnected state
    vi.mocked(require('../../hooks/useOfflineDetection').useOfflineDetection).mockReturnValue({
      isOnline: true,
      wasOffline: true,
      offlineDuration: 5000,
      isSlowConnection: false,
      networkStatus: null,
      retry: vi.fn(),
    });

    render(<OfflineIndicator showDetails={true} />);

    // The component should show reconnected message initially
    expect(screen.getByText('Back online!')).toBeInTheDocument();
  });

  it('should show slow connection warning', () => {
    // Mock slow connection state
    vi.mocked(require('../../hooks/useOfflineDetection').useOfflineDetection).mockReturnValue({
      isOnline: true,
      wasOffline: false,
      offlineDuration: 0,
      isSlowConnection: true,
      networkStatus: {
        isOnline: true,
        isSlowConnection: true,
        connectionType: 'cellular',
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 300,
        saveData: true,
      },
      retry: vi.fn(),
    });

    render(<OfflineIndicator showDetails={true} />);

    expect(screen.getByText('Slow connection')).toBeInTheDocument();
    expect(screen.getByText('(2g)')).toBeInTheDocument();
  });

  it('should not render offline indicator when online and no issues', () => {
    // Mock normal online state
    vi.mocked(require('../../hooks/useOfflineDetection').useOfflineDetection).mockReturnValue({
      isOnline: true,
      wasOffline: false,
      offlineDuration: 0,
      isSlowConnection: false,
      networkStatus: {
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'wifi',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      },
      retry: vi.fn(),
    });

    const { container } = render(<OfflineIndicator />);

    // Should not render anything when everything is normal
    expect(container.firstChild).toBeNull();
  });
});