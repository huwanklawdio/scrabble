// ================================
// Board Configuration Tests
// ================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyBoard,
  getPremiumSquareType,
  createBoardFromState,
  getBoardCell,
  setBoardCell,
  removeBoardTile,
  isValidPosition,
  isCellEmpty,
  hasTile,
  getBoardTiles,
  getEmptyPositions,
  isBoardEmpty,
  isCenterOccupied,
  getAdjacentPositions,
  getHorizontalLine,
  getVerticalLine,
  arePositionsAdjacent,
  arePositionsInLine,
  getBoardStatistics,
  validateBoardLayout,
  CENTER_POSITION,
  MULTIPLIER_VALUES,
  PREMIUM_SQUARE_LABELS,
  PREMIUM_SQUARE_ABBREV,
  DEFAULT_BOARD,
  BOARD_VALIDATION
} from './board';

import { createTile } from './tiles';
import type { Board, Tile } from '../types';
import { BOARD_SIZE, PREMIUM_SQUARES } from '../types';

describe('Board Configuration', () => {
  let board: Board;
  let testTile: Tile;

  beforeEach(() => {
    board = createEmptyBoard();
    testTile = createTile('A');
  });

  describe('Constants', () => {
    it('should have correct center position', () => {
      expect(CENTER_POSITION).toEqual({ row: 7, col: 7 });
    });

    it('should have correct multiplier values', () => {
      expect(MULTIPLIER_VALUES.DL).toBe(2);
      expect(MULTIPLIER_VALUES.TL).toBe(3);
      expect(MULTIPLIER_VALUES.DW).toBe(2);
      expect(MULTIPLIER_VALUES.TW).toBe(3);
    });

    it('should have premium square labels', () => {
      expect(PREMIUM_SQUARE_LABELS.DL).toBe('Double Letter Score');
      expect(PREMIUM_SQUARE_LABELS.TL).toBe('Triple Letter Score');
      expect(PREMIUM_SQUARE_LABELS.DW).toBe('Double Word Score');
      expect(PREMIUM_SQUARE_LABELS.TW).toBe('Triple Word Score');
      expect(PREMIUM_SQUARE_LABELS.center).toBe('Star (Game Start)');
    });

    it('should have premium square abbreviations', () => {
      expect(PREMIUM_SQUARE_ABBREV.center).toBe('★');
      expect(PREMIUM_SQUARE_ABBREV.DL).toBe('DL');
      expect(PREMIUM_SQUARE_ABBREV.TW).toBe('TW');
    });
  });

  describe('createEmptyBoard', () => {
    it('should create a 15x15 board', () => {
      expect(board.length).toBe(BOARD_SIZE);
      board.forEach(row => {
        expect(row.length).toBe(BOARD_SIZE);
      });
    });

    it('should have all empty cells initially', () => {
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const cell = board[row][col];
          expect(cell.isEmpty).toBe(true);
          expect(cell.tile).toBeUndefined();
        }
      }
    });

    it('should have center position marked correctly', () => {
      const centerCell = board[7][7];
      expect(centerCell.isCenter).toBe(true);
      expect(centerCell.premiumType).toBe('center');
    });

    it('should have correct premium square positions', () => {
      // Test some known premium square positions
      expect(board[0][0].premiumType).toBe('TW'); // Corner
      expect(board[0][3].premiumType).toBe('DL'); 
      expect(board[1][1].premiumType).toBe('DW');
      expect(board[1][5].premiumType).toBe('TL');
    });
  });

  describe('getPremiumSquareType', () => {
    it('should return center for center position', () => {
      expect(getPremiumSquareType({ row: 7, col: 7 })).toBe('center');
    });

    it('should return correct premium types', () => {
      expect(getPremiumSquareType({ row: 0, col: 0 })).toBe('TW');
      expect(getPremiumSquareType({ row: 0, col: 3 })).toBe('DL');
      expect(getPremiumSquareType({ row: 1, col: 1 })).toBe('DW');
      expect(getPremiumSquareType({ row: 1, col: 5 })).toBe('TL');
      expect(getPremiumSquareType({ row: 2, col: 2 })).toBe('DW');
    });

    it('should return normal for regular positions', () => {
      expect(getPremiumSquareType({ row: 1, col: 2 })).toBe('normal');
      expect(getPremiumSquareType({ row: 6, col: 7 })).toBe('normal');
    });
  });

  describe('createBoardFromState', () => {
    it('should create board from empty state', () => {
      const emptyState = Array(15).fill(null).map(() => Array(15).fill({}));
      const newBoard = createBoardFromState(emptyState);
      
      expect(newBoard.length).toBe(BOARD_SIZE);
      expect(isBoardEmpty(newBoard)).toBe(true);
    });

    it('should create board with tiles from state', () => {
      const stateWithTile = Array(15).fill(null).map(() => Array(15).fill({}));
      stateWithTile[7][7] = { tile: testTile };
      
      const newBoard = createBoardFromState(stateWithTile);
      expect(hasTile(newBoard, { row: 7, col: 7 })).toBe(true);
    });
  });

  describe('Board Utility Functions', () => {
    describe('getBoardCell', () => {
      it('should return correct cell', () => {
        const cell = getBoardCell(board, { row: 0, col: 0 });
        expect(cell).toBeDefined();
        expect(cell?.position).toEqual({ row: 0, col: 0 });
      });

      it('should return null for invalid position', () => {
        expect(getBoardCell(board, { row: -1, col: 0 })).toBeNull();
        expect(getBoardCell(board, { row: 15, col: 0 })).toBeNull();
      });
    });

    describe('setBoardCell', () => {
      it('should place tile on board', () => {
        const newBoard = setBoardCell(board, { row: 5, col: 5 }, testTile);
        const cell = getBoardCell(newBoard, { row: 5, col: 5 });
        
        expect(cell?.tile).toBe(testTile);
        expect(cell?.isEmpty).toBe(false);
        expect(testTile.position).toEqual({ row: 5, col: 5 });
        expect(testTile.status).toBe('board');
      });

      it('should throw error for invalid position', () => {
        expect(() => {
          setBoardCell(board, { row: -1, col: 0 }, testTile);
        }).toThrow('Invalid board position');
      });

      it('should create new board instance', () => {
        const newBoard = setBoardCell(board, { row: 5, col: 5 }, testTile);
        expect(newBoard).not.toBe(board);
        expect(isBoardEmpty(board)).toBe(true); // Original board unchanged
      });
    });

    describe('removeBoardTile', () => {
      it('should remove tile from board', () => {
        let newBoard = setBoardCell(board, { row: 5, col: 5 }, testTile);
        expect(hasTile(newBoard, { row: 5, col: 5 })).toBe(true);
        
        newBoard = removeBoardTile(newBoard, { row: 5, col: 5 });
        expect(isCellEmpty(newBoard, { row: 5, col: 5 })).toBe(true);
      });
    });

    describe('isValidPosition', () => {
      it('should validate correct positions', () => {
        expect(isValidPosition({ row: 0, col: 0 })).toBe(true);
        expect(isValidPosition({ row: 14, col: 14 })).toBe(true);
        expect(isValidPosition({ row: 7, col: 7 })).toBe(true);
      });

      it('should reject invalid positions', () => {
        expect(isValidPosition({ row: -1, col: 0 })).toBe(false);
        expect(isValidPosition({ row: 15, col: 0 })).toBe(false);
        expect(isValidPosition({ row: 0, col: -1 })).toBe(false);
        expect(isValidPosition({ row: 0, col: 15 })).toBe(false);
      });
    });

    describe('Board state queries', () => {
      it('should detect empty cells and tiles', () => {
        expect(isCellEmpty(board, { row: 5, col: 5 })).toBe(true);
        expect(hasTile(board, { row: 5, col: 5 })).toBe(false);
        
        const newBoard = setBoardCell(board, { row: 5, col: 5 }, testTile);
        expect(isCellEmpty(newBoard, { row: 5, col: 5 })).toBe(false);
        expect(hasTile(newBoard, { row: 5, col: 5 })).toBe(true);
      });

      it('should detect empty board', () => {
        expect(isBoardEmpty(board)).toBe(true);
        
        const newBoard = setBoardCell(board, { row: 5, col: 5 }, testTile);
        expect(isBoardEmpty(newBoard)).toBe(false);
      });

      it('should detect center occupation', () => {
        expect(isCenterOccupied(board)).toBe(false);
        
        const newBoard = setBoardCell(board, CENTER_POSITION, testTile);
        expect(isCenterOccupied(newBoard)).toBe(true);
      });
    });

    describe('getBoardTiles', () => {
      it('should return empty array for empty board', () => {
        expect(getBoardTiles(board)).toEqual([]);
      });

      it('should return all tiles on board', () => {
        let newBoard = setBoardCell(board, { row: 5, col: 5 }, testTile);
        const testTile2 = createTile('B');
        newBoard = setBoardCell(newBoard, { row: 6, col: 6 }, testTile2);
        
        const tiles = getBoardTiles(newBoard);
        expect(tiles).toHaveLength(2);
        expect(tiles.some(t => t.tile === testTile)).toBe(true);
        expect(tiles.some(t => t.tile === testTile2)).toBe(true);
      });
    });

    describe('getEmptyPositions', () => {
      it('should return all positions for empty board', () => {
        const emptyPositions = getEmptyPositions(board);
        expect(emptyPositions).toHaveLength(BOARD_SIZE * BOARD_SIZE);
      });

      it('should exclude occupied positions', () => {
        const newBoard = setBoardCell(board, { row: 5, col: 5 }, testTile);
        const emptyPositions = getEmptyPositions(newBoard);
        expect(emptyPositions).toHaveLength(BOARD_SIZE * BOARD_SIZE - 1);
        expect(emptyPositions.some(pos => pos.row === 5 && pos.col === 5)).toBe(false);
      });
    });
  });

  describe('Board Navigation Functions', () => {
    describe('getAdjacentPositions', () => {
      it('should return 4 adjacent positions for center', () => {
        const adjacent = getAdjacentPositions({ row: 7, col: 7 });
        expect(adjacent).toHaveLength(4);
        expect(adjacent).toContainEqual({ row: 6, col: 7 }); // Up
        expect(adjacent).toContainEqual({ row: 8, col: 7 }); // Down
        expect(adjacent).toContainEqual({ row: 7, col: 6 }); // Left
        expect(adjacent).toContainEqual({ row: 7, col: 8 }); // Right
      });

      it('should return 2 adjacent positions for corner', () => {
        const adjacent = getAdjacentPositions({ row: 0, col: 0 });
        expect(adjacent).toHaveLength(2);
        expect(adjacent).toContainEqual({ row: 1, col: 0 }); // Down
        expect(adjacent).toContainEqual({ row: 0, col: 1 }); // Right
      });

      it('should return 3 adjacent positions for edge', () => {
        const adjacent = getAdjacentPositions({ row: 0, col: 7 });
        expect(adjacent).toHaveLength(3);
      });
    });

    describe('getHorizontalLine', () => {
      it('should return horizontal line positions', () => {
        const line = getHorizontalLine({ row: 5, col: 3 }, 4);
        expect(line).toHaveLength(4);
        expect(line).toEqual([
          { row: 5, col: 3 },
          { row: 5, col: 4 },
          { row: 5, col: 5 },
          { row: 5, col: 6 }
        ]);
      });

      it('should stop at board boundary', () => {
        const line = getHorizontalLine({ row: 5, col: 13 }, 5);
        expect(line).toHaveLength(2); // Only positions 13 and 14 are valid
      });
    });

    describe('getVerticalLine', () => {
      it('should return vertical line positions', () => {
        const line = getVerticalLine({ row: 3, col: 5 }, 4);
        expect(line).toHaveLength(4);
        expect(line).toEqual([
          { row: 3, col: 5 },
          { row: 4, col: 5 },
          { row: 5, col: 5 },
          { row: 6, col: 5 }
        ]);
      });

      it('should stop at board boundary', () => {
        const line = getVerticalLine({ row: 13, col: 5 }, 5);
        expect(line).toHaveLength(2); // Only positions 13 and 14 are valid
      });
    });

    describe('arePositionsAdjacent', () => {
      it('should detect adjacent positions', () => {
        expect(arePositionsAdjacent({ row: 5, col: 5 }, { row: 5, col: 6 })).toBe(true);
        expect(arePositionsAdjacent({ row: 5, col: 5 }, { row: 6, col: 5 })).toBe(true);
      });

      it('should reject non-adjacent positions', () => {
        expect(arePositionsAdjacent({ row: 5, col: 5 }, { row: 5, col: 7 })).toBe(false);
        expect(arePositionsAdjacent({ row: 5, col: 5 }, { row: 7, col: 7 })).toBe(false);
      });
    });

    describe('arePositionsInLine', () => {
      it('should detect horizontal lines', () => {
        const positions = [
          { row: 5, col: 3 },
          { row: 5, col: 4 },
          { row: 5, col: 5 }
        ];
        const result = arePositionsInLine(positions);
        expect(result.isLine).toBe(true);
        expect(result.direction).toBe('horizontal');
      });

      it('should detect vertical lines', () => {
        const positions = [
          { row: 3, col: 5 },
          { row: 4, col: 5 },
          { row: 5, col: 5 }
        ];
        const result = arePositionsInLine(positions);
        expect(result.isLine).toBe(true);
        expect(result.direction).toBe('vertical');
      });

      it('should reject diagonal lines', () => {
        const positions = [
          { row: 3, col: 3 },
          { row: 4, col: 4 },
          { row: 5, col: 5 }
        ];
        const result = arePositionsInLine(positions);
        expect(result.isLine).toBe(false);
        expect(result.direction).toBe('none');
      });

      it('should handle single position', () => {
        const result = arePositionsInLine([{ row: 5, col: 5 }]);
        expect(result.isLine).toBe(true);
        expect(result.direction).toBe('none');
      });
    });
  });

  describe('Board Analysis Functions', () => {
    describe('getBoardStatistics', () => {
      it('should calculate empty board statistics', () => {
        const stats = getBoardStatistics(board);
        expect(stats.totalCells).toBe(225);
        expect(stats.occupiedCells).toBe(0);
        expect(stats.emptyCells).toBe(225);
        expect(stats.occupancyPercentage).toBe(0);
        expect(stats.isEmpty).toBe(true);
        expect(stats.isCenterOccupied).toBe(false);
      });

      it('should calculate board with tiles statistics', () => {
        const newBoard = setBoardCell(board, { row: 5, col: 5 }, testTile);
        const stats = getBoardStatistics(newBoard);
        expect(stats.occupiedCells).toBe(1);
        expect(stats.emptyCells).toBe(224);
        expect(stats.occupancyPercentage).toBeCloseTo(0.44, 2);
        expect(stats.isEmpty).toBe(false);
      });

      it('should count premium squares correctly', () => {
        const stats = getBoardStatistics(board);
        expect(stats.premiumSquares.DL).toBe(PREMIUM_SQUARES.DL.length);
        expect(stats.premiumSquares.TL).toBe(PREMIUM_SQUARES.TL.length);
        expect(stats.premiumSquares.DW).toBe(PREMIUM_SQUARES.DW.length);
        expect(stats.premiumSquares.TW).toBe(PREMIUM_SQUARES.TW.length);
        expect(stats.premiumSquares.center).toBe(1);
      });
    });

    describe('validateBoardLayout', () => {
      it('should validate correct board', () => {
        const validation = validateBoardLayout(board);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should detect incorrect dimensions', () => {
        const invalidBoard = board.slice(0, 14); // Remove last row
        const validation = validateBoardLayout(invalidBoard as Board);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(e => e.includes('Board height'))).toBe(true);
      });

      it('should detect premium square count mismatches', () => {
        // Modify a premium square to create mismatch
        const modifiedBoard = board.map(row => 
          row.map(cell => ({ ...cell }))
        );
        modifiedBoard[0][0].premiumType = 'DL'; // Should be TW
        
        const validation = validateBoardLayout(modifiedBoard);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(e => e.includes('Premium square mismatch'))).toBe(true);
      });
    });
  });

  describe('Default Exports', () => {
    it('should have valid default board', () => {
      expect(DEFAULT_BOARD).toBeDefined();
      expect(DEFAULT_BOARD.length).toBe(BOARD_SIZE);
      expect(isBoardEmpty(DEFAULT_BOARD)).toBe(true);
    });

    it('should have valid board validation', () => {
      expect(BOARD_VALIDATION).toBeDefined();
      expect(BOARD_VALIDATION.isValid).toBe(true);
      expect(BOARD_VALIDATION.errors).toHaveLength(0);
    });
  });

  describe('Premium Square Distribution', () => {
    it('should have correct number of each premium square type', () => {
      // Verify the distribution matches official Scrabble board
      expect(PREMIUM_SQUARES.DL.length).toBe(24); // Double Letter
      expect(PREMIUM_SQUARES.TL.length).toBe(12); // Triple Letter  
      expect(PREMIUM_SQUARES.DW.length).toBe(16); // Double Word
      expect(PREMIUM_SQUARES.TW.length).toBe(8);  // Triple Word
      expect(PREMIUM_SQUARES.CENTER.length).toBe(1); // Center star
    });

    it('should have symmetric premium square layout', () => {
      // Check that the board has 4-way rotational symmetry
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const pos1 = { row, col };
          const pos2 = { row: 14 - row, col: 14 - col }; // 180° rotation
          const pos3 = { row: col, col: row }; // 90° rotation
          const pos4 = { row: 14 - col, col: 14 - row }; // 270° rotation
          
          const type1 = getPremiumSquareType(pos1);
          const type2 = getPremiumSquareType(pos2);
          const type3 = getPremiumSquareType(pos3);
          const type4 = getPremiumSquareType(pos4);
          
          // For center position, all should be center
          if (row === 7 && col === 7) {
            expect(type1).toBe('center');
            expect(type2).toBe('center');
            expect(type3).toBe('center');
            expect(type4).toBe('center');
          } else {
            // For non-center positions, rotated positions should have same type
            expect(type1).toBe(type2);
          }
        }
      }
    });
  });
}); 