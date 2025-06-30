import React from 'react';
import { useGameState } from '../hooks/useGameState';
import { BoardCell } from './BoardCell';
import type { Board as BoardType, Tile } from '../types/game';

// ================================
// Board Component Props
// ================================

export interface BoardProps {
  className?: string;
  onCellClick?: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  onCellDrop?: (row: number, col: number, tile: Tile) => void;
  onCellDragEnter?: (row: number, col: number) => void;
  onCellDragLeave?: (row: number, col: number) => void;
  highlightedCells?: Set<string>;
  selectedCell?: { row: number; col: number } | null;
  dragOverCell?: { row: number; col: number } | null;
  validDropTargets?: Set<string>;
  disabled?: boolean;
}


// ================================
// Board Component
// ================================

export const Board: React.FC<BoardProps> = ({
  className = '',
  onCellClick,
  onCellHover,
  onCellLeave,
  onCellDrop,
  onCellDragEnter,
  onCellDragLeave,
  highlightedCells = new Set(),
  selectedCell,
  dragOverCell,
  validDropTargets = new Set(),
  disabled = false,
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
                <BoardCell
                  key={`cell-${rowIndex}-${colIndex}`}
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  onClick={onCellClick}
                  onMouseEnter={onCellHover}
                  onMouseLeave={onCellLeave}
                  onDrop={onCellDrop}
                  onDragEnter={onCellDragEnter}
                  onDragLeave={onCellDragLeave}
                  isHighlighted={highlightedCells.has(getCellKey(rowIndex, colIndex))}
                  isSelected={
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                  }
                  isDragOver={
                    dragOverCell?.row === rowIndex && dragOverCell?.col === colIndex
                  }
                  isValidDropTarget={
                    validDropTargets.size === 0 || 
                    validDropTargets.has(getCellKey(rowIndex, colIndex))
                  }
                  disabled={disabled}
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