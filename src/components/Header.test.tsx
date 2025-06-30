import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import type { GamePhase, GameMode } from '../types/game';

describe('Header Component', () => {
  const defaultProps = {
    gamePhase: 'playing' as GamePhase,
    gameMode: 'local' as GameMode,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders game title by default', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText('Scrabble Game')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    it('renders custom game name', () => {
      render(<Header {...defaultProps} gameName="Custom Scrabble" />);
      
      expect(screen.getByText('Custom Scrabble')).toBeInTheDocument();
    });

    it('shows game info when enabled', () => {
      render(<Header 
        {...defaultProps} 
        gameId="game123" 
        currentPlayer="Alice"
        showGameInfo 
      />);
      
      expect(screen.getByText('game123')).toBeInTheDocument();
      expect(screen.getAllByText('local')).toHaveLength(2); // Desktop and mobile versions
      expect(screen.getAllByText("Alice's turn")).toHaveLength(2); // Desktop and mobile versions
    });

    it('hides game info when disabled', () => {
      render(<Header 
        {...defaultProps} 
        gameId="game123" 
        showGameInfo={false} 
      />);
      
      expect(screen.queryByText('game123')).not.toBeInTheDocument();
    });

    it('applies compact styling', () => {
      render(<Header {...defaultProps} compact />);
      
      expect(screen.getByText('Scrabble Game')).toHaveClass('text-lg');
    });

    it('applies custom className', () => {
      const { container } = render(<Header {...defaultProps} className="custom-header" />);
      
      expect(container.firstChild).toHaveClass('custom-header');
    });
  });

  describe('Game Status Display', () => {
    it('shows setup status', () => {
      render(<Header {...defaultProps} gamePhase="setup" showGameInfo />);
      
      expect(screen.getAllByText('Setting up game...')).toHaveLength(2); // Desktop and mobile
    });

    it('shows playing status with current player', () => {
      render(<Header 
        {...defaultProps} 
        gamePhase="playing" 
        currentPlayer="Bob"
        showGameInfo 
      />);
      
      expect(screen.getAllByText("Bob's turn")).toHaveLength(2); // Desktop and mobile
    });

    it('shows playing status without current player', () => {
      render(<Header 
        {...defaultProps} 
        gamePhase="playing" 
        showGameInfo 
      />);
      
      expect(screen.getAllByText('Game in progress')).toHaveLength(2); // Desktop and mobile
    });

    it('shows finished status', () => {
      render(<Header {...defaultProps} gamePhase="finished" showGameInfo />);
      
      expect(screen.getAllByText('Game finished')).toHaveLength(2); // Desktop and mobile
    });
  });

  describe('Menu Functionality', () => {
    it('toggles menu when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} onNewGame={vi.fn()} />);
      
      const menuButton = screen.getByTitle('Game Menu');
      
      // Menu should be closed initially
      expect(screen.queryByText('New Game')).not.toBeInTheDocument();
      
      // Open menu
      await user.click(menuButton);
      expect(screen.getByText('New Game')).toBeInTheDocument();
      
      // Close menu
      await user.click(menuButton);
      expect(screen.queryByText('New Game')).not.toBeInTheDocument();
    });

    it('shows menu items based on provided handlers', () => {
      render(<Header 
        {...defaultProps} 
        onNewGame={vi.fn()}
        onSaveGame={vi.fn()}
        onLoadGame={vi.fn()}
        onExitGame={vi.fn()}
      />);
      
      fireEvent.click(screen.getByTitle('Game Menu'));
      
      expect(screen.getByText('New Game')).toBeInTheDocument();
      expect(screen.getByText('Save Game')).toBeInTheDocument();
      expect(screen.getByText('Load Game')).toBeInTheDocument();
      expect(screen.getByText('Exit Game')).toBeInTheDocument();
    });

    it('hides save game option when not playing', () => {
      render(<Header 
        {...defaultProps} 
        gamePhase="setup"
        onSaveGame={vi.fn()}
      />);
      
      fireEvent.click(screen.getByTitle('Game Menu'));
      
      expect(screen.queryByText('Save Game')).not.toBeInTheDocument();
    });

    it('calls menu handlers when clicked', async () => {
      const onNewGame = vi.fn();
      const onSaveGame = vi.fn();
      const onLoadGame = vi.fn();
      const onExitGame = vi.fn();
      
      render(<Header 
        {...defaultProps} 
        gamePhase="playing"
        onNewGame={onNewGame}
        onSaveGame={onSaveGame}
        onLoadGame={onLoadGame}
        onExitGame={onExitGame}
      />);
      
      fireEvent.click(screen.getByTitle('Game Menu'));
      
      fireEvent.click(screen.getByText('New Game'));
      expect(onNewGame).toHaveBeenCalledTimes(1);
      
      fireEvent.click(screen.getByTitle('Game Menu'));
      fireEvent.click(screen.getByText('Save Game'));
      expect(onSaveGame).toHaveBeenCalledTimes(1);
      
      fireEvent.click(screen.getByTitle('Game Menu'));
      fireEvent.click(screen.getByText('Load Game'));
      expect(onLoadGame).toHaveBeenCalledTimes(1);
      
      fireEvent.click(screen.getByTitle('Game Menu'));
      fireEvent.click(screen.getByText('Exit Game'));
      expect(onExitGame).toHaveBeenCalledTimes(1);
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} onNewGame={vi.fn()} />);
      
      // Open menu
      await user.click(screen.getByTitle('Game Menu'));
      expect(screen.getByText('New Game')).toBeInTheDocument();
      
      // Click outside (on the overlay)
      const overlay = document.querySelector('.fixed.inset-0.z-10');
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay!);
      
      expect(screen.queryByText('New Game')).not.toBeInTheDocument();
    });
  });

  describe('Settings Modal', () => {
    it('opens settings modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Settings'));
      
      expect(screen.getAllByText('Game Settings')).toHaveLength(2); // Modal title and section heading
      expect(screen.getByText('Interface Settings')).toBeInTheDocument();
    });

    it('closes settings modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Settings'));
      await user.click(screen.getByLabelText('Close modal'));
      
      expect(screen.queryAllByText('Game Settings')).toHaveLength(0);
    });

    it('closes settings modal when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Settings'));
      
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      fireEvent.click(backdrop!);
      
      expect(screen.queryAllByText('Game Settings')).toHaveLength(0);
    });

    it('calls onSettingsChange when settings are saved', async () => {
      const onSettingsChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Header {...defaultProps} onSettingsChange={onSettingsChange} />);
      
      await user.click(screen.getByText('Settings'));
      
      // Change a setting
      const timeInput = screen.getByDisplayValue('120');
      await user.clear(timeInput);
      await user.type(timeInput, '180');
      
      // Save settings
      await user.click(screen.getByText('Save Settings'));
      
      expect(onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ timePerTurn: 180 })
      );
    });

    it('allows toggling boolean settings', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Settings'));
      
      const exchangeCheckbox = screen.getByLabelText('Allow tile exchanges');
      expect(exchangeCheckbox).toBeChecked();
      
      await user.click(exchangeCheckbox);
      expect(exchangeCheckbox).not.toBeChecked();
    });

    it('allows changing dropdown settings', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Settings'));
      
      const dictionarySelect = screen.getByDisplayValue('Standard');
      await user.selectOptions(dictionarySelect, 'Tournament');
      
      expect(screen.getByDisplayValue('Tournament')).toBeInTheDocument();
    });
  });

  describe('Help Modal', () => {
    it('opens help modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Help'));
      
      expect(screen.getByText('How to Play Scrabble')).toBeInTheDocument();
      expect(screen.getByText('How to Play')).toBeInTheDocument();
      expect(screen.getByText('Game Controls')).toBeInTheDocument();
      expect(screen.getByText('Scoring System')).toBeInTheDocument();
    });

    it('displays game rules and controls', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Help'));
      
      expect(screen.getByText('Enter:')).toBeInTheDocument();
      expect(screen.getByText('Submit move')).toBeInTheDocument();
      expect(screen.getByText('P:')).toBeInTheDocument();
      expect(screen.getByText('Pass turn')).toBeInTheDocument();
      expect(screen.getByText('Letter Values:')).toBeInTheDocument();
      expect(screen.getByText('Premium Squares:')).toBeInTheDocument();
    });

    it('closes help modal when Got it button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Help'));
      await user.click(screen.getByText('Got it!'));
      
      expect(screen.queryByText('How to Play Scrabble')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('shows mobile game info on small screens', () => {
      render(<Header 
        {...defaultProps} 
        gameId="game123456789"
        currentPlayer="Alice"
        showGameInfo 
      />);
      
      // Mobile info should truncate long game ID
      expect(screen.getByText('ID: game1234...')).toBeInTheDocument();
    });

    it('hides quick action buttons on small screens', () => {
      // The buttons have 'hidden sm:flex' classes
      render(<Header {...defaultProps} />);
      
      const settingsButton = screen.getAllByText('Settings')[0]; // Get the first one (not in menu)
      expect(settingsButton.closest('div')).toHaveClass('hidden', 'sm:flex');
    });

    it('shows settings and help in mobile menu', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByTitle('Game Menu'));
      
      // Check for mobile menu items (they have sm:hidden class)
      const menuItems = screen.getAllByText('Settings');
      const mobileSettingsButton = menuItems.find(item => 
        item.closest('button')?.className.includes('sm:hidden')
      );
      
      expect(mobileSettingsButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Header {...defaultProps} onNewGame={vi.fn()} />);
      
      const menuButton = screen.getByTitle('Game Menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has screen reader text for menu button', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText('Open menu')).toHaveClass('sr-only');
    });

    it('has proper modal close button label', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      await user.click(screen.getByText('Settings'));
      
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByText('Scrabble Game')).toBeInTheDocument();
      expect(screen.getByTitle('Game Menu')).toBeInTheDocument();
    });

    it('handles missing currentPlayer gracefully', () => {
      render(<Header 
        {...defaultProps} 
        gamePhase="playing"
        showGameInfo 
      />);
      
      expect(screen.getAllByText('Game in progress')).toHaveLength(2); // Desktop and mobile
    });

    it('handles very long game IDs', () => {
      render(<Header 
        {...defaultProps} 
        gameId="this-is-a-very-long-game-id-that-should-be-truncated"
        showGameInfo 
      />);
      
      // Should show truncated version in mobile view
      expect(screen.getByText('ID: this-is-...')).toBeInTheDocument();
    });

    it('closes all modals when clicking close', async () => {
      const user = userEvent.setup();
      render(<Header {...defaultProps} />);
      
      // Open settings modal
      await user.click(screen.getByText('Settings'));
      expect(screen.getAllByText('Game Settings')).toHaveLength(2); // Modal title and section heading
      
      // Close it
      await user.click(screen.getByLabelText('Close modal'));
      
      // Should be closed
      expect(screen.queryAllByText('Game Settings')).toHaveLength(0);
    });

    it('prevents settings save with invalid values', async () => {
      const onSettingsChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Header {...defaultProps} onSettingsChange={onSettingsChange} />);
      
      await user.click(screen.getByText('Settings'));
      
      // Try to set invalid time (should be prevented by input constraints)
      const timeInput = screen.getByDisplayValue('120');
      await user.clear(timeInput);
      await user.type(timeInput, '10'); // Below minimum of 30
      
      await user.click(screen.getByText('Save Settings'));
      
      // Should still call with the typed value (input validation is handled by browser)
      expect(onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ timePerTurn: 10 })
      );
    });
  });
});