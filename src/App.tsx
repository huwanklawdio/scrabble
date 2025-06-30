import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import { Board } from './components';
import { useGame } from './contexts/GameContext';

function GameContent() {
  const { gameState, initializeGame, addPlayer, startGame } = useGame();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize a demo game
    if (!gameState) {
      initializeGame();
      // Add demo players
      setTimeout(() => {
        addPlayer({ name: 'Player 1' });
        addPlayer({ name: 'Player 2' });
        startGame();
      }, 100);
    }
  }, [gameState, initializeGame, addPlayer, startGame]);

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    console.log(`Cell clicked: (${row}, ${col})`);
  };

  const handleCellHover = (row: number, col: number) => {
    // Create a cross pattern of highlighted cells
    const newHighlights = new Set<string>();
    
    // Highlight the row
    for (let c = 0; c < 15; c++) {
      newHighlights.add(`${row},${c}`);
    }
    
    // Highlight the column
    for (let r = 0; r < 15; r++) {
      newHighlights.add(`${r},${col}`);
    }
    
    setHighlightedCells(newHighlights);
  };

  const handleCellLeave = () => {
    setHighlightedCells(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">
          🎯 Scrabble Game
        </h1>
        
        <div className="flex justify-center mb-4">
          <Board
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            onCellLeave={handleCellLeave}
            selectedCell={selectedCell}
            highlightedCells={highlightedCells}
          />
        </div>
        
        {selectedCell && (
          <div className="text-center mt-4 text-gray-700">
            Selected: Row {selectedCell.row + 1}, Column {String.fromCharCode(65 + selectedCell.col)}
          </div>
        )}
        
        <div className="text-center mt-8 text-gray-600">
          <p className="mb-2">✨ Click on cells to select them</p>
          <p>✨ Hover over cells to see row/column highlights</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

export default App;
