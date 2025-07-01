import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import { Board, TileRack, ScoreBoard, GameControls, GameLayout, Header } from './components';
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

  const handleCellDragLeave = () => {
    setDragOverCell(null);
  };
  
  const handleTileClick = (tile: TileType) => {
    setSelectedTileId(tile.id === selectedTileId ? null : tile.id);
  };
  
  const handleTileDragStart = (tile: TileType) => {
    setDraggedTile(tile);
  };
  
  const handleTileDragEnd = () => {
    setDraggedTile(null);
  };

  return (
    <GameLayout
      header={
        <Header
          gamePhase={gameState?.phase || 'setup'}
          gameMode="local"
          currentPlayer={gameState?.players?.[gameState?.currentPlayerIndex || 0]?.name}
          gameId="demo-game-123"
          onNewGame={() => console.log('New game')}
          onSaveGame={() => console.log('Save game')}
          onLoadGame={() => console.log('Load game')}
          onExitGame={() => console.log('Exit game')}
          onSettingsChange={(settings) => console.log('Settings changed:', settings)}
        />
      }
      board={
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
      }
      scoreBoard={
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
      }
      tileRack={
        <TileRack
          tiles={demoTiles}
          onTileClick={handleTileClick}
          onTileDragStart={handleTileDragStart}
          onTileDragEnd={handleTileDragEnd}
          onTileExchange={(tiles) => console.log('Exchange tiles:', tiles)}
          selectedTileIds={new Set(selectedTileId ? [selectedTileId] : [])}
          showTileCount
          showExchangeButton
          allowSorting
          allowExchange
        />
      }
      gameControls={
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
      }
      sidebar={
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Game Info</h3>
          {selectedCell && (
            <div className="text-sm text-gray-600">
              Selected: Row {selectedCell.row + 1}, Column {String.fromCharCode(65 + selectedCell.col)}
            </div>
          )}
          {draggedTile && (
            <div className="text-sm text-gray-600 mt-2">
              Dragging: {draggedTile.letter || 'Blank'}
            </div>
          )}
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <p>✨ Complete responsive layout</p>
            <p>✨ Header with settings & help</p>
            <p>✨ Keyboard shortcuts enabled</p>
            <p>✨ Mobile-friendly design</p>
          </div>
        </div>
      }
      variant="auto"
      theme="light"
      showSidebar={true}
    />
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
