// ================================
// Score Calculator Tests
// ================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ScoreCalculator,
  createScoreCalculator,
  createPracticeScoreCalculator,
  createTournamentScoreCalculator,
  calculateTileValue,
  findHighestScoringWord,
  calculateScorePerTile,
  isBingoMove,
  formatScoreBreakdown,
  compareMovesByScore,
  getScoreStatistics,
  DEFAULT_SCORING_CONFIG
} from './scoreCalculator';
import { createEmptyBoard } from '../data/board';
import { createTile } from '../data/tiles';
import type { 
  Board, 
  TilePlacement, 
  WordFormed, 
  Tile,
  BoardPosition 
} from '../types/game';

describe('Score Calculator', () => {
  let calculator: ScoreCalculator;
  let board: Board;

  beforeEach(() => {
    calculator = new ScoreCalculator();
    board = createEmptyBoard();
  });

  describe('Constructor and Configuration', () => {
    it('should create calculator with default config', () => {
      const config = calculator.getConfig();
      expect(config).toEqual(DEFAULT_SCORING_CONFIG);
    });

    it('should create calculator with custom config', () => {
      const customConfig = {
        bingoBonus: 75,
        applyPremiumSquares: false
      };
      
      const customCalculator = new ScoreCalculator(customConfig);
      const config = customCalculator.getConfig();
      
      expect(config.bingoBonus).toBe(75);
      expect(config.applyPremiumSquares).toBe(false);
      expect(config.endGamePenalty).toBe(true); // Default value
    });

    it('should update configuration', () => {
      calculator.updateConfig({ bingoBonus: 100 });
      const config = calculator.getConfig();
      
      expect(config.bingoBonus).toBe(100);
    });
  });

  describe('Basic Scoring', () => {
    it('should calculate simple word score', () => {
      const placements: TilePlacement[] = [
        {
          tile: createTile('C'), // 3 points
          position: { row: 7, col: 7 }
        },
        {
          tile: createTile('A'), // 1 point
          position: { row: 7, col: 8 }
        },
        {
          tile: createTile('T'), // 1 point
          position: { row: 7, col: 9 }
        }
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'CAT',
        positions: [
          { row: 7, col: 7 },
          { row: 7, col: 8 },
          { row: 7, col: 9 }
        ],
        score: 0, // Will be calculated
        isMainWord: true
      }];

      // Place tiles on board for calculation
      board[7][7].tile = placements[0].tile;
      board[7][7].isEmpty = false;
      board[7][8].tile = placements[1].tile;
      board[7][8].isEmpty = false;
      board[7][9].tile = placements[2].tile;
      board[7][9].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.totalScore).toBe(10); // 3+1+1 = 5, center star doubles word = 10
      expect(moveScore.wordScores).toHaveLength(1);
      expect(moveScore.wordScores[0].finalWordScore).toBe(10);
      expect(moveScore.bingoBonus).toBe(0);
      expect(moveScore.tilesUsed).toBe(3);
    });

    it('should calculate score without premium squares', () => {
      calculator.updateConfig({ applyPremiumSquares: false });

      const placements: TilePlacement[] = [{
        tile: createTile('C'), // 3 points
        position: { row: 7, col: 7 } // Center star, but premium squares disabled
      }];

      const wordsFormed: WordFormed[] = [{
        word: 'C',
        positions: [{ row: 7, col: 7 }],
        score: 0,
        isMainWord: true
      }];

      board[7][7].tile = placements[0].tile;
      board[7][7].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.totalScore).toBe(3); // No word multiplier applied
    });
  });

  describe('Premium Square Scoring', () => {
    it('should apply double letter score', () => {
      const placements: TilePlacement[] = [{
        tile: createTile('Q'), // 10 points
        position: { row: 0, col: 3 } // Double letter square
      }];

      const wordsFormed: WordFormed[] = [{
        word: 'Q',
        positions: [{ row: 0, col: 3 }],
        score: 0,
        isMainWord: true
      }];

      board[0][3].tile = placements[0].tile;
      board[0][3].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.totalScore).toBe(20); // 10 points × 2 (DL)
    });

    it('should apply triple letter score', () => {
      const placements: TilePlacement[] = [{
        tile: createTile('Z'), // 10 points
        position: { row: 1, col: 5 } // Triple letter square
      }];

      const wordsFormed: WordFormed[] = [{
        word: 'Z',
        positions: [{ row: 1, col: 5 }],
        score: 0,
        isMainWord: true
      }];

      board[1][5].tile = placements[0].tile;
      board[1][5].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.totalScore).toBe(30); // 10 points × 3 (TL)
    });

    it('should apply double word score', () => {
      const placements: TilePlacement[] = [
        {
          tile: createTile('C'), // 3 points
          position: { row: 1, col: 1 } // Double word square
        },
        {
          tile: createTile('A'), // 1 point
          position: { row: 1, col: 2 }
        }
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'CA',
        positions: [
          { row: 1, col: 1 },
          { row: 1, col: 2 }
        ],
        score: 0,
        isMainWord: true
      }];

      board[1][1].tile = placements[0].tile;
      board[1][1].isEmpty = false;
      board[1][2].tile = placements[1].tile;
      board[1][2].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.totalScore).toBe(8); // (3+1) × 2 (DW)
    });

    it('should apply triple word score', () => {
      const placements: TilePlacement[] = [
        {
          tile: createTile('C'), // 3 points
          position: { row: 0, col: 0 } // Triple word square
        },
        {
          tile: createTile('A'), // 1 point
          position: { row: 0, col: 1 }
        }
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'CA',
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 }
        ],
        score: 0,
        isMainWord: true
      }];

      board[0][0].tile = placements[0].tile;
      board[0][0].isEmpty = false;
      board[0][1].tile = placements[1].tile;
      board[0][1].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.totalScore).toBe(12); // (3+1) × 3 (TW)
    });

    it('should apply multiple premium squares in one word', () => {
      const placements: TilePlacement[] = [
        {
          tile: createTile('Q'), // 10 points
          position: { row: 0, col: 3 } // Double letter
        },
        {
          tile: createTile('U'), // 1 point
          position: { row: 0, col: 4 }
        },
        {
          tile: createTile('I'), // 1 point
          position: { row: 0, col: 5 }
        },
        {
          tile: createTile('T'), // 1 point
          position: { row: 0, col: 6 }
        },
        {
          tile: createTile('E'), // 1 point
          position: { row: 0, col: 7 } // Triple word
        }
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'QUITE',
        positions: [
          { row: 0, col: 3 },
          { row: 0, col: 4 },
          { row: 0, col: 5 },
          { row: 0, col: 6 },
          { row: 0, col: 7 }
        ],
        score: 0,
        isMainWord: true
      }];

      // Place tiles on board
      placements.forEach((placement, index) => {
        const { row, col } = placement.position;
        board[row][col].tile = placement.tile;
        board[row][col].isEmpty = false;
      });

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      // Q(20 DL) + U(1) + I(1) + T(1) + E(1) = 24, × 3 (TW) = 72
      expect(moveScore.totalScore).toBe(72);
    });

    it('should not apply premium squares to existing tiles', () => {
      // Place existing tile on premium square
      const existingTile = createTile('T');
      board[0][0].tile = existingTile; // Triple word square
      board[0][0].isEmpty = false;

      const placements: TilePlacement[] = [{
        tile: createTile('A'), // 1 point
        position: { row: 0, col: 1 }
      }];

      const wordsFormed: WordFormed[] = [{
        word: 'TA',
        positions: [
          { row: 0, col: 0 }, // Existing tile on TW
          { row: 0, col: 1 }  // New tile
        ],
        score: 0,
        isMainWord: true
      }];

      board[0][1].tile = placements[0].tile;
      board[0][1].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.totalScore).toBe(2); // T(1) + A(1) = 2, no premium multipliers
    });
  });

  describe('Bingo Bonus', () => {
    it('should apply bingo bonus for 7 tiles', () => {
      const placements: TilePlacement[] = [
        { tile: createTile('P'), position: { row: 7, col: 5 } },
        { tile: createTile('L'), position: { row: 7, col: 6 } },
        { tile: createTile('A'), position: { row: 7, col: 7 } },
        { tile: createTile('Y'), position: { row: 7, col: 8 } },
        { tile: createTile('I'), position: { row: 7, col: 9 } },
        { tile: createTile('N'), position: { row: 7, col: 10 } },
        { tile: createTile('G'), position: { row: 7, col: 11 } }
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'PLAYING',
        positions: placements.map(p => p.position),
        score: 0,
        isMainWord: true
      }];

      // Place tiles on board
      placements.forEach(placement => {
        const { row, col } = placement.position;
        board[row][col].tile = placement.tile;
        board[row][col].isEmpty = false;
      });

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.bingoBonus).toBe(50);
      expect(moveScore.totalScore).toBeGreaterThan(50); // Base score + bingo bonus
    });

    it('should not apply bingo bonus for fewer than 7 tiles', () => {
      const placements: TilePlacement[] = [
        { tile: createTile('C'), position: { row: 7, col: 7 } },
        { tile: createTile('A'), position: { row: 7, col: 8 } },
        { tile: createTile('T'), position: { row: 7, col: 9 } }
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'CAT',
        positions: placements.map(p => p.position),
        score: 0,
        isMainWord: true
      }];

      placements.forEach(placement => {
        const { row, col } = placement.position;
        board[row][col].tile = placement.tile;
        board[row][col].isEmpty = false;
      });

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.bingoBonus).toBe(0);
    });

    it('should use custom bingo bonus', () => {
      calculator.updateConfig({ bingoBonus: 75 });

      const placements: TilePlacement[] = Array.from({ length: 7 }, (_, i) => ({
        tile: createTile('A'),
        position: { row: 7, col: i }
      }));

      const wordsFormed: WordFormed[] = [{
        word: 'AAAAAAA',
        positions: placements.map(p => p.position),
        score: 0,
        isMainWord: true
      }];

      placements.forEach(placement => {
        const { row, col } = placement.position;
        board[row][col].tile = placement.tile;
        board[row][col].isEmpty = false;
      });

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.bingoBonus).toBe(75);
    });
  });

  describe('Multiple Words Scoring', () => {
    it('should score multiple words formed in one move', () => {
      // Set up existing word "CAT" horizontally
      board[7][7].tile = createTile('C');
      board[7][7].isEmpty = false;
      board[7][8].tile = createTile('A');
      board[7][8].isEmpty = false;
      board[7][9].tile = createTile('T');
      board[7][9].isEmpty = false;

      // Place "DOG" vertically intersecting at 'A'
      const placements: TilePlacement[] = [
        { tile: createTile('D'), position: { row: 6, col: 8 } },
        { tile: createTile('G'), position: { row: 8, col: 8 } }
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'DOG',
        positions: [
          { row: 6, col: 8 },
          { row: 7, col: 8 }, // Existing 'A'
          { row: 8, col: 8 }
        ],
        score: 0,
        isMainWord: true
      }];

      placements.forEach(placement => {
        const { row, col } = placement.position;
        board[row][col].tile = placement.tile;
        board[row][col].isEmpty = false;
      });

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.wordScores).toHaveLength(1);
      expect(moveScore.wordScores[0].word).toBe('DOG');
      expect(moveScore.totalScore).toBeGreaterThan(0);
    });
  });

  describe('Blank Tile Scoring', () => {
    it('should score blank tiles as 0 points', () => {
      const blankTile: Tile = {
        id: 'blank1',
        letter: '',
        points: 0,
        status: 'board',
        isBlank: true
      };

      const placements: TilePlacement[] = [
        { tile: blankTile, position: { row: 7, col: 7 }, assignedLetter: 'A' },
        { tile: createTile('T'), position: { row: 7, col: 8 } }
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'AT',
        positions: [
          { row: 7, col: 7 },
          { row: 7, col: 8 }
        ],
        score: 0,
        isMainWord: true
      }];

      // Place actual assigned letter on board for scoring
      board[7][7].tile = { ...blankTile, letter: 'A' };
      board[7][7].isEmpty = false;
      board[7][8].tile = placements[1].tile;
      board[7][8].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      // 0 (blank) + 1 (T) = 1, center star doubles = 2
      expect(moveScore.totalScore).toBe(2);
    });

    it('should apply premium squares to blank tiles normally', () => {
      const blankTile: Tile = {
        id: 'blank1',
        letter: '',
        points: 0,
        status: 'board',
        isBlank: true
      };

      const placements: TilePlacement[] = [{
        tile: blankTile,
        position: { row: 0, col: 3 }, // Double letter square
        assignedLetter: 'Q'
      }];

      const wordsFormed: WordFormed[] = [{
        word: 'Q',
        positions: [{ row: 0, col: 3 }],
        score: 0,
        isMainWord: true
      }];

      board[0][3].tile = { ...blankTile, letter: 'Q' };
      board[0][3].isEmpty = false;

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.totalScore).toBe(0); // 0 points × 2 (DL) = 0
    });
  });

  describe('End Game Scoring', () => {
    it('should calculate end game penalties', () => {
      const playerTiles: Record<string, Tile[]> = {
        'player1': [], // Went out
        'player2': [createTile('A'), createTile('T')], // 2 points remaining
        'player3': [createTile('Q'), createTile('Z')]  // 20 points remaining
      };

      const endGameScores = calculator.calculateEndGameScoring(playerTiles);

      expect(endGameScores).toHaveLength(3);
      
      const player1Score = endGameScores.find(s => s.playerId === 'player1')!;
      expect(player1Score.penalty).toBe(0);
      expect(player1Score.bonusFromOthers).toBe(22); // 2 + 20
      expect(player1Score.netAdjustment).toBe(22);

      const player2Score = endGameScores.find(s => s.playerId === 'player2')!;
      expect(player2Score.penalty).toBe(2);
      expect(player2Score.bonusFromOthers).toBe(0);
      expect(player2Score.netAdjustment).toBe(-2);

      const player3Score = endGameScores.find(s => s.playerId === 'player3')!;
      expect(player3Score.penalty).toBe(20);
      expect(player3Score.bonusFromOthers).toBe(0);
      expect(player3Score.netAdjustment).toBe(-20);
    });

    it('should handle multiple players going out', () => {
      const playerTiles: Record<string, Tile[]> = {
        'player1': [], // Went out
        'player2': [], // Also went out
        'player3': [createTile('Q')] // 10 points remaining
      };

      const endGameScores = calculator.calculateEndGameScoring(playerTiles);

      const player1Score = endGameScores.find(s => s.playerId === 'player1')!;
      const player2Score = endGameScores.find(s => s.playerId === 'player2')!;
      
      expect(player1Score.bonusFromOthers).toBe(5); // 10 / 2
      expect(player2Score.bonusFromOthers).toBe(5); // 10 / 2
    });

    it('should skip end game penalties when disabled', () => {
      calculator.updateConfig({ endGamePenalty: false });

      const playerTiles: Record<string, Tile[]> = {
        'player1': [],
        'player2': [createTile('Q')]
      };

      const endGameScores = calculator.calculateEndGameScoring(playerTiles);

      endGameScores.forEach(score => {
        expect(score.penalty).toBe(0);
        expect(score.bonusFromOthers).toBe(0);
        expect(score.netAdjustment).toBe(0);
      });
    });
  });

  describe('Score Breakdown', () => {
    it('should create detailed score breakdown', () => {
      const placements: TilePlacement[] = [
        { tile: createTile('Q'), position: { row: 0, col: 3 } }, // DL: 20 points
        { tile: createTile('U'), position: { row: 0, col: 4 } }, // 1 point
        { tile: createTile('I'), position: { row: 0, col: 5 } }, // 1 point
        { tile: createTile('T'), position: { row: 0, col: 6 } }, // 1 point
        { tile: createTile('E'), position: { row: 0, col: 7 } }  // TW: triple word
      ];

      const wordsFormed: WordFormed[] = [{
        word: 'QUITE',
        positions: placements.map(p => p.position),
        score: 0,
        isMainWord: true
      }];

      placements.forEach(placement => {
        const { row, col } = placement.position;
        board[row][col].tile = placement.tile;
        board[row][col].isEmpty = false;
      });

      const moveScore = calculator.calculateMoveScore(board, placements, wordsFormed);

      expect(moveScore.breakdown.baseScore).toBeGreaterThan(0);
      expect(moveScore.breakdown.letterMultipliers).toBeGreaterThan(0);
      expect(moveScore.breakdown.wordMultipliers).toBeGreaterThan(0);
      expect(moveScore.breakdown.breakdown).toHaveLength(3); // Word + letter mult + word mult
    });
  });

  describe('Utility Methods', () => {
    it('should get tile points correctly', () => {
      const normalTile = createTile('Q');
      const blankTile: Tile = {
        id: 'blank1',
        letter: '',
        points: 0,
        status: 'rack',
        isBlank: true
      };

      expect(calculator.getTilePoints(normalTile)).toBe(10);
      expect(calculator.getTilePoints(blankTile)).toBe(0);
    });

    it('should get premium square values', () => {
      expect(calculator.getPremiumSquareValue('DL')).toEqual({ letter: 2, word: 1 });
      expect(calculator.getPremiumSquareValue('TL')).toEqual({ letter: 3, word: 1 });
      expect(calculator.getPremiumSquareValue('DW')).toEqual({ letter: 1, word: 2 });
      expect(calculator.getPremiumSquareValue('TW')).toEqual({ letter: 1, word: 3 });
      expect(calculator.getPremiumSquareValue('center')).toEqual({ letter: 1, word: 2 });
      expect(calculator.getPremiumSquareValue('normal')).toEqual({ letter: 1, word: 1 });
    });

    it('should calculate maximum possible score', () => {
      const tiles = [
        createTile('Q'),
        createTile('Z'),
        createTile('X'),
        createTile('J')
      ];

      const maxScore = calculator.calculateMaximumPossibleScore(tiles);
      expect(maxScore).toBeGreaterThan(0);
    });

    it('should calculate average points per tile', () => {
      const tiles = [
        createTile('A'), // 1 point
        createTile('E'), // 1 point
        createTile('Q')  // 10 points
      ];

      const average = calculator.calculateAveragePointsPerTile(tiles);
      expect(average).toBe(4); // (1 + 1 + 10) / 3
    });

    it('should handle empty tile list for average', () => {
      const average = calculator.calculateAveragePointsPerTile([]);
      expect(average).toBe(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('Tile Value Calculation', () => {
    it('should calculate total tile value', () => {
      const tiles = [
        createTile('A'), // 1 point
        createTile('Q'), // 10 points
        {
          id: 'blank1',
          letter: '',
          points: 0,
          status: 'rack',
          isBlank: true
        } // 0 points
      ];

      expect(calculateTileValue(tiles)).toBe(11);
    });
  });

  describe('Score Analysis', () => {
    it('should find highest scoring word', () => {
      const wordScores = [
        {
          word: 'CAT',
          positions: [],
          tileScores: [],
          baseScore: 5,
          wordMultiplier: 1,
          finalWordScore: 5,
          isMainWord: true,
          newTilesOnly: true
        },
        {
          word: 'QUIZ',
          positions: [],
          tileScores: [],
          baseScore: 22,
          wordMultiplier: 2,
          finalWordScore: 44,
          isMainWord: true,
          newTilesOnly: true
        },
        {
          word: 'GO',
          positions: [],
          tileScores: [],
          baseScore: 3,
          wordMultiplier: 1,
          finalWordScore: 3,
          isMainWord: false,
          newTilesOnly: false
        }
      ];

      const highest = findHighestScoringWord(wordScores);
      expect(highest).toBeTruthy();
      expect(highest!.word).toBe('QUIZ');
      expect(highest!.finalWordScore).toBe(44);
    });

    it('should handle empty word list', () => {
      const highest = findHighestScoringWord([]);
      expect(highest).toBeNull();
    });

    it('should calculate score per tile', () => {
      const moveScore = {
        totalScore: 50,
        wordScores: [],
        bingoBonus: 0,
        breakdown: {
          baseScore: 0,
          letterMultipliers: 0,
          wordMultipliers: 0,
          bonuses: 0,
          total: 50,
          breakdown: []
        },
        tilesUsed: 5,
        newWordsFormed: 1
      };

      expect(calculateScorePerTile(moveScore)).toBe(10);
    });

    it('should handle zero tiles for score per tile', () => {
      const moveScore = {
        totalScore: 50,
        wordScores: [],
        bingoBonus: 0,
        breakdown: {
          baseScore: 0,
          letterMultipliers: 0,
          wordMultipliers: 0,
          bonuses: 0,
          total: 50,
          breakdown: []
        },
        tilesUsed: 0,
        newWordsFormed: 1
      };

      expect(calculateScorePerTile(moveScore)).toBe(0);
    });

    it('should identify bingo moves', () => {
      const bingoMove = Array.from({ length: 7 }, (_, i) => ({
        tile: createTile('A'),
        position: { row: 7, col: i }
      }));

      const normalMove = Array.from({ length: 3 }, (_, i) => ({
        tile: createTile('A'),
        position: { row: 7, col: i }
      }));

      expect(isBingoMove(bingoMove)).toBe(true);
      expect(isBingoMove(normalMove)).toBe(false);
    });
  });

  describe('Score Formatting', () => {
    it('should format score breakdown', () => {
      const breakdown = {
        baseScore: 15,
        letterMultipliers: 5,
        wordMultipliers: 10,
        bonuses: 50,
        total: 80,
        breakdown: [
          { description: 'QUIZ (4 letters)', points: 44 },
          { description: 'Letter multipliers', points: 5 },
          { description: 'Word multiplier (×2)', points: 10 },
          { description: 'Bingo bonus (7 tiles)', points: 50 }
        ]
      };

      const formatted = formatScoreBreakdown(breakdown);
      
      expect(formatted).toContain('Total Score: 80');
      expect(formatted).toContain('QUIZ (4 letters): +44');
      expect(formatted).toContain('Bingo bonus (7 tiles): +50');
      expect(formatted).toContain('Letter Multipliers: +5');
      expect(formatted).toContain('Word Multipliers: +10');
    });
  });

  describe('Score Comparison', () => {
    it('should compare moves by score', () => {
      const move1 = {
        totalScore: 20,
        wordScores: [],
        bingoBonus: 0,
        breakdown: {
          baseScore: 0,
          letterMultipliers: 0,
          wordMultipliers: 0,
          bonuses: 0,
          total: 20,
          breakdown: []
        },
        tilesUsed: 3,
        newWordsFormed: 1
      };

      const move2 = {
        totalScore: 35,
        wordScores: [],
        bingoBonus: 0,
        breakdown: {
          baseScore: 0,
          letterMultipliers: 0,
          wordMultipliers: 0,
          bonuses: 0,
          total: 35,
          breakdown: []
        },
        tilesUsed: 4,
        newWordsFormed: 1
      };

      expect(compareMovesByScore(move1, move2)).toBeGreaterThan(0); // move2 should come first
      expect(compareMovesByScore(move2, move1)).toBeLessThan(0);    // move1 should come second
    });

    it('should calculate score statistics', () => {
      const moveScores = [
        {
          totalScore: 15,
          wordScores: [],
          bingoBonus: 0,
          breakdown: { baseScore: 0, letterMultipliers: 0, wordMultipliers: 0, bonuses: 0, total: 15, breakdown: [] },
          tilesUsed: 3,
          newWordsFormed: 1
        },
        {
          totalScore: 75,
          wordScores: [],
          bingoBonus: 50,
          breakdown: { baseScore: 0, letterMultipliers: 0, wordMultipliers: 0, bonuses: 50, total: 75, breakdown: [] },
          tilesUsed: 7,
          newWordsFormed: 1
        },
        {
          totalScore: 30,
          wordScores: [],
          bingoBonus: 0,
          breakdown: { baseScore: 0, letterMultipliers: 0, wordMultipliers: 0, bonuses: 0, total: 30, breakdown: [] },
          tilesUsed: 4,
          newWordsFormed: 2
        }
      ];

      const stats = getScoreStatistics(moveScores);

      expect(stats.total).toBe(120);
      expect(stats.average).toBe(40);
      expect(stats.highest).toBe(75);
      expect(stats.lowest).toBe(15);
      expect(stats.bingoMoves).toBe(1);
    });

    it('should handle empty move list for statistics', () => {
      const stats = getScoreStatistics([]);
      
      expect(stats.total).toBe(0);
      expect(stats.average).toBe(0);
      expect(stats.highest).toBe(0);
      expect(stats.lowest).toBe(0);
      expect(stats.bingoMoves).toBe(0);
    });
  });
});

describe('Factory Functions', () => {
  it('should create default calculator', () => {
    const calculator = createScoreCalculator();
    const config = calculator.getConfig();
    
    expect(config).toEqual(DEFAULT_SCORING_CONFIG);
  });

  it('should create calculator with custom config', () => {
    const calculator = createScoreCalculator({ bingoBonus: 75 });
    const config = calculator.getConfig();
    
    expect(config.bingoBonus).toBe(75);
    expect(config.applyPremiumSquares).toBe(true); // Default
  });

  it('should create practice calculator', () => {
    const calculator = createPracticeScoreCalculator();
    const config = calculator.getConfig();
    
    expect(config.applyPremiumSquares).toBe(false);
    expect(config.endGamePenalty).toBe(false);
    expect(config.minimumWordLength).toBe(1);
  });

  it('should create tournament calculator', () => {
    const calculator = createTournamentScoreCalculator();
    const config = calculator.getConfig();
    
    expect(config.applyPremiumSquares).toBe(true);
    expect(config.endGamePenalty).toBe(true);
    expect(config.minimumWordLength).toBe(2);
    expect(config.bingoBonus).toBe(50);
  });
}); 