import { useCallback, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import type { 
  TilePlacement, 
  MoveValidation,
  BoardPosition,
  Tile,
  Player
} from '../types/game';

// ================================
// Validation Hook Types
// ================================

export interface ValidationInfo {
  // Current Validation State
  isValidationAvailable: boolean;
  lastValidation: MoveValidation | null;
  
  // Quick Validation Checks
  canPlayerMove: (playerId: string) => boolean;
  canPlaceTiles: (placements: TilePlacement[]) => boolean;
  canExchangeTiles: (playerId: string, tileIds: string[]) => boolean;
  
  // Move Requirements
  isFirstMove: boolean;
  requiresCenterPlacement: boolean;
  minimumTilesRequired: number;
  
  // Validation Results
  validationErrors: string[];
  validationWarnings: string[];
  isCurrentMoveValid: boolean;
}

export interface ValidationActions {
  // Move Validation
  validateMove: (playerId: string, placements: TilePlacement[]) => MoveValidation;
  validateTilePlacement: (tile: Tile, position: BoardPosition) => string[];
  validateBlankTileAssignment: (assignedLetter: string) => boolean;
  
  // Game State Validation
  validateGameCanStart: () => string[];
  validatePlayerCanAct: (playerId: string) => string[];
  validateTileExchange: (playerId: string, tileIds: string[]) => string[];
  
  // Word Validation
  validateWordExists: (word: string) => Promise<boolean>;
  
  // Utility Validation
  isPositionValid: (position: BoardPosition) => boolean;
  isAdjacentToExistingTile: (position: BoardPosition) => boolean;
  isConnectedToBoard: (placements: TilePlacement[]) => boolean;
}

export interface GameValidationHook extends ValidationInfo, ValidationActions {}

// ================================
// Game Validation Hook
// ================================

export function useGameValidation(): GameValidationHook {
  const { 
    gameState, 
    currentPlayer, 
    moveValidator,
    validateMove: contextValidateMove
  } = useGame();
  
  // ================================
  // Validation Information
  // ================================
  
  const isValidationAvailable = useMemo(() => {
    return !!moveValidator && !!gameState;
  }, [moveValidator, gameState]);
  
  const isFirstMove = useMemo(() => {
    return gameState?.moveHistory?.length === 0 || 
           gameState?.moveHistory?.every(move => move.type !== 'place') || false;
  }, [gameState?.moveHistory]);
  
  const requiresCenterPlacement = useMemo(() => {
    return isFirstMove;
  }, [isFirstMove]);
  
  const minimumTilesRequired = useMemo(() => {
    return isFirstMove ? 2 : 1;
  }, [isFirstMove]);
  
  // ================================
  // Quick Validation Checks
  // ================================
  
  const canPlayerMove = useCallback((playerId: string): boolean => {
    if (!gameState || gameState.phase !== 'playing') return false;
    
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;
    
    return player.status === 'active' && 
           currentPlayer?.id === playerId &&
           player.rack.length > 0;
  }, [gameState, currentPlayer]);
  
  const canPlaceTiles = useCallback((placements: TilePlacement[]): boolean => {
    if (!currentPlayer || placements.length === 0) return false;
    
    // Check minimum tiles
    if (placements.length < minimumTilesRequired) return false;
    
    // Check player has all tiles
    const playerTileIds = currentPlayer.rack.map(tile => tile.id);
    const placementTileIds = placements.map(p => p.tile.id);
    
    return placementTileIds.every(id => playerTileIds.includes(id));
  }, [currentPlayer, minimumTilesRequired]);
  
  const canExchangeTiles = useCallback((playerId: string, tileIds: string[]): boolean => {
    if (!gameState || !gameState.gameSettings.allowExchanges) return false;
    
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.id !== currentPlayer?.id) return false;
    
    // Must have enough tiles remaining in bag
    const tilesRemaining = gameState.tileBag?.remaining || 0;
    if (tilesRemaining < 7) return false; // Standard rule: need at least 7 tiles in bag
    
    // Player must have the tiles to exchange
    const playerTileIds = player.rack.map(tile => tile.id);
    return tileIds.every(id => playerTileIds.includes(id)) && tileIds.length > 0;
  }, [gameState, currentPlayer]);
  
  // ================================
  // Validation Actions
  // ================================
  
  const validateMove = useCallback((playerId: string, placements: TilePlacement[]): MoveValidation => {
    if (!isValidationAvailable) {
      return {
        isValid: false,
        errors: ['Validation not available'],
        warnings: [],
        score: 0,
        wordsFormed: []
      };
    }
    
    return contextValidateMove(playerId, placements);
  }, [isValidationAvailable, contextValidateMove]);
  
  const validateTilePlacement = useCallback((tile: Tile, position: BoardPosition): string[] => {
    const errors: string[] = [];
    
    if (!isPositionValid(position)) {
      errors.push('Position is out of bounds');
    }
    
    if (!gameState?.board) {
      errors.push('Game board not available');
      return errors;
    }
    
    const cell = gameState.board[position.row][position.col];
    if (cell && !cell.isEmpty) {
      errors.push('Position is already occupied');
    }
    
    if (!currentPlayer) {
      errors.push('No current player');
      return errors;
    }
    
    const playerHasTile = currentPlayer.rack.some(t => t.id === tile.id);
    if (!playerHasTile) {
      errors.push('Player does not have this tile');
    }
    
    return errors;
  }, [gameState?.board, currentPlayer]);
  
  const validateBlankTileAssignment = useCallback((assignedLetter: string): boolean => {
    return /^[A-Z]$/.test(assignedLetter);
  }, []);
  
  const validateGameCanStart = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!gameState) {
      errors.push('Game not initialized');
      return errors;
    }
    
    if (gameState.players.length < 2) {
      errors.push('Need at least 2 players to start');
    }
    
    if (gameState.players.length > 4) {
      errors.push('Maximum 4 players allowed');
    }
    
    const playersWithoutNames = gameState.players.filter(p => !p.name.trim());
    if (playersWithoutNames.length > 0) {
      errors.push('All players must have names');
    }
    
    if (gameState.phase !== 'setup') {
      errors.push('Game is not in setup phase');
    }
    
    return errors;
  }, [gameState]);
  
  const validatePlayerCanAct = useCallback((playerId: string): string[] => {
    const errors: string[] = [];
    
    if (!gameState) {
      errors.push('Game not available');
      return errors;
    }
    
    if (gameState.phase !== 'playing') {
      errors.push('Game is not in playing phase');
    }
    
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      errors.push('Player not found');
      return errors;
    }
    
    if (player.status !== 'active') {
      errors.push('Player is not active');
    }
    
    if (currentPlayer?.id !== playerId) {
      errors.push('Not player\'s turn');
    }
    
    return errors;
  }, [gameState, currentPlayer]);
  
  const validateTileExchange = useCallback((playerId: string, tileIds: string[]): string[] => {
    const errors: string[] = [];
    
    const playerErrors = validatePlayerCanAct(playerId);
    errors.push(...playerErrors);
    
    if (!canExchangeTiles(playerId, tileIds)) {
      errors.push('Cannot exchange tiles at this time');
    }
    
    if (tileIds.length === 0) {
      errors.push('Must select at least one tile to exchange');
    }
    
    if (tileIds.length > 7) {
      errors.push('Cannot exchange more than 7 tiles');
    }
    
    return errors;
  }, [validatePlayerCanAct, canExchangeTiles]);
  
  // ================================
  // Word Validation
  // ================================
  
  const validateWordExists = useCallback(async (word: string): Promise<boolean> => {
    // This would integrate with the dictionary system
    // For now, return true for basic validation
    return word.length >= 2 && /^[A-Z]+$/.test(word);
  }, []);
  
  // ================================
  // Utility Validation
  // ================================
  
  const isPositionValid = useCallback((position: BoardPosition): boolean => {
    return position.row >= 0 && position.row < 15 && 
           position.col >= 0 && position.col < 15;
  }, []);
  
  const isAdjacentToExistingTile = useCallback((position: BoardPosition): boolean => {
    if (!gameState?.board) return false;
    
    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 },  // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }   // right
    ];
    
    for (const dir of directions) {
      const newRow = position.row + dir.row;
      const newCol = position.col + dir.col;
      
      if (isPositionValid({ row: newRow, col: newCol })) {
        const cell = gameState.board[newRow][newCol];
        if (cell && !cell.isEmpty) {
          return true;
        }
      }
    }
    
    return false;
  }, [gameState?.board, isPositionValid]);
  
  const isConnectedToBoard = useCallback((placements: TilePlacement[]): boolean => {
    if (isFirstMove) {
      // First move must pass through center
      return placements.some(p => p.position.row === 7 && p.position.col === 7);
    }
    
    // Subsequent moves must connect to existing tiles
    return placements.some(p => isAdjacentToExistingTile(p.position));
  }, [isFirstMove, isAdjacentToExistingTile]);
  
  // ================================
  // Derived State
  // ================================
  
  const lastValidation = useMemo((): MoveValidation | null => {
    // This would come from the last validation performed
    return null;
  }, []);
  
  const validationErrors = useMemo(() => {
    return lastValidation?.errors || [];
  }, [lastValidation]);
  
  const validationWarnings = useMemo(() => {
    return lastValidation?.warnings || [];
  }, [lastValidation]);
  
  const isCurrentMoveValid = useMemo(() => {
    return lastValidation?.isValid || false;
  }, [lastValidation]);
  
  // ================================
  // Return Hook Interface
  // ================================
  
  return {
    // Information
    isValidationAvailable,
    lastValidation,
    canPlayerMove,
    canPlaceTiles,
    canExchangeTiles,
    isFirstMove,
    requiresCenterPlacement,
    minimumTilesRequired,
    validationErrors,
    validationWarnings,
    isCurrentMoveValid,
    
    // Actions
    validateMove,
    validateTilePlacement,
    validateBlankTileAssignment,
    validateGameCanStart,
    validatePlayerCanAct,
    validateTileExchange,
    validateWordExists,
    isPositionValid,
    isAdjacentToExistingTile,
    isConnectedToBoard,
  };
}

export default useGameValidation; 