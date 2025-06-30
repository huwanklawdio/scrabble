// ================================
// Move Validation System
// ================================

import { validateWord } from '../data/dictionary';
import type {
  Board,
  BoardPosition,
  BoardCell,
  Tile,
  TilePlacement,
  WordFormed,
  MoveValidation,
  BOARD_SIZE,
  PREMIUM_SQUARES
} from '../types/game';

// ================================
// Validation Configuration
// ================================

export interface MoveValidatorConfig {
  requireCenterStart?: boolean;
  requireAdjacency?: boolean;
  validateDictionary?: boolean;
  allowBlankTiles?: boolean;
}

export const DEFAULT_VALIDATOR_CONFIG: MoveValidatorConfig = {
  requireCenterStart: true,
  requireAdjacency: true,
  validateDictionary: true,
  allowBlankTiles: true
};

// ================================
// Validation Result Types
// ================================

export interface WordAnalysis {
  word: string;
  positions: BoardPosition[];
  isMainWord: boolean;
  direction: 'horizontal' | 'vertical';
  newTiles: BoardPosition[]; // Positions of newly placed tiles in this word
  existingTiles: BoardPosition[]; // Positions of existing tiles in this word
}

export interface PlacementValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  wordsFormed: WordAnalysis[];
  affectedPositions: BoardPosition[];
}

// ================================
// Move Validator Class
// ================================

export class MoveValidator {
  private config: MoveValidatorConfig;
  
  constructor(config: MoveValidatorConfig = DEFAULT_VALIDATOR_CONFIG) {
    this.config = { ...DEFAULT_VALIDATOR_CONFIG, ...config };
  }
  
  /**
   * Validate a complete move
   */
  validateMove(board: Board, placements: TilePlacement[], isFirstMove: boolean = false): MoveValidation {
    const validation: MoveValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 0,
      wordsFormed: []
    };
    
    // Early validation checks
    if (placements.length === 0) {
      validation.isValid = false;
      validation.errors.push('No tiles placed');
      return validation;
    }
    
    // Validate basic placement constraints
    const placementValidation = this.validatePlacements(board, placements);
    if (!placementValidation.isValid) {
      validation.isValid = false;
      validation.errors.push(...placementValidation.errors);
      validation.warnings.push(...placementValidation.warnings);
      return validation;
    }
    
    // Create temporary board with new placements
    const tempBoard = this.createTempBoard(board, placements);
    
    // Validate word formation
    const wordAnalysis = this.analyzeWordsFormed(tempBoard, placements);
    
    // First move specific validation
    if (isFirstMove) {
      const firstMoveErrors = this.validateFirstMove(placements);
      if (firstMoveErrors.length > 0) {
        validation.isValid = false;
        validation.errors.push(...firstMoveErrors);
        return validation;
      }
    } else {
      // Subsequent moves must connect to existing tiles
      const adjacencyErrors = this.validateAdjacency(board, placements);
      if (adjacencyErrors.length > 0) {
        validation.isValid = false;
        validation.errors.push(...adjacencyErrors);
        return validation;
      }
    }
    
    // Validate word formation rules
    const wordFormationErrors = this.validateWordFormation(wordAnalysis);
    if (wordFormationErrors.length > 0) {
      validation.isValid = false;
      validation.errors.push(...wordFormationErrors);
      return validation;
    }
    
    // Validate dictionary words
    if (this.config.validateDictionary) {
      const dictionaryErrors = this.validateDictionary(wordAnalysis);
      if (dictionaryErrors.length > 0) {
        validation.isValid = false;
        validation.errors.push(...dictionaryErrors);
        return validation;
      }
    }
    
    // Convert word analysis to WordFormed format
    validation.wordsFormed = wordAnalysis.map(analysis => ({
      word: analysis.word,
      positions: analysis.positions,
      score: 0, // Will be calculated by scoring system
      isMainWord: analysis.isMainWord
    }));
    
    return validation;
  }
  
  /**
   * Validate basic placement constraints
   */
  private validatePlacements(board: Board, placements: TilePlacement[]): PlacementValidation {
    const validation: PlacementValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      wordsFormed: [],
      affectedPositions: []
    };
    
    const placedPositions = new Set<string>();
    
    for (const placement of placements) {
      const { row, col } = placement.position;
      const posKey = `${row},${col}`;
      
      // Check bounds
      if (row < 0 || row >= 15 || col < 0 || col >= 15) {
        validation.isValid = false;
        validation.errors.push(`Position (${row},${col}) is out of bounds`);
        continue;
      }
      
      // Check for duplicate placements in this move
      if (placedPositions.has(posKey)) {
        validation.isValid = false;
        validation.errors.push(`Multiple tiles placed at position (${row},${col})`);
        continue;
      }
      placedPositions.add(posKey);
      
      // Check if position is already occupied
      const cell = board[row][col];
      if (cell && !cell.isEmpty) {
        validation.isValid = false;
        validation.errors.push(`Position (${row},${col}) is already occupied`);
        continue;
      }
      
      // Validate blank tile assignments
      if (placement.tile.isBlank) {
        if (!this.config.allowBlankTiles) {
          validation.isValid = false;
          validation.errors.push('Blank tiles are not allowed');
          continue;
        }
        
        if (!placement.assignedLetter || placement.assignedLetter.length !== 1) {
          validation.isValid = false;
          validation.errors.push(`Blank tile at (${row},${col}) must be assigned a letter`);
          continue;
        }
        
        if (!/^[A-Z]$/.test(placement.assignedLetter)) {
          validation.isValid = false;
          validation.errors.push(`Invalid letter '${placement.assignedLetter}' assigned to blank tile`);
          continue;
        }
      }
      
      validation.affectedPositions.push(placement.position);
    }
    
    // Validate placement alignment
    if (placements.length > 1) {
      const alignmentError = this.validateAlignment(placements);
      if (alignmentError) {
        validation.isValid = false;
        validation.errors.push(alignmentError);
      }
    }
    
    return validation;
  }
  
  /**
   * Validate that placements are in a straight line
   */
  private validateAlignment(placements: TilePlacement[]): string | null {
    if (placements.length <= 1) return null;
    
    const positions = placements.map(p => p.position);
    const rows = positions.map(p => p.row);
    const cols = positions.map(p => p.col);
    
    const allSameRow = rows.every(row => row === rows[0]);
    const allSameCol = cols.every(col => col === cols[0]);
    
    if (!allSameRow && !allSameCol) {
      return 'All tiles must be placed in the same row or column';
    }
    
    // Check for gaps in placement
    if (allSameRow) {
      const sortedCols = [...cols].sort((a, b) => a - b);
      for (let i = 1; i < sortedCols.length; i++) {
        if (sortedCols[i] - sortedCols[i-1] !== 1) {
          return 'Tiles must be placed consecutively without gaps';
        }
      }
    } else {
      const sortedRows = [...rows].sort((a, b) => a - b);
      for (let i = 1; i < sortedRows.length; i++) {
        if (sortedRows[i] - sortedRows[i-1] !== 1) {
          return 'Tiles must be placed consecutively without gaps';
        }
      }
    }
    
    return null;
  }
  
  /**
   * Validate first move requirements
   */
  private validateFirstMove(placements: TilePlacement[]): string[] {
    const errors: string[] = [];
    
    if (!this.config.requireCenterStart) {
      return errors;
    }
    
    // First move must pass through center star (7,7)
    const touchesCenter = placements.some(p => p.position.row === 7 && p.position.col === 7);
    if (!touchesCenter) {
      errors.push('First move must pass through the center star');
    }
    
    // First move must be at least 2 tiles
    if (placements.length < 2) {
      errors.push('First move must place at least 2 tiles');
    }
    
    return errors;
  }
  
  /**
   * Validate adjacency requirements for subsequent moves
   */
  private validateAdjacency(board: Board, placements: TilePlacement[]): string[] {
    const errors: string[] = [];
    
    if (!this.config.requireAdjacency) {
      return errors;
    }
    
    // At least one placed tile must be adjacent to an existing tile
    let hasAdjacency = false;
    
    for (const placement of placements) {
      if (this.isAdjacentToExistingTile(board, placement.position)) {
        hasAdjacency = true;
        break;
      }
    }
    
    if (!hasAdjacency) {
      errors.push('New tiles must connect to existing tiles on the board');
    }
    
    return errors;
  }
  
  /**
   * Check if a position is adjacent to an existing tile
   */
  private isAdjacentToExistingTile(board: Board, position: BoardPosition): boolean {
    const { row, col } = position;
    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 },  // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }   // right
    ];
    
    for (const dir of directions) {
      const newRow = row + dir.row;
      const newCol = col + dir.col;
      
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
        const cell = board[newRow][newCol];
        if (cell && !cell.isEmpty) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Create temporary board with new placements
   */
  private createTempBoard(board: Board, placements: TilePlacement[]): Board {
    // Deep clone the board
    const tempBoard: Board = board.map(row => 
      row.map(cell => ({ ...cell }))
    );
    
    // Apply placements
    for (const placement of placements) {
      const { row, col } = placement.position;
      const tile = placement.tile.isBlank ? 
        { ...placement.tile, letter: placement.assignedLetter || '' } :
        placement.tile;
        
      tempBoard[row][col] = {
        ...tempBoard[row][col],
        tile,
        isEmpty: false
      };
    }
    
    return tempBoard;
  }
  
  /**
   * Analyze all words formed by the placements
   */
  private analyzeWordsFormed(board: Board, placements: TilePlacement[]): WordAnalysis[] {
    const words: WordAnalysis[] = [];
    const processedPositions = new Set<string>();
    const placementPositions = new Set(placements.map(p => `${p.position.row},${p.position.col}`));
    
    // Find the main word (contains all placements)
    const mainWord = this.findMainWord(board, placements);
    if (mainWord) {
      words.push(mainWord);
      mainWord.positions.forEach(pos => processedPositions.add(`${pos.row},${pos.col}`));
    }
    
    // Find cross-words (perpendicular words that include newly placed tiles)
    for (const placement of placements) {
      const { row, col } = placement.position;
      const posKey = `${row},${col}`;
      
      if (processedPositions.has(posKey)) continue;
      
      // Check horizontal word if main word was vertical
      if (!mainWord || mainWord.direction === 'vertical') {
        const horizontalWord = this.findWordAt(board, { row, col }, 'horizontal', placementPositions);
        if (horizontalWord && horizontalWord.word.length > 1) {
          words.push(horizontalWord);
          horizontalWord.positions.forEach(pos => processedPositions.add(`${pos.row},${pos.col}`));
        }
      }
      
      // Check vertical word if main word was horizontal
      if (!mainWord || mainWord.direction === 'horizontal') {
        const verticalWord = this.findWordAt(board, { row, col }, 'vertical', placementPositions);
        if (verticalWord && verticalWord.word.length > 1) {
          words.push(verticalWord);
          verticalWord.positions.forEach(pos => processedPositions.add(`${pos.row},${pos.col}`));
        }
      }
    }
    
    return words;
  }
  
  /**
   * Find the main word that contains all placements
   */
  private findMainWord(board: Board, placements: TilePlacement[]): WordAnalysis | null {
    if (placements.length === 0) return null;
    if (placements.length === 1) {
      // Single tile - check both directions for existing words
      const { row, col } = placements[0].position;
      const placementSet = new Set([`${row},${col}`]);
      
      const horizontal = this.findWordAt(board, { row, col }, 'horizontal', placementSet);
      const vertical = this.findWordAt(board, { row, col }, 'vertical', placementSet);
      
      // Return the longer word, or horizontal if equal
      if (vertical && (!horizontal || vertical.word.length > horizontal.word.length)) {
        return vertical;
      }
      return horizontal;
    }
    
    // Multiple tiles - determine direction from placement alignment
    const positions = placements.map(p => p.position);
    const rows = positions.map(p => p.row);
    const cols = positions.map(p => p.col);
    
    const allSameRow = rows.every(row => row === rows[0]);
    const direction = allSameRow ? 'horizontal' : 'vertical';
    
    // Find the leftmost/topmost placement
    const startPos = allSameRow ?
      positions.reduce((min, pos) => pos.col < min.col ? pos : min) :
      positions.reduce((min, pos) => pos.row < min.row ? pos : min);
    
    const placementSet = new Set(placements.map(p => `${p.position.row},${p.position.col}`));
    return this.findWordAt(board, startPos, direction, placementSet);
  }
  
  /**
   * Find word at position in given direction
   */
  private findWordAt(
    board: Board, 
    startPos: BoardPosition, 
    direction: 'horizontal' | 'vertical',
    newTilePositions: Set<string>
  ): WordAnalysis | null {
    const positions: BoardPosition[] = [];
    const newTiles: BoardPosition[] = [];
    const existingTiles: BoardPosition[] = [];
    let word = '';
    
    // Find start of word (scan backwards)
    let currentPos = { ...startPos };
    const deltaRow = direction === 'vertical' ? -1 : 0;
    const deltaCol = direction === 'horizontal' ? -1 : 0;
    
    while (currentPos.row >= 0 && currentPos.col >= 0) {
      const cell = board[currentPos.row][currentPos.col];
      if (!cell || cell.isEmpty) break;
      
      currentPos = {
        row: currentPos.row + deltaRow,
        col: currentPos.col + deltaCol
      };
    }
    
    // Adjust to first tile position
    currentPos = {
      row: currentPos.row - deltaRow,
      col: currentPos.col - deltaCol
    };
    
    // Build word (scan forwards)
    const forwardDeltaRow = direction === 'vertical' ? 1 : 0;
    const forwardDeltaCol = direction === 'horizontal' ? 1 : 0;
    
    while (currentPos.row < 15 && currentPos.col < 15) {
      const cell = board[currentPos.row][currentPos.col];
      if (!cell || cell.isEmpty) break;
      
      const letter = cell.tile?.letter || '';
      word += letter;
      positions.push({ ...currentPos });
      
      const posKey = `${currentPos.row},${currentPos.col}`;
      if (newTilePositions.has(posKey)) {
        newTiles.push({ ...currentPos });
      } else {
        existingTiles.push({ ...currentPos });
      }
      
      currentPos = {
        row: currentPos.row + forwardDeltaRow,
        col: currentPos.col + forwardDeltaCol
      };
    }
    
    if (word.length === 0) return null;
    
    return {
      word,
      positions,
      isMainWord: newTiles.length > 1 || (newTiles.length === 1 && word.length > 1),
      direction,
      newTiles,
      existingTiles
    };
  }
  
  /**
   * Validate word formation rules
   */
  private validateWordFormation(wordAnalyses: WordAnalysis[]): string[] {
    const errors: string[] = [];
    
    if (wordAnalyses.length === 0) {
      errors.push('No valid words formed');
      return errors;
    }
    
    // At least one word must contain new tiles
    const hasNewTiles = wordAnalyses.some(analysis => analysis.newTiles.length > 0);
    if (!hasNewTiles) {
      errors.push('Move must form at least one word with new tiles');
    }
    
    // All words must be at least 2 letters long
    for (const analysis of wordAnalyses) {
      if (analysis.word.length < 2) {
        errors.push(`Word '${analysis.word}' is too short (minimum 2 letters)`);
      }
    }
    
    return errors;
  }
  
  /**
   * Validate words against dictionary
   */
  private validateDictionary(wordAnalyses: WordAnalysis[]): string[] {
    const errors: string[] = [];
    
    for (const analysis of wordAnalyses) {
      if (!validateWord(analysis.word)) {
        errors.push(`'${analysis.word}' is not a valid word`);
      }
    }
    
    return errors;
  }
  
  /**
   * Get all possible words at a position (for move suggestions)
   */
  findPossibleWords(
    board: Board, 
    position: BoardPosition, 
    availableLetters: string[]
  ): WordAnalysis[] {
    // This would be used for AI or hint systems
    // Implementation would be more complex, involving dictionary lookup
    // and trying different letter combinations
    return [];
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<MoveValidatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): MoveValidatorConfig {
    return { ...this.config };
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Check if a position is valid on the board
 */
export function isValidPosition(position: BoardPosition): boolean {
  return position.row >= 0 && position.row < 15 && 
         position.col >= 0 && position.col < 15;
}

/**
 * Check if two positions are adjacent
 */
export function arePositionsAdjacent(pos1: BoardPosition, pos2: BoardPosition): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Get adjacent positions
 */
export function getAdjacentPositions(position: BoardPosition): BoardPosition[] {
  const { row, col } = position;
  const positions: BoardPosition[] = [];
  
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 },  // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 }   // right
  ];
  
  for (const dir of directions) {
    const newPos = { row: row + dir.row, col: col + dir.col };
    if (isValidPosition(newPos)) {
      positions.push(newPos);
    }
  }
  
  return positions;
}

/**
 * Calculate distance between positions
 */
export function getPositionDistance(pos1: BoardPosition, pos2: BoardPosition): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

/**
 * Sort positions by row then column
 */
export function sortPositions(positions: BoardPosition[]): BoardPosition[] {
  return [...positions].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
}

// ================================
// Factory Functions
// ================================

/**
 * Create a move validator with default configuration
 */
export function createMoveValidator(config?: Partial<MoveValidatorConfig>): MoveValidator {
  return new MoveValidator(config);
}

/**
 * Create a lenient move validator (for testing or practice mode)
 */
export function createLenientValidator(): MoveValidator {
  return new MoveValidator({
    requireCenterStart: false,
    requireAdjacency: false,
    validateDictionary: false,
    allowBlankTiles: true
  });
}

// ================================
// Default Export
// ================================

export default MoveValidator; 