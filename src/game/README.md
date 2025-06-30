# Game Logic Directory

This directory contains all the core game logic, rules, and state management for the Scrabble game.

## Directory Structure

```
game/
├── engine/         # Core game engine and orchestration
├── state/          # Game state management
├── rules/          # Game rules and validation logic
├── board/          # Board-specific logic
├── players/        # Player management logic
├── moves/          # Move processing and history
├── flow/           # Game flow and session management
└── index.ts        # Export barrel for game modules
```

## Module Categories

### Core Engine (`engine/`)
- **GameEngine**: Main game orchestration and lifecycle
- Controls game initialization, turn progression, and termination
- Coordinates between different game systems

### State Management (`state/`)
- **GameState**: Central game state container
- **TurnManager**: Turn progression and player switching
- Immutable state updates and history tracking

### Rules & Validation (`rules/`)
- **MoveValidator**: Validates tile placement and word formation
- **WordValidator**: Dictionary validation and word checking
- **ScoreCalculator**: Point calculation with bonuses and multipliers
- Implements official Scrabble rules

### Board Management (`board/`)
- **BoardManager**: Board state and tile placement
- **TilePlacement**: Tile positioning and adjacency logic
- Handles premium squares and board constraints

### Player Systems (`players/`)
- **PlayerManager**: Player creation and management
- **TileManager**: Tile distribution and rack management
- Player scoring and statistics

### Move Processing (`moves/`)
- **MoveProcessor**: Move execution and validation
- **MoveHistory**: Move tracking and undo functionality
- Move serialization for network play

### Game Flow (`flow/`)
- **GameFlow**: High-level game flow control
- **GameSession**: Session management and persistence
- Game modes and difficulty settings

## Core Concepts

### Game State
The game state is immutable and contains:
- Board configuration (15×15 grid)
- Player information and scores
- Tile bag and distribution
- Move history
- Current game phase

### Move Validation
All moves are validated for:
- Valid tile placement (adjacency, board bounds)
- Word formation (dictionary validation)
- Rule compliance (first move on center star)
- Scoring accuracy

### Scoring System
- Base letter point values
- Premium square multipliers (DL, TL, DW, TW)
- Word bonuses (50 points for using all 7 tiles)
- End-game penalties for remaining tiles

## Usage

Import game logic modules:

```typescript
import { GameEngine, MoveValidator, ScoreCalculator } from '@/game';

// Initialize a new game
const game = new GameEngine({
  players: ['Alice', 'Bob'],
  difficulty: 'standard'
});

// Validate a move
const isValid = MoveValidator.validateMove(move, gameState);

// Calculate score
const score = ScoreCalculator.calculateScore(move, board);
```

## Development Guidelines

- All game logic should be pure functions where possible
- Use immutable data structures for state
- Comprehensive input validation for all public methods
- Detailed error messages for invalid operations
- Performance optimization for move validation
- Full test coverage for all rules and edge cases
- Documentation for complex algorithms

## Testing

Each module should include:
- Unit tests for all public methods
- Integration tests for complex interactions
- Property-based tests for game rules
- Performance tests for critical paths
- Edge case testing (empty bag, invalid moves, etc.)

## Performance Considerations

- Memoize expensive calculations (word validation)
- Optimize board traversal algorithms
- Use efficient data structures for tile lookup
- Consider web workers for complex validation
- Implement move validation caching

## Official Scrabble Rules

The implementation follows official Scrabble rules:
- 15×15 board with premium squares
- 100 tiles with standard distribution
- First word must cross center star
- Words must connect to existing tiles
- Only valid dictionary words allowed
- Challenging and scoring rules 