import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import { Board, Tile, TileGroup, TileRack, ScoreBoard, GameControls } from './components';
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
    { id: 'demo-1', letter: 'A', points: 1, isBlank: false, status: 'rack' },
    { id: 'demo-2', letter: 'R', points: 1, isBlank: false, status: 'rack' },
    { id: 'demo-3', letter: 'T', points: 1, isBlank: false, status: 'rack' },
    { id: 'demo-4', letter: 'S', points: 1, isBlank: false, status: 'rack' },
    { id: 'demo-5', letter: '', points: 0, isBlank: true, status: 'rack' },
    { id: 'demo-6', letter: 'E', points: 1, isBlank: false, status: 'rack' },
    { id: 'demo-7', letter: 'N', points: 1, isBlank: false, status: 'rack' },
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
        
        {/* ScoreBoard Component Demo */}
        <div className="mb-6">
          <ScoreBoard
            players={gameState?.players || []}
            currentPlayerIndex={gameState?.currentPlayerIndex || 0}
            gamePhase={gameState?.phase || 'setup'}
            remainingTiles={gameState?.tileBag.remaining || 100}
            totalTiles={100}
            showTurnTimer={true}
            turnTimeRemaining={85}
            showPlayerDetails={true}
            showGameInfo={true}
          />
        </div>
        
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
        
        {/* Game Layout Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* TileRack */}
          <div className="lg:col-span-2">
            <TileRack
              tiles={demoTiles}
              onTileClick={handleTileClick}
              onTileDragStart={handleTileDragStart}
              onTileDragEnd={handleTileDragEnd}
              onTileExchange={(tiles) => console.log('Exchange tiles:', tiles)}
              selectedTileIds={new Set(selectedTileId ? [selectedTileId] : [])}
              size="large"
              showTileCount
              showExchangeButton
              allowSorting
              allowExchange
            />
          </div>
          
          {/* GameControls */}
          <div>
            <GameControls
              gamePhase={gameState?.phase || 'playing'}
              isCurrentPlayer={true}
              canSubmit={selectedTileId !== null || selectedCell !== null}
              canPass={true}
              canExchange={true}
              hasSelectedTiles={selectedTileId !== null}
              placedTilesCount={selectedCell ? 1 : 0}
              onSubmit={() => console.log('Submit move')}
              onPass={() => console.log('Pass turn')}
              onExchange={() => console.log('Exchange tiles')}
              onClear={() => {
                setSelectedCell(null);
                setSelectedTileId(null);
                console.log('Clear board');
              }}
              onUndo={() => console.log('Undo last action')}
              onHint={() => console.log('Show hint')}
              onShuffle={() => console.log('Shuffle rack')}
              showAdvancedControls={true}
              enableKeyboardShortcuts={true}
            />
          </div>
        </div>
        
        <div className="text-center mt-8 text-gray-600 space-y-2">
          <p>✨ ScoreBoard shows player scores, turn indicators, and game info</p>
          <p>✨ GameControls provide Submit, Pass, Exchange actions with keyboard shortcuts</p>
          <p>✨ Click tiles to select them in the rack</p>
          <p>✨ Drag tiles from rack to empty cells on the board</p>
          <p>✨ Use keyboard shortcuts: Enter (Submit), P (Pass), E (Exchange), C (Clear)</p>
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
