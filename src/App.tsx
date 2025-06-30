import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import { Board } from './components';
import { useGame } from './contexts/GameContext';

function GameContent() {
  const { gameState, initializeGame, addPlayer, startGame } = useGame();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null);

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

  const handleCellDrop = (row: number, col: number, tile: any) => {
    console.log(`Tile dropped at (${row}, ${col}):`, tile);
    // In a real implementation, this would update the game state
  };

  const handleCellDragEnter = (row: number, col: number) => {
    setDragOverCell({ row, col });
  };

  const handleCellDragLeave = (row: number, col: number) => {
    setDragOverCell(null);
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
            onCellDrop={handleCellDrop}
            onCellDragEnter={handleCellDragEnter}
            onCellDragLeave={handleCellDragLeave}
            selectedCell={selectedCell}
            highlightedCells={highlightedCells}
            dragOverCell={dragOverCell}
          />
        </div>
        
        {selectedCell && (
          <div className="text-center mt-4 text-gray-700">
            Selected: Row {selectedCell.row + 1}, Column {String.fromCharCode(65 + selectedCell.col)}
          </div>
        )}
        
        <div className="text-center mt-8 text-gray-600">
          <p className="mb-2">✨ Click on cells to select them</p>
          <p className="mb-2">✨ Hover over cells to see row/column highlights</p>
          <p>✨ Drag and drop support ready (tiles will be added in next task)</p>
        </div>
        
        {/* Demo Draggable Tile for Testing */}
        <div className="flex justify-center mt-8">
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                id: 'demo-tile',
                letter: 'A',
                points: 1,
                isBlank: false
              }));
            }}
            className="w-16 h-16 bg-amber-100 rounded shadow-lg flex flex-col items-center justify-center cursor-move hover:shadow-xl transition-shadow"
          >
            <span className="text-2xl font-bold">A</span>
            <span className="text-sm">1</span>
          </div>
        </div>
        <p className="text-center mt-2 text-gray-500 text-sm">
          Drag this tile to any empty cell on the board
        </p>
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
