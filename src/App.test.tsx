import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the Scrabble game title', () => {
    render(<App />);
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('Scrabble Game')).toBeInTheDocument();
  });

  it('renders the game board', () => {
    render(<App />);
    // Check for board cells - there should be 225 cells (15x15)
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(225);
  });

  it('renders the tile rack component', () => {
    render(<App />);
    expect(screen.getByText('Your Tiles')).toBeInTheDocument();
    expect(screen.getByText('(7/7)')).toBeInTheDocument(); // Tile count
  });

  it('renders demo tiles in the rack', () => {
    render(<App />);
    // Check for tiles by their test IDs to avoid conflicts with board letters
    expect(screen.getByTestId('tile-demo-1')).toBeInTheDocument(); // A tile
    expect(screen.getByTestId('tile-demo-2')).toBeInTheDocument(); // R tile
    expect(screen.getByTestId('tile-demo-3')).toBeInTheDocument(); // T tile
    expect(screen.getByTestId('tile-demo-4')).toBeInTheDocument(); // S tile
    expect(screen.getByTestId('tile-demo-5')).toBeInTheDocument(); // Blank tile
    expect(screen.getByTestId('tile-demo-6')).toBeInTheDocument(); // E tile
    expect(screen.getByTestId('tile-demo-7')).toBeInTheDocument(); // N tile
  });

  it('renders control buttons', () => {
    render(<App />);
    expect(screen.getByText('Exchange')).toBeInTheDocument();
  });
});
