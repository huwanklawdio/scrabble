import React from 'react';
import { useGameState } from '../hooks/useGameState';
import type { Board as BoardType, BoardCell, PremiumSquareType } from '../types/game';

// ================================
// Board Component Props
// ================================

export interface BoardProps {
  className?: string;
  onCellClick?: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  highlightedCells?: Set<string>;
  selectedCell?: { row: number; col: number } | null;
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

// ================================
// Board Cell Component
// ================================

interface BoardCellComponentProps {
  cell: BoardCell;
  row: number;
  col: number;
  onClick?: (row: number, col: number) => void;
  onMouseEnter?: (row: number, col: number) => void;
  onMouseLeave?: () => void;
  isHighlighted?: boolean;
  isSelected?: boolean;
}

const BoardCellComponent: React.FC<BoardCellComponentProps> = ({
  cell,
  row,
  col,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isHighlighted,
  isSelected,
}) => {
  const handleClick = () => {
    onClick?.(row, col);
  };

  const handleMouseEnter = () => {
    onMouseEnter?.(row, col);
  };

  const baseClasses = 'aspect-square border border-gray-300 flex items-center justify-center font-semibold text-xs sm:text-sm transition-all duration-200';
  const premiumClasses = !cell.tile ? getPremiumSquareClasses(cell.premiumType) : 'bg-amber-100';
  const interactionClasses = `
    ${isHighlighted ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
    ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
    ${onClick ? 'cursor-pointer hover:brightness-110' : ''}
  `;

  return (
    <div
      className={`${baseClasses} ${premiumClasses} ${interactionClasses}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid={`cell-${row}-${col}`}
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
        <span className="text-xs opacity-80">
          {getPremiumSquareLabel(cell.premiumType)}
        </span>
      )}
    </div>
  );
};

// ================================
// Board Component
// ================================

export const Board: React.FC<BoardProps> = ({
  className = '',
  onCellClick,
  onCellHover,
  onCellLeave,
  highlightedCells = new Set(),
  selectedCell,
}) => {
  const { board } = useGameState();

  if (!board) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500">No game board available</p>
      </div>
    );
  }

  const getCellKey = (row: number, col: number) => `${row},${col}`;

  return (
    <div className={`inline-block ${className}`}>
      {/* Board Container */}
      <div className="bg-gray-800 p-2 sm:p-4 rounded-lg shadow-2xl">
        {/* Column Labels */}
        <div className="grid grid-cols-[auto_repeat(15,1fr)] gap-0 mb-1">
          <div className="w-6 sm:w-8" /> {/* Empty corner */}
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={`col-label-${i}`}
              className="text-center text-gray-400 text-xs sm:text-sm font-semibold"
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>

        {/* Board Grid with Row Labels */}
        <div className="grid grid-cols-[auto_repeat(15,1fr)] gap-0">
          {board.map((row, rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              {/* Row Label */}
              <div className="w-6 sm:w-8 flex items-center justify-center text-gray-400 text-xs sm:text-sm font-semibold">
                {rowIndex + 1}
              </div>
              
              {/* Row Cells */}
              {row.map((cell, colIndex) => (
                <BoardCellComponent
                  key={`cell-${rowIndex}-${colIndex}`}
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  onClick={onCellClick}
                  onMouseEnter={onCellHover}
                  onMouseLeave={onCellLeave}
                  isHighlighted={highlightedCells.has(getCellKey(rowIndex, colIndex))}
                  isSelected={
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                  }
                />
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-gray-400">Triple Word</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-pink-500 rounded"></div>
            <span className="text-gray-400">Double Word</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-gray-400">Triple Letter</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-gray-400">Double Letter</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;