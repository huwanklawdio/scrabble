import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameControls } from './GameControls';
import type { GamePhase } from '../types/game';

describe('GameControls Component', () => {
  const defaultProps = {
    gamePhase: 'playing' as GamePhase,
    isCurrentPlayer: true,
    canSubmit: true,
    canPass: true,
    canExchange: true,
    hasSelectedTiles: false,
    placedTilesCount: 0,
    onSubmit: vi.fn(),
    onPass: vi.fn(),
    onExchange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('keydown', vi.fn());
  });

  describe('Rendering', () => {
    it('renders the game controls with title', () => {
      render(<GameControls {...defaultProps} />);
      
      expect(screen.getByText('Game Controls')).toBeInTheDocument();
      expect(screen.getByText('🎮')).toBeInTheDocument();
    });

    it('displays primary action buttons', () => {
      render(<GameControls {...defaultProps} />);
      
      expect(screen.getByText('Submit Move')).toBeInTheDocument();
      expect(screen.getByText('Pass Turn')).toBeInTheDocument();
      expect(screen.getByText('Exchange Tiles')).toBeInTheDocument();
    });

    it('shows placed tiles count when tiles are placed', () => {
      render(<GameControls {...defaultProps} placedTilesCount={3} />);
      
      expect(screen.getByText('3 tiles placed on board')).toBeInTheDocument();
    });

    it('shows singular tile text for one tile', () => {
      render(<GameControls {...defaultProps} placedTilesCount={1} />);
      
      expect(screen.getByText('1 tile placed on board')).toBeInTheDocument();
    });

    it('displays advanced controls when enabled', () => {
      render(<GameControls 
        {...defaultProps} 
        showAdvancedControls 
        onClear={vi.fn()}
        onUndo={vi.fn()}
        onHint={vi.fn()}
        onShuffle={vi.fn()}
      />);
      
      expect(screen.getByText('Clear Board')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Hint')).toBeInTheDocument();
      expect(screen.getByText('Shuffle')).toBeInTheDocument();
    });

    it('hides advanced controls when disabled', () => {
      render(<GameControls 
        {...defaultProps} 
        showAdvancedControls={false}
        onClear={vi.fn()}
        onUndo={vi.fn()}
        onHint={vi.fn()}
        onShuffle={vi.fn()}
      />);
      
      expect(screen.queryByText('Clear Board')).not.toBeInTheDocument();
      expect(screen.queryByText('Undo')).not.toBeInTheDocument();
      expect(screen.queryByText('Hint')).not.toBeInTheDocument();
      expect(screen.queryByText('Shuffle')).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('enables submit button when canSubmit is true', () => {
      render(<GameControls {...defaultProps} canSubmit />);
      
      const submitButton = screen.getByText('Submit Move').closest('button');
      expect(submitButton).not.toBeDisabled();
    });

    it('disables submit button when canSubmit is false', () => {
      render(<GameControls {...defaultProps} canSubmit={false} />);
      
      const submitButton = screen.getByText('Submit Move').closest('button');
      expect(submitButton).toBeDisabled();
    });

    it('disables all buttons when isSubmitting is true', () => {
      render(<GameControls {...defaultProps} isSubmitting />);
      
      expect(screen.getByText('Submit Move').closest('button')).toBeDisabled();
      expect(screen.getByText('Pass Turn').closest('button')).toBeDisabled();
      expect(screen.getByText('Exchange Tiles').closest('button')).toBeDisabled();
    });

    it('shows loading state on submit button when submitting', () => {
      render(<GameControls {...defaultProps} isSubmitting />);
      
      const submitButton = screen.getByText('Submit Move').closest('button');
      expect(submitButton?.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('disables clear button when no tiles are placed', () => {
      render(<GameControls {...defaultProps} onClear={vi.fn()} placedTilesCount={0} />);
      
      const clearButton = screen.getByText('Clear Board').closest('button');
      expect(clearButton).toBeDisabled();
    });

    it('enables clear button when tiles are placed', () => {
      render(<GameControls {...defaultProps} onClear={vi.fn()} placedTilesCount={2} />);
      
      const clearButton = screen.getByText('Clear Board').closest('button');
      expect(clearButton).not.toBeDisabled();
    });
  });

  describe('Button Interactions', () => {
    it('calls onSubmit when submit button is clicked', () => {
      const onSubmit = vi.fn();
      render(<GameControls {...defaultProps} onSubmit={onSubmit} />);
      
      fireEvent.click(screen.getByText('Submit Move'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('calls onPass when pass button is clicked', () => {
      const onPass = vi.fn();
      render(<GameControls {...defaultProps} onPass={onPass} />);
      
      fireEvent.click(screen.getByText('Pass Turn'));
      expect(onPass).toHaveBeenCalledTimes(1);
    });

    it('calls onExchange when exchange button is clicked', () => {
      const onExchange = vi.fn();
      render(<GameControls {...defaultProps} onExchange={onExchange} />);
      
      fireEvent.click(screen.getByText('Exchange Tiles'));
      expect(onExchange).toHaveBeenCalledTimes(1);
    });

    it('calls onClear when clear button is clicked', () => {
      const onClear = vi.fn();
      render(<GameControls {...defaultProps} onClear={onClear} placedTilesCount={1} />);
      
      fireEvent.click(screen.getByText('Clear Board'));
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('calls onUndo when undo button is clicked', () => {
      const onUndo = vi.fn();
      render(<GameControls {...defaultProps} onUndo={onUndo} />);
      
      fireEvent.click(screen.getByText('Undo'));
      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('calls onHint when hint button is clicked', () => {
      const onHint = vi.fn();
      render(<GameControls {...defaultProps} onHint={onHint} />);
      
      fireEvent.click(screen.getByText('Hint'));
      expect(onHint).toHaveBeenCalledTimes(1);
    });

    it('calls onShuffle when shuffle button is clicked', () => {
      const onShuffle = vi.fn();
      render(<GameControls {...defaultProps} onShuffle={onShuffle} />);
      
      fireEvent.click(screen.getByText('Shuffle'));
      expect(onShuffle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('triggers onSubmit when Enter is pressed', async () => {
      const onSubmit = vi.fn();
      render(<GameControls {...defaultProps} onSubmit={onSubmit} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('triggers onPass when P is pressed', async () => {
      const onPass = vi.fn();
      render(<GameControls {...defaultProps} onPass={onPass} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 'p' });
      expect(onPass).toHaveBeenCalledTimes(1);
    });

    it('triggers onExchange when E is pressed', async () => {
      const onExchange = vi.fn();
      render(<GameControls {...defaultProps} onExchange={onExchange} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 'e' });
      expect(onExchange).toHaveBeenCalledTimes(1);
    });

    it('triggers onClear when C is pressed', async () => {
      const onClear = vi.fn();
      render(<GameControls {...defaultProps} onClear={onClear} placedTilesCount={1} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 'c' });
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('triggers onUndo when Ctrl+Z is pressed', async () => {
      const onUndo = vi.fn();
      render(<GameControls {...defaultProps} onUndo={onUndo} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('triggers onHint when H is pressed', async () => {
      const onHint = vi.fn();
      render(<GameControls {...defaultProps} onHint={onHint} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 'h' });
      expect(onHint).toHaveBeenCalledTimes(1);
    });

    it('triggers onShuffle when S is pressed', async () => {
      const onShuffle = vi.fn();
      render(<GameControls {...defaultProps} onShuffle={onShuffle} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 's' });
      expect(onShuffle).toHaveBeenCalledTimes(1);
    });

    it('ignores keyboard shortcuts when disabled', () => {
      const onSubmit = vi.fn();
      render(<GameControls {...defaultProps} onSubmit={onSubmit} enableKeyboardShortcuts={false} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('ignores keyboard shortcuts when not current player', () => {
      const onSubmit = vi.fn();
      render(<GameControls {...defaultProps} onSubmit={onSubmit} isCurrentPlayer={false} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('ignores keyboard shortcuts when typing in input', () => {
      const onSubmit = vi.fn();
      render(
        <div>
          <input data-testid="text-input" />
          <GameControls {...defaultProps} onSubmit={onSubmit} enableKeyboardShortcuts />
        </div>
      );
      
      const input = screen.getByTestId('text-input');
      input.focus();
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('respects button disabled state for keyboard shortcuts', () => {
      const onSubmit = vi.fn();
      render(<GameControls {...defaultProps} onSubmit={onSubmit} canSubmit={false} enableKeyboardShortcuts />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Game States', () => {
    it('shows waiting message when not current player', () => {
      render(<GameControls {...defaultProps} isCurrentPlayer={false} />);
      
      expect(screen.getByText('Waiting for your turn...')).toBeInTheDocument();
      expect(screen.queryByText('Submit Move')).not.toBeInTheDocument();
    });

    it('shows setup message during setup phase', () => {
      render(<GameControls {...defaultProps} gamePhase="setup" />);
      
      expect(screen.getByText('Game is being set up...')).toBeInTheDocument();
      expect(screen.queryByText('Submit Move')).not.toBeInTheDocument();
    });

    it('shows finished message when game is finished', () => {
      render(<GameControls {...defaultProps} gamePhase="finished" />);
      
      expect(screen.getByText('Game has finished')).toBeInTheDocument();
      expect(screen.queryByText('Submit Move')).not.toBeInTheDocument();
    });

    it('shows controls only during playing phase for current player', () => {
      render(<GameControls {...defaultProps} gamePhase="playing" isCurrentPlayer />);
      
      expect(screen.getByText('Submit Move')).toBeInTheDocument();
      expect(screen.queryByText('Waiting for your turn...')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies compact styling', () => {
      render(<GameControls {...defaultProps} compact />);
      
      // Should still render controls but potentially smaller
      expect(screen.getByText('Game Controls')).toBeInTheDocument();
      expect(screen.getByText('Submit Move')).toBeInTheDocument();
    });

    it('applies vertical orientation', () => {
      render(<GameControls {...defaultProps} orientation="vertical" />);
      
      expect(screen.getByText('Submit Move')).toBeInTheDocument();
      expect(screen.getByText('Pass Turn')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<GameControls {...defaultProps} className="custom-controls" />);
      
      expect(container.firstChild?.className).toContain('custom-controls');
    });

    it('shows keyboard shortcuts help when enabled and not compact', () => {
      render(<GameControls {...defaultProps} enableKeyboardShortcuts compact={false} />);
      
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('hides keyboard shortcuts help in compact mode', () => {
      render(<GameControls {...defaultProps} enableKeyboardShortcuts compact />);
      
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });

    it('expands keyboard shortcuts help when clicked', async () => {
      const user = userEvent.setup();
      render(<GameControls {...defaultProps} enableKeyboardShortcuts compact={false} />);
      
      const shortcutsToggle = screen.getByText('Keyboard Shortcuts');
      await user.click(shortcutsToggle);
      
      expect(screen.getByText('Enter: Submit Move')).toBeInTheDocument();
      expect(screen.getByText('P: Pass Turn')).toBeInTheDocument();
    });
  });

  describe('Button Variants and Icons', () => {
    it('displays button icons', () => {
      render(<GameControls {...defaultProps} />);
      
      expect(screen.getByText('✓')).toBeInTheDocument(); // Submit
      expect(screen.getByText('⏭')).toBeInTheDocument(); // Pass
      expect(screen.getByText('🔄')).toBeInTheDocument(); // Exchange
    });

    it('shows keyboard shortcut indicators', () => {
      render(<GameControls {...defaultProps} enableKeyboardShortcuts />);
      
      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('P')).toBeInTheDocument();
      expect(screen.getByText('E')).toBeInTheDocument();
    });

    it('hides keyboard shortcut indicators when disabled', () => {
      render(<GameControls {...defaultProps} enableKeyboardShortcuts={false} />);
      
      expect(screen.queryByText('Enter')).not.toBeInTheDocument();
      expect(screen.queryByText('P')).not.toBeInTheDocument();
      expect(screen.queryByText('E')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional callbacks gracefully', () => {
      render(<GameControls {...defaultProps} />);
      
      // Should render without advanced controls when callbacks are not provided
      expect(screen.getByText('Submit Move')).toBeInTheDocument();
      expect(screen.queryByText('Clear Board')).not.toBeInTheDocument();
    });

    it('handles zero placed tiles count', () => {
      render(<GameControls {...defaultProps} placedTilesCount={0} />);
      
      expect(screen.queryByText('0 tiles placed on board')).not.toBeInTheDocument();
    });

    it('prevents multiple rapid submissions', () => {
      const onSubmit = vi.fn();
      render(<GameControls {...defaultProps} onSubmit={onSubmit} isSubmitting />);
      
      const submitButton = screen.getByText('Submit Move');
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      
      // Should not call onSubmit because button is disabled during submission
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});