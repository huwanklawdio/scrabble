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

// TODO: Add remaining game logic exports as they are implemented:
// export { default as MoveValidator } from './rules/MoveValidator';
// export { default as ScoreCalculator } from './rules/ScoreCalculator'; 