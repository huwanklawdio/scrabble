# Utilities Directory

This directory contains all utility functions, helpers, and shared logic for the Scrabble game application.

## Directory Structure

```
utils/
├── game/           # Game-specific utility functions
├── validation/     # Input validation utilities
├── data/           # Data manipulation utilities
├── ui/             # UI and DOM utilities
├── performance/    # Performance optimization utilities
├── storage/        # Storage and persistence utilities
├── network/        # Network and API utilities
├── time/           # Date and time utilities
├── accessibility/  # Accessibility helpers
├── math/           # Mathematical utilities
├── error/          # Error handling utilities
├── constants/      # Application constants
└── index.ts        # Export barrel for all utilities
```

## Utility Categories

### Game Logic (`game/`)
- **tileUtils**: Tile manipulation and scoring
- **boardUtils**: Board state and position calculations
- **scoreUtils**: Score calculation helpers
- **wordUtils**: Word validation and dictionary operations
- **moveUtils**: Move processing and validation helpers

### Validation (`validation/`)
- **gameValidation**: Game rule validation
- **playerValidation**: Player input validation
- **formValidation**: Form input validation with custom rules

### Data Manipulation (`data/`)
- **arrayUtils**: Array operations and transformations
- **objectUtils**: Object manipulation and deep operations
- **stringUtils**: String processing and formatting
- **numberUtils**: Number formatting and calculations

### UI & DOM (`ui/`)
- **domUtils**: DOM manipulation and queries
- **eventUtils**: Event handling and delegation
- **styleUtils**: CSS and styling utilities
- **animationUtils**: Animation helpers and transitions

### Performance (`performance/`)
- **memoization**: Memoization and caching utilities
- **optimization**: Performance optimization helpers
- **debounce**: Debouncing utility functions
- **throttle**: Throttling utility functions

### Storage (`storage/`)
- **localStorage**: Local storage helpers with serialization
- **sessionStorage**: Session storage utilities
- **indexedDB**: IndexedDB helpers for complex data

### Network (`network/`)
- **api**: API request helpers and error handling
- **websocket**: WebSocket utilities for real-time communication
- **retry**: Retry logic with exponential backoff

### Time & Date (`time/`)
- **dateUtils**: Date formatting and calculations
- **timerUtils**: Timer and timeout utilities
- **formatUtils**: Time formatting for display

### Accessibility (`accessibility/`)
- **focusUtils**: Focus management utilities
- **ariaUtils**: ARIA attribute helpers
- **keyboardUtils**: Keyboard navigation utilities

### Math (`math/`)
- **geometry**: 2D geometry calculations for board positions
- **random**: Random number generation and shuffling
- **statistics**: Statistical calculations and analysis

### Error Handling (`error/`)
- **errorUtils**: Error formatting and logging
- **recovery**: Error recovery strategies
- **logging**: Structured logging utilities

### Constants (`constants/`)
- **gameConstants**: Game configuration constants
- **uiConstants**: UI configuration and breakpoints
- **keyboardConstants**: Keyboard shortcut definitions

## Usage Examples

### Game Utilities
```typescript
import { 
  calculateWordScore, 
  isValidPlacement, 
  shuffleTiles 
} from '@/utils/game';

const score = calculateWordScore(word, board, position);
const isValid = isValidPlacement(tile, position, board);
const shuffled = shuffleTiles(tileBag);
```

### Validation
```typescript
import { validatePlayerName, validateGameSettings } from '@/utils/validation';

const nameResult = validatePlayerName(name);
const settingsResult = validateGameSettings(settings);
```

### Data Manipulation
```typescript
import { 
  deepClone, 
  debounce, 
  formatNumber 
} from '@/utils';

const cloned = deepClone(gameState);
const debouncedSave = debounce(saveGame, 500);
const formattedScore = formatNumber(score);
```

### Performance
```typescript
import { memoize, throttle } from '@/utils/performance';

const memoizedCalculation = memoize(expensiveCalculation);
const throttledUpdate = throttle(updateUI, 100);
```

## Development Guidelines

### Function Design
- **Pure Functions**: Prefer pure functions with no side effects
- **Type Safety**: Full TypeScript support with proper types
- **Error Handling**: Robust error handling and validation
- **Documentation**: Clear JSDoc comments for all public functions
- **Testing**: Comprehensive unit tests for all utilities

### Naming Conventions
- Use descriptive, verb-based names for functions
- Group related functions in the same module
- Use consistent parameter naming across modules
- Export functions with clear, non-conflicting names

### Performance
- Optimize for common use cases
- Use memoization for expensive computations
- Implement lazy evaluation where beneficial
- Profile performance-critical functions

### Error Handling
```typescript
// Good: Proper error handling with types
export function parseGameMove(input: string): GameMove | null {
  try {
    // Parse logic
    return parsedMove;
  } catch (error) {
    console.warn('Failed to parse game move:', error);
    return null;
  }
}
```

## Testing

Each utility should have:
- Unit tests with Jest
- Property-based testing for mathematical functions
- Edge case testing
- Performance benchmarks for critical functions
- Integration tests where applicable

### Testing Example
```typescript
import { calculateWordScore } from './scoreUtils';

describe('calculateWordScore', () => {
  test('calculates basic word score correctly', () => {
    const result = calculateWordScore('HELLO', board, position);
    expect(result).toBe(8);
  });
  
  test('applies premium square multipliers', () => {
    const result = calculateWordScore('QUIZ', boardWithTripleWord, position);
    expect(result).toBe(66); // 22 * 3
  });
});
```

## Common Patterns

### Validation Pattern
```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export function validateInput(input: unknown): ValidationResult {
  const errors: string[] = [];
  
  // Validation logic
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### Async Utility Pattern
```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Memoization Pattern
```typescript
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return
): (...args: Args) => Return {
  const cache = new Map();
  
  return (...args: Args): Return => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
```

## Best Practices

1. **Keep functions small**: Single responsibility principle
2. **Avoid side effects**: Pure functions when possible
3. **Handle edge cases**: Comprehensive input validation
4. **Use TypeScript**: Strong typing for all parameters and returns
5. **Document thoroughly**: Clear JSDoc for complex functions
6. **Test extensively**: High test coverage and edge cases
7. **Optimize wisely**: Profile before optimizing
8. **Export consistently**: Use barrel exports for clean imports 