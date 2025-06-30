import React, { useState, useCallback } from 'react';
import type { BoardCell as BoardCellType, PremiumSquareType, Tile } from '../types/game';

// ================================
// BoardCell Component Props
// ================================

export interface BoardCellProps {
  cell: BoardCellType;
  row: number;
  col: number;
  onClick?: (row: number, col: number) => void;
  onMouseEnter?: (row: number, col: number) => void;
  onMouseLeave?: () => void;
  onDrop?: (row: number, col: number, tile: Tile) => void;
  onDragEnter?: (row: number, col: number) => void;
  onDragLeave?: (row: number, col: number) => void;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isValidDropTarget?: boolean;
  isDragOver?: boolean;
  disabled?: boolean;
}

// ================================
// Premium Square Styling
// ================================

const getPremiumSquareClasses = (premiumType: PremiumSquareType | null): string => {
  switch (premiumType) {
    case 'TW':
      return 'bg-red-600 text-white';
    case 'DW':
      return 'bg-pink-500 text-white';
    case 'TL':
      return 'bg-blue-600 text-white';
    case 'DL':
      return 'bg-blue-400 text-white';
    case 'center':
      return 'bg-pink-500 text-white';
    default:
      return 'bg-green-100';
  }
};

const getPremiumSquareLabel = (premiumType: PremiumSquareType | null): string => {
  switch (premiumType) {
    case 'TW':
      return 'TW';
    case 'DW':
      return 'DW';
    case 'TL':
      return 'TL';
    case 'DL':
      return 'DL';
    case 'center':
      return '★';
    default:
      return '';
  }
};

const getPremiumSquareAriaLabel = (premiumType: PremiumSquareType | null): string => {
  switch (premiumType) {
    case 'TW':
      return 'Triple Word Score';
    case 'DW':
      return 'Double Word Score';
    case 'TL':
      return 'Triple Letter Score';
    case 'DL':
      return 'Double Letter Score';
    case 'center':
      return 'Center Star';
    default:
      return '';
  }
};

// ================================
// BoardCell Component
// ================================

export const BoardCell: React.FC<BoardCellProps> = ({
  cell,
  row,
  col,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDrop,
  onDragEnter,
  onDragLeave,
  isHighlighted = false,
  isSelected = false,
  isValidDropTarget = true,
  isDragOver = false,
  disabled = false,
}) => {
  const [dragCounter, setDragCounter] = useState(0);

  // ================================
  // Event Handlers
  // ================================

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick(row, col);
    }
  }, [row, col, onClick, disabled]);

  const handleMouseEnter = useCallback(() => {
    if (!disabled && onMouseEnter) {
      onMouseEnter(row, col);
    }
  }, [row, col, onMouseEnter, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled && isValidDropTarget && !cell.tile) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  }, [disabled, isValidDropTarget, cell.tile]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev + 1);
    
    if (!disabled && isValidDropTarget && !cell.tile && onDragEnter) {
      onDragEnter(row, col);
    }
  }, [row, col, disabled, isValidDropTarget, cell.tile, onDragEnter]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0 && onDragLeave) {
        onDragLeave(row, col);
      }
      return newCounter;
    });
  }, [row, col, onDragLeave]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(0);
    
    if (!disabled && isValidDropTarget && !cell.tile && onDrop) {
      try {
        const tileData = e.dataTransfer.getData('application/json');
        const tile = JSON.parse(tileData) as Tile;
        onDrop(row, col, tile);
      } catch (error) {
        console.error('Failed to parse dropped tile data:', error);
      }
    }
    
    if (onDragLeave) {
      onDragLeave(row, col);
    }
  }, [row, col, disabled, isValidDropTarget, cell.tile, onDrop, onDragLeave]);

  // ================================
  // Styling
  // ================================

  const baseClasses = 'aspect-square border border-gray-300 flex items-center justify-center font-semibold text-xs sm:text-sm transition-all duration-200 relative';
  
  const premiumClasses = !cell.tile ? getPremiumSquareClasses(cell.premiumType) : 'bg-amber-100';
  
  const interactionClasses = `
    ${isHighlighted ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
    ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
    ${!disabled && onClick ? 'cursor-pointer hover:brightness-110' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  const dragClasses = `
    ${isDragOver && isValidDropTarget && !cell.tile ? 'ring-2 ring-green-500 ring-offset-2 scale-105' : ''}
    ${isDragOver && (!isValidDropTarget || cell.tile) ? 'ring-2 ring-red-500 ring-offset-2 opacity-50' : ''}
  `;

  // ================================
  // Accessibility
  // ================================

  const getCellAriaLabel = (): string => {
    const position = `Row ${row + 1}, Column ${String.fromCharCode(65 + col)}`;
    
    if (cell.tile) {
      return `${position}, ${cell.tile.letter} worth ${cell.tile.points} points`;
    }
    
    const premiumLabel = getPremiumSquareAriaLabel(cell.premiumType);
    if (premiumLabel) {
      return `${position}, ${premiumLabel}`;
    }
    
    return `${position}, Empty`;
  };

  // ================================
  // Render
  // ================================

  return (
    <div
      className={`${baseClasses} ${premiumClasses} ${interactionClasses} ${dragClasses}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`cell-${row}-${col}`}
      role="gridcell"
      aria-label={getCellAriaLabel()}
      aria-selected={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      aria-rowindex={row + 1}
      aria-colindex={col + 1}
    >
      {cell.tile ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-amber-100 rounded">
          <span className="text-gray-800 font-bold text-sm sm:text-base">
            {cell.tile.letter}
          </span>
          <span className="text-gray-600 text-xs">
            {cell.tile.points}
          </span>
        </div>
      ) : (
        <>
          <span className="text-xs opacity-80" aria-hidden="true">
            {getPremiumSquareLabel(cell.premiumType)}
          </span>
          {isDragOver && (
            <div className="absolute inset-0 pointer-events-none">
              {isValidDropTarget && !cell.tile ? (
                <div className="w-full h-full border-2 border-green-500 rounded animate-pulse" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-red-500 text-2xl">✗</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BoardCell;