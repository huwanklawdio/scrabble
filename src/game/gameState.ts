// ================================
// Game State Management System
// ================================

import { createEmptyBoard, createBoardFromState } from '../data/board';
import { createTileBag, drawTiles as drawTilesFromArray } from '../data/tiles';
import { initializeDefaultDictionary, type ScrabbleDictionary } from '../data/dictionary';
import type {
  GameState,
  GamePhase,
  GameMode,
  GameSettings,
  Player,
  PlayerStatus,
  Board,
  BoardPosition,
  Move,
  TilePlacement,
  MoveValidation,
  WordFormed,
  Tile,
  TileBag
} from '../types/game';

// ================================
// Tile Bag Helper Functions
// ================================

/**
 * Create a TileBag from a tile array
 */
function createTileBagFromArray(tiles: Tile[]): TileBag {
  return {
    tiles: [...tiles],
    remaining: tiles.length
  };
}

/**
 * Draw tiles from a TileBag
 */
function drawTiles(tileBag: TileBag, count: number): Tile[] {
  const { drawnTiles, remainingBag } = drawTilesFromArray(tileBag.tiles, count);
  
  // Update the tile bag
  tileBag.tiles = remainingBag;
  tileBag.remaining = remainingBag.length;
  
  return drawnTiles;
}

// ================================
// Game State Events
// ================================

export type GameEventType =
  | 'game-created'
  | 'game-started'
  | 'player-added'
  | 'player-removed'
  | 'turn-changed'
  | 'move-made'
  | 'move-validated'
  | 'tiles-exchanged'
  | 'game-paused'
  | 'game-resumed'
  | 'game-ended'
  | 'error';

export interface GameEvent {
  type: GameEventType;
  timestamp: Date;
  gameId: string;
  playerId?: string;
  data?: any;
  message?: string;
}

export type GameEventListener = (event: GameEvent) => void;

// ================================
// Game Configuration
// ================================

export interface GameConfig {
  mode: GameMode;
  settings: Partial<GameSettings>;
  players?: Partial<Player>[];
  autoStart?: boolean;
  customDictionary?: ScrabbleDictionary;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 4,
  timePerTurn: 300, // 5 minutes
  totalGameTime: 3600, // 1 hour
  allowExchanges: true,
  dictionary: 'standard'
};

// ================================
// Player Management
// ================================

export class PlayerManager {
  private players: Map<string, Player> = new Map();
  
  /**
   * Create a new player
   */
  createPlayer(data: Partial<Player> & { name: string }): Player {
    const player: Player = {
      id: data.id || this.generatePlayerId(),
      name: data.name,
      score: data.score || 0,
      rack: data.rack || [],
      status: data.status || 'waiting',
      isHost: data.isHost || false,
      consecutivePasses: data.consecutivePasses || 0,
      timeRemaining: data.timeRemaining
    };
    
    this.players.set(player.id, player);
    return player;
  }
  
  /**
   * Add an existing player
   */
  addPlayer(player: Player): boolean {
    if (this.players.has(player.id)) {
      return false;
    }
    
    this.players.set(player.id, { ...player });
    return true;
  }
  
  /**
   * Remove a player
   */
  removePlayer(playerId: string): boolean {
    return this.players.delete(playerId);
  }
  
  /**
   * Get a player by ID
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }
  
  /**
   * Get all players
   */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }
  
  /**
   * Update player data
   */
  updatePlayer(playerId: string, updates: Partial<Player>): boolean {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }
    
    Object.assign(player, updates);
    this.players.set(playerId, player);
    return true;
  }
  
  /**
   * Set player status
   */
  setPlayerStatus(playerId: string, status: PlayerStatus): boolean {
    return this.updatePlayer(playerId, { status });
  }
  
  /**
   * Add score to player
   */
  addScore(playerId: string, points: number): boolean {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }
    
    return this.updatePlayer(playerId, { score: player.score + points });
  }
  
  /**
   * Deal tiles to player
   */
  dealTiles(playerId: string, tiles: Tile[]): boolean {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }
    
    const newRack = [...player.rack, ...tiles];
    return this.updatePlayer(playerId, { rack: newRack });
  }
  
  /**
   * Remove tiles from player rack
   */
  removeTiles(playerId: string, tileIds: string[]): Tile[] {
    const player = this.players.get(playerId);
    if (!player) {
      return [];
    }
    
    const removedTiles: Tile[] = [];
    const newRack = player.rack.filter(tile => {
      if (tileIds.includes(tile.id)) {
        removedTiles.push(tile);
        return false;
      }
      return true;
    });
    
    this.updatePlayer(playerId, { rack: newRack });
    return removedTiles;
  }
  
  /**
   * Get active players
   */
  getActivePlayers(): Player[] {
    return this.getAllPlayers().filter(p => p.status !== 'finished');
  }
  
  /**
   * Check if all players are ready to start
   */
  areAllPlayersReady(): boolean {
    const players = this.getAllPlayers();
    return players.length >= 2 && players.every(p => p.status === 'waiting');
  }
  
  /**
   * Reset consecutive passes for all players
   */
  resetConsecutivePasses(): void {
    this.players.forEach(player => {
      player.consecutivePasses = 0;
    });
  }
  
  /**
   * Increment consecutive passes for a player
   */
  incrementConsecutivePasses(playerId: string): number {
    const player = this.players.get(playerId);
    if (!player) {
      return 0;
    }
    
    player.consecutivePasses += 1;
    return player.consecutivePasses;
  }
  
  /**
   * Get game winner(s)
   */
  getWinners(): Player[] {
    const players = this.getAllPlayers();
    if (players.length === 0) {
      return [];
    }
    
    const maxScore = Math.max(...players.map(p => p.score));
    return players.filter(p => p.score === maxScore);
  }
  
  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Clear all players
   */
  clear(): void {
    this.players.clear();
  }
}

// ================================
// Game State Manager
// ================================

export class GameStateManager {
  private state: GameState;
  private playerManager: PlayerManager;
  private eventListeners: Map<GameEventType, GameEventListener[]> = new Map();
  private dictionary: ScrabbleDictionary | null = null;
  
  constructor(config: GameConfig = { mode: 'local', settings: {} }) {
    this.playerManager = new PlayerManager();
    this.state = this.createInitialState(config);
    this.initializeDictionary(config.customDictionary);
  }
  
  /**
   * Create initial game state
   */
  private createInitialState(config: GameConfig): GameState {
    const settings: GameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      ...config.settings
    };
    
    const state: GameState = {
      id: this.generateGameId(),
      mode: config.mode,
      phase: 'setup',
      board: createEmptyBoard(),
      players: [],
      currentPlayerIndex: 0,
      tileBag: createTileBagFromArray(createTileBag()),
      moveHistory: [],
      gameSettings: settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add initial players if provided
    if (config.players) {
      config.players.forEach(playerData => {
        if (playerData.name) {
          const player = this.playerManager.createPlayer(playerData as any);
          state.players.push(player);
        }
      });
    }
    
    return state;
  }
  
  /**
   * Initialize dictionary
   */
  private async initializeDictionary(customDictionary?: ScrabbleDictionary): Promise<void> {
    try {
      if (customDictionary) {
        this.dictionary = customDictionary;
      } else {
        this.dictionary = initializeDefaultDictionary();
      }
    } catch (error) {
      console.error('Failed to initialize dictionary:', error);
      this.emitEvent('error', { message: 'Failed to initialize dictionary' });
    }
  }
  
  /**
   * Get current game state (immutable copy)
   */
  getState(): Readonly<GameState> {
    return { 
      ...this.state,
      players: this.state.players.map(p => ({ ...p, rack: [...p.rack] })),
      moveHistory: [...this.state.moveHistory],
      tileBag: { ...this.state.tileBag, tiles: [...this.state.tileBag.tiles] }
    };
  }
  
  /**
   * Get current player
   */
  getCurrentPlayer(): Player | null {
    if (this.state.currentPlayerIndex >= this.state.players.length) {
      return null;
    }
    return this.state.players[this.state.currentPlayerIndex];
  }
  
  /**
   * Add a player to the game
   */
  addPlayer(playerData: Partial<Player> & { name: string }): Player | null {
    if (this.state.phase !== 'setup') {
      this.emitEvent('error', { message: 'Cannot add players after game has started' });
      return null;
    }
    
    if (this.state.players.length >= this.state.gameSettings.maxPlayers) {
      this.emitEvent('error', { message: 'Game is full' });
      return null;
    }
    
    // Set first player as host
    if (this.state.players.length === 0) {
      playerData.isHost = true;
    }
    
    const player = this.playerManager.createPlayer(playerData);
    this.state.players.push(player);
    this.updateTimestamp();
    
    this.emitEvent('player-added', { playerId: player.id });
    return player;
  }
  
  /**
   * Remove a player from the game
   */
  removePlayer(playerId: string): boolean {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }
    
    // Cannot remove players during active game
    if (this.state.phase === 'playing') {
      this.emitEvent('error', { message: 'Cannot remove players during active game' });
      return false;
    }
    
    const player = this.state.players[playerIndex];
    this.state.players.splice(playerIndex, 1);
    this.playerManager.removePlayer(playerId);
    
    // Adjust current player index if necessary
    if (this.state.currentPlayerIndex >= this.state.players.length) {
      this.state.currentPlayerIndex = 0;
    }
    
    // Transfer host if necessary
    if (player.isHost && this.state.players.length > 0) {
      this.state.players[0].isHost = true;
    }
    
    this.updateTimestamp();
    this.emitEvent('player-removed', { playerId });
    return true;
  }
  
  /**
   * Start the game
   */
  startGame(): boolean {
    if (this.state.phase !== 'setup') {
      this.emitEvent('error', { message: 'Game already started' });
      return false;
    }
    
    if (this.state.players.length < 2) {
      this.emitEvent('error', { message: 'Need at least 2 players to start' });
      return false;
    }
    
    // Deal initial tiles to all players
    this.state.players.forEach(player => {
      const tiles = drawTiles(this.state.tileBag, 7);
      player.rack = tiles;
      player.status = 'waiting';
    });
    
    // Set first player as active
    this.state.players[0].status = 'active';
    this.state.phase = 'playing';
    this.updateTimestamp();
    
    this.emitEvent('game-started');
    return true;
  }
  
  /**
   * Advance to next player's turn
   */
  nextTurn(): boolean {
    if (this.state.phase !== 'playing') {
      return false;
    }
    
    // Set current player to waiting
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer) {
      currentPlayer.status = 'waiting';
    }
    
    // Find next active player
    const activePlayers = this.state.players.filter(p => p.status !== 'finished');
    if (activePlayers.length <= 1) {
      return this.endGame();
    }
    
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    
    // Skip finished players
    let attempts = 0;
    while (
      this.state.players[this.state.currentPlayerIndex].status === 'finished' &&
      attempts < this.state.players.length
    ) {
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
      attempts++;
    }
    
    const nextPlayer = this.getCurrentPlayer();
    if (nextPlayer) {
      nextPlayer.status = 'active';
      // Note: consecutivePasses is only reset when a successful move is made, not on turn change
    }
    
    this.updateTimestamp();
    this.emitEvent('turn-changed', { playerId: nextPlayer?.id });
    return true;
  }
  
  /**
   * Handle player pass
   */
  passMove(playerId: string): boolean {
    if (this.state.phase !== 'playing') {
      return false;
    }
    
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== playerId) {
      this.emitEvent('error', { message: 'Not your turn' });
      return false;
    }
    
    // Increment consecutive passes
    currentPlayer.consecutivePasses += 1;
    
    // Create pass move
    const move: Move = {
      id: this.generateMoveId(),
      playerId,
      type: 'pass',
      timestamp: new Date(),
      score: 0,
      isValid: true
    };
    
    this.state.moveHistory.push(move);
    
    // Check if all players have passed twice consecutively
    const allPlayersPassed = this.state.players.every(p => p.consecutivePasses >= 2);
    if (allPlayersPassed) {
      return this.endGame();
    }
    
    this.updateTimestamp();
    this.emitEvent('move-made', { playerId, move });
    
    return this.nextTurn();
  }
  
  /**
   * Handle tile exchange
   */
  exchangeTiles(playerId: string, tileIds: string[]): boolean {
    if (this.state.phase !== 'playing') {
      return false;
    }
    
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== playerId) {
      this.emitEvent('error', { message: 'Not your turn' });
      return false;
    }
    
    if (!this.state.gameSettings.allowExchanges) {
      this.emitEvent('error', { message: 'Tile exchanges not allowed' });
      return false;
    }
    
    if (this.state.tileBag.remaining < tileIds.length) {
      this.emitEvent('error', { message: 'Not enough tiles remaining in bag' });
      return false;
    }
    
    // Remove tiles from player rack
    const exchangedTiles = this.playerManager.removeTiles(playerId, tileIds);
    if (exchangedTiles.length !== tileIds.length) {
      this.emitEvent('error', { message: 'Invalid tiles for exchange' });
      return false;
    }
    
    // Draw new tiles
    const newTiles = drawTiles(this.state.tileBag, tileIds.length);
    this.playerManager.dealTiles(playerId, newTiles);
    
    // Return exchanged tiles to bag (simplified - would normally shuffle)
    this.state.tileBag.tiles.push(...exchangedTiles);
    
    // Create exchange move
    const move: Move = {
      id: this.generateMoveId(),
      playerId,
      type: 'exchange',
      timestamp: new Date(),
      score: 0,
      exchangedTiles,
      isValid: true
    };
    
    this.state.moveHistory.push(move);
    this.updateTimestamp();
    
    this.emitEvent('tiles-exchanged', { playerId, exchangedTiles, newTiles });
    this.emitEvent('move-made', { playerId, move });
    
    return this.nextTurn();
  }
  
  /**
   * Place tiles on board (basic implementation - full validation in separate module)
   */
  placeTiles(playerId: string, placements: TilePlacement[]): MoveValidation {
    const validation: MoveValidation = {
      isValid: false,
      errors: [],
      warnings: [],
      score: 0,
      wordsFormed: []
    };
    
    if (this.state.phase !== 'playing') {
      validation.errors.push('Game not in playing phase');
      return validation;
    }
    
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== playerId) {
      validation.errors.push('Not your turn');
      return validation;
    }
    
    if (placements.length === 0) {
      validation.errors.push('No tiles placed');
      return validation;
    }
    
    // Basic validation (full implementation in move validator)
    validation.isValid = true;
    validation.score = placements.length * 10; // Simplified scoring
    
    return validation;
  }
  
  /**
   * Submit a validated move
   */
  submitMove(playerId: string, placements: TilePlacement[], validation: MoveValidation): boolean {
    if (!validation.isValid) {
      this.emitEvent('error', { message: 'Invalid move cannot be submitted' });
      return false;
    }
    
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return false;
    }
    
    // Apply placements to board (simplified)
    placements.forEach(placement => {
      const { row, col } = placement.position;
      if (this.state.board[row] && this.state.board[row][col]) {
        this.state.board[row][col].tile = placement.tile;
        this.state.board[row][col].isEmpty = false;
      }
    });
    
    // Remove tiles from player rack
    const tileIds = placements.map(p => p.tile.id);
    this.playerManager.removeTiles(playerId, tileIds);
    
    // Add score to player
    this.playerManager.addScore(playerId, validation.score);
    
    // Reset consecutive passes for successful move
    currentPlayer.consecutivePasses = 0;
    
    // Deal new tiles if bag has tiles
    if (this.state.tileBag.remaining > 0) {
      const tilesToDraw = Math.min(7 - currentPlayer.rack.length, this.state.tileBag.remaining);
      if (tilesToDraw > 0) {
        const newTiles = drawTiles(this.state.tileBag, tilesToDraw);
        this.playerManager.dealTiles(playerId, newTiles);
      }
    }
    
    // Create move record
    const move: Move = {
      id: this.generateMoveId(),
      playerId,
      type: 'place',
      timestamp: new Date(),
      placements,
      wordsFormed: validation.wordsFormed,
      score: validation.score,
      isValid: true
    };
    
    this.state.moveHistory.push(move);
    
    // Check win condition (player used all tiles)
    if (currentPlayer.rack.length === 0) {
      return this.endGame();
    }
    
    this.updateTimestamp();
    this.emitEvent('move-made', { playerId, move });
    
    return this.nextTurn();
  }
  
  /**
   * End the game
   */
  endGame(): boolean {
    if (this.state.phase === 'finished') {
      return false;
    }
    
    this.state.phase = 'finished';
    this.state.players.forEach(player => {
      player.status = 'finished';
    });
    
    this.updateTimestamp();
    this.emitEvent('game-ended');
    return true;
  }
  
  /**
   * Pause the game
   */
  pauseGame(): boolean {
    if (this.state.phase !== 'playing') {
      return false;
    }
    
    // Implementation would depend on how pausing is handled
    this.emitEvent('game-paused');
    return true;
  }
  
  /**
   * Resume the game
   */
  resumeGame(): boolean {
    // Implementation would depend on how pausing is handled
    this.emitEvent('game-resumed');
    return true;
  }
  
  /**
   * Reset game to setup phase
   */
  resetGame(): void {
    this.state.phase = 'setup';
    this.state.board = createEmptyBoard();
    this.state.tileBag = createTileBagFromArray(createTileBag());
    this.state.moveHistory = [];
    this.state.currentPlayerIndex = 0;
    
    this.state.players.forEach(player => {
      player.score = 0;
      player.rack = [];
      player.status = 'waiting';
      player.consecutivePasses = 0;
    });
    
    this.playerManager.resetConsecutivePasses();
    this.updateTimestamp();
  }
  
  /**
   * Get game statistics
   */
  getGameStats() {
    const players = this.state.players;
    const moves = this.state.moveHistory;
    
    return {
      gameId: this.state.id,
      duration: Math.max(1, Date.now() - this.state.createdAt.getTime()),
      totalMoves: moves.length,
      averageScore: players.length > 0 ? players.reduce((sum, p) => sum + p.score, 0) / players.length : 0,
      highestScore: players.length > 0 ? Math.max(...players.map(p => p.score)) : 0,
      winners: this.playerManager.getWinners(),
      tilesRemaining: this.state.tileBag.remaining,
      phase: this.state.phase
    };
  }
  
  /**
   * Export game state
   */
  exportState(): GameState {
    return this.getState();
  }
  
  /**
   * Import game state
   */
  importState(state: GameState): boolean {
    try {
      this.state = { ...state };
      
      // Rebuild player manager
      this.playerManager.clear();
      this.state.players.forEach(player => {
        this.playerManager.addPlayer(player);
      });
      
      return true;
    } catch (error) {
      this.emitEvent('error', { message: 'Failed to import game state' });
      return false;
    }
  }
  
  // ================================
  // Event System
  // ================================
  
  /**
   * Add event listener
   */
  addEventListener(type: GameEventType, listener: GameEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(type: GameEventType, listener: GameEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Emit event
   */
  private emitEvent(type: GameEventType, data?: any): void {
    const event: GameEvent = {
      type,
      timestamp: new Date(),
      gameId: this.state.id,
      ...data
    };
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
  
  // ================================
  // Utility Methods
  // ================================
  
  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateMoveId(): string {
    return `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private updateTimestamp(): void {
    this.state.updatedAt = new Date();
  }
}

// ================================
// Factory Functions
// ================================

/**
 * Create a new game state manager
 */
export function createGameState(config?: GameConfig): GameStateManager {
  return new GameStateManager(config);
}

/**
 * Create a local game with players
 */
export function createLocalGame(playerNames: string[]): GameStateManager {
  const config: GameConfig = {
    mode: 'local',
    settings: DEFAULT_GAME_SETTINGS,
    players: playerNames.map(name => ({ name })),
    autoStart: false
  };
  
  return new GameStateManager(config);
}

/**
 * Create a quick game (auto-configured)
 */
export function createQuickGame(playerNames: string[]): GameStateManager {
  const game = createLocalGame(playerNames);
  game.startGame();
  return game;
}

// ================================
// Default Export
// ================================

export default GameStateManager; 