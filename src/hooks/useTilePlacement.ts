import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import type { 
  TilePlacement, 
  BoardPosition, 
  Tile, 
  MoveValidation
} from '../types/game';

// ================================
// Tile Placement Hook Types
// ================================

export interface PlacementState {
  // Current placements
  placements: TilePlacement[];
  
  // Validation
  validation: MoveValidation | null;
  isValidMove: boolean;
  
  // UI State
  isDragging: boolean;
  draggedTile: Tile | null;
  hoveredPosition: BoardPosition | null;
  previewPlacements: TilePlacement[];
}

export interface PlacementActions {
  // Placement Management
  addPlacement: (tile: Tile, position: BoardPosition, assignedLetter?: string) => void;
  removePlacement: (position: BoardPosition) => void;
  clearPlacements: () => void;
  movePlacement: (fromPosition: BoardPosition, toPosition: BoardPosition) => void;
  
  // Validation
  validateCurrentPlacements: () => MoveValidation;
  submitPlacements: () => boolean;
  
  // Drag & Drop Support
  startDrag: (tile: Tile) => void;
  endDrag: () => void;
  setHoveredPosition: (position: BoardPosition | null) => void;
  
  // Preview System
  setPreviewPlacements: (placements: TilePlacement[]) => void;
  clearPreviewPlacements: () => void;
  
  // Utility
  canPlaceTileAt: (position: BoardPosition) => boolean;
  getTileAtPosition: (position: BoardPosition) => Tile | null;
  isPositionOccupied: (position: BoardPosition) => boolean;
}

export interface TilePlacementHook extends PlacementState, PlacementActions {}

// ================================
// Tile Placement Hook
// ================================

export function useTilePlacement(): TilePlacementHook {
  const { 
    gameState, 
    currentPlayer, 
    validateMove, 
    submitMove 
  } = useGame();
  
  // ================================
  // State Management
  // ================================
  
  const [placements, setPlacements] = useState<TilePlacement[]>([]);
  const [validation, setValidation] = useState<MoveValidation | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTile, setDraggedTile] = useState<Tile | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<BoardPosition | null>(null);
  const [previewPlacements, setPreviewPlacements] = useState<TilePlacement[]>([]);
  
  // Use ref to avoid stale closures in validation
  const placementsRef = useRef<TilePlacement[]>([]);
  placementsRef.current = placements;
  
  // ================================
  // Memoized Values
  // ================================
  
  const isValidMove = useMemo(() => {
    return validation?.isValid || false;
  }, [validation]);
  
  const board = useMemo(() => {
    return gameState?.board || null;
  }, [gameState?.board]);
  
  // ================================
  // Utility Functions
  // ================================
  
  const canPlaceTileAt = useCallback((position: BoardPosition): boolean => {
    if (!board || !currentPlayer) return false;
    
    // Check bounds
    if (position.row < 0 || position.row >= 15 || position.col < 0 || position.col >= 15) {
      return false;
    }
    
    // Check if position is already occupied on the board
    const cell = board[position.row][position.col];
    if (cell && !cell.isEmpty) {
      return false;
    }
    
    // Check if position already has a placement in current move
    const hasPlacement = placements.some(p => 
      p.position.row === position.row && p.position.col === position.col
    );
    
    return !hasPlacement;
  }, [board, currentPlayer, placements]);
  
  const getTileAtPosition = useCallback((position: BoardPosition): Tile | null => {
    // First check current placements
    const placement = placements.find(p => 
      p.position.row === position.row && p.position.col === position.col
    );
    if (placement) return placement.tile;
    
    // Then check board
    if (!board) return null;
    const cell = board[position.row][position.col];
    return cell?.tile || null;
  }, [placements, board]);
  
  const isPositionOccupied = useCallback((position: BoardPosition): boolean => {
    return getTileAtPosition(position) !== null;
  }, [getTileAtPosition]);
  
  // ================================
  // Placement Management
  // ================================
  
  const addPlacement = useCallback((tile: Tile, position: BoardPosition, assignedLetter?: string) => {
    if (!canPlaceTileAt(position)) {
      console.warn('Cannot place tile at position:', position);
      return;
    }
    
    const newPlacement: TilePlacement = {
      tile,
      position,
      assignedLetter: tile.isBlank ? assignedLetter : undefined
    };
    
    setPlacements(prev => [...prev, newPlacement]);
  }, [canPlaceTileAt]);
  
  const removePlacement = useCallback((position: BoardPosition) => {
    setPlacements(prev => prev.filter(p => 
      !(p.position.row === position.row && p.position.col === position.col)
    ));
  }, []);
  
  const clearPlacements = useCallback(() => {
    setPlacements([]);
    setValidation(null);
    setPreviewPlacements([]);
  }, []);
  
  const movePlacement = useCallback((fromPosition: BoardPosition, toPosition: BoardPosition) => {
    if (!canPlaceTileAt(toPosition)) {
      return;
    }
    
    setPlacements(prev => prev.map(placement => {
      if (placement.position.row === fromPosition.row && 
          placement.position.col === fromPosition.col) {
        return { ...placement, position: toPosition };
      }
      return placement;
    }));
  }, [canPlaceTileAt]);
  
  // ================================
  // Validation
  // ================================
  
  const validateCurrentPlacements = useCallback((): MoveValidation => {
    if (!currentPlayer || placementsRef.current.length === 0) {
      const emptyValidation: MoveValidation = {
        isValid: false,
        errors: ['No tiles placed'],
        warnings: [],
        score: 0,
        wordsFormed: []
      };
      setValidation(emptyValidation);
      return emptyValidation;
    }
    
    const newValidation = validateMove(currentPlayer.id, placementsRef.current);
    setValidation(newValidation);
    return newValidation;
  }, [currentPlayer, validateMove]);
  
  const submitPlacements = useCallback((): boolean => {
    if (!currentPlayer || !validation || !validation.isValid) {
      return false;
    }
    
    const success = submitMove(currentPlayer.id, placements, validation);
    if (success) {
      clearPlacements();
    }
    
    return success;
  }, [currentPlayer, validation, submitMove, placements, clearPlacements]);
  
  // ================================
  // Drag & Drop Support
  // ================================
  
  const startDrag = useCallback((tile: Tile) => {
    setIsDragging(true);
    setDraggedTile(tile);
  }, []);
  
  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDraggedTile(null);
    setHoveredPosition(null);
  }, []);
  
  // ================================
  // Auto-validation
  // ================================
  
  // Auto-validate when placements change
  useEffect(() => {
    if (placements.length > 0) {
      validateCurrentPlacements();
    } else {
      setValidation(null);
    }
  }, [placements, validateCurrentPlacements]);
  
  // ================================
  // Return Hook Interface
  // ================================
  
  return {
    // State
    placements,
    validation,
    isValidMove,
    isDragging,
    draggedTile,
    hoveredPosition,
    previewPlacements,
    
    // Actions
    addPlacement,
    removePlacement,
    clearPlacements,
    movePlacement,
    validateCurrentPlacements,
    submitPlacements,
    startDrag,
    endDrag,
    setHoveredPosition,
    setPreviewPlacements: (newPreviews) => setPreviewPlacements(newPreviews),
    clearPreviewPlacements: () => setPreviewPlacements([]),
    
    // Utilities
    canPlaceTileAt,
    getTileAtPosition,
    isPositionOccupied,
  };
}

export default useTilePlacement; 