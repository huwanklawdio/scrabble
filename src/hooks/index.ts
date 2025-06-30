// ================================
// Custom Hooks Export Index
// ================================

// Game Context & Core Hooks (Task 3.1.1 & 3.1.2 - COMPLETED)
export { useGame, GameProvider } from '../contexts/GameContext';
export { default as useGameState } from './useGameState';
export { default as useTilePlacement } from './useTilePlacement';
export { default as useScoring } from './useScoring';
export { default as useGameValidation } from './useGameValidation';

// Local Component State Hooks (Task 3.2.1 - COMPLETED)
export { default as useDragAndDrop } from './useDragAndDrop';
export { default as useUIInteraction } from './useUIInteraction';
export { default as useFormState } from './useFormState';
export { default as useModalState } from './useModalState';

// Re-export types
export type { 
  DragAndDropHook, 
  DragItem, 
  DropZone, 
  DragState, 
  TouchState,
  DragDropConfig 
} from './useDragAndDrop';
export type { 
  UIInteractionHook, 
  InteractionState, 
  InteractionCallbacks,
  UIInteractionConfig 
} from './useUIInteraction';
export type { 
  FormStateHook, 
  FormField, 
  FormState, 
  ValidationRule,
  FieldConfig,
  FormConfig 
} from './useFormState';
export type { 
  ModalStateHook, 
  ModalConfig, 
  ModalState, 
  ModalStackItem,
  ModalManagerConfig 
} from './useModalState';

// Re-export validation helpers
export { ValidationRules } from './useFormState';

// Future hooks will be added in subsequent phases:
// Phase 4: UI Components
// Phase 5: Drag & Drop
// Phase 6: Game Flow
// Phase 7: Enhanced UX
// Phase 8: Accessibility & Performance 