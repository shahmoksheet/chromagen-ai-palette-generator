import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColorReasoningPanel, { ColorReasoning } from '../ColorReasoningPanel';

// Mock the tooltip components
jest.mock('../ColorTheoryTooltip', () => {
  return function MockColorTheoryTooltip({ children }: any) {
    return <div>{children}</div>;
  };
});

jest.mock('../AccessibilityTooltip', () => {
  return function MockAccessibilityTooltip({ children }: any) {
    return <div>{children}</div>;
  };
});

const mockColorReasoning: ColorReasoning[] = [
  {
    colorName: 'Ocean Blue',
    hex: '#2563eb',
    category: 'primary',
    reasoning: 'This primary blue creates a strong foundation for the palette, evoking trust and professionalism.',
    harmonyType: 'complementary',
    psychologicalEffect: 'Blue conveys trust, stability, and professionalism.',
    usageRecommendation: 'Use for primary buttons, headers, and brand elements.',
    accessibilityNotes: 'Contrast ratio with white: 7.2:1, WCAG AAA compliant.'
  },
  {
    colorName: 'Sunset Orange',
    hex: '#f97316',
    category: 'accent',
    reasoning: 'This vibrant orange provides energetic contrast to the blue primary.',
    harmonyType: 'complementary',
    psychologicalEffect: 'Orange represents enthusiasm and creativity.',
    usageRecommendation: 'Use sparingly for call-to-action buttons and highlights.',
    accessibilityNotes: 'Contrast ratio with white: 4.8:1, WCAG AA compliant.'
  }
];

describe('ColorReasoningPanel', () => {
  it('renders the panel title', () => {
    render(
      <ColorReasoningPanel
        reasoning={mockColorReasoning}
        overallExplanation="Test explanation"
      />
    );

    expect(screen.getByText('AI Color Reasoning')).toBeInTheDocument();
  });

  it('displays overall explanation when provided', () => {
    const explanation = 'This palette combines trust and energy for a balanced design.';
    render(
      <ColorReasoningPanel
        reasoning={mockColorReasoning}
        overallExplanation={explanation}
      />
    );

    expect(screen.getByText(explanation)).toBeInTheDocument();
  });

  it('displays harmony type badge when provided', () => {
    render(
      <ColorReasoningPanel
        reasoning={mockColorReasoning}
        harmonyType="complementary"
      />
    );

    expect(screen.getByText('Complementary')).toBeInTheDocument();
  });

  it('renders all color reasoning items', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    expect(screen.getByText('Ocean Blue')).toBeInTheDocument();
    expect(screen.getByText('Sunset Orange')).toBeInTheDocument();
    expect(screen.getByText('#2563eb')).toBeInTheDocument();
    expect(screen.getByText('#f97316')).toBeInTheDocument();
  });

  it('displays color categories correctly', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('accent')).toBeInTheDocument();
  });

  it('shows basic reasoning for each color', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    expect(screen.getByText(/This primary blue creates a strong foundation/)).toBeInTheDocument();
    expect(screen.getByText(/This vibrant orange provides energetic contrast/)).toBeInTheDocument();
  });

  it('expands color details when clicked', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    const expandButton = screen.getAllByRole('button')[0]; // First expand button
    fireEvent.click(expandButton);

    expect(screen.getByText('Color Harmony')).toBeInTheDocument();
    expect(screen.getByText('Psychological Effect')).toBeInTheDocument();
    expect(screen.getByText('Usage Recommendation')).toBeInTheDocument();
    expect(screen.getByText('Accessibility Notes')).toBeInTheDocument();
  });

  it('collapses expanded color when clicked again', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    const expandButton = screen.getAllByRole('button')[0];
    
    // Expand
    fireEvent.click(expandButton);
    expect(screen.getByText('Color Harmony')).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(expandButton);
    expect(screen.queryByText('Color Harmony')).not.toBeInTheDocument();
  });

  it('shows detailed information when expanded', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    const expandButton = screen.getAllByRole('button')[0];
    fireEvent.click(expandButton);

    expect(screen.getByText('complementary relationship')).toBeInTheDocument();
    expect(screen.getByText('Blue conveys trust, stability, and professionalism.')).toBeInTheDocument();
    expect(screen.getByText('Use for primary buttons, headers, and brand elements.')).toBeInTheDocument();
    expect(screen.getByText('Contrast ratio with white: 7.2:1, WCAG AAA compliant.')).toBeInTheDocument();
  });

  it('renders color swatches with correct background colors', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    const colorSwatches = screen.getAllByRole('generic').filter(el => 
      el.style.backgroundColor === 'rgb(37, 99, 235)' || el.style.backgroundColor === '#2563eb'
    );
    expect(colorSwatches.length).toBeGreaterThan(0);
  });

  it('displays category icons correctly', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    // Check for SVG icons (they should be present for primary and accent categories)
    const svgElements = screen.getAllByRole('img', { hidden: true });
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('shows help text at the bottom', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    expect(screen.getByText(/Click on colors to expand detailed explanations/)).toBeInTheDocument();
  });

  it('handles empty reasoning array', () => {
    render(
      <ColorReasoningPanel reasoning={[]} />
    );

    expect(screen.getByText('AI Color Reasoning')).toBeInTheDocument();
    // Should not crash with empty array
  });

  it('applies custom className', () => {
    const { container } = render(
      <ColorReasoningPanel
        reasoning={mockColorReasoning}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles missing optional properties gracefully', () => {
    const minimalReasoning: ColorReasoning[] = [
      {
        colorName: 'Test Color',
        hex: '#000000',
        category: 'primary',
        reasoning: 'Basic reasoning'
      }
    ];

    render(
      <ColorReasoningPanel reasoning={minimalReasoning} />
    );

    expect(screen.getByText('Test Color')).toBeInTheDocument();
    expect(screen.getByText('Basic reasoning')).toBeInTheDocument();
  });

  it('rotates expand icon when expanded', () => {
    render(
      <ColorReasoningPanel reasoning={mockColorReasoning} />
    );

    const expandButton = screen.getAllByRole('button')[0];
    const icon = expandButton.querySelector('svg');
    
    expect(icon).not.toHaveClass('rotate-180');
    
    fireEvent.click(expandButton);
    
    expect(icon).toHaveClass('rotate-180');
  });
});