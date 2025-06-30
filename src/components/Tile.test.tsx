import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tile, TileGroup } from './Tile';
import type { Tile as TileType } from '../types/game';

describe('Tile Component', () => {
  const mockTile: TileType = {
    id: 'tile-1',
    letter: 'A',
    points: 1,
    isBlank: false,
  };

  const blankTile: TileType = {
    id: 'tile-blank',
    letter: '',
    points: 0,
    isBlank: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders a tile with letter and points', () => {
      render(<Tile tile={mockTile} />);
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders a blank tile with question mark', () => {
      render(<Tile tile={blankTile} />);
      
      expect(screen.getByText('?')).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('applies different size classes', () => {
      const { rerender } = render(<Tile tile={mockTile} size="small" />);
      let tile = screen.getByTestId('tile-tile-1');
      expect(tile.className).toContain('w-10 h-10');

      rerender(<Tile tile={mockTile} size="medium" />);
      tile = screen.getByTestId('tile-tile-1');
      expect(tile.className).toContain('w-14 h-14');

      rerender(<Tile tile={mockTile} size="large" />);
      tile = screen.getByTestId('tile-tile-1');
      expect(tile.className).toContain('w-16 h-16');
    });

    it('applies custom className', () => {
      render(<Tile tile={mockTile} className="custom-class" />);
      const tile = screen.getByTestId('tile-tile-1');
      expect(tile.className).toContain('custom-class');
    });
  });

  describe('Interaction', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<Tile tile={mockTile} onClick={onClick} />);
      
      fireEvent.click(screen.getByTestId('tile-tile-1'));
      expect(onClick).toHaveBeenCalledWith(mockTile);
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();
      render(<Tile tile={mockTile} onClick={onClick} isDisabled />);
      
      fireEvent.click(screen.getByTestId('tile-tile-1'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('applies selected styles', () => {
      render(<Tile tile={mockTile} isSelected />);
      const tile = screen.getByTestId('tile-tile-1');
      
      expect(tile.className).toContain('ring-2');
      expect(tile.className).toContain('ring-blue-500');
      expect(tile.className).toContain('scale-110');
    });

    it('applies dragging styles', () => {
      render(<Tile tile={mockTile} isDragging />);
      const tile = screen.getByTestId('tile-tile-1');
      
      expect(tile.className).toContain('opacity-50');
      expect(tile.className).toContain('scale-95');
    });

    it('applies placed styles', () => {
      render(<Tile tile={mockTile} isPlaced />);
      const tile = screen.getByTestId('tile-tile-1');
      
      expect(tile.className).toContain('bg-amber-50');
      expect(tile.className).toContain('cursor-default');
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag start', () => {
      const onDragStart = vi.fn();
      render(<Tile tile={mockTile} onDragStart={onDragStart} />);
      
      const tile = screen.getByTestId('tile-tile-1');
      const event = new Event('dragstart', { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          setData: vi.fn(),
          effectAllowed: '',
          setDragImage: vi.fn(),
        },
      });
      
      fireEvent(tile, event);
      expect(onDragStart).toHaveBeenCalledWith(mockTile);
    });

    it('handles drag end', () => {
      const onDragEnd = vi.fn();
      render(<Tile tile={mockTile} onDragEnd={onDragEnd} />);
      
      const tile = screen.getByTestId('tile-tile-1');
      fireEvent.dragEnd(tile);
      expect(onDragEnd).toHaveBeenCalledWith(mockTile);
    });

    it('prevents drag when disabled', () => {
      const onDragStart = vi.fn();
      render(<Tile tile={mockTile} onDragStart={onDragStart} isDisabled />);
      
      const tile = screen.getByTestId('tile-tile-1');
      expect(tile).toHaveAttribute('draggable', 'false');
    });

    it('prevents drag when placed', () => {
      const onDragStart = vi.fn();
      render(<Tile tile={mockTile} onDragStart={onDragStart} isPlaced />);
      
      const tile = screen.getByTestId('tile-tile-1');
      expect(tile).toHaveAttribute('draggable', 'false');
    });
  });

  describe('Blank Tile Input', () => {
    it('shows input for blank tile when showBlankInput is true', () => {
      render(<Tile tile={blankTile} showBlankInput />);
      
      const input = screen.getByPlaceholderText('?');
      expect(input).toBeInTheDocument();
    });

    it('handles blank letter assignment', () => {
      const onBlankLetterAssign = vi.fn();
      render(
        <Tile 
          tile={blankTile} 
          showBlankInput 
          onBlankLetterAssign={onBlankLetterAssign}
        />
      );
      
      const input = screen.getByPlaceholderText('?');
      fireEvent.change(input, { target: { value: 'x' } });
      fireEvent.submit(input.closest('form')!);
      
      expect(onBlankLetterAssign).toHaveBeenCalledWith('X');
    });

    it('only accepts single letters for blank tiles', () => {
      render(<Tile tile={blankTile} showBlankInput />);
      
      const input = screen.getByPlaceholderText('?') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'abc' } });
      
      expect(input.value).toBe('C'); // Only last character
    });

    it('converts lowercase to uppercase for blank tiles', () => {
      const onBlankLetterAssign = vi.fn();
      render(
        <Tile 
          tile={blankTile} 
          showBlankInput 
          onBlankLetterAssign={onBlankLetterAssign}
        />
      );
      
      const input = screen.getByPlaceholderText('?');
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.submit(input.closest('form')!);
      
      expect(onBlankLetterAssign).toHaveBeenCalledWith('A');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<Tile tile={mockTile} />);
      const tile = screen.getByTestId('tile-tile-1');
      
      expect(tile).toHaveAttribute('role', 'button');
      expect(tile).toHaveAttribute('tabIndex', '0');
      expect(tile).toHaveAttribute('aria-label', 'Tile A worth 1 points');
    });

    it('updates ARIA label for selected state', () => {
      render(<Tile tile={mockTile} isSelected />);
      const tile = screen.getByTestId('tile-tile-1');
      
      expect(tile).toHaveAttribute('aria-label', 'Tile A worth 1 points, selected');
      expect(tile).toHaveAttribute('aria-selected', 'true');
    });

    it('updates ARIA label for placed state', () => {
      render(<Tile tile={mockTile} isPlaced />);
      const tile = screen.getByTestId('tile-tile-1');
      
      expect(tile).toHaveAttribute('aria-label', 'Tile A worth 1 points, placed on board');
    });

    it('sets correct ARIA attributes when disabled', () => {
      render(<Tile tile={mockTile} isDisabled />);
      const tile = screen.getByTestId('tile-tile-1');
      
      expect(tile).toHaveAttribute('tabIndex', '-1');
      expect(tile).toHaveAttribute('aria-disabled', 'true');
    });

    it('has correct ARIA label for blank tiles', () => {
      render(<Tile tile={blankTile} />);
      const tile = screen.getByTestId('tile-tile-blank');
      
      expect(tile).toHaveAttribute('aria-label', 'Tile blank worth 0 points');
    });
  });
});

describe('TileGroup Component', () => {
  const mockTiles: TileType[] = [
    { id: 'tile-1', letter: 'A', points: 1, isBlank: false },
    { id: 'tile-2', letter: 'B', points: 3, isBlank: false },
    { id: 'tile-3', letter: 'C', points: 3, isBlank: false },
  ];

  it('renders multiple tiles', () => {
    render(<TileGroup tiles={mockTiles} />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('handles tile click with index', () => {
    const onTileClick = vi.fn();
    render(<TileGroup tiles={mockTiles} onTileClick={onTileClick} />);
    
    fireEvent.click(screen.getByText('B'));
    expect(onTileClick).toHaveBeenCalledWith(mockTiles[1], 1);
  });

  it('applies selected state to tiles', () => {
    const selectedTileIds = new Set(['tile-2']);
    render(<TileGroup tiles={mockTiles} selectedTileIds={selectedTileIds} />);
    
    const tileB = screen.getByTestId('tile-tile-2');
    expect(tileB.className).toContain('ring-2');
  });

  it('applies disabled state to tiles', () => {
    const disabledTileIds = new Set(['tile-1', 'tile-3']);
    render(<TileGroup tiles={mockTiles} disabledTileIds={disabledTileIds} />);
    
    const tileA = screen.getByTestId('tile-tile-1');
    const tileC = screen.getByTestId('tile-tile-3');
    
    expect(tileA.className).toContain('opacity-50');
    expect(tileC.className).toContain('opacity-50');
  });

  it('applies custom gap spacing', () => {
    const { container } = render(<TileGroup tiles={mockTiles} gap="gap-4" />);
    const group = container.firstChild;
    
    expect(group?.className).toContain('gap-4');
  });
});