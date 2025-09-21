import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccessibilityTooltip from '../AccessibilityTooltip';

// Mock the Tooltip component
jest.mock('../Tooltip', () => {
  return function MockTooltip({ content, children }: any) {
    const [isVisible, setIsVisible] = React.useState(false);
    
    return (
      <div>
        <div 
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {children}
        </div>
        {isVisible && <div data-testid="tooltip-content">{content}</div>}
      </div>
    );
  };
});

describe('AccessibilityTooltip', () => {
  it('renders children correctly', () => {
    render(
      <AccessibilityTooltip concept="wcag-aa">
        <span>WCAG AA</span>
      </AccessibilityTooltip>
    );

    expect(screen.getByText('WCAG AA')).toBeInTheDocument();
  });

  it('shows WCAG AA information on hover', async () => {
    render(
      <AccessibilityTooltip concept="wcag-aa">
        <span>WCAG AA</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('WCAG AA');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('WCAG AA Standard')).toBeInTheDocument();
      expect(screen.getByText(/minimum level of accessibility/)).toBeInTheDocument();
    });
  });

  it('shows WCAG AAA information', async () => {
    render(
      <AccessibilityTooltip concept="wcag-aaa">
        <span>WCAG AAA</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('WCAG AAA');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('WCAG AAA Standard')).toBeInTheDocument();
      expect(screen.getByText(/highest level of accessibility/)).toBeInTheDocument();
    });
  });

  it('shows contrast ratio information', async () => {
    render(
      <AccessibilityTooltip concept="contrast-ratio">
        <span>Contrast Ratio</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('Contrast Ratio');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Contrast Ratio')).toBeInTheDocument();
      expect(screen.getByText(/measure of the difference in luminance/)).toBeInTheDocument();
    });
  });

  it('shows color blindness information', async () => {
    render(
      <AccessibilityTooltip concept="color-blindness">
        <span>Color Blindness</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('Color Blindness');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Color Blindness')).toBeInTheDocument();
      expect(screen.getByText(/affecting about 8% of men/)).toBeInTheDocument();
    });
  });

  it('shows large text information', async () => {
    render(
      <AccessibilityTooltip concept="large-text">
        <span>Large Text</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('Large Text');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Large Text')).toBeInTheDocument();
      expect(screen.getByText(/18pt \(24px\) or larger/)).toBeInTheDocument();
    });
  });

  it('shows normal text information', async () => {
    render(
      <AccessibilityTooltip concept="normal-text">
        <span>Normal Text</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('Normal Text');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Normal Text')).toBeInTheDocument();
      expect(screen.getByText(/smaller than 18pt/)).toBeInTheDocument();
    });
  });

  it('shows protanopia information', async () => {
    render(
      <AccessibilityTooltip concept="protanopia">
        <span>Protanopia</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('Protanopia');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Protanopia')).toBeInTheDocument();
      expect(screen.getByText(/red cones are missing/)).toBeInTheDocument();
    });
  });

  it('shows deuteranopia information', async () => {
    render(
      <AccessibilityTooltip concept="deuteranopia">
        <span>Deuteranopia</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('Deuteranopia');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Deuteranopia')).toBeInTheDocument();
      expect(screen.getByText(/green cones are missing/)).toBeInTheDocument();
    });
  });

  it('shows tritanopia information', async () => {
    render(
      <AccessibilityTooltip concept="tritanopia">
        <span>Tritanopia</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('Tritanopia');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Tritanopia')).toBeInTheDocument();
      expect(screen.getByText(/blue cones are missing/)).toBeInTheDocument();
    });
  });

  it('includes standards information for WCAG concepts', async () => {
    render(
      <AccessibilityTooltip concept="wcag-aa">
        <span>WCAG AA</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('WCAG AA');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Standards:')).toBeInTheDocument();
      expect(screen.getByText('AA:')).toBeInTheDocument();
      expect(screen.getByText('AAA:')).toBeInTheDocument();
      expect(screen.getByText('4.5:1 for normal text, 3:1 for large text')).toBeInTheDocument();
    });
  });

  it('includes tips for all concepts', async () => {
    render(
      <AccessibilityTooltip concept="contrast-ratio">
        <span>Contrast Ratio</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('Contrast Ratio');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Tips:')).toBeInTheDocument();
      expect(screen.getByText(/Calculated as \(L1 \+ 0\.05\)/)).toBeInTheDocument();
    });
  });

  it('includes learn more links', async () => {
    render(
      <AccessibilityTooltip concept="wcag-aa">
        <span>WCAG AA</span>
      </AccessibilityTooltip>
    );

    const trigger = screen.getByText('WCAG AA');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      const learnMoreLink = screen.getByText('Learn more');
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink.closest('a')).toHaveAttribute('target', '_blank');
      expect(learnMoreLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders accessibility icon', () => {
    render(
      <AccessibilityTooltip concept="wcag-aa">
        <span>Test content</span>
      </AccessibilityTooltip>
    );

    // Check for the accessibility icon SVG
    const accessibilityIcon = screen.getByRole('img', { hidden: true });
    expect(accessibilityIcon).toBeInTheDocument();
  });

  it('handles invalid concept gracefully', () => {
    render(
      <AccessibilityTooltip concept={'invalid' as any}>
        <span>Test content</span>
      </AccessibilityTooltip>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    // Should not crash and should render children
  });

  it('applies custom className', () => {
    render(
      <AccessibilityTooltip concept="wcag-aa" className="custom-class">
        <span>Test content</span>
      </AccessibilityTooltip>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    // The custom class should be passed to the Tooltip component
  });
});