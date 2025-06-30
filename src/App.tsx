import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import { Board, Tile, TileGroup } from './components';
import { useGame } from './contexts/GameContext';
import type { Tile as TileType } from './types/game';

function GameContent() {
  const { gameState, initializeGame, addPlayer, startGame } = useGame();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [draggedTile, setDraggedTile] = useState<TileType | null>(null);
  
  // Demo tiles for testing
  const [demoTiles] = useState<TileType[]>([
    { id: 'demo-1', letter: 'A', points: 1, isBlank: false },
    { id: 'demo-2', letter: 'R', points: 1, isBlank: false },
    { id: 'demo-3', letter: 'T', points: 1, isBlank: false },
    { id: 'demo-4', letter: 'S', points: 1, isBlank: false },
    { id: 'demo-5', letter: '', points: 0, isBlank: true },
    { id: 'demo-6', letter: 'E', points: 1, isBlank: false },
    { id: 'demo-7', letter: 'N', points: 1, isBlank: false },
  ]);

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

  const handleCellDrop = (row: number, col: number, tile: TileType) => {
    console.log(`Tile ${tile.letter} dropped at (${row}, ${col})`);
    // In a real implementation, this would update the game state
  };

  const handleCellDragEnter = (row: number, col: number) => {
    setDragOverCell({ row, col });
  };

  const handleCellDragLeave = (row: number, col: number) => {
    setDragOverCell(null);
  };
  
  const handleTileClick = (tile: TileType) => {
    setSelectedTileId(tile.id === selectedTileId ? null : tile.id);
  };
  
  const handleTileDragStart = (tile: TileType) => {
    setDraggedTile(tile);
  };
  
  const handleTileDragEnd = (tile: TileType) => {
    setDraggedTile(null);
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
        
        {/* Demo Tile Rack */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-700 text-center mb-4">
            Your Tiles (Demo)
          </h2>
          <div className="flex justify-center">
            <div className="bg-wood-pattern bg-amber-800 p-4 rounded-lg shadow-xl">
              <TileGroup
                tiles={demoTiles}
                onTileClick={handleTileClick}
                onTileDragStart={handleTileDragStart}
                onTileDragEnd={handleTileDragEnd}
                selectedTileIds={new Set(selectedTileId ? [selectedTileId] : [])}
                size="large"
                gap="gap-3"
              />
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-gray-600 space-y-2">
          <p>✨ Click tiles to select them</p>
          <p>✨ Drag tiles to empty cells on the board</p>
          <p>✨ Click or hover cells for interactive effects</p>
          <p>✨ Blank tiles show "?" and can be assigned any letter</p>
        </div>
        
        {draggedTile && (
          <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
            <p className="text-sm text-gray-600">Dragging: {draggedTile.letter || 'Blank'}</p>
          </div>
        )}
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
