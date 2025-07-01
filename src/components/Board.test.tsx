import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Board } from './Board';
import { GameProvider } from '../contexts/GameContext';

// Mock the useGameState hook
vi.mock('../hooks/useGameState', () => ({
  useGameState: () => ({
    board: Array(15).fill(null).map((_, row) =>
      Array(15).fill(null).map((_, col) => ({
        row,
        col,
        tile: null,
        isEmpty: true,
        premiumType: row === 7 && col === 7 ? 'center' : null,
      }))
    ),
  }),
}));

describe('Board Component', () => {
  const renderBoard = (props = {}) => {
    return render(
      <GameProvider>
        <Board {...props} />
      </GameProvider>
    );
  };

  it('renders a 15x15 grid', () => {
    renderBoard();
    
    // Check for 15x15 = 225 cells
    const cells = screen.getAllByTestId(/^cell-\d+-\d+$/);
    expect(cells).toHaveLength(225);
  });

  it('displays column labels A-O', () => {
    renderBoard();
    
    // Check for column labels
    for (let i = 0; i < 15; i++) {
      const label = String.fromCharCode(65 + i);
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('displays row labels 1-15', () => {
    renderBoard();
    
    // Check for row labels
    for (let i = 1; i <= 15; i++) {
      const labels = screen.getAllByText(i.toString());
      expect(labels.length).toBeGreaterThan(0);
    }
  });

  it('highlights the center cell', () => {
    renderBoard();
    
    const centerCell = screen.getByTestId('cell-7-7');
    expect(centerCell).toHaveTextContent('★');
  });

  it('calls onCellClick when a cell is clicked', () => {
    const onCellClick = vi.fn();
    renderBoard({ onCellClick });
    
    const cell = screen.getByTestId('cell-0-0');
    fireEvent.click(cell);
    
    expect(onCellClick).toHaveBeenCalledWith(0, 0);
  });

  it('calls onCellHover when mouse enters a cell', () => {
    const onCellHover = vi.fn();
    renderBoard({ onCellHover });
    
    const cell = screen.getByTestId('cell-5-5');
    fireEvent.mouseEnter(cell);
    
    expect(onCellHover).toHaveBeenCalledWith(5, 5);
  });

  it('highlights specified cells', () => {
    const highlightedCells = new Set(['3,4', '5,6']);
    renderBoard({ highlightedCells });
    
    const cell1 = screen.getByTestId('cell-3-4');
    const cell2 = screen.getByTestId('cell-5-6');
    const cell3 = screen.getByTestId('cell-0-0');
    
    expect(cell1.className).toContain('ring-2');
    expect(cell2.className).toContain('ring-2');
    expect(cell3.className).not.toContain('ring-2');
  });

  it('shows selected cell', () => {
    const selectedCell = { row: 7, col: 7 };
    renderBoard({ selectedCell });
    
    const cell = screen.getByTestId('cell-7-7');
    expect(cell.className).toContain('ring-2');
    expect(cell.className).toContain('ring-offset-2');
  });

  it('displays legend for premium squares', () => {
    renderBoard();
    
    expect(screen.getByText('Triple Word')).toBeInTheDocument();
    expect(screen.getByText('Double Word')).toBeInTheDocument();
    expect(screen.getByText('Triple Letter')).toBeInTheDocument();
    expect(screen.getByText('Double Letter')).toBeInTheDocument();
  });
});