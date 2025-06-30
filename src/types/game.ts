// ================================
// Core Game Types
// ================================

export type GamePhase = 'setup' | 'playing' | 'finished';
export type GameMode = 'local' | 'lan';
export type TileStatus = 'bag' | 'rack' | 'board' | 'played';
export type PlayerStatus = 'waiting' | 'active' | 'passed' | 'finished';

// ================================
// Tile System
// ================================

export interface Tile {
  id: string;
  letter: string;
  points: number;
  status: TileStatus;
  playerId?: string;
  position?: BoardPosition;
  isBlank?: boolean; // For blank tiles that can represent any letter
  assignedLetter?: string; // The letter assigned to a blank tile
}

export interface TileBag {
  tiles: Tile[];
  remaining: number;
}

// ================================
// Board System
// ================================

export interface BoardPosition {
  row: number;
  col: number;
}

export type PremiumSquareType = 'normal' | 'DL' | 'TL' | 'DW' | 'TW' | 'center';

export interface BoardCell {
  position: BoardPosition;
  tile?: Tile;
  premiumType: PremiumSquareType;
  isCenter: boolean;
  isEmpty: boolean;
}

export type Board = BoardCell[][];

// ================================
// Player System
// ================================

export interface Player {
  id: string;
  name: string;
  score: number;
  rack: Tile[];
  status: PlayerStatus;
  isHost?: boolean; // For multiplayer games
  consecutivePasses: number;
  timeRemaining?: number; // For timed games
}

// ================================
// Move System
// ================================

export interface TilePlacement {
  tile: Tile;
  position: BoardPosition;
  wasBlank?: boolean;
  assignedLetter?: string;
}

export interface WordFormed {
  word: string;
  positions: BoardPosition[];
  score: number;
  isMainWord: boolean; // True for the primary word, false for cross-words
}

export interface Move {
  id: string;
  playerId: string;
  type: 'place' | 'pass' | 'exchange';
  timestamp: Date;
  placements?: TilePlacement[];
  wordsFormed?: WordFormed[];
  score: number;
  exchangedTiles?: Tile[];
  isValid: boolean;
  validationErrors?: string[];
}

export interface MoveValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  wordsFormed: WordFormed[];
}

// ================================
// Game State
// ================================

export interface GameState {
  id: string;
  mode: GameMode;
  phase: GamePhase;
  board: Board;
  players: Player[];
  currentPlayerIndex: number;
  tileBag: TileBag;
  moveHistory: Move[];
  gameSettings: GameSettings;
  createdAt: Date;
  updatedAt: Date;
  
  // LAN Multiplayer specific
  roomId?: string;
  hostPlayerId?: string;
}

export interface GameSettings {
  maxPlayers: number;
  timePerTurn?: number; // in seconds
  totalGameTime?: number; // in seconds
  allowExchanges: boolean;
  dictionary: 'standard' | 'tournament' | 'custom';
  customDictionaryUrl?: string;
}

// ================================
// LAN Multiplayer Types
// ================================

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  players: NetworkPlayer[];
  maxPlayers: number;
  gameState?: GameState;
  isPrivate: boolean;
  password?: string;
  createdAt: Date;
  status: 'waiting' | 'playing' | 'finished';
}

export interface NetworkPlayer extends Player {
  connectionId: string;
  isConnected: boolean;
  lastActivity: Date;
  isHost: boolean;
  ping?: number;
}

// ================================
// Network Messages
// ================================

export type NetworkMessageType =
  | 'join-room'
  | 'leave-room'
  | 'player-joined'
  | 'player-left'
  | 'game-started'
  | 'move-made'
  | 'turn-changed'
  | 'game-ended'
  | 'sync-state'
  | 'error';

export interface NetworkMessage {
  type: NetworkMessageType;
  payload: any;
  timestamp: Date;
  fromPlayerId?: string;
  toPlayerId?: string; // For direct messages
}

// ================================
// Utility Types
// ================================

export interface GameStats {
  totalGames: number;
  wins: number;
  averageScore: number;
  bestWord: {
    word: string;
    score: number;
    game: string;
  };
  totalWordsPlayed: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  letterMultipliers: number;
  wordMultipliers: number;
  bonuses: number;
  total: number;
  breakdown: {
    description: string;
    points: number;
  }[];
}

// ================================
// Constants
// ================================

export const BOARD_SIZE = 15;
export const RACK_SIZE = 7;
export const TOTAL_TILES = 100;
export const BINGO_BONUS = 50; // Bonus for using all 7 tiles

// Premium square positions (0-indexed)
export const PREMIUM_SQUARES = {
  DL: [
    [0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14],
    [6, 2], [6, 6], [6, 8], [6, 12], [7, 3], [7, 11], [8, 2],
    [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14], [12, 6],
    [12, 8], [14, 3], [14, 11]
  ],
  TL: [
    [1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13], [9, 1],
    [9, 5], [9, 9], [9, 13], [13, 5], [13, 9]
  ],
  DW: [
    [1, 1], [1, 13], [2, 2], [2, 12], [3, 3], [3, 11], [4, 4],
    [4, 10], [10, 4], [10, 10], [11, 3], [11, 11], [12, 2],
    [12, 12], [13, 1], [13, 13]
  ],
  TW: [
    [0, 0], [0, 7], [0, 14], [7, 0], [7, 14], [14, 0], [14, 7], [14, 14]
  ],
  CENTER: [[7, 7]]
} as const; 