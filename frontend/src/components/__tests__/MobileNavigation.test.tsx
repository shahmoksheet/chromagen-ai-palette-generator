import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileNavigation from '../MobileNavigation';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the responsive utilities
jest.mock('../../utils/responsive', () => ({
  useScreenSize: jest.fn(() => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  })),
  useMobileInteractions: jest.fn(() => ({
    getTouchProps: jest.fn((onClick) => ({ onClick })),
  })),
}));

describe('MobileNavigation', () => {
  const mockProps = {
    onHelpClick: jest.fn(),
    onTourClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render mobile menu button when on mobile', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuButton = screen.getByLabelText('Open menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('should not render when not on mobile', () => {
    const { useScreenSize } = require('../../utils/responsive');
    useScreenSize.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    const { container } = render(<MobileNavigation {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('should open menu when button is clicked', async () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('ChromaGen')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('Take Tour')).toBeInTheDocument();
    });
  });

  it('should close menu when close button is clicked', async () => {
    render(<MobileNavigation {...mockProps} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('ChromaGen')).toBeInTheDocument();
    });

    // Close menu
    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('ChromaGen')).not.toBeInTheDocument();
    });
  });

  it('should close menu when backdrop is clicked', async () => {
    render(<MobileNavigation {...mockProps} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('ChromaGen')).toBeInTheDocument();
    });

    // Click backdrop (the overlay div)
    const backdrop = screen.getByText('ChromaGen').closest('[class*="fixed inset-0"]');
    if (backdrop?.previousSibling) {
      fireEvent.click(backdrop.previousSibling as Element);
    }

    await waitFor(() => {
      expect(screen.queryByText('ChromaGen')).not.toBeInTheDocument();
    });
  });

  it('should call onHelpClick when Help is clicked', async () => {
    render(<MobileNavigation {...mockProps} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Help')).toBeInTheDocument();
    });

    // Click Help
    const helpButton = screen.getByText('Help');
    fireEvent.click(helpButton);

    expect(mockProps.onHelpClick).toHaveBeenCalled();
  });

  it('should call onTourClick when Take Tour is clicked', async () => {
    render(<MobileNavigation {...mockProps} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Take Tour')).toBeInTheDocument();
    });

    // Click Take Tour
    const tourButton = screen.getByText('Take Tour');
    fireEvent.click(tourButton);

    expect(mockProps.onTourClick).toHaveBeenCalled();
  });

  it('should close menu when menu item is clicked', async () => {
    render(<MobileNavigation {...mockProps} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Help')).toBeInTheDocument();
    });

    // Click Help (should close menu)
    const helpButton = screen.getByText('Help');
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.queryByText('ChromaGen')).not.toBeInTheDocument();
    });
  });

  it('should handle touch interactions', () => {
    const { useMobileInteractions } = require('../../utils/responsive');
    const mockGetTouchProps = jest.fn((onClick) => ({ onClick }));
    
    useMobileInteractions.mockReturnValue({
      getTouchProps: mockGetTouchProps,
    });

    render(<MobileNavigation {...mockProps} />);

    expect(mockGetTouchProps).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MobileNavigation {...mockProps} className="custom-nav" />
    );
    
    const menuButton = container.querySelector('button');
    expect(menuButton).toHaveClass('custom-nav');
  });

  it('should show footer text in menu', async () => {
    render(<MobileNavigation {...mockProps} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('AI-Powered Color Palette Generator')).toBeInTheDocument();
    });
  });
});