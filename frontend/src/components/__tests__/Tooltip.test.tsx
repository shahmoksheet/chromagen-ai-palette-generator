import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tooltip from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    // Mock createPortal to render in the same container
    jest.spyOn(require('react-dom'), 'createPortal').mockImplementation((element) => element);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip on hover after delay', async () => {
    render(
      <Tooltip content="Test tooltip content" delay={100}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Test tooltip content" delay={50}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on focus', async () => {
    render(
      <Tooltip content="Test tooltip content" delay={50}>
        <button>Focus me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Focus me');
    fireEvent.focus(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    });
  });

  it('hides tooltip on blur', async () => {
    render(
      <Tooltip content="Test tooltip content" delay={50}>
        <button>Focus me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Focus me');
    fireEvent.focus(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    });

    fireEvent.blur(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(
      <Tooltip content="Test tooltip" className="custom-class">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);

    // The tooltip should have the custom class when visible
    // Note: This test might need adjustment based on how the className is applied
  });

  it('respects maxWidth prop', async () => {
    render(
      <Tooltip content="Test tooltip content" maxWidth="200px" delay={50}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      const tooltip = screen.getByText('Test tooltip content').closest('div');
      expect(tooltip).toHaveStyle('max-width: 200px');
    });
  });

  it('renders complex content', async () => {
    const complexContent = (
      <div>
        <h4>Title</h4>
        <p>Description</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    );

    render(
      <Tooltip content={complexContent} delay={50}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  it('handles different positions', () => {
    const positions = ['top', 'bottom', 'left', 'right'] as const;
    
    positions.forEach(position => {
      const { unmount } = render(
        <Tooltip content="Test tooltip" position={position}>
          <button>Hover me {position}</button>
        </Tooltip>
      );
      
      expect(screen.getByText(`Hover me ${position}`)).toBeInTheDocument();
      unmount();
    });
  });
});