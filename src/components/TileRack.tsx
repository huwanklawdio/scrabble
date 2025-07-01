import React, { useState, useCallback, useMemo } from 'react';
import { TileGroup } from './Tile';
import type { Tile as TileType } from '../types/game';

// ================================
// TileRack Component Props
// ================================

export interface TileRackProps {
  tiles: TileType[];
  onTileClick?: (tile: TileType, index: number) => void;
  onTileDragStart?: (tile: TileType, index: number) => void;
  onTileDragEnd?: (tile: TileType, index: number) => void;
  onTileExchange?: (tiles: TileType[]) => void;
  selectedTileIds?: Set<string>;
  disabledTileIds?: Set<string>;
  isExchangeMode?: boolean;
  allowExchange?: boolean;
  allowSorting?: boolean;
  sortBy?: 'letter' | 'points' | 'none';
  maxTiles?: number;
  showTileCount?: boolean;
  showExchangeButton?: boolean;
  isDisabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

// ================================
// Sorting Functions
// ================================

const sortTiles = (tiles: TileType[], sortBy: 'letter' | 'points' | 'none'): TileType[] => {
  if (sortBy === 'none') return tiles;
  
  return [...tiles].sort((a, b) => {
    if (sortBy === 'letter') {
      // Blank tiles come last
      if (a.isBlank && !b.isBlank) return 1;
      if (!a.isBlank && b.isBlank) return -1;
      if (a.isBlank && b.isBlank) return 0;
      
      return a.letter.localeCompare(b.letter);
    }
    
    if (sortBy === 'points') {
      // Sort by points descending, then by letter
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      return a.letter.localeCompare(b.letter);
    }
    
    return 0;
  });
};

// ================================
// TileRack Component
// ================================

export const TileRack: React.FC<TileRackProps> = ({
  tiles,
  onTileClick,
  onTileDragStart,
  onTileDragEnd,
  onTileExchange,
  selectedTileIds = new Set(),
  disabledTileIds = new Set(),
  isExchangeMode = false,
  allowExchange = true,
  allowSorting = true,
  sortBy = 'letter',
  maxTiles = 7,
  showTileCount = true,
  showExchangeButton = true,
  isDisabled = false,
  size = 'medium',
  orientation = 'horizontal',
  className = '',
}) => {
  const [internalSortBy, setInternalSortBy] = useState<'letter' | 'points' | 'none'>(sortBy);
  const [exchangeSelection, setExchangeSelection] = useState<Set<string>>(new Set());

  // ================================
  // Computed Values
  // ================================

  const sortedTiles = useMemo(() => {
    return sortTiles(tiles, internalSortBy);
  }, [tiles, internalSortBy]);

  const emptySlots = Math.max(0, maxTiles - tiles.length);
  const exchangeSelectedTiles = isExchangeMode ? exchangeSelection : selectedTileIds;

  // ================================
  // Event Handlers
  // ================================

  const handleTileClick = useCallback((tile: TileType, index: number) => {
    if (isDisabled) return;

    if (isExchangeMode) {
      const newSelection = new Set(exchangeSelection);
      if (newSelection.has(tile.id)) {
        newSelection.delete(tile.id);
      } else {
        newSelection.add(tile.id);
      }
      setExchangeSelection(newSelection);
    }

    if (onTileClick) {
      onTileClick(tile, index);
    }
  }, [isDisabled, isExchangeMode, exchangeSelection, onTileClick]);

  const handleSortChange = useCallback((newSortBy: 'letter' | 'points' | 'none') => {
    setInternalSortBy(newSortBy);
  }, []);

  const handleExchangeConfirm = useCallback(() => {
    const tilesToExchange = tiles.filter(tile => exchangeSelectedTiles.has(tile.id));
    if (tilesToExchange.length > 0 && onTileExchange) {
      onTileExchange(tilesToExchange);
      setExchangeSelection(new Set());
    }
  }, [tiles, exchangeSelectedTiles, onTileExchange]);

  const handleExchangeCancel = useCallback(() => {
    setExchangeSelection(new Set());
  }, []);

  // ================================
  // Styling
  // ================================

  const rackClasses = `
    ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
    ${orientation === 'horizontal' ? 'w-full max-w-2xl' : 'h-full max-h-96'}
  `;

  const containerClasses = `
    relative
    bg-gradient-to-b from-amber-800 to-amber-900
    rounded-lg
    shadow-xl
    border-4 border-amber-700
    overflow-hidden
    ${className}
  `;

  const headerClasses = `
    bg-amber-700
    px-4 py-2
    border-b-2 border-amber-600
    flex items-center justify-between
    text-amber-100
    font-semibold
  `;

  const tilesAreaClasses = `
    p-4
    flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
    items-center
    gap-3
    min-h-24
    ${orientation === 'horizontal' ? 'justify-center flex-wrap' : 'justify-start'}
  `;

  const controlsClasses = `
    bg-amber-700
    px-4 py-2
    border-t-2 border-amber-600
    flex items-center justify-between
    gap-2
  `;

  // ================================
  // Render
  // ================================

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={headerClasses}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎲</span>
          <span>Your Tiles</span>
          {showTileCount && (
            <span className="text-sm opacity-75">
              ({tiles.length}/{maxTiles})
            </span>
          )}
        </div>
        
        {isExchangeMode && (
          <div className="text-sm">
            Exchange Mode ({exchangeSelection.size} selected)
          </div>
        )}
      </div>

      {/* Tiles Area */}
      <div className={tilesAreaClasses}>
        <div className={rackClasses}>
          <TileGroup
            tiles={sortedTiles}
            onTileClick={handleTileClick}
            onTileDragStart={onTileDragStart}
            onTileDragEnd={onTileDragEnd}
            selectedTileIds={isExchangeMode ? exchangeSelection : selectedTileIds}
            disabledTileIds={isDisabled ? new Set(tiles.map(t => t.id)) : disabledTileIds}
            size={size}
            gap={orientation === 'horizontal' ? 'gap-3' : 'gap-2'}
          />
          
          {/* Empty Slots */}
          {emptySlots > 0 && (
            <div className={`flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} gap-3`}>
              {Array.from({ length: emptySlots }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className={`
                    ${size === 'small' ? 'w-10 h-10' : size === 'medium' ? 'w-14 h-14' : 'w-16 h-16'}
                    border-2 border-dashed border-amber-600
                    rounded-lg
                    bg-amber-900
                    opacity-50
                    flex items-center justify-center
                  `}
                >
                  <span className="text-amber-600 text-xs">·</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {(allowSorting || (allowExchange && showExchangeButton)) && (
        <div className={controlsClasses}>
          {/* Sorting Controls */}
          {allowSorting && (
            <div className="flex items-center gap-2">
              <span className="text-amber-100 text-sm">Sort:</span>
              <select
                value={internalSortBy}
                onChange={(e) => handleSortChange(e.target.value as 'letter' | 'points' | 'none')}
                className="
                  bg-amber-800 text-amber-100 text-sm
                  border border-amber-600 rounded px-2 py-1
                  focus:outline-none focus:ring-2 focus:ring-amber-500
                "
                disabled={isDisabled}
              >
                <option value="letter">A-Z</option>
                <option value="points">Points</option>
                <option value="none">None</option>
              </select>
            </div>
          )}

          {/* Exchange Controls */}
          {allowExchange && showExchangeButton && (
            <div className="flex items-center gap-2">
              {!isExchangeMode ? (
                <button
                  onClick={() => setExchangeSelection(new Set())}
                  disabled={isDisabled || tiles.length === 0}
                  className="
                    bg-amber-600 hover:bg-amber-500
                    disabled:bg-amber-800 disabled:opacity-50
                    text-amber-100 text-sm font-medium
                    px-3 py-1 rounded
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-amber-400
                  "
                >
                  Exchange
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleExchangeConfirm}
                    disabled={exchangeSelection.size === 0}
                    className="
                      bg-green-600 hover:bg-green-500
                      disabled:bg-gray-600 disabled:opacity-50
                      text-white text-sm font-medium
                      px-3 py-1 rounded
                      transition-colors duration-200
                      focus:outline-none focus:ring-2 focus:ring-green-400
                    "
                  >
                    Confirm ({exchangeSelection.size})
                  </button>
                  <button
                    onClick={handleExchangeCancel}
                    className="
                      bg-red-600 hover:bg-red-500
                      text-white text-sm font-medium
                      px-3 py-1 rounded
                      transition-colors duration-200
                      focus:outline-none focus:ring-2 focus:ring-red-400
                    "
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TileRack;