// ================================
// Official Scrabble Tile System
// ================================

import type { Tile } from '../types';

// Official Scrabble tile distribution and point values
export const TILE_DISTRIBUTION = {
  A: { count: 9, points: 1 },
  B: { count: 2, points: 3 },
  C: { count: 2, points: 3 },
  D: { count: 4, points: 2 },
  E: { count: 12, points: 1 },
  F: { count: 2, points: 4 },
  G: { count: 3, points: 2 },
  H: { count: 2, points: 4 },
  I: { count: 9, points: 1 },
  J: { count: 1, points: 8 },
  K: { count: 1, points: 5 },
  L: { count: 4, points: 1 },
  M: { count: 2, points: 3 },
  N: { count: 6, points: 1 },
  O: { count: 8, points: 1 },
  P: { count: 2, points: 3 },
  Q: { count: 1, points: 10 },
  R: { count: 6, points: 1 },
  S: { count: 4, points: 1 },
  T: { count: 6, points: 1 },
  U: { count: 4, points: 1 },
  V: { count: 2, points: 4 },
  W: { count: 2, points: 4 },
  X: { count: 1, points: 8 },
  Y: { count: 2, points: 4 },
  Z: { count: 1, points: 10 },
  BLANK: { count: 2, points: 0 }
} as const;

// Type for valid tile letters
export type TileLetter = keyof typeof TILE_DISTRIBUTION;

// Total number of tiles in a standard Scrabble set
export const TOTAL_TILES = 100;

// ================================
// Tile Creation and Validation
// ================================

/**
 * Creates a tile with the specified letter
 */
export function createTile(letter: TileLetter, id?: string): Tile {
  const distribution = TILE_DISTRIBUTION[letter];
  
  if (!distribution) {
    throw new Error(`Invalid tile letter: ${letter}`);
  }

  return {
    id: id || generateTileId(),
    letter: letter === 'BLANK' ? '' : letter,
    points: distribution.points,
    status: 'bag',
    isBlank: letter === 'BLANK',
    assignedLetter: letter === 'BLANK' ? undefined : letter
  };
}

/**
 * Generates a unique tile ID
 */
function generateTileId(): string {
  return `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates tile distribution totals
 */
export function validateTileDistribution(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check total tile count
  const totalCount = Object.values(TILE_DISTRIBUTION)
    .reduce((sum, tile) => sum + tile.count, 0);
  
  if (totalCount !== TOTAL_TILES) {
    errors.push(`Total tile count is ${totalCount}, expected ${TOTAL_TILES}`);
  }
  
  // Check for negative counts or points
  Object.entries(TILE_DISTRIBUTION).forEach(([letter, data]) => {
    if (data.count < 0) {
      errors.push(`Negative count for ${letter}: ${data.count}`);
    }
    if (data.points < 0) {
      errors.push(`Negative points for ${letter}: ${data.points}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ================================
// Tile Bag Management
// ================================

/**
 * Creates a full tile bag with all tiles
 */
export function createTileBag(): Tile[] {
  const tiles: Tile[] = [];
  
  Object.entries(TILE_DISTRIBUTION).forEach(([letter, data]) => {
    for (let i = 0; i < data.count; i++) {
      tiles.push(createTile(letter as TileLetter));
    }
  });
  
  return shuffleTiles(tiles);
}

/**
 * Shuffles an array of tiles using Fisher-Yates algorithm
 */
export function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Draws a specified number of tiles from the bag
 */
export function drawTiles(tileBag: Tile[], count: number): {
  drawnTiles: Tile[];
  remainingBag: Tile[];
} {
  if (count < 0) {
    throw new Error('Cannot draw negative number of tiles');
  }
  
  if (count > tileBag.length) {
    // Return all remaining tiles if requested count exceeds available
    return {
      drawnTiles: [...tileBag],
      remainingBag: []
    };
  }
  
  const drawnTiles = tileBag.slice(0, count);
  const remainingBag = tileBag.slice(count);
  
  return {
    drawnTiles,
    remainingBag
  };
}

/**
 * Returns tiles to the bag and reshuffles
 */
export function returnTilesToBag(tileBag: Tile[], returnedTiles: Tile[]): Tile[] {
  const newBag = [...tileBag, ...returnedTiles];
  return shuffleTiles(newBag);
}

/**
 * Exchanges specified tiles for new ones from the bag
 */
export function exchangeTiles(
  tileBag: Tile[], 
  tilesToExchange: Tile[]
): {
  newTiles: Tile[];
  updatedBag: Tile[];
} {
  if (tilesToExchange.length > tileBag.length) {
    throw new Error('Cannot exchange more tiles than available in bag');
  }
  
  // Draw new tiles
  const { drawnTiles: newTiles, remainingBag } = drawTiles(tileBag, tilesToExchange.length);
  
  // Return exchanged tiles to bag and shuffle
  const updatedBag = returnTilesToBag(remainingBag, tilesToExchange);
  
  return {
    newTiles,
    updatedBag
  };
}

// ================================
// Tile Query Functions
// ================================

/**
 * Gets the point value for a specific letter
 */
export function getTilePoints(letter: TileLetter): number {
  return TILE_DISTRIBUTION[letter].points;
}

/**
 * Gets the count of a specific letter in the distribution
 */
export function getTileCount(letter: TileLetter): number {
  return TILE_DISTRIBUTION[letter].count;
}

/**
 * Gets all available letters sorted by point value
 */
export function getLettersByPoints(): Array<{ letter: TileLetter; points: number }> {
  return Object.entries(TILE_DISTRIBUTION)
    .map(([letter, data]) => ({
      letter: letter as TileLetter,
      points: data.points
    }))
    .sort((a, b) => a.points - b.points);
}

/**
 * Checks if a tile bag is empty
 */
export function isTileBagEmpty(tileBag: Tile[]): boolean {
  return tileBag.length === 0;
}

/**
 * Gets the number of tiles remaining in the bag
 */
export function getTilesRemaining(tileBag: Tile[]): number {
  return tileBag.length;
}

/**
 * Counts tiles by letter in a collection
 */
export function countTilesByLetter(tiles: Tile[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  tiles.forEach(tile => {
    const letter = tile.isBlank ? 'BLANK' : tile.letter;
    counts[letter] = (counts[letter] || 0) + 1;
  });
  
  return counts;
}

// ================================
// Blank Tile Management
// ================================

/**
 * Designates a blank tile to represent a specific letter
 */
export function designateBlankTile(tile: Tile, letter: string): Tile {
  if (!tile.isBlank) {
    throw new Error('Can only designate blank tiles');
  }
  
  if (letter.length !== 1 || !/[A-Z]/.test(letter.toUpperCase())) {
    throw new Error('Designated letter must be a single uppercase letter');
  }
  
  return {
    ...tile,
    assignedLetter: letter.toUpperCase(),
    letter: letter.toUpperCase()
  };
}

/**
 * Resets a blank tile to its undesignated state
 */
export function resetBlankTile(tile: Tile): Tile {
  if (!tile.isBlank) {
    throw new Error('Can only reset blank tiles');
  }
  
  return {
    ...tile,
    assignedLetter: undefined,
    letter: ''
  };
}

// ================================
// Tile Statistics
// ================================

/**
 * Calculates tile distribution statistics
 */
export function getTileStatistics() {
  const letters = Object.keys(TILE_DISTRIBUTION) as TileLetter[];
  const totalTiles = letters.reduce((sum, letter) => sum + TILE_DISTRIBUTION[letter].count, 0);
  const totalPoints = letters.reduce((sum, letter) => 
    sum + (TILE_DISTRIBUTION[letter].count * TILE_DISTRIBUTION[letter].points), 0
  );
  
  return {
    totalTiles,
    totalPoints,
    uniqueLetters: letters.length,
    averagePointValue: totalPoints / totalTiles,
    highestValueTile: Math.max(...letters.map(l => TILE_DISTRIBUTION[l].points)),
    lowestValueTile: Math.min(...letters.map(l => TILE_DISTRIBUTION[l].points)),
    vowelCount: ['A', 'E', 'I', 'O', 'U'].reduce((sum, vowel) => 
      sum + TILE_DISTRIBUTION[vowel as TileLetter].count, 0
    ),
    consonantCount: totalTiles - ['A', 'E', 'I', 'O', 'U', 'BLANK'].reduce((sum, letter) => 
      sum + TILE_DISTRIBUTION[letter as TileLetter].count, 0
    )
  };
}

// ================================
// Export Default Tile Bag
// ================================

// Pre-created and shuffled tile bag for immediate use
export const DEFAULT_TILE_BAG = createTileBag();

// Export validation result for runtime checking
export const TILE_VALIDATION = validateTileDistribution(); 