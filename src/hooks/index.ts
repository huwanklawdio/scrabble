// ================================
// Custom Hooks Export Index
// ================================

// This file will export all custom React hooks once they are implemented
// Currently empty - hooks will be added in subsequent tasks

// TODO: Add hook exports as they are implemented:
// Game State Hooks
// export { default as useGameState } from './game/useGameState';
// export { default as useGameActions } from './game/useGameActions';

// Board Interaction Hooks
// export { default as useTilePlacement } from './board/useTilePlacement';
// export { default as useDragAndDrop } from './board/useDragAndDrop';

// UI Interaction Hooks
// export { default as useKeyboardShortcuts } from './ui/useKeyboardShortcuts';
// export { default as useModal } from './ui/useModal';

// Utility Hooks
// export { default as useDebounce } from './utils/useDebounce';
// export { default as useAsync } from './utils/useAsync';

// Game State Hooks
export { default as useGameState } from './game/useGameState';
export { default as useGameActions } from './game/useGameActions';
export { default as useGameFlow } from './game/useGameFlow';

// Board Interaction Hooks
export { default as useTilePlacement } from './board/useTilePlacement';
export { default as useBoardValidation } from './board/useBoardValidation';
export { default as useDragAndDrop } from './board/useDragAndDrop';

// Player Management Hooks
export { default as usePlayerState } from './player/usePlayerState';
export { default as useTileRack } from './player/useTileRack';
export { default as useScoring } from './player/useScoring';

// UI Interaction Hooks
export { default as useKeyboardShortcuts } from './ui/useKeyboardShortcuts';
export { default as useModal } from './ui/useModal';
export { default as useNotifications } from './ui/useNotifications';
export { default as useAccessibility } from './ui/useAccessibility';

// Performance Hooks
export { default as usePerformance } from './performance/usePerformance';
export { default as useVirtualization } from './performance/useVirtualization';
export { default as useLazyLoading } from './performance/useLazyLoading';

// Responsive Design Hooks
export { default as useResponsive } from './responsive/useResponsive';
export { default as useBreakpoints } from './responsive/useBreakpoints';

// Storage and Persistence Hooks
export { default as useLocalStorage } from './storage/useLocalStorage';
export { default as useGamePersistence } from './storage/useGamePersistence';

// Network Hooks (for future multiplayer)
export { default as useWebSocket } from './network/useWebSocket';
export { default as useNetworkState } from './network/useNetworkState';

// Utility Hooks
export { default as useThrottle } from './utils/useThrottle';
export { default as useTimeout } from './utils/useTimeout';
export { default as useInterval } from './utils/useInterval'; 