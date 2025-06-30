import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Tile as TileType } from '../types/game';

// ================================
// Tile Component Props
// ================================

export interface TileProps {
  tile: TileType;
  onClick?: (tile: TileType) => void;
  onDragStart?: (tile: TileType) => void;
  onDragEnd?: (tile: TileType) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  isPlaced?: boolean;
  isDisabled?: boolean;
  showBlankInput?: boolean;
  onBlankLetterAssign?: (letter: string) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// ================================
// Size Configuration
// ================================

const sizeClasses = {
  small: 'w-10 h-10 text-sm',
  medium: 'w-14 h-14 text-base',
  large: 'w-16 h-16 text-lg',
};

const pointSizeClasses = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-sm',
};

// ================================
// Tile Component
// ================================

export const Tile: React.FC<TileProps> = ({
  tile,
  onClick,
  onDragStart,
  onDragEnd,
  isSelected = false,
  isDragging = false,
  isPlaced = false,
  isDisabled = false,
  showBlankInput = false,
  onBlankLetterAssign,
  size = 'medium',
  className = '',
}) => {
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const [blankLetter, setBlankLetter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when showing blank input
  useEffect(() => {
    if (showBlankInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showBlankInput]);

  // ================================
  // Event Handlers
  // ================================

  const handleClick = useCallback(() => {
    if (!isDisabled && onClick) {
      onClick(tile);
    }
  }, [tile, onClick, isDisabled]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled || isPlaced) {
      e.preventDefault();
      return;
    }

    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify(tile));
    e.dataTransfer.effectAllowed = 'move';
    
    // Create drag image (only in non-test environment)
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      try {
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.transform = 'rotate(-5deg)';
        dragImage.style.opacity = '0.8';
        dragImage.removeAttribute('data-testid'); // Remove test ID to avoid duplicates
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 32, 32);
        setTimeout(() => {
          if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
          }
        }, 0);
      } catch (error) {
        // Silently fail in test environment
      }
    }

    setIsDraggingInternal(true);
    
    if (onDragStart) {
      onDragStart(tile);
    }
  }, [tile, onDragStart, isDisabled, isPlaced]);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingInternal(false);
    
    if (onDragEnd) {
      onDragEnd(tile);
    }
  }, [tile, onDragEnd]);

  const handleBlankSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (blankLetter && onBlankLetterAssign) {
      onBlankLetterAssign(blankLetter.toUpperCase());
    }
  }, [blankLetter, onBlankLetterAssign]);

  const handleBlankChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(-1).toUpperCase();
    if (/^[A-Z]?$/.test(value)) {
      setBlankLetter(value);
    }
  }, []);

  // ================================
  // Styling
  // ================================

  const baseClasses = `
    ${sizeClasses[size]}
    relative
    flex flex-col
    items-center justify-center
    bg-amber-100
    border-2 border-amber-200
    rounded-lg
    shadow-md
    font-bold
    transition-all duration-200
    select-none
  `;

  const interactionClasses = `
    ${!isDisabled && !isPlaced ? 'cursor-move hover:shadow-lg hover:scale-105' : ''}
    ${!isDisabled && onClick ? 'cursor-pointer' : ''}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${isPlaced ? 'cursor-default' : ''}
  `;

  const stateClasses = `
    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : ''}
    ${isDragging || isDraggingInternal ? 'opacity-50 scale-95' : ''}
    ${isPlaced ? 'bg-amber-50 border-amber-100' : ''}
  `;

  const letterClasses = `
    text-gray-800
    ${tile.isBlank ? 'text-gray-500' : ''}
  `;

  const pointClasses = `
    absolute bottom-1 right-1
    ${pointSizeClasses[size]}
    text-gray-600
    font-semibold
  `;

  // ================================
  // Render
  // ================================

  // Blank tile with input
  if (tile.isBlank && showBlankInput) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <form onSubmit={handleBlankSubmit} className="w-full h-full flex items-center justify-center">
          <input
            ref={inputRef}
            type="text"
            value={blankLetter}
            onChange={handleBlankChange}
            className="w-8 h-8 text-center bg-transparent border-b-2 border-gray-400 outline-none focus:border-blue-500"
            placeholder="?"
            maxLength={1}
            aria-label="Enter letter for blank tile"
          />
        </form>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${interactionClasses} ${stateClasses} ${className}`}
      onClick={handleClick}
      draggable={!isDisabled && !isPlaced}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`Tile ${tile.letter || 'blank'} worth ${tile.points} points${isSelected ? ', selected' : ''}${isPlaced ? ', placed on board' : ''}`}
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      data-testid={`tile-${tile.id}`}
    >
      {/* Letter */}
      <span className={letterClasses}>
        {tile.letter || (tile.isBlank ? '?' : '')}
      </span>
      
      {/* Points */}
      {!tile.isBlank && (
        <span className={pointClasses}>
          {tile.points}
        </span>
      )}
      
      {/* Visual feedback for dragging */}
      {(isDragging || isDraggingInternal) && (
        <div className="absolute inset-0 bg-blue-500 opacity-20 rounded-lg animate-pulse" />
      )}
    </div>
  );
};

// ================================
// Tile Group Component (for tile racks)
// ================================

export interface TileGroupProps {
  tiles: TileType[];
  onTileClick?: (tile: TileType, index: number) => void;
  onTileDragStart?: (tile: TileType, index: number) => void;
  onTileDragEnd?: (tile: TileType, index: number) => void;
  selectedTileIds?: Set<string>;
  disabledTileIds?: Set<string>;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  gap?: string;
}

export const TileGroup: React.FC<TileGroupProps> = ({
  tiles,
  onTileClick,
  onTileDragStart,
  onTileDragEnd,
  selectedTileIds = new Set(),
  disabledTileIds = new Set(),
  size = 'medium',
  className = '',
  gap = 'gap-2',
}) => {
  return (
    <div className={`flex flex-wrap ${gap} ${className}`}>
      {tiles.map((tile, index) => (
        <Tile
          key={tile.id}
          tile={tile}
          onClick={onTileClick ? () => onTileClick(tile, index) : undefined}
          onDragStart={onTileDragStart ? () => onTileDragStart(tile, index) : undefined}
          onDragEnd={onTileDragEnd ? () => onTileDragEnd(tile, index) : undefined}
          isSelected={selectedTileIds.has(tile.id)}
          isDisabled={disabledTileIds.has(tile.id)}
          size={size}
        />
      ))}
    </div>
  );
};

export default Tile;