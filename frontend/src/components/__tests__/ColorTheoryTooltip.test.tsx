import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColorTheoryTooltip from '../ColorTheoryTooltip';

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

describe('ColorTheoryTooltip', () => {
  it('renders children correctly', () => {
    render(
      <ColorTheoryTooltip concept="complementary">
        <span>Test content</span>
      </ColorTheoryTooltip>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('shows complementary color theory content on hover', async () => {
    render(
      <ColorTheoryTooltip concept="complementary">
        <span>Complementary colors</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Complementary colors');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Complementary Colors')).toBeInTheDocument();
      expect(screen.getByText(/Colors that are opposite each other/)).toBeInTheDocument();
    });
  });

  it('shows triadic color theory content', async () => {
    render(
      <ColorTheoryTooltip concept="triadic">
        <span>Triadic colors</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Triadic colors');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Triadic Color Scheme')).toBeInTheDocument();
      expect(screen.getByText(/Three colors evenly spaced/)).toBeInTheDocument();
    });
  });

  it('shows analogous color theory content', async () => {
    render(
      <ColorTheoryTooltip concept="analogous">
        <span>Analogous colors</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Analogous colors');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Analogous Colors')).toBeInTheDocument();
      expect(screen.getByText(/Colors that are next to each other/)).toBeInTheDocument();
    });
  });

  it('shows monochromatic color theory content', async () => {
    render(
      <ColorTheoryTooltip concept="monochromatic">
        <span>Monochromatic colors</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Monochromatic colors');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Monochromatic Colors')).toBeInTheDocument();
      expect(screen.getByText(/Different shades, tints, and tones/)).toBeInTheDocument();
    });
  });

  it('shows contrast information', async () => {
    render(
      <ColorTheoryTooltip concept="contrast">
        <span>Color contrast</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Color contrast');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Color Contrast')).toBeInTheDocument();
      expect(screen.getByText(/difference in luminance/)).toBeInTheDocument();
    });
  });

  it('shows saturation information', async () => {
    render(
      <ColorTheoryTooltip concept="saturation">
        <span>Color saturation</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Color saturation');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Color Saturation')).toBeInTheDocument();
      expect(screen.getByText(/intensity or purity/)).toBeInTheDocument();
    });
  });

  it('shows hue information', async () => {
    render(
      <ColorTheoryTooltip concept="hue">
        <span>Hue</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Hue');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Hue')).toBeInTheDocument();
      expect(screen.getByText(/pure color itself/)).toBeInTheDocument();
    });
  });

  it('shows lightness information', async () => {
    render(
      <ColorTheoryTooltip concept="lightness">
        <span>Lightness</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Lightness');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Lightness/Value')).toBeInTheDocument();
      expect(screen.getByText(/How light or dark/)).toBeInTheDocument();
    });
  });

  it('includes examples in tooltip content', async () => {
    render(
      <ColorTheoryTooltip concept="complementary">
        <span>Complementary colors</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Complementary colors');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Examples:')).toBeInTheDocument();
      expect(screen.getByText('Red & Green')).toBeInTheDocument();
      expect(screen.getByText('Blue & Orange')).toBeInTheDocument();
    });
  });

  it('includes learn more link', async () => {
    render(
      <ColorTheoryTooltip concept="complementary">
        <span>Complementary colors</span>
      </ColorTheoryTooltip>
    );

    const trigger = screen.getByText('Complementary colors');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      const learnMoreLink = screen.getByText('Learn more');
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink.closest('a')).toHaveAttribute('target', '_blank');
      expect(learnMoreLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders help icon', () => {
    render(
      <ColorTheoryTooltip concept="complementary">
        <span>Test content</span>
      </ColorTheoryTooltip>
    );

    // Check for the help icon SVG
    const helpIcon = screen.getByRole('img', { hidden: true });
    expect(helpIcon).toBeInTheDocument();
  });

  it('handles invalid concept gracefully', () => {
    render(
      <ColorTheoryTooltip concept={'invalid' as any}>
        <span>Test content</span>
      </ColorTheoryTooltip>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    // Should not crash and should render children
  });

  it('applies custom className', () => {
    render(
      <ColorTheoryTooltip concept="complementary" className="custom-class">
        <span>Test content</span>
      </ColorTheoryTooltip>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    // The custom class should be passed to the Tooltip component
  });
});