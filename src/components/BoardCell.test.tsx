import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardCell } from './BoardCell';
import type { BoardCell as BoardCellType, Tile } from '../types/game';

describe('BoardCell Component', () => {
  const mockCell: BoardCellType = {
    row: 0,
    col: 0,
    tile: null,
    isEmpty: true,
    premiumType: null,
  };

  const mockTile: Tile = {
    id: 'tile-1',
    letter: 'A',
    points: 1,
    isBlank: false,
  };

  const defaultProps = {
    cell: mockCell,
    row: 0,
    col: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders an empty cell', () => {
      render(<BoardCell {...defaultProps} />);
      const cell = screen.getByTestId('cell-0-0');
      expect(cell).toBeInTheDocument();
    });

    it('renders a cell with a tile', () => {
      const cellWithTile = { ...mockCell, tile: mockTile, isEmpty: false };
      render(<BoardCell {...defaultProps} cell={cellWithTile} />);
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders premium square labels', () => {
      const premiumCell = { ...mockCell, premiumType: 'TW' as const };
      render(<BoardCell {...defaultProps} cell={premiumCell} />);
      
      expect(screen.getByText('TW')).toBeInTheDocument();
    });

    it('renders center star correctly', () => {
      const centerCell = { ...mockCell, premiumType: 'center' as const };
      render(<BoardCell {...defaultProps} cell={centerCell} />);
      
      expect(screen.getByText('★')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<BoardCell {...defaultProps} onClick={onClick} />);
      
      fireEvent.click(screen.getByTestId('cell-0-0'));
      expect(onClick).toHaveBeenCalledWith(0, 0);
    });

    it('calls onMouseEnter when hovered', () => {
      const onMouseEnter = vi.fn();
      render(<BoardCell {...defaultProps} onMouseEnter={onMouseEnter} />);
      
      fireEvent.mouseEnter(screen.getByTestId('cell-0-0'));
      expect(onMouseEnter).toHaveBeenCalledWith(0, 0);
    });

    it('does not call event handlers when disabled', () => {
      const onClick = vi.fn();
      const onMouseEnter = vi.fn();
      
      render(
        <BoardCell
          {...defaultProps}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          disabled
        />
      );
      
      const cell = screen.getByTestId('cell-0-0');
      fireEvent.click(cell);
      fireEvent.mouseEnter(cell);
      
      expect(onClick).not.toHaveBeenCalled();
      expect(onMouseEnter).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('handles dragOver event', () => {
      render(<BoardCell {...defaultProps} />);
      const cell = screen.getByTestId('cell-0-0');
      
      const event = new Event('dragover', { bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'dataTransfer', {
        value: { dropEffect: '' },
      });
      
      fireEvent(cell, event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('handles drop event with valid tile data', () => {
      const onDrop = vi.fn();
      render(<BoardCell {...defaultProps} onDrop={onDrop} />);
      const cell = screen.getByTestId('cell-0-0');
      
      const event = new Event('drop', { bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          getData: vi.fn(() => JSON.stringify(mockTile)),
        },
      });
      
      fireEvent(cell, event);
      expect(onDrop).toHaveBeenCalledWith(0, 0, mockTile);
    });

    it('does not allow drop on occupied cells', () => {
      const onDrop = vi.fn();
      const occupiedCell = { ...mockCell, tile: mockTile, isEmpty: false };
      
      render(<BoardCell {...defaultProps} cell={occupiedCell} onDrop={onDrop} />);
      const cell = screen.getByTestId('cell-0-0');
      
      const event = new Event('drop', { bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          getData: vi.fn(() => JSON.stringify(mockTile)),
        },
      });
      
      fireEvent(cell, event);
      expect(onDrop).not.toHaveBeenCalled();
    });

    it('handles dragEnter and dragLeave events', () => {
      const onDragEnter = vi.fn();
      const onDragLeave = vi.fn();
      
      render(
        <BoardCell
          {...defaultProps}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        />
      );
      
      const cell = screen.getByTestId('cell-0-0');
      
      fireEvent.dragEnter(cell);
      expect(onDragEnter).toHaveBeenCalledWith(0, 0);
      
      // Note: dragLeave is called when dragCounter reaches 0
      fireEvent.dragLeave(cell);
    });
  });

  describe('Styling', () => {
    it('applies highlight classes when highlighted', () => {
      render(<BoardCell {...defaultProps} isHighlighted />);
      const cell = screen.getByTestId('cell-0-0');
      
      expect(cell.className).toContain('ring-2');
      expect(cell.className).toContain('ring-blue-400');
    });

    it('applies selected classes when selected', () => {
      render(<BoardCell {...defaultProps} isSelected />);
      const cell = screen.getByTestId('cell-0-0');
      
      expect(cell.className).toContain('ring-2');
      expect(cell.className).toContain('ring-offset-2');
    });

    it('applies drag over classes', () => {
      render(<BoardCell {...defaultProps} isDragOver isValidDropTarget />);
      const cell = screen.getByTestId('cell-0-0');
      
      expect(cell.className).toContain('ring-green-500');
      expect(cell.className).toContain('scale-105');
    });

    it('applies invalid drop target classes', () => {
      render(<BoardCell {...defaultProps} isDragOver isValidDropTarget={false} />);
      const cell = screen.getByTestId('cell-0-0');
      
      expect(cell.className).toContain('ring-red-500');
      expect(cell.className).toContain('opacity-50');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<BoardCell {...defaultProps} row={7} col={4} />);
      const cell = screen.getByTestId('cell-7-4');
      
      expect(cell).toHaveAttribute('role', 'gridcell');
      expect(cell).toHaveAttribute('aria-label', 'Row 8, Column E, Empty');
      expect(cell).toHaveAttribute('aria-rowindex', '8');
      expect(cell).toHaveAttribute('aria-colindex', '5');
    });

    it('has correct ARIA label for tiles', () => {
      const cellWithTile = { ...mockCell, tile: mockTile, isEmpty: false };
      render(<BoardCell {...defaultProps} cell={cellWithTile} />);
      const cell = screen.getByTestId('cell-0-0');
      
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column A, A worth 1 points');
    });

    it('has correct ARIA label for premium squares', () => {
      const premiumCell = { ...mockCell, premiumType: 'TW' as const };
      render(<BoardCell {...defaultProps} cell={premiumCell} />);
      const cell = screen.getByTestId('cell-0-0');
      
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column A, Triple Word Score');
    });

    it('is keyboard accessible when not disabled', () => {
      render(<BoardCell {...defaultProps} />);
      const cell = screen.getByTestId('cell-0-0');
      
      expect(cell).toHaveAttribute('tabIndex', '0');
    });

    it('is not keyboard accessible when disabled', () => {
      render(<BoardCell {...defaultProps} disabled />);
      const cell = screen.getByTestId('cell-0-0');
      
      expect(cell).toHaveAttribute('tabIndex', '-1');
      expect(cell).toHaveAttribute('aria-disabled', 'true');
    });
  });
});