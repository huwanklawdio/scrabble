import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GameProvider, useGame } from './GameContext';

// Test component to verify context works
function TestComponent() {
  const { gameState, initializeGame, addPlayer, error } = useGame();
  
  React.useEffect(() => {
    initializeGame({ mode: 'local', settings: {} });
  }, [initializeGame]);
  
  return (
    <div>
      <div data-testid="game-phase">{gameState?.phase || 'loading'}</div>
      <div data-testid="player-count">{gameState?.players?.length || 0}</div>
      <div data-testid="error">{error || 'none'}</div>
      <button 
        onClick={() => addPlayer({ name: 'Test Player' })}
        data-testid="add-player"
      >
        Add Player
      </button>
    </div>
  );
}

describe('GameContext', () => {
  test('initializes game correctly', async () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );
    
    // Should initialize to setup phase
    expect(screen.getByTestId('game-phase')).toHaveTextContent('setup');
    expect(screen.getByTestId('player-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });
  
  test('adds players correctly', async () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );
    
    // Add a player
    await act(async () => {
      screen.getByTestId('add-player').click();
    });
    
    expect(screen.getByTestId('player-count')).toHaveTextContent('1');
  });
});

export {}; 