// ================================
// Game Logic Export Index
// ================================

// Export game types that are already defined
export type {
  GameState,
  Player,
  Tile,
  Move,
  BoardCell,
  BoardPosition,
  GamePhase,
} from '../types';

// Export game state management system
export {
  GameStateManager,
  PlayerManager,
  createGameState,
  createLocalGame,
  createQuickGame,
  DEFAULT_GAME_SETTINGS,
  type GameConfig,
  type GameEvent,
  type GameEventType,
  type GameEventListener
} from './gameState';

// Move Validation System
export {
  MoveValidator,
  createMoveValidator,
  createLenientValidator,
  isValidPosition,
  arePositionsAdjacent,
  getAdjacentPositions,
  getPositionDistance,
  sortPositions,
  DEFAULT_VALIDATOR_CONFIG,
  type MoveValidatorConfig,
  type WordAnalysis,
  type PlacementValidation
} from './moveValidator';

// Scoring System
export {
  ScoreCalculator,
  createScoreCalculator,
  createPracticeScoreCalculator,
  createTournamentScoreCalculator,
  calculateTileValue,
  findHighestScoringWord,
  calculateScorePerTile,
  isBingoMove,
  formatScoreBreakdown,
  compareMovesByScore,
  getScoreStatistics,
  DEFAULT_SCORING_CONFIG,
  type ScoringConfig,
  type TileScore,
  type WordScore,
  type MoveScore,
  type EndGameScore
} from './scoreCalculator';

// Re-export all game types
export * from '../types/game';

// TODO: Add remaining game logic exports as they are implemented:
// export { default as MoveValidator } from './rules/MoveValidator';
// export { default as ScoreCalculator } from './rules/ScoreCalculator'; 