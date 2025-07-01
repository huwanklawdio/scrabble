import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TileRack } from './TileRack';
import type { Tile as TileType } from '../types/game';

describe('TileRack Component', () => {
  const mockTiles: TileType[] = [
    { id: 'tile-1', letter: 'A', points: 1, isBlank: false, status: 'rack' },
    { id: 'tile-2', letter: 'R', points: 1, isBlank: false, status: 'rack' },
    { id: 'tile-3', letter: 'T', points: 1, isBlank: false, status: 'rack' },
    { id: 'tile-4', letter: 'S', points: 1, isBlank: false, status: 'rack' },
    { id: 'tile-5', letter: '', points: 0, isBlank: true, status: 'rack' },
  ];

  const defaultProps = {
    tiles: mockTiles,
    maxTiles: 7,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the tile rack with tiles', () => {
      render(<TileRack {...defaultProps} />);
      
      expect(screen.getByText('Your Tiles')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('R')).toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument(); // Blank tile
    });

    it('shows tile count when enabled', () => {
      render(<TileRack {...defaultProps} showTileCount />);
      expect(screen.getByText('(5/7)')).toBeInTheDocument();
    });

    it('hides tile count when disabled', () => {
      render(<TileRack {...defaultProps} showTileCount={false} />);
      expect(screen.queryByText('(5/7)')).not.toBeInTheDocument();
    });

    it('renders empty slots for missing tiles', () => {
      render(<TileRack {...defaultProps} />);
      
      // Should have 2 empty slots (7 max - 5 current = 2)
      const emptySlots = screen.getAllByText('·');
      expect(emptySlots).toHaveLength(2);
    });

    it('applies custom className', () => {
      const { container } = render(<TileRack {...defaultProps} className="custom-rack" />);
      expect((container.firstChild as Element)?.className).toContain('custom-rack');
    });

    it('renders in vertical orientation', () => {
      const { container } = render(<TileRack {...defaultProps} orientation="vertical" />);
      const tilesArea = container.querySelector('.flex-col');
      expect(tilesArea).toBeInTheDocument();
    });
  });

  describe('Tile Sorting', () => {
    const unsortedTiles: TileType[] = [
      { id: 'tile-1', letter: 'Z', points: 10, isBlank: false, status: 'rack' },
      { id: 'tile-2', letter: 'A', points: 1, isBlank: false, status: 'rack' },
      { id: 'tile-3', letter: '', points: 0, isBlank: true, status: 'rack' },
      { id: 'tile-4', letter: 'M', points: 3, isBlank: false, status: 'rack' },
    ];

    it('sorts tiles alphabetically by default', () => {
      render(<TileRack tiles={unsortedTiles} sortBy="letter" />);
      
      const tiles = screen.getAllByTestId(/^tile-/);
      const letters = tiles.map(tile => tile.textContent?.charAt(0) || '');
      
      // Should be A, M, Z, ? (blank comes last)
      expect(letters[0]).toBe('A');
      expect(letters[1]).toBe('M');
      expect(letters[2]).toBe('Z');
      expect(letters[3]).toBe('?');
    });

    it('sorts tiles by points when selected', async () => {
      const user = userEvent.setup();
      render(<TileRack tiles={unsortedTiles} allowSorting />);
      
      const sortSelect = screen.getByDisplayValue('A-Z');
      await user.selectOptions(sortSelect, 'Points');
      
      await waitFor(() => {
        const tiles = screen.getAllByTestId(/^tile-/);
        const letters = tiles.map(tile => tile.textContent?.charAt(0) || '');
        
        // Should be Z (10 points), M (3 points), A (1 point), blank (0 points)
        expect(letters[0]).toBe('Z');
        expect(letters[1]).toBe('M');
        expect(letters[2]).toBe('A');
        expect(letters[3]).toBe('?');
      });
    });

    it('maintains original order when sort is none', async () => {
      const user = userEvent.setup();
      render(<TileRack tiles={unsortedTiles} allowSorting />);
      
      const sortSelect = screen.getByDisplayValue('A-Z');
      await user.selectOptions(sortSelect, 'None');
      
      await waitFor(() => {
        const tiles = screen.getAllByTestId(/^tile-/);
        const letters = tiles.map(tile => tile.textContent?.charAt(0) || '');
        
        // Should maintain original order: Z, A, ?, M
        expect(letters[0]).toBe('Z');
        expect(letters[1]).toBe('A');
        expect(letters[2]).toBe('?');
        expect(letters[3]).toBe('M');
      });
    });

    it('hides sorting controls when allowSorting is false', () => {
      render(<TileRack {...defaultProps} allowSorting={false} />);
      expect(screen.queryByText('Sort:')).not.toBeInTheDocument();
    });
  });

  describe('Tile Interactions', () => {
    it('calls onTileClick with tile and index', () => {
      const onTileClick = vi.fn();
      render(<TileRack {...defaultProps} onTileClick={onTileClick} />);
      
      fireEvent.click(screen.getByText('A'));
      expect(onTileClick).toHaveBeenCalledWith(mockTiles[0], expect.any(Number));
    });

    it('calls onTileDragStart when tile drag starts', () => {
      const onTileDragStart = vi.fn();
      render(<TileRack {...defaultProps} onTileDragStart={onTileDragStart} />);
      
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
      expect(onTileDragStart).toHaveBeenCalledWith(mockTiles[0], expect.any(Number));
    });

    it('calls onTileDragEnd when tile drag ends', () => {
      const onTileDragEnd = vi.fn();
      render(<TileRack {...defaultProps} onTileDragEnd={onTileDragEnd} />);
      
      const tile = screen.getByTestId('tile-tile-1');
      fireEvent.dragEnd(tile);
      expect(onTileDragEnd).toHaveBeenCalledWith(mockTiles[0], expect.any(Number));
    });

    it('shows selected tiles with visual feedback', () => {
      const selectedTileIds = new Set(['tile-1', 'tile-3']);
      render(<TileRack {...defaultProps} selectedTileIds={selectedTileIds} />);
      
      const tileA = screen.getByTestId('tile-tile-1');
      const tileT = screen.getByTestId('tile-tile-3');
      
      expect(tileA.className).toContain('ring-2');
      expect(tileT.className).toContain('ring-2');
    });

    it('disables interactions when isDisabled is true', () => {
      const onTileClick = vi.fn();
      render(<TileRack {...defaultProps} onTileClick={onTileClick} isDisabled />);
      
      fireEvent.click(screen.getByText('A'));
      expect(onTileClick).not.toHaveBeenCalled();
    });
  });

  describe('Exchange Mode', () => {
    it('shows exchange mode header when enabled', () => {
      render(<TileRack {...defaultProps} isExchangeMode />);
      expect(screen.getByText(/Exchange Mode/)).toBeInTheDocument();
    });

    it('allows selecting tiles for exchange', () => {
      render(<TileRack {...defaultProps} isExchangeMode />);
      
      fireEvent.click(screen.getByText('A'));
      fireEvent.click(screen.getByText('R'));
      
      expect(screen.getByText('Exchange Mode (2 selected)')).toBeInTheDocument();
    });

    it('shows exchange controls when in exchange mode', () => {
      render(<TileRack {...defaultProps} isExchangeMode />);
      
      // Select a tile first
      fireEvent.click(screen.getByText('A'));
      
      expect(screen.getByText('Confirm (1)')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onTileExchange when confirm is clicked', () => {
      const onTileExchange = vi.fn();
      render(<TileRack {...defaultProps} isExchangeMode onTileExchange={onTileExchange} />);
      
      // Select tiles
      fireEvent.click(screen.getByText('A'));
      fireEvent.click(screen.getByText('R'));
      
      // Confirm exchange
      fireEvent.click(screen.getByText('Confirm (2)'));
      
      expect(onTileExchange).toHaveBeenCalledWith([mockTiles[0], mockTiles[1]]);
    });

    it('clears selection when cancel is clicked', () => {
      render(<TileRack {...defaultProps} isExchangeMode />);
      
      // Select tiles
      fireEvent.click(screen.getByText('A'));
      fireEvent.click(screen.getByText('R'));
      
      expect(screen.getByText('Exchange Mode (2 selected)')).toBeInTheDocument();
      
      // Cancel exchange
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(screen.getByText('Exchange Mode (0 selected)')).toBeInTheDocument();
    });

    it('hides exchange button when allowExchange is false', () => {
      render(<TileRack {...defaultProps} allowExchange={false} />);
      expect(screen.queryByText('Exchange')).not.toBeInTheDocument();
    });

    it('hides exchange button when showExchangeButton is false', () => {
      render(<TileRack {...defaultProps} showExchangeButton={false} />);
      expect(screen.queryByText('Exchange')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies correct size classes', () => {
      const { rerender } = render(<TileRack {...defaultProps} size="small" />);
      let emptySlot = screen.getAllByText('·')[0].parentElement;
      expect(emptySlot?.className).toContain('w-10 h-10');

      rerender(<TileRack {...defaultProps} size="medium" />);
      emptySlot = screen.getAllByText('·')[0].parentElement;
      expect(emptySlot?.className).toContain('w-14 h-14');

      rerender(<TileRack {...defaultProps} size="large" />);
      emptySlot = screen.getAllByText('·')[0].parentElement;
      expect(emptySlot?.className).toContain('w-16 h-16');
    });

    it('handles different maxTiles values', () => {
      const { rerender } = render(<TileRack tiles={mockTiles} maxTiles={5} />);
      expect(screen.queryByText('·')).not.toBeInTheDocument(); // No empty slots

      rerender(<TileRack tiles={mockTiles} maxTiles={10} />);
      const emptySlots = screen.getAllByText('·');
      expect(emptySlots).toHaveLength(5); // 10 - 5 = 5 empty slots
    });
  });

  describe('Accessibility', () => {
    it('maintains tile accessibility attributes', () => {
      render(<TileRack {...defaultProps} />);
      
      const tileA = screen.getByTestId('tile-tile-1');
      expect(tileA).toHaveAttribute('role', 'button');
      expect(tileA).toHaveAttribute('tabIndex', '0');
    });

    it('disables sorting controls when rack is disabled', () => {
      render(<TileRack {...defaultProps} isDisabled allowSorting />);
      
      const sortSelect = screen.getByDisplayValue('A-Z');
      expect(sortSelect).toBeDisabled();
    });

    it('disables exchange button when rack is disabled', () => {
      render(<TileRack {...defaultProps} isDisabled />);
      
      const exchangeButton = screen.getByText('Exchange');
      expect(exchangeButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tiles array', () => {
      render(<TileRack tiles={[]} maxTiles={7} />);
      
      expect(screen.getByText('Your Tiles')).toBeInTheDocument();
      expect(screen.getByText('(0/7)')).toBeInTheDocument();
      
      const emptySlots = screen.getAllByText('·');
      expect(emptySlots).toHaveLength(7);
    });

    it('handles tiles exceeding maxTiles', () => {
      const manyTiles = Array.from({ length: 10 }, (_, i) => ({
        id: `tile-${i}`,
        letter: String.fromCharCode(65 + i),
        points: 1,
        isBlank: false,
        status: 'rack' as const,
      }));
      
      render(<TileRack tiles={manyTiles} maxTiles={7} />);
      
      expect(screen.getByText('(10/7)')).toBeInTheDocument();
      expect(screen.queryByText('·')).not.toBeInTheDocument(); // No empty slots
    });

    it('handles disabled tiles correctly', () => {
      const disabledTileIds = new Set(['tile-1', 'tile-3']);
      render(<TileRack {...defaultProps} disabledTileIds={disabledTileIds} />);
      
      const tileA = screen.getByTestId('tile-tile-1');
      const tileT = screen.getByTestId('tile-tile-3');
      
      expect(tileA.className).toContain('opacity-50');
      expect(tileT.className).toContain('opacity-50');
    });
  });
});