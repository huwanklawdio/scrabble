// ================================
// Scrabble Scoring System
// ================================

import type {
  Board,
  BoardPosition,
  Tile,
  TilePlacement,
  WordFormed,
  ScoreBreakdown,
  PremiumSquareType
} from '../types/game';

// ================================
// Scoring Configuration
// ================================

export interface ScoringConfig {
  bingoBonus: number;
  applyPremiumSquares: boolean;
  endGamePenalty: boolean;
  minimumWordLength: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  bingoBonus: 50,
  applyPremiumSquares: true,
  endGamePenalty: true,
  minimumWordLength: 2
};

// ================================
// Detailed Scoring Types
// ================================

export interface TileScore {
  tile: Tile;
  position: BoardPosition;
  basePoints: number;
  letterMultiplier: number;
  totalTilePoints: number;
}

export interface WordScore {
  word: string;
  positions: BoardPosition[];
  tileScores: TileScore[];
  baseScore: number;
  wordMultiplier: number;
  finalWordScore: number;
  isMainWord: boolean;
  newTilesOnly: boolean;
}

export interface MoveScore {
  totalScore: number;
  wordScores: WordScore[];
  bingoBonus: number;
  breakdown: ScoreBreakdown;
  tilesUsed: number;
  newWordsFormed: number;
}

export interface EndGameScore {
  playerId: string;
  tilesRemaining: Tile[];
  penalty: number;
  bonusFromOthers: number;
  netAdjustment: number;
}

// ================================
// Score Calculator Class
// ================================

export class ScoreCalculator {
  private config: ScoringConfig;
  
  constructor(config: Partial<ScoringConfig> = {}) {
    this.config = { ...DEFAULT_SCORING_CONFIG, ...config };
  }
  
  /**
   * Calculate total score for a move
   */
  calculateMoveScore(
    board: Board,
    placements: TilePlacement[],
    wordsFormed: WordFormed[]
  ): MoveScore {
    const wordScores: WordScore[] = [];
    let totalScore = 0;
    
    // Calculate score for each word
    for (const wordFormed of wordsFormed) {
      const wordScore = this.calculateWordScore(board, wordFormed, placements);
      wordScores.push(wordScore);
      totalScore += wordScore.finalWordScore;
    }
    
    // Apply bingo bonus if all 7 tiles were used
    const bingoBonus = placements.length === 7 ? this.config.bingoBonus : 0;
    totalScore += bingoBonus;
    
    // Create detailed breakdown
    const breakdown = this.createScoreBreakdown(wordScores, bingoBonus);
    
    return {
      totalScore,
      wordScores,
      bingoBonus,
      breakdown,
      tilesUsed: placements.length,
      newWordsFormed: wordsFormed.length
    };
  }
  
  /**
   * Calculate score for a single word
   */
  private calculateWordScore(
    board: Board,
    wordFormed: WordFormed,
    placements: TilePlacement[]
  ): WordScore {
    const tileScores: TileScore[] = [];
    let baseScore = 0;
    let wordMultiplier = 1;
    
    // Create set of newly placed positions for quick lookup
    const newPositions = new Set(
      placements.map(p => `${p.position.row},${p.position.col}`)
    );
    
    // Calculate score for each tile in the word
    for (const position of wordFormed.positions) {
      const cell = board[position.row][position.col];
      if (!cell || !cell.tile) continue;
      
      const tile = cell.tile;
      const isNewTile = newPositions.has(`${position.row},${position.col}`);
      
      // Get base points for the tile
      const basePoints = tile.isBlank ? 0 : tile.points;
      
      // Apply premium squares only for newly placed tiles
      let letterMultiplier = 1;
      let tileWordMultiplier = 1;
      
      if (isNewTile && this.config.applyPremiumSquares) {
        const premiumType = cell.premiumType;
        
        switch (premiumType) {
          case 'DL': // Double Letter
            letterMultiplier = 2;
            break;
          case 'TL': // Triple Letter
            letterMultiplier = 3;
            break;
          case 'DW': // Double Word
          case 'center': // Center star (double word for first move)
            tileWordMultiplier = 2;
            break;
          case 'TW': // Triple Word
            tileWordMultiplier = 3;
            break;
        }
      }
      
      const totalTilePoints = basePoints * letterMultiplier;
      baseScore += totalTilePoints;
      wordMultiplier *= tileWordMultiplier;
      
      tileScores.push({
        tile,
        position,
        basePoints,
        letterMultiplier,
        totalTilePoints
      });
    }
    
    const finalWordScore = baseScore * wordMultiplier;
    
    return {
      word: wordFormed.word,
      positions: wordFormed.positions,
      tileScores,
      baseScore,
      wordMultiplier,
      finalWordScore,
      isMainWord: wordFormed.isMainWord,
      newTilesOnly: tileScores.every(ts => 
        newPositions.has(`${ts.position.row},${ts.position.col}`)
      )
    };
  }
  
  /**
   * Create detailed score breakdown
   */
  private createScoreBreakdown(wordScores: WordScore[], bingoBonus: number): ScoreBreakdown {
    let baseScore = 0;
    let letterMultipliers = 0;
    let wordMultipliers = 0;
    const breakdown: { description: string; points: number }[] = [];
    
    // Process each word
    for (const wordScore of wordScores) {
      const baseWordPoints = wordScore.tileScores.reduce((sum, ts) => sum + ts.basePoints, 0);
      const letterBonusPoints = wordScore.tileScores.reduce(
        (sum, ts) => sum + (ts.basePoints * (ts.letterMultiplier - 1)), 0
      );
      const wordBonusPoints = wordScore.baseScore * (wordScore.wordMultiplier - 1);
      
      baseScore += baseWordPoints;
      letterMultipliers += letterBonusPoints;
      wordMultipliers += wordBonusPoints;
      
      breakdown.push({
        description: `"${wordScore.word}" (${wordScore.positions.length} letters)`,
        points: wordScore.finalWordScore
      });
      
      // Add details for significant bonuses
      if (letterBonusPoints > 0) {
        breakdown.push({
          description: `  Letter multipliers`,
          points: letterBonusPoints
        });
      }
      
      if (wordBonusPoints > 0) {
        breakdown.push({
          description: `  Word multiplier (×${wordScore.wordMultiplier})`,
          points: wordBonusPoints
        });
      }
    }
    
    // Add bingo bonus
    if (bingoBonus > 0) {
      breakdown.push({
        description: 'Bingo bonus (7 tiles)',
        points: bingoBonus
      });
    }
    
    const total = baseScore + letterMultipliers + wordMultipliers + bingoBonus;
    
    return {
      baseScore,
      letterMultipliers,
      wordMultipliers,
      bonuses: bingoBonus,
      total,
      breakdown
    };
  }
  
  /**
   * Calculate end-game scoring adjustments
   */
  calculateEndGameScoring(playerTiles: Record<string, Tile[]>): EndGameScore[] {
    if (!this.config.endGamePenalty) {
      return Object.keys(playerTiles).map(playerId => ({
        playerId,
        tilesRemaining: playerTiles[playerId] || [],
        penalty: 0,
        bonusFromOthers: 0,
        netAdjustment: 0
      }));
    }
    
    const endGameScores: EndGameScore[] = [];
    let totalPenalties = 0;
    
    // Calculate penalties for remaining tiles
    for (const [playerId, tiles] of Object.entries(playerTiles)) {
      const penalty = this.calculateTilePenalty(tiles);
      totalPenalties += penalty;
      
      endGameScores.push({
        playerId,
        tilesRemaining: tiles,
        penalty,
        bonusFromOthers: 0,
        netAdjustment: -penalty
      });
    }
    
    // Find player(s) who went out (no remaining tiles)
    const playersWhoWentOut = endGameScores.filter(score => score.tilesRemaining.length === 0);
    
    if (playersWhoWentOut.length > 0) {
      // Distribute total penalties among players who went out
      const bonusPerPlayer = Math.floor(totalPenalties / playersWhoWentOut.length);
      const remainder = totalPenalties % playersWhoWentOut.length;
      
      playersWhoWentOut.forEach((score, index) => {
        const bonus = bonusPerPlayer + (index < remainder ? 1 : 0);
        score.bonusFromOthers = bonus;
        score.netAdjustment = bonus; // No penalty since they went out
      });
    }
    
    return endGameScores;
  }
  
  /**
   * Calculate penalty for remaining tiles
   */
  private calculateTilePenalty(tiles: Tile[]): number {
    return tiles.reduce((penalty, tile) => {
      return penalty + (tile.isBlank ? 0 : tile.points);
    }, 0);
  }
  
  /**
   * Get tile points (considering blank tiles)
   */
  getTilePoints(tile: Tile): number {
    return tile.isBlank ? 0 : tile.points;
  }
  
  /**
   * Calculate potential score for a placement (for move suggestions)
   */
  calculatePotentialScore(
    board: Board,
    placements: TilePlacement[],
    wordsFormed: WordFormed[]
  ): MoveScore {
    return this.calculateMoveScore(board, placements, wordsFormed);
  }
  
  /**
   * Get premium square multiplier value
   */
  getPremiumSquareValue(premiumType: PremiumSquareType): { letter: number; word: number } {
    switch (premiumType) {
      case 'DL':
        return { letter: 2, word: 1 };
      case 'TL':
        return { letter: 3, word: 1 };
      case 'DW':
      case 'center':
        return { letter: 1, word: 2 };
      case 'TW':
        return { letter: 1, word: 3 };
      default:
        return { letter: 1, word: 1 };
    }
  }
  
  /**
   * Calculate theoretical maximum score for given tiles
   */
  calculateMaximumPossibleScore(tiles: Tile[]): number {
    // Theoretical maximum assuming best premium squares and longest word
    const basePoints = tiles.reduce((sum, tile) => sum + this.getTilePoints(tile), 0);
    
    // Assume triple word score and some letter multipliers
    const estimatedMultiplier = 3; // Conservative estimate
    const bingoBonus = tiles.length === 7 ? this.config.bingoBonus : 0;
    
    return (basePoints * estimatedMultiplier) + bingoBonus;
  }
  
  /**
   * Calculate average points per tile
   */
  calculateAveragePointsPerTile(tiles: Tile[]): number {
    if (tiles.length === 0) return 0;
    
    const totalPoints = tiles.reduce((sum, tile) => sum + this.getTilePoints(tile), 0);
    return totalPoints / tiles.length;
  }
  
  /**
   * Update scoring configuration
   */
  updateConfig(config: Partial<ScoringConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current scoring configuration
   */
  getConfig(): ScoringConfig {
    return { ...this.config };
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Calculate total value of tiles
 */
export function calculateTileValue(tiles: Tile[]): number {
  return tiles.reduce((total, tile) => total + (tile.isBlank ? 0 : tile.points), 0);
}

/**
 * Find highest scoring word from a list
 */
export function findHighestScoringWord(wordScores: WordScore[]): WordScore | null {
  if (wordScores.length === 0) return null;
  
  return wordScores.reduce((highest, current) => 
    current.finalWordScore > highest.finalWordScore ? current : highest
  );
}

/**
 * Calculate score per tile for efficiency comparison
 */
export function calculateScorePerTile(moveScore: MoveScore): number {
  return moveScore.tilesUsed > 0 ? moveScore.totalScore / moveScore.tilesUsed : 0;
}

/**
 * Check if move qualifies for bingo bonus
 */
export function isBingoMove(placements: TilePlacement[]): boolean {
  return placements.length === 7;
}

/**
 * Format score breakdown for display
 */
export function formatScoreBreakdown(breakdown: ScoreBreakdown): string {
  let result = `Total Score: ${breakdown.total}\n\n`;
  
  result += 'Breakdown:\n';
  breakdown.breakdown.forEach(item => {
    result += `${item.description}: ${item.points >= 0 ? '+' : ''}${item.points}\n`;
  });
  
  if (breakdown.letterMultipliers > 0) {
    result += `\nLetter Multipliers: +${breakdown.letterMultipliers}\n`;
  }
  
  if (breakdown.wordMultipliers > 0) {
    result += `Word Multipliers: +${breakdown.wordMultipliers}\n`;
  }
  
  if (breakdown.bonuses > 0) {
    result += `Bonuses: +${breakdown.bonuses}\n`;
  }
  
  return result;
}

/**
 * Compare two moves by score
 */
export function compareMovesByScore(move1: MoveScore, move2: MoveScore): number {
  return move2.totalScore - move1.totalScore; // Higher score first
}

/**
 * Get score statistics for a list of moves
 */
export function getScoreStatistics(moveScores: MoveScore[]): {
  total: number;
  average: number;
  highest: number;
  lowest: number;
  bingoMoves: number;
} {
  if (moveScores.length === 0) {
    return { total: 0, average: 0, highest: 0, lowest: 0, bingoMoves: 0 };
  }
  
  const scores = moveScores.map(m => m.totalScore);
  const total = scores.reduce((sum, score) => sum + score, 0);
  const average = total / scores.length;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  const bingoMoves = moveScores.filter(m => m.bingoBonus > 0).length;
  
  return { total, average, highest, lowest, bingoMoves };
}

// ================================
// Factory Functions
// ================================

/**
 * Create a score calculator with default configuration
 */
export function createScoreCalculator(config?: Partial<ScoringConfig>): ScoreCalculator {
  return new ScoreCalculator(config);
}

/**
 * Create a score calculator for practice mode (no premium squares)
 */
export function createPracticeScoreCalculator(): ScoreCalculator {
  return new ScoreCalculator({
    bingoBonus: 50,
    applyPremiumSquares: false,
    endGamePenalty: false,
    minimumWordLength: 1
  });
}

/**
 * Create a tournament score calculator (strict rules)
 */
export function createTournamentScoreCalculator(): ScoreCalculator {
  return new ScoreCalculator({
    bingoBonus: 50,
    applyPremiumSquares: true,
    endGamePenalty: true,
    minimumWordLength: 2
  });
}

// ================================
// Default Export
// ================================

export default ScoreCalculator; 