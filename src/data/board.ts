// ================================
// Scrabble Board Configuration
// ================================

import type { 
  Board, 
  BoardCell, 
  BoardPosition, 
  PremiumSquareType,
  Tile 
} from '../types';
import { BOARD_SIZE, PREMIUM_SQUARES } from '../types';

// ================================
// Board Layout Constants
// ================================

// Center position (star square where first word must be placed)
export const CENTER_POSITION: BoardPosition = { row: 7, col: 7 };

// Multiplier values for premium squares
export const MULTIPLIER_VALUES = {
  DL: 2,  // Double Letter Score
  TL: 3,  // Triple Letter Score
  DW: 2,  // Double Word Score
  TW: 3   // Triple Word Score
} as const;

// Premium square descriptions for UI
export const PREMIUM_SQUARE_LABELS = {
  normal: '',
  DL: 'Double Letter Score',
  TL: 'Triple Letter Score', 
  DW: 'Double Word Score',
  TW: 'Triple Word Score',
  center: 'Star (Game Start)'
} as const;

// Premium square abbreviations for display
export const PREMIUM_SQUARE_ABBREV = {
  normal: '',
  DL: 'DL',
  TL: 'TL',
  DW: 'DW', 
  TW: 'TW',
  center: '★'
} as const;

// ================================
// Board Creation Functions
// ================================

/**
 * Creates an empty board with all premium squares correctly positioned
 */
export function createEmptyBoard(): Board {
  const board: Board = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    const boardRow: BoardCell[] = [];
    
    for (let col = 0; col < BOARD_SIZE; col++) {
      const position: BoardPosition = { row, col };
      const premiumType = getPremiumSquareType(position);
      const isCenter = row === 7 && col === 7;
      
      boardRow.push({
        position,
        tile: undefined,
        premiumType,
        isCenter,
        isEmpty: true
      });
    }
    
    board.push(boardRow);
  }
  
  return board;
}

/**
 * Determines the premium square type for a given position
 */
export function getPremiumSquareType(position: BoardPosition): PremiumSquareType {
  const { row, col } = position;
  
  // Check center position first
  if (row === 7 && col === 7) {
    return 'center';
  }
  
  // Check each premium square type
  if (PREMIUM_SQUARES.TW.some(([r, c]) => r === row && c === col)) {
    return 'TW';
  }
  
  if (PREMIUM_SQUARES.DW.some(([r, c]) => r === row && c === col)) {
    return 'DW';
  }
  
  if (PREMIUM_SQUARES.TL.some(([r, c]) => r === row && c === col)) {
    return 'TL';
  }
  
  if (PREMIUM_SQUARES.DL.some(([r, c]) => r === row && c === col)) {
    return 'DL';
  }
  
  return 'normal';
}

/**
 * Creates a board from an existing state (for loading saved games)
 */
export function createBoardFromState(boardData: any[][]): Board {
  const board: Board = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    const boardRow: BoardCell[] = [];
    
    for (let col = 0; col < BOARD_SIZE; col++) {
      const position: BoardPosition = { row, col };
      const cellData = boardData[row]?.[col];
      const premiumType = getPremiumSquareType(position);
      const isCenter = row === 7 && col === 7;
      
      boardRow.push({
        position,
        tile: cellData?.tile || undefined,
        premiumType,
        isCenter,
        isEmpty: !cellData?.tile
      });
    }
    
    board.push(boardRow);
  }
  
  return board;
}

// ================================
// Board Utility Functions
// ================================

/**
 * Gets a specific cell from the board
 */
export function getBoardCell(board: Board, position: BoardPosition): BoardCell | null {
  const { row, col } = position;
  
  if (!isValidPosition(position)) {
    return null;
  }
  
  return board[row][col];
}

/**
 * Sets a tile on the board at the specified position
 */
export function setBoardCell(board: Board, position: BoardPosition, tile: Tile | undefined): Board {
  if (!isValidPosition(position)) {
    throw new Error(`Invalid board position: (${position.row}, ${position.col})`);
  }
  
  // Create a deep copy of the board
  const newBoard = board.map(row => 
    row.map(cell => ({ ...cell }))
  );
  
  const cell = newBoard[position.row][position.col];
  cell.tile = tile;
  cell.isEmpty = !tile;
  
  // Update tile position if tile is provided
  if (tile) {
    tile.position = position;
    tile.status = 'board';
  }
  
  return newBoard;
}

/**
 * Removes a tile from the board at the specified position
 */
export function removeBoardTile(board: Board, position: BoardPosition): Board {
  return setBoardCell(board, position, undefined);
}

/**
 * Checks if a position is valid (within board bounds)
 */
export function isValidPosition(position: BoardPosition): boolean {
  const { row, col } = position;
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Checks if a board cell is empty
 */
export function isCellEmpty(board: Board, position: BoardPosition): boolean {
  const cell = getBoardCell(board, position);
  return cell ? cell.isEmpty : false;
}

/**
 * Checks if a board cell has a tile
 */
export function hasTile(board: Board, position: BoardPosition): boolean {
  return !isCellEmpty(board, position);
}

/**
 * Gets all tiles currently on the board
 */
export function getBoardTiles(board: Board): Array<{ tile: Tile; position: BoardPosition }> {
  const tiles: Array<{ tile: Tile; position: BoardPosition }> = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell.tile) {
        tiles.push({
          tile: cell.tile,
          position: cell.position
        });
      }
    }
  }
  
  return tiles;
}

/**
 * Gets all empty positions on the board
 */
export function getEmptyPositions(board: Board): BoardPosition[] {
  const emptyPositions: BoardPosition[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].isEmpty) {
        emptyPositions.push({ row, col });
      }
    }
  }
  
  return emptyPositions;
}

/**
 * Checks if the board is completely empty
 */
export function isBoardEmpty(board: Board): boolean {
  return getBoardTiles(board).length === 0;
}

/**
 * Checks if the center star position is occupied
 */
export function isCenterOccupied(board: Board): boolean {
  return hasTile(board, CENTER_POSITION);
}

// ================================
// Board Navigation Functions
// ================================

/**
 * Gets adjacent positions (up, down, left, right)
 */
export function getAdjacentPositions(position: BoardPosition): BoardPosition[] {
  const { row, col } = position;
  const adjacent: BoardPosition[] = [];
  
  // Up, Down, Left, Right
  const directions = [
    { row: -1, col: 0 },  // Up
    { row: 1, col: 0 },   // Down
    { row: 0, col: -1 },  // Left
    { row: 0, col: 1 }    // Right
  ];
  
  directions.forEach(dir => {
    const newPos = { row: row + dir.row, col: col + dir.col };
    if (isValidPosition(newPos)) {
      adjacent.push(newPos);
    }
  });
  
  return adjacent;
}

/**
 * Gets all positions in a horizontal line from a starting position
 */
export function getHorizontalLine(startPosition: BoardPosition, length: number): BoardPosition[] {
  const positions: BoardPosition[] = [];
  const { row, col } = startPosition;
  
  for (let i = 0; i < length; i++) {
    const position = { row, col: col + i };
    if (isValidPosition(position)) {
      positions.push(position);
    }
  }
  
  return positions;
}

/**
 * Gets all positions in a vertical line from a starting position
 */
export function getVerticalLine(startPosition: BoardPosition, length: number): BoardPosition[] {
  const positions: BoardPosition[] = [];
  const { row, col } = startPosition;
  
  for (let i = 0; i < length; i++) {
    const position = { row: row + i, col };
    if (isValidPosition(position)) {
      positions.push(position);
    }
  }
  
  return positions;
}

/**
 * Checks if two positions are adjacent (horizontally or vertically)
 */
export function arePositionsAdjacent(pos1: BoardPosition, pos2: BoardPosition): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  
  // Adjacent means exactly one cell away in one direction
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Checks if positions form a straight line (horizontal or vertical)
 */
export function arePositionsInLine(positions: BoardPosition[]): { isLine: boolean; direction: 'horizontal' | 'vertical' | 'none' } {
  if (positions.length < 2) {
    return { isLine: true, direction: 'none' };
  }
  
  // Check if all positions are in the same row (horizontal)
  const sameRow = positions.every(pos => pos.row === positions[0].row);
  if (sameRow) {
    return { isLine: true, direction: 'horizontal' };
  }
  
  // Check if all positions are in the same column (vertical)
  const sameCol = positions.every(pos => pos.col === positions[0].col);
  if (sameCol) {
    return { isLine: true, direction: 'vertical' };
  }
  
  return { isLine: false, direction: 'none' };
}

// ================================
// Board Analysis Functions
// ================================

/**
 * Calculates board statistics
 */
export function getBoardStatistics(board: Board) {
  const totalCells = BOARD_SIZE * BOARD_SIZE;
  const occupiedCells = getBoardTiles(board).length;
  const emptyCells = totalCells - occupiedCells;
  
  // Count premium squares
  const premiumCounts = {
    DL: 0,
    TL: 0,
    DW: 0,
    TW: 0,
    center: 0,
    normal: 0
  };
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      premiumCounts[cell.premiumType]++;
    }
  }
  
  return {
    totalCells,
    occupiedCells,
    emptyCells,
    occupancyPercentage: (occupiedCells / totalCells) * 100,
    premiumSquares: premiumCounts,
    isCenterOccupied: isCenterOccupied(board),
    isEmpty: isBoardEmpty(board)
  };
}

/**
 * Validates board layout and premium square positions
 */
export function validateBoardLayout(board: Board): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check board dimensions
  if (board.length !== BOARD_SIZE) {
    errors.push(`Board height is ${board.length}, expected ${BOARD_SIZE}`);
  }
  
  board.forEach((row, rowIndex) => {
    if (row.length !== BOARD_SIZE) {
      errors.push(`Row ${rowIndex} has ${row.length} columns, expected ${BOARD_SIZE}`);
    }
  });
  
  // Check center position
  const centerCell = getBoardCell(board, CENTER_POSITION);
  if (!centerCell || !centerCell.isCenter || centerCell.premiumType !== 'center') {
    errors.push('Center position is not correctly configured');
  }
  
  // Validate premium square positions
  let dlCount = 0, tlCount = 0, dwCount = 0, twCount = 0;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Check if the row and cell exist before accessing
      if (!board[row] || !board[row][col]) {
        continue; // Skip invalid positions
      }
      
      const cell = board[row][col];
      const expectedType = getPremiumSquareType({ row, col });
      
      if (cell.premiumType !== expectedType) {
        errors.push(`Premium square mismatch at (${row}, ${col}): expected ${expectedType}, got ${cell.premiumType}`);
      }
      
      // Count premium squares
      switch (cell.premiumType) {
        case 'DL': dlCount++; break;
        case 'TL': tlCount++; break;
        case 'DW': dwCount++; break;
        case 'TW': twCount++; break;
      }
    }
  }
  
  // Validate premium square counts
  if (dlCount !== PREMIUM_SQUARES.DL.length) {
    errors.push(`Expected ${PREMIUM_SQUARES.DL.length} DL squares, found ${dlCount}`);
  }
  if (tlCount !== PREMIUM_SQUARES.TL.length) {
    errors.push(`Expected ${PREMIUM_SQUARES.TL.length} TL squares, found ${tlCount}`);
  }
  if (dwCount !== PREMIUM_SQUARES.DW.length) {
    errors.push(`Expected ${PREMIUM_SQUARES.DW.length} DW squares, found ${dwCount}`);
  }
  if (twCount !== PREMIUM_SQUARES.TW.length) {
    errors.push(`Expected ${PREMIUM_SQUARES.TW.length} TW squares, found ${twCount}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ================================
// Export Default Board
// ================================

// Pre-created empty board for immediate use
export const DEFAULT_BOARD = createEmptyBoard();

// Export validation result for runtime checking
export const BOARD_VALIDATION = validateBoardLayout(DEFAULT_BOARD); 