import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { GameStateManager, createGameState, type GameConfig, type GameEvent } from '../game/gameState';
import { createMoveValidator, type MoveValidator } from '../game/moveValidator';
import { createScoreCalculator, type ScoreCalculator } from '../game/scoreCalculator';
import type { 
  GameState, 
  Player, 
  TilePlacement, 
  MoveValidation,
  GamePhase,
  Move
} from '../types/game';

// ================================
// Action Types
// ================================

export type GameAction =
  | { type: 'INITIALIZE_GAME'; payload: { config?: GameConfig } }
  | { type: 'ADD_PLAYER'; payload: { playerData: Partial<Player> & { name: string } } }
  | { type: 'REMOVE_PLAYER'; payload: { playerId: string } }
  | { type: 'START_GAME' }
  | { type: 'NEXT_TURN' }
  | { type: 'PASS_TURN'; payload: { playerId: string } }
  | { type: 'PLACE_TILES'; payload: { playerId: string; placements: TilePlacement[] } }
  | { type: 'SUBMIT_MOVE'; payload: { playerId: string; placements: TilePlacement[]; validation: MoveValidation } }
  | { type: 'EXCHANGE_TILES'; payload: { playerId: string; tileIds: string[] } }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_STATE'; payload: { state: GameState } }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: { loading: boolean } };

// ================================
// Context State Interface
// ================================

export interface GameContextState {
  // Game Manager
  gameManager: GameStateManager | null;
  
  // Game State
  gameState: GameState | null;
  currentPlayer: Player | null;
  
  // Game Logic Helpers
  moveValidator: MoveValidator;
  scoreCalculator: ScoreCalculator;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Temporary state for current move
  pendingPlacements: TilePlacement[];
  lastMoveValidation: MoveValidation | null;
}

// ================================
// Context Actions Interface
// ================================

export interface GameContextActions {
  // Game Setup
  initializeGame: (config?: GameConfig) => void;
  addPlayer: (playerData: Partial<Player> & { name: string }) => Player | null;
  removePlayer: (playerId: string) => boolean;
  startGame: () => boolean;
  
  // Game Flow
  nextTurn: () => boolean;
  passMove: (playerId: string) => boolean;
  exchangeTiles: (playerId: string, tileIds: string[]) => boolean;
  
  // Move Management
  validateMove: (playerId: string, placements: TilePlacement[]) => MoveValidation;
  placeTiles: (playerId: string, placements: TilePlacement[]) => MoveValidation;
  submitMove: (playerId: string, placements: TilePlacement[], validation: MoveValidation) => boolean;
  
  // Game Control
  pauseGame: () => boolean;
  resumeGame: () => boolean;
  endGame: () => boolean;
  resetGame: () => void;
  
  // Utility
  clearError: () => void;
  
  // Temporary Move State
  setPendingPlacements: (placements: TilePlacement[]) => void;
  clearPendingPlacements: () => void;
}

// ================================
// Combined Context Interface
// ================================

export interface GameContextValue extends GameContextState, GameContextActions {}

// ================================
// Initial State
// ================================

const initialState: GameContextState = {
  gameManager: null,
  gameState: null,
  currentPlayer: null,
  moveValidator: createMoveValidator(),
  scoreCalculator: createScoreCalculator(),
  isLoading: false,
  error: null,
  pendingPlacements: [],
  lastMoveValidation: null
};

// ================================
// Reducer
// ================================

function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'INITIALIZE_GAME': {
      const gameManager = createGameState(action.payload.config);
      const gameState = gameManager.getState();
      const currentPlayer = gameManager.getCurrentPlayer();
      
      return {
        ...state,
        gameManager,
        gameState,
        currentPlayer,
        error: null,
        isLoading: false,
        pendingPlacements: [],
        lastMoveValidation: null
      };
    }
    
    case 'UPDATE_STATE': {
      const gameState = action.payload.state;
      const currentPlayer = state.gameManager?.getCurrentPlayer() || null;
      
      return {
        ...state,
        gameState,
        currentPlayer,
        pendingPlacements: [],
        lastMoveValidation: null
      };
    }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        isLoading: false
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.loading
      };
    
    default:
      return state;
  }
}

// ================================
// Context Creation
// ================================

const GameContext = createContext<GameContextValue | undefined>(undefined);

// ================================
// Provider Component
// ================================

export interface GameProviderProps {
  children: React.ReactNode;
  config?: GameConfig;
}

export function GameProvider({ children, config }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // ================================
  // Event Handling
  // ================================
  
  useEffect(() => {
    if (!state.gameManager) return;
    
    const handleGameEvent = (event: GameEvent) => {
      // Update state when game events occur
      const newState = state.gameManager!.getState();
      dispatch({ type: 'UPDATE_STATE', payload: { state: newState } });
    };
    
    // Subscribe to all game events
    const eventTypes = [
      'game-created', 'game-started', 'player-added', 'player-removed',
      'turn-changed', 'move-made', 'move-validated', 'tiles-exchanged',
      'game-paused', 'game-resumed', 'game-ended'
    ] as const;
    
    eventTypes.forEach(eventType => {
      state.gameManager!.addEventListener(eventType, handleGameEvent);
    });
    
    return () => {
      eventTypes.forEach(eventType => {
        state.gameManager!.removeEventListener(eventType, handleGameEvent);
      });
    };
  }, [state.gameManager]);
  
  // ================================
  // Action Implementations
  // ================================
  
  const initializeGame = useCallback((gameConfig?: GameConfig) => {
    dispatch({ type: 'SET_LOADING', payload: { loading: true } });
    try {
      dispatch({ type: 'INITIALIZE_GAME', payload: { config: gameConfig } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to initialize game' } });
    }
  }, []);
  
  const addPlayer = useCallback((playerData: Partial<Player> & { name: string }): Player | null => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return null;
    }
    
    try {
      const player = state.gameManager.addPlayer(playerData);
      if (!player) {
        dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to add player' } });
        return null;
      }
      return player;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to add player' } });
      return null;
    }
  }, [state.gameManager]);
  
  const removePlayer = useCallback((playerId: string): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.removePlayer(playerId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to remove player' } });
      return false;
    }
  }, [state.gameManager]);
  
  const startGame = useCallback((): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.startGame();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to start game' } });
      return false;
    }
  }, [state.gameManager]);
  
  const nextTurn = useCallback((): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.nextTurn();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to advance turn' } });
      return false;
    }
  }, [state.gameManager]);
  
  const passMove = useCallback((playerId: string): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.passMove(playerId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to pass move' } });
      return false;
    }
  }, [state.gameManager]);
  
  const exchangeTiles = useCallback((playerId: string, tileIds: string[]): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.exchangeTiles(playerId, tileIds);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to exchange tiles' } });
      return false;
    }
  }, [state.gameManager]);
  
  const validateMove = useCallback((playerId: string, placements: TilePlacement[]): MoveValidation => {
    if (!state.gameManager) {
      const errorValidation: MoveValidation = {
        isValid: false,
        errors: ['Game not initialized'],
        warnings: [],
        score: 0,
        wordsFormed: []
      };
      return errorValidation;
    }
    
    try {
      return state.gameManager.placeTiles(playerId, placements);
    } catch (error) {
      const errorValidation: MoveValidation = {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Failed to validate move'],
        warnings: [],
        score: 0,
        wordsFormed: []
      };
      return errorValidation;
    }
  }, [state.gameManager]);
  
  const placeTiles = useCallback((playerId: string, placements: TilePlacement[]): MoveValidation => {
    const validation = validateMove(playerId, placements);
    
    // Store validation result and pending placements
    dispatch({ 
      type: 'UPDATE_STATE', 
      payload: { 
        state: { 
          ...state.gameState!, 
          // We'll extend this when we need to track pending state
        } 
      } 
    });
    
    return validation;
  }, [validateMove, state.gameState]);
  
  const submitMove = useCallback((playerId: string, placements: TilePlacement[], validation: MoveValidation): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.submitMove(playerId, placements, validation);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to submit move' } });
      return false;
    }
  }, [state.gameManager]);
  
  const pauseGame = useCallback((): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.pauseGame();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to pause game' } });
      return false;
    }
  }, [state.gameManager]);
  
  const resumeGame = useCallback((): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.resumeGame();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to resume game' } });
      return false;
    }
  }, [state.gameManager]);
  
  const endGame = useCallback((): boolean => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return false;
    }
    
    try {
      return state.gameManager.endGame();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to end game' } });
      return false;
    }
  }, [state.gameManager]);
  
  const resetGame = useCallback(() => {
    if (!state.gameManager) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Game not initialized' } });
      return;
    }
    
    try {
      state.gameManager.resetGame();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { error: error instanceof Error ? error.message : 'Failed to reset game' } });
    }
  }, [state.gameManager]);
  
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);
  
  const setPendingPlacements = useCallback((placements: TilePlacement[]) => {
    // This will be implemented when we add UI state management
    // For now, just validate the move
    if (state.currentPlayer) {
      validateMove(state.currentPlayer.id, placements);
    }
  }, [state.currentPlayer, validateMove]);
  
  const clearPendingPlacements = useCallback(() => {
    // This will be implemented when we add UI state management
  }, []);
  
  // ================================
  // Auto-initialize
  // ================================
  
  useEffect(() => {
    if (!state.gameManager && config) {
      initializeGame(config);
    }
  }, [initializeGame, state.gameManager, config]);
  
  // ================================
  // Context Value
  // ================================
  
  const contextValue: GameContextValue = {
    // State
    ...state,
    
    // Actions
    initializeGame,
    addPlayer,
    removePlayer,
    startGame,
    nextTurn,
    passMove,
    exchangeTiles,
    validateMove,
    placeTiles,
    submitMove,
    pauseGame,
    resumeGame,
    endGame,
    resetGame,
    clearError,
    setPendingPlacements,
    clearPendingPlacements
  };
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// ================================
// Hook
// ================================

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// ================================
// Exports
// ================================

export default GameContext; 