# Hooks Directory

This directory contains all custom React hooks for the Scrabble game application.

## Directory Structure

```
hooks/
├── game/           # Game state and logic hooks
├── board/          # Board interaction hooks
├── player/         # Player management hooks
├── ui/             # UI interaction hooks
├── performance/    # Performance optimization hooks
├── responsive/     # Responsive design hooks
├── storage/        # Data persistence hooks
├── network/        # Network and multiplayer hooks
├── utils/          # Utility hooks
└── index.ts        # Export barrel for all hooks
```

## Hook Categories

### Game State Hooks (`game/`)
- **useGameState**: Main game state management
- **useGameActions**: Game action dispatchers
- **useGameFlow**: Game flow and phase management

### Board Interaction (`board/`)
- **useTilePlacement**: Tile placement logic and validation
- **useBoardValidation**: Real-time move validation
- **useDragAndDrop**: Drag and drop functionality

### Player Management (`player/`)
- **usePlayerState**: Individual player state
- **useTileRack**: Tile rack management
- **useScoring**: Score calculation and tracking

### UI Interaction (`ui/`)
- **useKeyboardShortcuts**: Keyboard navigation and shortcuts
- **useModal**: Modal state management
- **useNotifications**: Toast notification system
- **useAccessibility**: Accessibility features and ARIA support

### Performance (`performance/`)
- **usePerformance**: Performance monitoring
- **useVirtualization**: List virtualization for large datasets
- **useLazyLoading**: Lazy loading and code splitting

### Responsive Design (`responsive/`)
- **useResponsive**: Responsive breakpoint detection
- **useBreakpoints**: Media query management

### Storage & Persistence (`storage/`)
- **useLocalStorage**: Local storage management
- **useGamePersistence**: Game state persistence

### Network (Future) (`network/`)
- **useWebSocket**: WebSocket connection management
- **useNetworkState**: Network connectivity status

### Utility Hooks (`utils/`)
- **useDebounce**: Debounced value updates
- **useThrottle**: Throttled function calls
- **useAsync**: Async operation management
- **useTimeout**: Timeout management
- **useInterval**: Interval management

## Usage Examples

### Game State Management
```typescript
import { useGameState, useGameActions } from '@/hooks';

function GameComponent() {
  const gameState = useGameState();
  const { makeMove, passTurn, exchangeTiles } = useGameActions();
  
  // Component logic
}
```

### Board Interactions
```typescript
import { useTilePlacement, useDragAndDrop } from '@/hooks';

function BoardComponent() {
  const { validatePlacement, placeTile } = useTilePlacement();
  const { draggedTile, dropZone, handlers } = useDragAndDrop();
  
  // Component logic
}
```

### UI Enhancements
```typescript
import { useKeyboardShortcuts, useModal } from '@/hooks';

function GameControls() {
  const { openModal, closeModal } = useModal();
  
  useKeyboardShortcuts({
    'Ctrl+Enter': submitMove,
    'Escape': () => closeModal(),
    'Space': passTurn
  });
  
  // Component logic
}
```

## Development Guidelines

### Hook Design Principles
- **Single Responsibility**: Each hook should have one clear purpose
- **Reusability**: Design for reuse across multiple components
- **Type Safety**: Full TypeScript support with proper return types
- **Performance**: Minimize re-renders with proper dependencies
- **Testing**: Comprehensive testing with React Testing Library

### Naming Conventions
- Use descriptive names starting with `use`
- Group related functionality in the same hook
- Use consistent parameter and return value naming
- Document complex hooks with JSDoc comments

### State Management
- Use `useReducer` for complex state logic
- Implement proper memoization with `useMemo` and `useCallback`
- Handle side effects with `useEffect`
- Clean up resources and subscriptions

### Error Handling
- Include error boundaries for hook errors
- Provide meaningful error messages
- Implement retry logic where appropriate
- Log errors for debugging

## Testing

Each hook should have:
- Unit tests with `@testing-library/react-hooks`
- Integration tests in component context
- Edge case testing
- Performance testing for complex hooks
- Mock external dependencies

### Testing Example
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useGameState } from './useGameState';

test('should initialize game state correctly', () => {
  const { result } = renderHook(() => useGameState());
  
  expect(result.current.gamePhase).toBe('setup');
  expect(result.current.players).toHaveLength(0);
});
```

## Performance Considerations

- Use `useMemo` for expensive calculations
- Implement `useCallback` for event handlers
- Debounce/throttle frequently called functions
- Optimize dependency arrays
- Consider lazy initialization for heavy operations

## Best Practices

1. **Keep hooks focused**: One responsibility per hook
2. **Abstract complex logic**: Move business logic to custom hooks
3. **Handle loading states**: Always provide loading/error states
4. **Clean up effects**: Prevent memory leaks with proper cleanup
5. **Document dependencies**: Clear dependency arrays
6. **Type everything**: Full TypeScript coverage
7. **Test thoroughly**: High test coverage for reliability 