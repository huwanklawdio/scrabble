# Data Directory

This directory contains all static game data, configurations, and preset definitions for the Scrabble game.

## Directory Structure

```
data/
├── tiles.ts            # Official Scrabble tile distribution
├── board.ts            # Board layout and premium squares
├── dictionary.ts       # Word dictionary and validation
├── config/             # Game configuration files
│   ├── gameConfig.ts   # Core game settings
│   ├── boardConfig.ts  # Board-specific configuration
│   ├── playerConfig.ts # Player settings and limits
│   ├── themeConfig.ts  # UI theme configurations
│   ├── animationConfig.ts # Animation settings
│   └── accessibilityConfig.ts # A11y configurations
├── scoring/            # Scoring rules and calculations
│   ├── scoringRules.ts # Point values and multipliers
│   └── bonusMultipliers.ts # Premium square bonuses
├── media/              # Sound effects and assets
│   ├── soundEffects.ts # Game sound definitions
│   └── gameAssets.ts   # Image and icon references
├── presets/            # Predefined game configurations
│   ├── gamePresets.ts  # Standard game modes
│   └── difficultyLevels.ts # Difficulty configurations
├── localization/       # Multi-language support
│   ├── translations.ts # Text translations
│   └── localeConfig.ts # Locale-specific settings
└── index.ts            # Export barrel for all data
```

## Core Data Files

### Tiles (`tiles.ts`)
Official Scrabble tile distribution and point values:
```typescript
export const TILE_DISTRIBUTION = {
  A: { count: 9, points: 1 },
  B: { count: 2, points: 3 },
  C: { count: 2, points: 3 },
  // ... complete distribution
  BLANK: { count: 2, points: 0 }
};
```

### Board Layout (`board.ts`)
15×15 board configuration with premium squares:
```typescript
export const PREMIUM_SQUARES = {
  // Double Letter Score positions
  DL: [[0,3], [0,11], [2,6], [2,8], ...],
  // Triple Letter Score positions  
  TL: [[1,5], [1,9], [5,1], [5,5], ...],
  // Double Word Score positions
  DW: [[1,1], [2,2], [3,3], [4,4], ...],
  // Triple Word Score positions
  TW: [[0,0], [0,7], [0,14], [7,0], ...]
};
```

### Dictionary (`dictionary.ts`)
Word validation and dictionary management:
```typescript
export interface DictionaryConfig {
  source: 'standard' | 'tournament' | 'custom';
  words: Set<string>;
  validate: (word: string) => boolean;
}
```

## Configuration Files

### Game Configuration (`config/gameConfig.ts`)
Core game settings and rules:
```typescript
export const GAME_CONFIG = {
  maxPlayers: 4,
  minPlayers: 2,
  tilesPerPlayer: 7,
  timeLimit: 1800, // 30 minutes
  allowExchanges: true,
  challengeRules: 'standard'
};
```

### Theme Configuration (`config/themeConfig.ts`)
UI appearance and styling:
```typescript
export const BOARD_THEMES = {
  classic: {
    name: 'Classic',
    cellColors: {
      normal: '#F5F5DC',
      doubleWord: '#FFB6C1',
      tripleWord: '#FF6347',
      // ...
    }
  }
};
```

## Scoring Data

### Scoring Rules (`scoring/scoringRules.ts`)
Point calculations and bonus rules:
```typescript
export const SCORING_RULES = {
  sevenTileBonus: 50,
  endGamePenalty: true,
  premiumSquareRules: {
    onlyNewTiles: true,
    wordMultiplierStacking: false
  }
};
```

### Bonus Multipliers (`scoring/bonusMultipliers.ts`)
Premium square multiplier values:
```typescript
export const MULTIPLIERS = {
  DOUBLE_LETTER: 2,
  TRIPLE_LETTER: 3,
  DOUBLE_WORD: 2,
  TRIPLE_WORD: 3
};
```

## Media Assets

### Sound Effects (`media/soundEffects.ts`)
Game audio definitions:
```typescript
export const SOUND_EFFECTS = {
  tilePlacement: {
    src: '/sounds/tile-place.wav',
    volume: 0.7
  },
  wordComplete: {
    src: '/sounds/word-complete.wav', 
    volume: 0.8
  }
};
```

## Game Presets

### Standard Presets (`presets/gamePresets.ts`)
Predefined game configurations:
```typescript
export const GAME_PRESETS = {
  standard: {
    name: 'Standard Game',
    timeLimit: 0,
    allowExchanges: true,
    dictionary: 'standard'
  },
  tournament: {
    name: 'Tournament Mode',
    timeLimit: 25 * 60, // 25 minutes
    allowExchanges: true,
    dictionary: 'tournament'
  }
};
```

## Usage Examples

### Importing Game Data
```typescript
import { TILE_DISTRIBUTION, PREMIUM_SQUARES } from '@/data';
import { GAME_CONFIG } from '@/data/config/gameConfig';

// Initialize tile bag
const tileBag = createTileBag(TILE_DISTRIBUTION);

// Check premium square
const isPremium = PREMIUM_SQUARES.DW.includes([row, col]);
```

### Using Configurations
```typescript
import { BOARD_THEMES, SOUND_EFFECTS } from '@/data';

// Apply theme
const theme = BOARD_THEMES[selectedTheme];

// Play sound
const sound = new Audio(SOUND_EFFECTS.tilePlacement.src);
sound.volume = SOUND_EFFECTS.tilePlacement.volume;
```

## Development Guidelines

### Data Integrity
- **Accuracy**: All data must match official Scrabble rules
- **Validation**: Include validation for all imported data
- **Immutability**: Export read-only objects where possible
- **Type Safety**: Strong TypeScript interfaces for all data structures

### File Organization
- **Single Responsibility**: One data concern per file
- **Logical Grouping**: Related data in subdirectories
- **Clear Naming**: Descriptive file and export names
- **Consistent Structure**: Uniform data format across files

### Performance
- **Lazy Loading**: Load large datasets only when needed
- **Efficient Lookups**: Use Maps/Sets for O(1) lookups
- **Memory Management**: Avoid unnecessary data duplication
- **Compression**: Consider compression for large word lists

## Data Validation

All data should include validation functions:
```typescript
export function validateTileDistribution(distribution: any): boolean {
  const totalTiles = Object.values(distribution)
    .reduce((sum, tile) => sum + tile.count, 0);
  return totalTiles === 100; // Standard Scrabble has 100 tiles
}

export function validateBoardLayout(layout: any): boolean {
  // Validate 15x15 grid, center star, premium square placement
  return layout.length === 15 && layout.every(row => row.length === 15);
}
```

## Testing

Each data file should have:
- Validation tests for data integrity
- Performance tests for large datasets
- Integration tests with game logic
- Accuracy tests against official rules

### Testing Example
```typescript
import { TILE_DISTRIBUTION, validateTileDistribution } from './tiles';

describe('Tile Distribution', () => {
  test('has correct total tile count', () => {
    expect(validateTileDistribution(TILE_DISTRIBUTION)).toBe(true);
  });
  
  test('includes all required letters', () => {
    const letters = Object.keys(TILE_DISTRIBUTION);
    expect(letters).toContain('A');
    expect(letters).toContain('BLANK');
  });
});
```

## Localization Support

All user-facing text should support localization:
```typescript
export const TRANSLATIONS = {
  en: {
    'game.title': 'Scrabble',
    'game.newGame': 'New Game',
    'error.invalidMove': 'Invalid move'
  },
  es: {
    'game.title': 'Scrabble',
    'game.newGame': 'Nuevo Juego', 
    'error.invalidMove': 'Movimiento inválido'
  }
};
```

## Best Practices

1. **Follow Official Rules**: Ensure all data matches official Scrabble
2. **Version Control**: Track changes to game data carefully
3. **Documentation**: Document data sources and any modifications
4. **Validation**: Include runtime validation for critical data
5. **Performance**: Optimize data structures for game performance
6. **Extensibility**: Design for easy addition of new languages/variants
7. **Testing**: Comprehensive tests for all data integrity
8. **Immutability**: Prevent accidental data modification 