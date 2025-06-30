import { describe, test, expect } from 'vitest';
import {
  TILE_DISTRIBUTION,
  TOTAL_TILES,
  createTile,
  createTileBag,
  drawTiles,
  exchangeTiles,
  shuffleTiles,
  validateTileDistribution,
  getTilePoints,
  getTileCount,
  getLettersByPoints,
  designateBlankTile,
  resetBlankTile,
  getTileStatistics,
  countTilesByLetter,
  DEFAULT_TILE_BAG,
  TILE_VALIDATION
} from './tiles';

describe('Tile Distribution', () => {
  test('has correct total tile count', () => {
    const totalCount = Object.values(TILE_DISTRIBUTION)
      .reduce((sum, tile) => sum + tile.count, 0);
    expect(totalCount).toBe(TOTAL_TILES);
    expect(totalCount).toBe(100);
  });

  test('includes all required letters', () => {
    const letters = Object.keys(TILE_DISTRIBUTION);
    expect(letters).toContain('A');
    expect(letters).toContain('Z');
    expect(letters).toContain('BLANK');
    expect(letters).toHaveLength(27); // 26 letters + BLANK
  });

  test('has correct point values for key letters', () => {
    expect(TILE_DISTRIBUTION.A.points).toBe(1);
    expect(TILE_DISTRIBUTION.Q.points).toBe(10);
    expect(TILE_DISTRIBUTION.Z.points).toBe(10);
    expect(TILE_DISTRIBUTION.BLANK.points).toBe(0);
  });

  test('validates distribution correctly', () => {
    const result = validateTileDistribution();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Tile Creation', () => {
  test('creates regular tile correctly', () => {
    const tile = createTile('A');
    expect(tile.letter).toBe('A');
    expect(tile.points).toBe(1);
    expect(tile.isBlank).toBe(false);
    expect(tile.status).toBe('bag');
    expect(tile.id).toBeTruthy();
  });

  test('creates blank tile correctly', () => {
    const tile = createTile('BLANK');
    expect(tile.letter).toBe('');
    expect(tile.points).toBe(0);
    expect(tile.isBlank).toBe(true);
    expect(tile.assignedLetter).toBeUndefined();
  });

  test('creates tile with custom ID', () => {
    const customId = 'custom-tile-123';
    const tile = createTile('A', customId);
    expect(tile.id).toBe(customId);
  });

  test('throws error for invalid letter', () => {
    expect(() => createTile('INVALID' as any)).toThrow('Invalid tile letter');
  });
});

describe('Tile Bag Management', () => {
  test('creates full tile bag with correct count', () => {
    const tileBag = createTileBag();
    expect(tileBag).toHaveLength(TOTAL_TILES);
  });

  test('creates tile bag with correct distribution', () => {
    const tileBag = createTileBag();
    const counts = countTilesByLetter(tileBag);
    
    // Check specific letter counts
    expect(counts.A).toBe(9);
    expect(counts.E).toBe(12);
    expect(counts.Q).toBe(1);
    expect(counts.BLANK).toBe(2);
  });

  test('shuffles tiles differently each time', () => {
    const bag1 = createTileBag();
    const bag2 = createTileBag();
    
    // Extremely unlikely to have identical order if shuffling works
    const identical = bag1.every((tile, index) => 
      tile.letter === bag2[index].letter
    );
    expect(identical).toBe(false);
  });

  test('draws correct number of tiles', () => {
    const tileBag = createTileBag();
    const { drawnTiles, remainingBag } = drawTiles(tileBag, 7);
    
    expect(drawnTiles).toHaveLength(7);
    expect(remainingBag).toHaveLength(TOTAL_TILES - 7);
    expect(drawnTiles.length + remainingBag.length).toBe(TOTAL_TILES);
  });

  test('handles drawing more tiles than available', () => {
    const smallBag = [createTile('A'), createTile('B')];
    const { drawnTiles, remainingBag } = drawTiles(smallBag, 5);
    
    expect(drawnTiles).toHaveLength(2);
    expect(remainingBag).toHaveLength(0);
  });

  test('throws error for negative draw count', () => {
    const tileBag = createTileBag();
    expect(() => drawTiles(tileBag, -1)).toThrow('Cannot draw negative number');
  });
});

describe('Tile Exchange', () => {
  test('exchanges tiles correctly', () => {
    const tileBag = createTileBag();
    const tilesToExchange = [createTile('A'), createTile('B')];
    
    const { newTiles, updatedBag } = exchangeTiles(tileBag, tilesToExchange);
    
    expect(newTiles).toHaveLength(2);
    expect(updatedBag).toHaveLength(TOTAL_TILES); // Same total after exchange
  });

  test('throws error when exchanging more tiles than available', () => {
    const smallBag = [createTile('A')];
    const tilesToExchange = [createTile('B'), createTile('C')];
    
    expect(() => exchangeTiles(smallBag, tilesToExchange))
      .toThrow('Cannot exchange more tiles than available');
  });
});

describe('Blank Tile Management', () => {
  test('assigns letter to blank tile', () => {
    const blankTile = createTile('BLANK');
    const assignedTile = designateBlankTile(blankTile, 'S');
    
    expect(assignedTile.letter).toBe('S');
    expect(assignedTile.assignedLetter).toBe('S');
    expect(assignedTile.isBlank).toBe(true);
    expect(assignedTile.points).toBe(0);
  });

  test('resets blank tile to unassigned state', () => {
    const blankTile = createTile('BLANK');
    const assignedTile = designateBlankTile(blankTile, 'S');
    const resetTile = resetBlankTile(assignedTile);
    
    expect(resetTile.letter).toBe('');
    expect(resetTile.assignedLetter).toBeUndefined();
    expect(resetTile.isBlank).toBe(true);
  });

  test('throws error when assigning letter to non-blank tile', () => {
    const regularTile = createTile('A');
    expect(() => designateBlankTile(regularTile, 'S'))
      .toThrow('Can only designate blank tiles');
  });

  test('throws error for invalid assigned letter', () => {
    const blankTile = createTile('BLANK');
    expect(() => designateBlankTile(blankTile, '123'))
      .toThrow('Designated letter must be a single uppercase letter');
  });
});

describe('Tile Query Functions', () => {
  test('gets correct tile points', () => {
    expect(getTilePoints('A')).toBe(1);
    expect(getTilePoints('Q')).toBe(10);
    expect(getTilePoints('BLANK')).toBe(0);
  });

  test('gets correct tile count', () => {
    expect(getTileCount('A')).toBe(9);
    expect(getTileCount('E')).toBe(12);
    expect(getTileCount('BLANK')).toBe(2);
  });

  test('gets letters sorted by points', () => {
    const lettersByPoints = getLettersByPoints();
    expect(lettersByPoints[0].points).toBe(0); // BLANK
    expect(lettersByPoints[lettersByPoints.length - 1].points).toBe(10); // Q or Z
  });
});

describe('Tile Statistics', () => {
  test('calculates correct statistics', () => {
    const stats = getTileStatistics();
    
    expect(stats.totalTiles).toBe(100);
    expect(stats.uniqueLetters).toBe(27);
    expect(stats.highestValueTile).toBe(10);
    expect(stats.lowestValueTile).toBe(0);
    expect(stats.vowelCount).toBe(42); // A(9) + E(12) + I(9) + O(8) + U(4)
  });
});

describe('Default Exports', () => {
  test('default tile bag is valid', () => {
    expect(DEFAULT_TILE_BAG).toHaveLength(TOTAL_TILES);
    expect(Array.isArray(DEFAULT_TILE_BAG)).toBe(true);
  });

  test('tile validation passes', () => {
    expect(TILE_VALIDATION.isValid).toBe(true);
    expect(TILE_VALIDATION.errors).toHaveLength(0);
  });
});

describe('Edge Cases', () => {
  test('handles empty tile array', () => {
    const counts = countTilesByLetter([]);
    expect(Object.keys(counts)).toHaveLength(0);
  });

  test('shuffles single tile correctly', () => {
    const singleTile = [createTile('A')];
    const shuffled = shuffleTiles(singleTile);
    expect(shuffled).toHaveLength(1);
    expect(shuffled[0].letter).toBe('A');
  });

  test('handles drawing zero tiles', () => {
    const tileBag = createTileBag();
    const { drawnTiles, remainingBag } = drawTiles(tileBag, 0);
    
    expect(drawnTiles).toHaveLength(0);
    expect(remainingBag).toHaveLength(TOTAL_TILES);
  });
}); 