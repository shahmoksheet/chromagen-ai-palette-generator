import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PromptInput from '../PromptInput';
import { TextGenerationRequest } from '../../types/api';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Send: () => <div data-testid="send-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  Keyboard: () => <div data-testid="keyboard-icon" />,
}));

describe('PromptInput', () => {
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default placeholder', () => {
      render(<PromptInput {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Describe your ideal color palette...')).toBeInTheDocument();
      expect(screen.getByText('Describe Your Vision')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<PromptInput {...defaultProps} placeholder="Custom placeholder" />);
      
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('should show character count', () => {
      render(<PromptInput {...defaultProps} />);
      
      expect(screen.getByText('0/500')).toBeInTheDocument();
    });

    it('should show examples button when showExamples is true', () => {
      render(<PromptInput {...defaultProps} showExamples={true} />);
      
      expect(screen.getByText('Examples')).toBeInTheDocument();
    });

    it('should not show examples button when showExamples is false', () => {
      render(<PromptInput {...defaultProps} showExamples={false} />);
      
      expect(screen.queryByText('Examples')).not.toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      await user.type(textarea, 'Hello world');
      
      expect(screen.getByText('11/500')).toBeInTheDocument();
    });

    it('should show minimum character warning for short input', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      await user.type(textarea, 'Short');
      
      expect(screen.getByText('Minimum 10 characters required')).toBeInTheDocument();
    });

    it('should disable submit button for invalid input', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await user.type(textarea, 'Short');
      
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button for valid input', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await user.type(textarea, 'This is a valid prompt with enough characters');
      
      expect(submitButton).not.toBeDisabled();
    });

    it('should respect maxLength prop', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} maxLength={20} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      await user.type(textarea, 'This is a very long text that exceeds the limit');
      
      expect(screen.getByText('20/20')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is submitted', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await user.type(textarea, 'A beautiful sunset palette');
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'A beautiful sunset palette',
          options: expect.objectContaining({
            colorCount: 6,
            harmonyType: 'complementary',
            accessibilityLevel: 'AA',
            includeNeutrals: true,
          }),
        })
      );
    });

    it('should not submit when input is invalid', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await user.type(textarea, 'Short');
      await user.click(submitButton);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not submit when loading', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} isLoading={true} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await user.type(textarea, 'A beautiful sunset palette');
      await user.click(submitButton);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<PromptInput {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Generating your palette...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should disable textarea when loading', () => {
      render(<PromptInput {...defaultProps} isLoading={true} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      expect(textarea).toBeDisabled();
    });

    it('should disable submit button when loading', () => {
      render(<PromptInput {...defaultProps} isLoading={true} />);
      
      const submitButton = screen.getByRole('button', { name: /generate/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Examples Functionality', () => {
    it('should show examples list when examples button is clicked', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} showExamples={true} />);
      
      const examplesButton = screen.getByText('Examples');
      await user.click(examplesButton);
      
      expect(screen.getByText('Example Prompts')).toBeInTheDocument();
      expect(screen.getByText('Energetic palette for fitness brand inspired by tropical sunset')).toBeInTheDocument();
    });

    it('should populate textarea when example is clicked', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} showExamples={true} />);
      
      const examplesButton = screen.getByText('Examples');
      await user.click(examplesButton);
      
      const examplePrompt = screen.getByText('Energetic palette for fitness brand inspired by tropical sunset');
      await user.click(examplePrompt);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      expect(textarea).toHaveValue('Energetic palette for fitness brand inspired by tropical sunset');
    });
  });

  describe('Clear Functionality', () => {
    it('should show clear button when there is text', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      await user.type(textarea, 'Some text');
      
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should clear textarea when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      await user.type(textarea, 'Some text to clear');
      
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);
      
      expect(textarea).toHaveValue('');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should show keyboard shortcuts when keyboard button is clicked', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const keyboardButton = screen.getByTestId('keyboard-icon').closest('button');
      await user.click(keyboardButton!);
      
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Submit prompt')).toBeInTheDocument();
      expect(screen.getByText('Ctrl + Enter')).toBeInTheDocument();
    });

    it('should submit form when Ctrl+Enter is pressed with valid input', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      await user.type(textarea, 'A beautiful sunset palette');
      
      await user.keyboard('{Control>}{Enter}{/Control}');
      
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should clear input when Ctrl+K is pressed', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      await user.type(textarea, 'Text to clear');
      
      await user.keyboard('{Control>}k{/Control}');
      
      expect(textarea).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      expect(textarea).toBeInTheDocument();
      
      const submitButton = screen.getByRole('button', { name: /generate/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should focus textarea when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Describe your ideal color palette...');
      await user.type(textarea, 'Some text');
      
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);
      
      expect(textarea).toHaveFocus();
    });
  });
});