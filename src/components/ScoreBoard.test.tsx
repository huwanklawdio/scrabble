import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBoard } from './ScoreBoard';
import type { Player, GamePhase } from '../types/game';

describe('ScoreBoard Component', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      name: 'Alice',
      score: 250,
      rack: [
        { id: 'tile-1', letter: 'A', points: 1, isBlank: false, status: 'rack' },
        { id: 'tile-2', letter: 'B', points: 3, isBlank: false, status: 'rack' },
      ],
      status: 'active',
      consecutivePasses: 0,
      isHost: true,
    },
    {
      id: 'player-2',
      name: 'Bob',
      score: 180,
      rack: [
        { id: 'tile-3', letter: 'C', points: 3, isBlank: false, status: 'rack' },
        { id: 'tile-4', letter: 'D', points: 2, isBlank: false, status: 'rack' },
        { id: 'tile-5', letter: 'E', points: 1, isBlank: false, status: 'rack' },
      ],
      status: 'waiting',
      consecutivePasses: 1,
      timeRemaining: 120,
    },
    {
      id: 'player-3',
      name: 'Charlie',
      score: 320,
      rack: [
        { id: 'tile-6', letter: 'F', points: 4, isBlank: false, status: 'rack' },
      ],
      status: 'passed',
      consecutivePasses: 2,
    },
  ];

  const defaultProps = {
    players: mockPlayers,
    currentPlayerIndex: 0,
    gamePhase: 'playing' as GamePhase,
    remainingTiles: 65,
    totalTiles: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the scoreboard with title', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('Score Board')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('displays all players', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('displays player scores', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('180')).toBeInTheDocument();
      expect(screen.getByText('320')).toBeInTheDocument();
    });

    it('shows current player turn indicator', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText("Alice's turn")).toBeInTheDocument();
      expect(screen.getByText('TURN')).toBeInTheDocument();
    });

    it('displays host indicator', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('HOST')).toBeInTheDocument();
    });

    it('shows player status badges', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('WAITING')).toBeInTheDocument();
      expect(screen.getByText('PASSED')).toBeInTheDocument();
    });
  });

  describe('Player Details', () => {
    it('shows tile counts for each player', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('2/7')).toBeInTheDocument(); // Alice
      expect(screen.getByText('3/7')).toBeInTheDocument(); // Bob
      expect(screen.getByText('1/7')).toBeInTheDocument(); // Charlie
    });

    it('displays consecutive passes when > 0', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      // Alice has 0 passes, should not show
      const aliceSection = screen.getByText('Alice').closest('div');
      expect(aliceSection).not.toHaveTextContent('Passes:');
      
      // Bob and Charlie have passes, should show
      expect(screen.getByText('1')).toBeInTheDocument(); // Bob's passes
      expect(screen.getByText('2')).toBeInTheDocument(); // Charlie's passes
    });

    it('shows time remaining when available', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('2:00')).toBeInTheDocument(); // Bob's time
    });

    it('highlights low time remaining', () => {
      const playersWithLowTime = [
        { ...mockPlayers[0], timeRemaining: 25 },
        mockPlayers[1],
        mockPlayers[2],
      ];
      
      render(<ScoreBoard {...defaultProps} players={playersWithLowTime} />);
      
      const timeElement = screen.getByText('0:25');
      expect(timeElement.className).toContain('text-red-600');
    });

    it('hides player details when showPlayerDetails is false', () => {
      render(<ScoreBoard {...defaultProps} showPlayerDetails={false} />);
      
      expect(screen.queryByText('Tiles:')).not.toBeInTheDocument();
      expect(screen.queryByText('2/7')).not.toBeInTheDocument();
    });
  });

  describe('Game Info', () => {
    it('displays game phase', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('Game Phase:')).toBeInTheDocument();
      expect(screen.getByText('playing')).toBeInTheDocument();
    });

    it('shows tiles remaining with progress bar', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      expect(screen.getByText('Tiles Remaining:')).toBeInTheDocument();
      expect(screen.getByText('65/100')).toBeInTheDocument();
    });

    it('changes progress bar color based on remaining tiles', () => {
      const { rerender } = render(<ScoreBoard {...defaultProps} remainingTiles={75} />);
      
      // High tiles (>50%) should be green
      let progressBar = document.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
      
      // Medium tiles (25-50%) should be yellow
      rerender(<ScoreBoard {...defaultProps} remainingTiles={35} />);
      progressBar = document.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
      
      // Low tiles (<25%) should be red
      rerender(<ScoreBoard {...defaultProps} remainingTiles={15} />);
      progressBar = document.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('hides game info when showGameInfo is false', () => {
      render(<ScoreBoard {...defaultProps} showGameInfo={false} />);
      
      expect(screen.queryByText('Game Phase:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tiles Remaining:')).not.toBeInTheDocument();
    });
  });

  describe('Turn Timer', () => {
    it('shows turn timer when enabled and time is provided', () => {
      render(<ScoreBoard {...defaultProps} showTurnTimer turnTimeRemaining={90} />);
      
      expect(screen.getByText('Time Remaining')).toBeInTheDocument();
      expect(screen.getByText('1:30')).toBeInTheDocument();
    });

    it('highlights timer when time is low', () => {
      render(<ScoreBoard {...defaultProps} showTurnTimer turnTimeRemaining={25} />);
      
      // Find the timer container (parent of the Time Remaining text)
      const timerContainer = screen.getByText('Time Remaining').parentElement;
      expect(timerContainer?.className).toContain('bg-red-50');
      expect(timerContainer?.className).toContain('border-red-300');
      
      const timeDisplay = screen.getByText('0:25');
      expect(timeDisplay.className).toContain('animate-pulse');
    });

    it('hides timer when showTurnTimer is false', () => {
      render(<ScoreBoard {...defaultProps} showTurnTimer={false} turnTimeRemaining={90} />);
      
      expect(screen.queryByText('Time Remaining')).not.toBeInTheDocument();
    });

    it('hides timer when game is not playing', () => {
      render(<ScoreBoard {...defaultProps} gamePhase="setup" showTurnTimer turnTimeRemaining={90} />);
      
      expect(screen.queryByText('Time Remaining')).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('applies compact styling', () => {
      render(<ScoreBoard {...defaultProps} compact />);
      
      // Should still render all content but with smaller sizes
      expect(screen.getByText('Score Board')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('hides detailed info in compact mode', () => {
      render(<ScoreBoard {...defaultProps} compact showPlayerDetails />);
      
      // In compact mode, details should be hidden even if showPlayerDetails is true
      expect(screen.queryByText('Tiles:')).not.toBeInTheDocument();
    });
  });

  describe('Player Ordering', () => {
    it('puts current player first, then sorts by score', () => {
      // Set Bob (middle score) as current player
      render(<ScoreBoard {...defaultProps} currentPlayerIndex={1} />);
      
      const playerCards = screen.getAllByText(/ACTIVE|WAITING|PASSED/);
      
      // Bob should be first (current player), then Charlie (highest score), then Alice
      expect(screen.getByText("Bob's turn")).toBeInTheDocument();
    });

    it('handles different numbers of players', () => {
      const twoPlayers = mockPlayers.slice(0, 2);
      render(<ScoreBoard {...defaultProps} players={twoPlayers} />);
      
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    });
  });

  describe('Game Phases', () => {
    it('handles setup phase', () => {
      render(<ScoreBoard {...defaultProps} gamePhase="setup" />);
      
      expect(screen.getByText('setup')).toBeInTheDocument();
      expect(screen.queryByText("Alice's turn")).not.toBeInTheDocument();
      expect(screen.queryByText('TURN')).not.toBeInTheDocument();
    });

    it('handles finished phase', () => {
      render(<ScoreBoard {...defaultProps} gamePhase="finished" />);
      
      expect(screen.getByText('finished')).toBeInTheDocument();
      expect(screen.queryByText("Alice's turn")).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ScoreBoard {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Score Board');
    });

    it('formats large numbers with locale string', () => {
      const highScorePlayers = [
        { ...mockPlayers[0], score: 1250 },
        mockPlayers[1],
        mockPlayers[2],
      ];
      
      render(<ScoreBoard {...defaultProps} players={highScorePlayers} />);
      
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty players array', () => {
      render(<ScoreBoard {...defaultProps} players={[]} />);
      
      expect(screen.getByText('Score Board')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('handles invalid currentPlayerIndex', () => {
      render(<ScoreBoard {...defaultProps} currentPlayerIndex={99} />);
      
      // Should not crash and still render players
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('TURN')).not.toBeInTheDocument();
    });

    it('handles zero remaining tiles', () => {
      render(<ScoreBoard {...defaultProps} remainingTiles={0} />);
      
      expect(screen.getByText('0/100')).toBeInTheDocument();
      
      const progressBar = document.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<ScoreBoard {...defaultProps} className="custom-scoreboard" />);
      
      expect(container.firstChild?.className).toContain('custom-scoreboard');
    });
  });
});