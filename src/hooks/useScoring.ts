import { useMemo, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import type { 
  TilePlacement, 
  WordFormed,
  MoveValidation,
  Player,
  ScoreBreakdown,
  Tile
} from '../types/game';

// ================================
// Scoring Hook Types
// ================================

export interface ScoringInfo {
  // Current Game Scores
  playerScores: Record<string, number>;
  currentPlayerScore: number;
  leadingPlayer: Player | null;
  scoreGap: number; // Points behind leader
  
  // Move Scoring
  lastMoveScore: number;
  potentialScore: number; // Score for current pending placements
  
  // Score Analysis
  averageWordScore: number;
  highestWordScore: number;
  totalWordsFormed: number;
  bingoCount: number; // Number of 7-tile moves
  
  // Tile Values
  getTileValue: (tile: Tile) => number;
  calculateTileHandValue: (tiles: Tile[]) => number;
}

export interface ScoringActions {
  // Score Calculations
  calculateMoveScore: (placements: TilePlacement[], wordsFormed: WordFormed[]) => number;
  calculatePotentialScore: (placements: TilePlacement[]) => number;
  
  // Score Projections
  projectFinalScores: () => Record<string, number>;
  calculateWinProbability: (playerId: string) => number;
  
  // Score Analysis
  getScoreBreakdown: (validation: MoveValidation) => ScoreBreakdown | null;
  getBestWordFromMove: (validation: MoveValidation) => WordFormed | null;
  
  // Comparisons
  comparePlayerScores: (player1Id: string, player2Id: string) => number;
  getRankings: () => Player[];
}

export interface ScoringHook extends ScoringInfo, ScoringActions {}

// ================================
// Scoring Hook
// ================================

export function useScoring(): ScoringHook {
  const { 
    gameState, 
    currentPlayer, 
    scoreCalculator 
  } = useGame();
  
  // ================================
  // Memoized Score Information
  // ================================
  
  const playerScores = useMemo(() => {
    const scores: Record<string, number> = {};
    if (gameState?.players) {
      gameState.players.forEach(player => {
        scores[player.id] = player.score;
      });
    }
    return scores;
  }, [gameState?.players]);
  
  const currentPlayerScore = useMemo(() => {
    return currentPlayer?.score || 0;
  }, [currentPlayer?.score]);
  
  const leadingPlayer = useMemo(() => {
    if (!gameState?.players || gameState.players.length === 0) return null;
    
    return gameState.players.reduce((leader, player) => 
      player.score > leader.score ? player : leader
    );
  }, [gameState?.players]);
  
  const scoreGap = useMemo(() => {
    if (!leadingPlayer || !currentPlayer) return 0;
    return Math.max(0, leadingPlayer.score - currentPlayer.score);
  }, [leadingPlayer, currentPlayer]);
  
  const lastMoveScore = useMemo(() => {
    if (!gameState?.moveHistory || gameState.moveHistory.length === 0) return 0;
    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    return lastMove.score || 0;
  }, [gameState?.moveHistory]);
  
  // ================================
  // Score Analysis
  // ================================
  
  const scoreAnalysis = useMemo(() => {
    const moves = gameState?.moveHistory || [];
    const wordMoves = moves.filter(move => move.type === 'place' && move.wordsFormed);
    
    const allWords: WordFormed[] = [];
    let bingoCount = 0;
    
    wordMoves.forEach(move => {
      if (move.wordsFormed) {
        allWords.push(...move.wordsFormed);
      }
      if (move.placements && move.placements.length === 7) {
        bingoCount++;
      }
    });
    
    const wordScores = allWords.map(word => word.score);
    const averageWordScore = wordScores.length > 0 ? 
      wordScores.reduce((sum, score) => sum + score, 0) / wordScores.length : 0;
    const highestWordScore = wordScores.length > 0 ? Math.max(...wordScores) : 0;
    
    return {
      averageWordScore: Math.round(averageWordScore),
      highestWordScore,
      totalWordsFormed: allWords.length,
      bingoCount
    };
  }, [gameState?.moveHistory]);
  
  // ================================
  // Utility Functions
  // ================================
  
  const getTileValue = useCallback((tile: Tile): number => {
    return scoreCalculator.getTilePoints(tile);
  }, [scoreCalculator]);
  
  const calculateTileHandValue = useCallback((tiles: Tile[]): number => {
    return tiles.reduce((total, tile) => total + getTileValue(tile), 0);
  }, [getTileValue]);
  
  // ================================
  // Score Calculations
  // ================================
  
  const calculateMoveScore = useCallback((placements: TilePlacement[], wordsFormed: WordFormed[]): number => {
    if (!gameState?.board) return 0;
    
    const moveScore = scoreCalculator.calculateMoveScore(
      gameState.board,
      placements,
      wordsFormed
    );
    
    return moveScore.totalScore;
  }, [gameState?.board, scoreCalculator]);
  
  const calculatePotentialScore = useCallback((placements: TilePlacement[]): number => {
    if (!gameState?.board || !currentPlayer || placements.length === 0) return 0;
    
    // This would require validating the move first to get words formed
    // For now, return a basic calculation
    return placements.reduce((total, placement) => {
      return total + getTileValue(placement.tile);
    }, 0);
  }, [gameState?.board, currentPlayer, getTileValue]);
  
  // ================================
  // Score Projections
  // ================================
  
  const projectFinalScores = useCallback((): Record<string, number> => {
    const projections: Record<string, number> = {};
    
    if (!gameState?.players) return projections;
    
    // Simple projection based on current scores and remaining tiles
    const tilesRemaining = gameState.tileBag?.remaining || 0;
    const avgPointsPerTile = 4; // Rough average
    const estimatedRemainingPoints = tilesRemaining * avgPointsPerTile;
    
    gameState.players.forEach(player => {
      // Add current score plus a portion of remaining points
      const projectedBonus = estimatedRemainingPoints / gameState.players.length;
      projections[player.id] = player.score + projectedBonus;
    });
    
    return projections;
  }, [gameState]);
  
  const calculateWinProbability = useCallback((playerId: string): number => {
    if (!gameState?.players) return 0;
    
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return 0;
    
    const projections = projectFinalScores();
    const playerProjection = projections[playerId] || 0;
    
    // Calculate how many players this player is projected to beat
    const otherProjections = Object.values(projections).filter((_, index) => 
      gameState.players[index]?.id !== playerId
    );
    
    const betterProjections = otherProjections.filter(score => score > playerProjection);
    const probability = 1 - (betterProjections.length / otherProjections.length);
    
    return Math.max(0, Math.min(1, probability));
  }, [gameState?.players, projectFinalScores]);
  
  // ================================
  // Score Analysis Functions
  // ================================
  
  const getScoreBreakdown = useCallback((validation: MoveValidation): ScoreBreakdown | null => {
    if (!validation?.isValid || !gameState?.board) return null;
    
    // This would require integration with the score calculator
    // For now, return a basic breakdown
    return {
      baseScore: validation.score,
      letterMultipliers: 0,
      wordMultipliers: 0,
      bonuses: 0,
      total: validation.score,
      breakdown: [
        {
          description: 'Word formation',
          points: validation.score
        }
      ]
    };
  }, [gameState?.board]);
  
  const getBestWordFromMove = useCallback((validation: MoveValidation): WordFormed | null => {
    if (!validation?.wordsFormed || validation.wordsFormed.length === 0) return null;
    
    return validation.wordsFormed.reduce((best, word) => 
      word.score > best.score ? word : best
    );
  }, []);
  
  // ================================
  // Comparison Functions
  // ================================
  
  const comparePlayerScores = useCallback((player1Id: string, player2Id: string): number => {
    const score1 = playerScores[player1Id] || 0;
    const score2 = playerScores[player2Id] || 0;
    return score2 - score1; // Higher score first
  }, [playerScores]);
  
  const getRankings = useCallback((): Player[] => {
    if (!gameState?.players) return [];
    
    return [...gameState.players].sort((a, b) => b.score - a.score);
  }, [gameState?.players]);
  
  // ================================
  // Return Hook Interface
  // ================================
  
  return {
    // Score Information
    playerScores,
    currentPlayerScore,
    leadingPlayer,
    scoreGap,
    lastMoveScore,
    potentialScore: 0, // Will be calculated when needed
    ...scoreAnalysis,
    
    // Utility
    getTileValue,
    calculateTileHandValue,
    
    // Actions
    calculateMoveScore,
    calculatePotentialScore,
    projectFinalScores,
    calculateWinProbability,
    getScoreBreakdown,
    getBestWordFromMove,
    comparePlayerScores,
    getRankings,
  };
}

export default useScoring; 