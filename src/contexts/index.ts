// ================================
// Contexts Export Index
// ================================

// Game Context
export { 
  default as GameContext,
  GameProvider,
  useGame,
  type GameContextState,
  type GameContextActions,
  type GameContextValue,
  type GameAction,
  type GameProviderProps
} from './GameContext';

// Import for default export
import GameContext from './GameContext';

// Export all contexts
export default GameContext; 