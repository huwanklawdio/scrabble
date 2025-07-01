import React, { useState, useCallback } from 'react';
import type { BoardCell as BoardCellType, PremiumSquareType, Tile } from '../types/game';
import { dragAndDropUtils } from '../utils/dragAndDrop';
import { touchDragAndDropUtils } from '../utils/touchDragAndDrop';

const {
  DragDataManager,
  DropZoneValidator,
  DragAccessibility,
} = dragAndDropUtils;

const { TouchDragManager } = touchDragAndDropUtils;

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
  const cellRef = React.useRef<HTMLDivElement>(null);
  const touchManager = TouchDragManager.getInstance();

  // Set up accessibility descriptions (only for additional context, don't override aria-label)
  React.useEffect(() => {
    if (cellRef.current && !cellRef.current.getAttribute('aria-label')) {
      DragAccessibility.setDropZoneDescriptions(cellRef.current, row, col);
    }
  }, [row, col]);

  // Register as a touch drop target
  React.useEffect(() => {
    if (cellRef.current) {
      const cellId = `cell-${row}-${col}`;
      touchManager.registerDropTarget(cellId, cellRef.current, row, col);
      
      return () => {
        touchManager.unregisterDropTarget(cellId);
      };
    }
  }, [row, col, touchManager]);

  // Handle touch drop events
  React.useEffect(() => {
    const handleTouchDrop = (e: CustomEvent) => {
      const { tile, row: dropRow, col: dropCol } = e.detail;
      
      if (dropRow === row && dropCol === col && onDrop && !cell.tile && !disabled && isValidDropTarget) {
        onDrop(row, col, tile);
      }
    };

    if (cellRef.current) {
      cellRef.current.addEventListener('touchdrop', handleTouchDrop as EventListener);
      
      return () => {
        if (cellRef.current) {
          cellRef.current.removeEventListener('touchdrop', handleTouchDrop as EventListener);
        }
      };
    }
  }, [row, col, onDrop, cell.tile, disabled, isValidDropTarget]);

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
    
    // Try to get drag data, but don't fail if it's not available
    let isValid = true;
    try {
      const dragData = DragDataManager.getTileData(e.dataTransfer);
      
      // Validate drop zone
      const dropZoneState = DropZoneValidator.validateDropTarget(
        dragData,
        row,
        col,
        !!cell.tile,
        disabled || !isValidDropTarget
      );
      
      isValid = dropZoneState.isValidTarget;
    } catch (error) {
      // Fallback validation for test environments
      isValid = !disabled && isValidDropTarget && !cell.tile;
    }
    
    // Set appropriate drop effect
    e.dataTransfer.dropEffect = isValid ? 'move' : 'none';
  }, [disabled, isValidDropTarget, cell.tile, row, col]);

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
    
    // Standard validation for backward compatibility
    if (!disabled && isValidDropTarget && !cell.tile && onDrop) {
      // Try enhanced drag data first
      let dragData = DragDataManager.getTileData(e.dataTransfer);
      let tileToUse = dragData?.tile;
      
      // Fallback to legacy JSON format for compatibility
      if (!tileToUse) {
        try {
          const legacyData = e.dataTransfer.getData('application/json');
          if (legacyData) {
            const parsedTile = JSON.parse(legacyData);
            tileToUse = parsedTile;
            dragData = { type: 'tile', tile: parsedTile };
          }
        } catch (error) {
          console.warn('Failed to parse drag data:', error);
        }
      }
      
      if (tileToUse) {
        // Enhanced validation if we have enhanced data
        if (dragData) {
          const dropZoneState = DropZoneValidator.validateDropTarget(
            dragData,
            row,
            col,
            !!cell.tile,
            disabled || !isValidDropTarget
          );
          
          if (dropZoneState.isValidTarget) {
            DragAccessibility.announceDropAction(dragData.tile, row, col, true);
            onDrop(row, col, dragData.tile);
          } else {
            DragAccessibility.announceDropAction(dragData.tile, row, col, false);
          }
        } else {
          // Legacy behavior
          onDrop(row, col, tileToUse);
        }
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
    ${isDragOver && isValidDropTarget && !cell.tile ? 'ring-2 ring-green-500 ring-offset-2 scale-105 bg-green-50 shadow-lg' : ''}
    ${isDragOver && (!isValidDropTarget || cell.tile) ? 'ring-2 ring-red-500 ring-offset-2 opacity-50 bg-red-50 animate-pulse' : ''}
    ${dragCounter > 0 && isValidDropTarget && !cell.tile ? 'bg-green-50 border-green-300' : ''}
    ${dragCounter > 0 && (!isValidDropTarget || cell.tile) ? 'bg-red-50 border-red-300' : ''}
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
      ref={cellRef}
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