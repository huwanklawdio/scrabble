import { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import type { GameState, Player, Board, GamePhase, Tile } from '../types/game';

// ================================
// Game State Hook
// ================================

export interface GameStateInfo {
  // Basic State
  gameState: GameState | null;
  currentPlayer: Player | null;
  board: Board | null;
  phase: GamePhase | null;
  players: Player[];
  
  // Game Status
  isGameActive: boolean;
  isCurrentPlayerTurn: (playerId: string) => boolean;
  canPlayerAct: (playerId: string) => boolean;
  
  // Game Progress
  totalMoves: number;
  tilesRemaining: number;
  turnNumber: number;
  
  // Player Information
  getPlayer: (playerId: string) => Player | undefined;
  getPlayerScore: (playerId: string) => number;
  getPlayerRack: (playerId: string) => Tile[];
  getWinningPlayer: () => Player | null;
  
  // Game Statistics
  gameStats: {
    totalScore: number;
    averageScore: number;
    highestScore: number;
    wordsPlayed: number;
    movesPlayed: number;
  };
}

/**
 * Hook for accessing game state and common operations
 */
export function useGameState(): GameStateInfo {
  const { gameState, currentPlayer } = useGame();
  
  // Memoized basic state
  const basicState = useMemo(() => ({
    gameState,
    currentPlayer,
    board: gameState?.board || null,
    phase: gameState?.phase || null,
    players: gameState?.players || [],
  }), [gameState, currentPlayer]);
  
  // Memoized game status
  const gameStatus = useMemo(() => ({
    isGameActive: gameState?.phase === 'playing',
    
    isCurrentPlayerTurn: (playerId: string): boolean => {
      if (!gameState || !currentPlayer) return false;
      return currentPlayer.id === playerId && gameState.phase === 'playing';
    },
    
    canPlayerAct: (playerId: string): boolean => {
      if (!gameState || gameState.phase !== 'playing') return false;
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return false;
      return player.status === 'active' && currentPlayer?.id === playerId;
    },
  }), [gameState, currentPlayer]);
  
  // Memoized game progress
  const gameProgress = useMemo(() => ({
    totalMoves: gameState?.moveHistory?.length || 0,
    tilesRemaining: gameState?.tileBag?.remaining || 0,
    turnNumber: Math.floor((gameState?.moveHistory?.length || 0) / (gameState?.players?.length || 1)) + 1,
  }), [gameState]);
  
  // Memoized player functions
  const playerFunctions = useMemo(() => ({
    getPlayer: (playerId: string): Player | undefined => {
      return gameState?.players.find(p => p.id === playerId);
    },
    
    getPlayerScore: (playerId: string): number => {
      const player = gameState?.players.find(p => p.id === playerId);
      return player?.score || 0;
    },
    
    getPlayerRack: (playerId: string) => {
      const player = gameState?.players.find(p => p.id === playerId);
      return player?.rack || [];
    },
    
    getWinningPlayer: (): Player | null => {
      if (!gameState?.players || gameState.players.length === 0) return null;
      
      const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
      const highestScore = sortedPlayers[0].score;
      
      // Check for ties
      const winners = sortedPlayers.filter(p => p.score === highestScore);
      return winners.length === 1 ? winners[0] : null; // Return null if tied
    },
  }), [gameState]);
  
  // Memoized game statistics
  const gameStats = useMemo(() => {
    const players = gameState?.players || [];
    const moves = gameState?.moveHistory || [];
    
    const totalScore = players.reduce((sum, player) => sum + player.score, 0);
    const averageScore = players.length > 0 ? totalScore / players.length : 0;
    const highestScore = players.length > 0 ? Math.max(...players.map(p => p.score)) : 0;
    
    const wordsPlayed = moves.reduce((count, move) => {
      return count + (move.wordsFormed?.length || 0);
    }, 0);
    
    const movesPlayed = moves.filter(move => move.type === 'place').length;
    
    return {
      totalScore,
      averageScore: Math.round(averageScore),
      highestScore,
      wordsPlayed,
      movesPlayed,
    };
  }, [gameState]);
  
  return {
    ...basicState,
    ...gameStatus,
    ...gameProgress,
    ...playerFunctions,
    gameStats,
  };
}

export default useGameState; 