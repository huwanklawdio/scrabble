// ================================
// Move Validator Tests
// ================================

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  MoveValidator,
  createMoveValidator,
  createLenientValidator,
  isValidPosition,
  arePositionsAdjacent,
  getAdjacentPositions,
  getPositionDistance,
  sortPositions,
  DEFAULT_VALIDATOR_CONFIG
} from './moveValidator';
import { createEmptyBoard } from '../data/board';
import { createTile } from '../data/tiles';
import { initializeDefaultDictionary } from '../data/dictionary';
import type { Board, TilePlacement, BoardPosition, Tile } from '../types/game';

describe('Move Validator', () => {
  let validator: MoveValidator;
  let board: Board;
  let mockTiles: Tile[];

  beforeAll(() => {
    // Initialize dictionary system for tests
    initializeDefaultDictionary();
  });

  beforeEach(() => {
    validator = new MoveValidator();
    board = createEmptyBoard();
    mockTiles = [
      createTile('H'),
      createTile('E'),
      createTile('L'),
      createTile('L'),
      createTile('O'),
      createTile('W'),
      createTile('O')
    ];
  });

  describe('Constructor and Configuration', () => {
    it('should create validator with default config', () => {
      const config = validator.getConfig();
      expect(config).toEqual(DEFAULT_VALIDATOR_CONFIG);
    });

    it('should create validator with custom config', () => {
      const customConfig = {
        requireCenterStart: false,
        validateDictionary: false
      };
      
      const customValidator = new MoveValidator(customConfig);
      const config = customValidator.getConfig();
      
      expect(config.requireCenterStart).toBe(false);
      expect(config.validateDictionary).toBe(false);
      expect(config.requireAdjacency).toBe(true); // Default value
    });

    it('should update configuration', () => {
      validator.updateConfig({ requireAdjacency: false });
      const config = validator.getConfig();
      
      expect(config.requireAdjacency).toBe(false);
    });
  });

  describe('Basic Placement Validation', () => {
    it('should reject empty placements', () => {
      const validation = validator.validateMove(board, [], true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No tiles placed');
    });

    it('should reject out of bounds placements', () => {
      const placements: TilePlacement[] = [{
        tile: mockTiles[0],
        position: { row: -1, col: 5 }
      }];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('out of bounds'))).toBe(true);
    });

    it('should reject placements on occupied squares', () => {
      // Place a tile on the board first
      board[7][7].tile = mockTiles[0];
      board[7][7].isEmpty = false;
      
      const placements: TilePlacement[] = [{
        tile: mockTiles[1],
        position: { row: 7, col: 7 }
      }];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('already occupied'))).toBe(true);
    });

    it('should reject duplicate placements in same move', () => {
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 7, col: 7 }
        },
        {
          tile: mockTiles[1],
          position: { row: 7, col: 7 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Multiple tiles placed'))).toBe(true);
    });
  });

  describe('Alignment Validation', () => {
    it('should accept single tile placement', () => {
      const placements: TilePlacement[] = [{
        tile: mockTiles[0],
        position: { row: 7, col: 7 }
      }];
      
      const validation = validator.validateMove(board, placements, true);
      // Should fail for first move requirement, not alignment
      expect(validation.errors.some(e => e.includes('same row or column'))).toBe(false);
    });

    it('should accept horizontal alignment', () => {
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 7, col: 6 }
        },
        {
          tile: mockTiles[1],
          position: { row: 7, col: 7 }
        },
        {
          tile: mockTiles[2],
          position: { row: 7, col: 8 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      expect(validation.errors.some(e => e.includes('same row or column'))).toBe(false);
    });

    it('should accept vertical alignment', () => {
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 6, col: 7 }
        },
        {
          tile: mockTiles[1],
          position: { row: 7, col: 7 }
        },
        {
          tile: mockTiles[2],
          position: { row: 8, col: 7 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      expect(validation.errors.some(e => e.includes('same row or column'))).toBe(false);
    });

    it('should reject diagonal placement', () => {
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 7, col: 7 }
        },
        {
          tile: mockTiles[1],
          position: { row: 8, col: 8 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('same row or column'))).toBe(true);
    });

    it('should reject gaps in placement', () => {
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 7, col: 6 }
        },
        {
          tile: mockTiles[1],
          position: { row: 7, col: 8 } // Gap at col 7
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('consecutively without gaps'))).toBe(true);
    });
  });

  describe('First Move Validation', () => {
    it('should accept valid first move through center', () => {
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 7, col: 6 }
        },
        {
          tile: mockTiles[1],
          position: { row: 7, col: 7 } // Center star
        },
        {
          tile: mockTiles[2],
          position: { row: 7, col: 8 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      
      // Should pass basic validations (dictionary validation may fail)
      expect(validation.errors.some(e => e.includes('center star'))).toBe(false);
      expect(validation.errors.some(e => e.includes('at least 2 tiles'))).toBe(false);
    });

    it('should reject first move not through center', () => {
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 5, col: 5 }
        },
        {
          tile: mockTiles[1],
          position: { row: 5, col: 6 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('center star'))).toBe(true);
    });

    it('should reject first move with single tile', () => {
      const placements: TilePlacement[] = [{
        tile: mockTiles[0],
        position: { row: 7, col: 7 }
      }];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('at least 2 tiles'))).toBe(true);
    });

    it('should allow disabling center requirement', () => {
      validator.updateConfig({ requireCenterStart: false });
      
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 5, col: 5 }
        },
        {
          tile: mockTiles[1],
          position: { row: 5, col: 6 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.errors.some(e => e.includes('center star'))).toBe(false);
    });
  });

  describe('Adjacency Validation', () => {
    beforeEach(() => {
      // Place an existing word on the board
      board[7][7].tile = createTile('C');
      board[7][7].isEmpty = false;
      board[7][8].tile = createTile('A');
      board[7][8].isEmpty = false;
      board[7][9].tile = createTile('T');
      board[7][9].isEmpty = false;
    });

    it('should accept adjacent placement', () => {
      const placements: TilePlacement[] = [{
        tile: mockTiles[0],
        position: { row: 8, col: 7 } // Below existing 'C'
      }];
      
      const validation = validator.validateMove(board, placements, false);
      
      expect(validation.errors.some(e => e.includes('connect to existing'))).toBe(false);
    });

    it('should reject non-adjacent placement', () => {
      const placements: TilePlacement[] = [{
        tile: mockTiles[0],
        position: { row: 5, col: 5 } // Not adjacent to existing tiles
      }];
      
      const validation = validator.validateMove(board, placements, false);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('connect to existing'))).toBe(true);
    });

    it('should accept placement adjacent through multiple tiles', () => {
      const placements: TilePlacement[] = [
        {
          tile: mockTiles[0],
          position: { row: 8, col: 7 } // Adjacent to existing 'C'
        },
        {
          tile: mockTiles[1],
          position: { row: 9, col: 7 } // Not directly adjacent to existing, but connected through first placement
        }
      ];
      
      const validation = validator.validateMove(board, placements, false);
      
      expect(validation.errors.some(e => e.includes('connect to existing'))).toBe(false);
    });

    it('should allow disabling adjacency requirement', () => {
      validator.updateConfig({ requireAdjacency: false });
      
      const placements: TilePlacement[] = [{
        tile: mockTiles[0],
        position: { row: 1, col: 1 } // Far from existing tiles
      }];
      
      const validation = validator.validateMove(board, placements, false);
      
      expect(validation.errors.some(e => e.includes('connect to existing'))).toBe(false);
    });
  });

  describe('Blank Tile Validation', () => {
    let blankTile: Tile;

    beforeEach(() => {
      blankTile = {
        id: 'blank1',
        letter: '',
        points: 0,
        status: 'rack',
        isBlank: true
      };
    });

    it('should accept blank tile with assigned letter', () => {
      const placements: TilePlacement[] = [{
        tile: blankTile,
        position: { row: 7, col: 7 },
        assignedLetter: 'A'
      }];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.errors.some(e => e.includes('assigned a letter'))).toBe(false);
    });

    it('should reject blank tile without assigned letter', () => {
      const placements: TilePlacement[] = [{
        tile: blankTile,
        position: { row: 7, col: 7 }
      }];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('assigned a letter'))).toBe(true);
    });

    it('should reject blank tile with invalid assigned letter', () => {
      const placements: TilePlacement[] = [{
        tile: blankTile,
        position: { row: 7, col: 7 },
        assignedLetter: '1' // Single invalid character (not A-Z)
      }];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Invalid letter'))).toBe(true);
    });

    it('should allow disabling blank tiles', () => {
      validator.updateConfig({ allowBlankTiles: false });
      
      const placements: TilePlacement[] = [{
        tile: blankTile,
        position: { row: 7, col: 7 },
        assignedLetter: 'A'
      }];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('not allowed'))).toBe(true);
    });
  });

  describe('Word Formation Analysis', () => {
    it('should identify horizontal main word', () => {
      const placements: TilePlacement[] = [
        {
          tile: createTile('C'),
          position: { row: 7, col: 6 }
        },
        {
          tile: createTile('A'),
          position: { row: 7, col: 7 }
        },
        {
          tile: createTile('T'),
          position: { row: 7, col: 8 }
        }
      ];
      
      // Use lenient validator to skip dictionary validation
      const lenientValidator = createLenientValidator();
      const validation = lenientValidator.validateMove(board, placements, false);
      
      expect(validation.isValid).toBe(true);
      expect(validation.wordsFormed).toHaveLength(1);
      expect(validation.wordsFormed[0].word).toBe('CAT');
      expect(validation.wordsFormed[0].isMainWord).toBe(true);
    });

    it('should identify vertical main word', () => {
      const placements: TilePlacement[] = [
        {
          tile: createTile('C'),
          position: { row: 6, col: 7 }
        },
        {
          tile: createTile('A'),
          position: { row: 7, col: 7 }
        },
        {
          tile: createTile('T'),
          position: { row: 8, col: 7 }
        }
      ];
      
      const lenientValidator = createLenientValidator();
      const validation = lenientValidator.validateMove(board, placements, false);
      
      expect(validation.isValid).toBe(true);
      expect(validation.wordsFormed).toHaveLength(1);
      expect(validation.wordsFormed[0].word).toBe('CAT');
      expect(validation.wordsFormed[0].isMainWord).toBe(true);
    });

    it('should identify cross-words', () => {
      // Use lenient validator to avoid adjacency/dictionary issues for this word formation test
      const lenientValidator = createLenientValidator();
      
      // Place a single existing tile 'A'
      board[7][7].tile = createTile('A');
      board[7][7].isEmpty = false;
      
      // Place new tile 'T' below to form 'AT'
      const placements: TilePlacement[] = [
        {
          tile: createTile('T'),
          position: { row: 8, col: 7 }
        }
      ];
      
      const validation = lenientValidator.validateMove(board, placements, false);
      
      expect(validation.isValid).toBe(true);
      expect(validation.wordsFormed).toHaveLength(1);
      expect(validation.wordsFormed[0].word).toBe('AT');
    });
  });

  describe('Dictionary Validation', () => {
    it('should accept dictionary words when validation enabled', () => {
      const placements: TilePlacement[] = [
        {
          tile: createTile('C'),
          position: { row: 7, col: 6 }
        },
        {
          tile: createTile('A'),
          position: { row: 7, col: 7 }
        },
        {
          tile: createTile('T'),
          position: { row: 7, col: 8 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, false);
      
      // CAT should be in the demo dictionary
      expect(validation.errors.some(e => e.includes('not a valid word'))).toBe(false);
    });

    it('should reject non-dictionary words when validation enabled', () => {
      // Place an existing tile to satisfy adjacency requirement
      board[7][5].tile = createTile('A');
      board[7][5].isEmpty = false;
      
      const placements: TilePlacement[] = [
        {
          tile: createTile('X'),
          position: { row: 7, col: 6 }
        },
        {
          tile: createTile('Y'),
          position: { row: 7, col: 7 }
        },
        {
          tile: createTile('Z'),
          position: { row: 7, col: 8 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, false);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('not a valid word'))).toBe(true);
    });

    it('should skip dictionary validation when disabled', () => {
      validator.updateConfig({ validateDictionary: false });
      
      const placements: TilePlacement[] = [
        {
          tile: createTile('X'),
          position: { row: 7, col: 6 }
        },
        {
          tile: createTile('Y'),
          position: { row: 7, col: 7 }
        },
        {
          tile: createTile('Z'),
          position: { row: 7, col: 8 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, false);
      
      expect(validation.errors.some(e => e.includes('not a valid word'))).toBe(false);
    });
  });

  describe('Complete Move Validation Scenarios', () => {
    it('should validate complete first move', () => {
      const placements: TilePlacement[] = [
        {
          tile: createTile('T'),
          position: { row: 7, col: 6 }
        },
        {
          tile: createTile('H'),
          position: { row: 7, col: 7 }
        },
        {
          tile: createTile('E'),
          position: { row: 7, col: 8 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, true);
      
      expect(validation.isValid).toBe(true);
      expect(validation.wordsFormed).toHaveLength(1);
      expect(validation.wordsFormed[0].word).toBe('THE');
    });

    it('should validate subsequent move with adjacency', () => {
      // Place existing word
      board[7][7].tile = createTile('C');
      board[7][7].isEmpty = false;
      board[7][8].tile = createTile('A');
      board[7][8].isEmpty = false;
      board[7][9].tile = createTile('T');
      board[7][9].isEmpty = false;
      
      // Add adjacent word vertically from the 'A' - forming "AT"
      const placements: TilePlacement[] = [
        {
          tile: createTile('T'),
          position: { row: 8, col: 8 }
        }
      ];
      
      const validation = validator.validateMove(board, placements, false);
      
      expect(validation.isValid).toBe(true);
      expect(validation.wordsFormed).toHaveLength(1);
      expect(validation.wordsFormed[0].word).toBe('AT');
    });
  });
});

describe('Utility Functions', () => {
  describe('Position Utilities', () => {
    it('should validate positions correctly', () => {
      expect(isValidPosition({ row: 0, col: 0 })).toBe(true);
      expect(isValidPosition({ row: 14, col: 14 })).toBe(true);
      expect(isValidPosition({ row: -1, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 15, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 0, col: -1 })).toBe(false);
      expect(isValidPosition({ row: 0, col: 15 })).toBe(false);
    });

    it('should check adjacency correctly', () => {
      const center = { row: 7, col: 7 };
      const up = { row: 6, col: 7 };
      const down = { row: 8, col: 7 };
      const left = { row: 7, col: 6 };
      const right = { row: 7, col: 8 };
      const diagonal = { row: 6, col: 6 };
      const far = { row: 5, col: 5 };
      
      expect(arePositionsAdjacent(center, up)).toBe(true);
      expect(arePositionsAdjacent(center, down)).toBe(true);
      expect(arePositionsAdjacent(center, left)).toBe(true);
      expect(arePositionsAdjacent(center, right)).toBe(true);
      expect(arePositionsAdjacent(center, diagonal)).toBe(false);
      expect(arePositionsAdjacent(center, far)).toBe(false);
    });

    it('should get adjacent positions correctly', () => {
      const center = { row: 7, col: 7 };
      const adjacent = getAdjacentPositions(center);
      
      expect(adjacent).toHaveLength(4);
      expect(adjacent).toContainEqual({ row: 6, col: 7 });
      expect(adjacent).toContainEqual({ row: 8, col: 7 });
      expect(adjacent).toContainEqual({ row: 7, col: 6 });
      expect(adjacent).toContainEqual({ row: 7, col: 8 });
    });

    it('should get adjacent positions for corner', () => {
      const corner = { row: 0, col: 0 };
      const adjacent = getAdjacentPositions(corner);
      
      expect(adjacent).toHaveLength(2);
      expect(adjacent).toContainEqual({ row: 1, col: 0 });
      expect(adjacent).toContainEqual({ row: 0, col: 1 });
    });

    it('should calculate position distance', () => {
      const pos1 = { row: 0, col: 0 };
      const pos2 = { row: 3, col: 4 };
      
      expect(getPositionDistance(pos1, pos2)).toBe(7); // Manhattan distance
    });

    it('should sort positions correctly', () => {
      const positions: BoardPosition[] = [
        { row: 5, col: 8 },
        { row: 3, col: 2 },
        { row: 5, col: 3 },
        { row: 3, col: 8 }
      ];
      
      const sorted = sortPositions(positions);
      
      expect(sorted).toEqual([
        { row: 3, col: 2 },
        { row: 3, col: 8 },
        { row: 5, col: 3 },
        { row: 5, col: 8 }
      ]);
    });
  });
});

describe('Factory Functions', () => {
  it('should create default validator', () => {
    const validator = createMoveValidator();
    const config = validator.getConfig();
    
    expect(config).toEqual(DEFAULT_VALIDATOR_CONFIG);
  });

  it('should create validator with custom config', () => {
    const customConfig = { requireCenterStart: false };
    const validator = createMoveValidator(customConfig);
    const config = validator.getConfig();
    
    expect(config.requireCenterStart).toBe(false);
    expect(config.requireAdjacency).toBe(true); // Default
  });

  it('should create lenient validator', () => {
    const validator = createLenientValidator();
    const config = validator.getConfig();
    
    expect(config.requireCenterStart).toBe(false);
    expect(config.requireAdjacency).toBe(false);
    expect(config.validateDictionary).toBe(false);
    expect(config.allowBlankTiles).toBe(true);
  });
}); 