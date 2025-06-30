// ================================
// Game State Management Tests
// ================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GameStateManager,
  PlayerManager,
  createGameState,
  createLocalGame,
  createQuickGame,
  DEFAULT_GAME_SETTINGS,
  type GameConfig,
  type GameEvent,
  type GameEventListener
} from './gameState';
import type { Player, GamePhase, TilePlacement } from '../types/game';

describe('Game State Management', () => {
  let gameManager: GameStateManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    gameManager = new GameStateManager();
    playerManager = new PlayerManager();
  });

  afterEach(() => {
    // Clean up any event listeners
    vi.clearAllMocks();
  });

  describe('PlayerManager', () => {
    describe('Player Creation and Management', () => {
      it('should create a new player with defaults', () => {
        const player = playerManager.createPlayer({ name: 'Alice' });
        
        expect(player.name).toBe('Alice');
        expect(player.score).toBe(0);
        expect(player.rack).toEqual([]);
        expect(player.status).toBe('waiting');
        expect(player.consecutivePasses).toBe(0);
        expect(player.isHost).toBe(false);
        expect(player.id).toBeTruthy();
      });

      it('should create player with custom data', () => {
        const customData = {
          name: 'Bob',
          score: 100,
          isHost: true,
          timeRemaining: 300
        };
        
        const player = playerManager.createPlayer(customData);
        
        expect(player.name).toBe('Bob');
        expect(player.score).toBe(100);
        expect(player.isHost).toBe(true);
        expect(player.timeRemaining).toBe(300);
      });

      it('should add existing player', () => {
        const player: Player = {
          id: 'test-player',
          name: 'Charlie',
          score: 50,
          rack: [],
          status: 'waiting',
          consecutivePasses: 0
        };
        
        const result = playerManager.addPlayer(player);
        expect(result).toBe(true);
        
        const retrieved = playerManager.getPlayer('test-player');
        expect(retrieved).toEqual(player);
      });

      it('should not add duplicate player', () => {
        const player = playerManager.createPlayer({ name: 'Alice' });
        const result = playerManager.addPlayer(player);
        
        expect(result).toBe(false);
      });

      it('should remove player', () => {
        const player = playerManager.createPlayer({ name: 'Alice' });
        const result = playerManager.removePlayer(player.id);
        
        expect(result).toBe(true);
        expect(playerManager.getPlayer(player.id)).toBeUndefined();
      });

      it('should get all players', () => {
        playerManager.createPlayer({ name: 'Alice' });
        playerManager.createPlayer({ name: 'Bob' });
        
        const players = playerManager.getAllPlayers();
        expect(players).toHaveLength(2);
        expect(players.map(p => p.name)).toContain('Alice');
        expect(players.map(p => p.name)).toContain('Bob');
      });
    });

    describe('Player Updates', () => {
      let player: Player;

      beforeEach(() => {
        player = playerManager.createPlayer({ name: 'Alice' });
      });

      it('should update player data', () => {
        const result = playerManager.updatePlayer(player.id, { score: 150 });
        
        expect(result).toBe(true);
        
        const updated = playerManager.getPlayer(player.id);
        expect(updated?.score).toBe(150);
      });

      it('should set player status', () => {
        const result = playerManager.setPlayerStatus(player.id, 'active');
        
        expect(result).toBe(true);
        expect(playerManager.getPlayer(player.id)?.status).toBe('active');
      });

      it('should add score to player', () => {
        playerManager.updatePlayer(player.id, { score: 50 });
        const result = playerManager.addScore(player.id, 25);
        
        expect(result).toBe(true);
        expect(playerManager.getPlayer(player.id)?.score).toBe(75);
      });

      it('should handle consecutive passes', () => {
        const count1 = playerManager.incrementConsecutivePasses(player.id);
        expect(count1).toBe(1);
        
        const count2 = playerManager.incrementConsecutivePasses(player.id);
        expect(count2).toBe(2);
        
        playerManager.resetConsecutivePasses();
        expect(playerManager.getPlayer(player.id)?.consecutivePasses).toBe(0);
      });
    });

    describe('Game Logic Helpers', () => {
      beforeEach(() => {
        playerManager.createPlayer({ name: 'Alice', score: 100 });
        playerManager.createPlayer({ name: 'Bob', score: 150 });
        playerManager.createPlayer({ name: 'Charlie', score: 150 });
      });

      it('should get active players', () => {
        playerManager.setPlayerStatus(playerManager.getAllPlayers()[0].id, 'finished');
        
        const activePlayers = playerManager.getActivePlayers();
        expect(activePlayers).toHaveLength(2);
      });

      it('should check if all players are ready', () => {
        expect(playerManager.areAllPlayersReady()).toBe(true);
        
        playerManager.setPlayerStatus(playerManager.getAllPlayers()[0].id, 'active');
        expect(playerManager.areAllPlayersReady()).toBe(false);
      });

      it('should get winners', () => {
        const winners = playerManager.getWinners();
        expect(winners).toHaveLength(2); // Bob and Charlie with score 150
        expect(winners.every(w => w.score === 150)).toBe(true);
      });
    });
  });

  describe('GameStateManager', () => {
    describe('Game Initialization', () => {
      it('should create game with default config', () => {
        const state = gameManager.getState();
        
        expect(state.phase).toBe('setup');
        expect(state.mode).toBe('local');
        expect(state.players).toHaveLength(0);
        expect(state.currentPlayerIndex).toBe(0);
        expect(state.moveHistory).toHaveLength(0);
        expect(state.gameSettings).toEqual(DEFAULT_GAME_SETTINGS);
        expect(state.board).toBeDefined();
        expect(state.tileBag).toBeDefined();
      });

      it('should create game with custom config', () => {
        const config: GameConfig = {
          mode: 'lan',
          settings: {
            maxPlayers: 2,
            timePerTurn: 120,
            allowExchanges: false
          },
          players: [{ name: 'Alice' }, { name: 'Bob' }]
        };
        
        const customGame = new GameStateManager(config);
        const state = customGame.getState();
        
        expect(state.mode).toBe('lan');
        expect(state.gameSettings.maxPlayers).toBe(2);
        expect(state.gameSettings.timePerTurn).toBe(120);
        expect(state.gameSettings.allowExchanges).toBe(false);
        expect(state.players).toHaveLength(2);
        expect(state.players[0].name).toBe('Alice');
        expect(state.players[1].name).toBe('Bob');
      });

      it('should set first player as host', () => {
        const alice = gameManager.addPlayer({ name: 'Alice' });
        const bob = gameManager.addPlayer({ name: 'Bob' });
        
        expect(alice?.isHost).toBe(true);
        expect(bob?.isHost).toBe(false);
      });
    });

    describe('Player Management', () => {
      it('should add players during setup', () => {
        const alice = gameManager.addPlayer({ name: 'Alice' });
        const bob = gameManager.addPlayer({ name: 'Bob' });
        
        expect(alice).toBeDefined();
        expect(bob).toBeDefined();
        expect(gameManager.getState().players).toHaveLength(2);
      });

      it('should not add players after game starts', () => {
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.startGame();
        
        const charlie = gameManager.addPlayer({ name: 'Charlie' });
        expect(charlie).toBeNull();
        expect(gameManager.getState().players).toHaveLength(2);
      });

      it('should not exceed max players', () => {
        // Default max is 4
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.addPlayer({ name: 'Charlie' });
        gameManager.addPlayer({ name: 'David' });
        
        const extra = gameManager.addPlayer({ name: 'Extra' });
        expect(extra).toBeNull();
        expect(gameManager.getState().players).toHaveLength(4);
      });

      it('should remove players during setup', () => {
        const alice = gameManager.addPlayer({ name: 'Alice' });
        const bob = gameManager.addPlayer({ name: 'Bob' });
        
        const result = gameManager.removePlayer(alice!.id);
        expect(result).toBe(true);
        expect(gameManager.getState().players).toHaveLength(1);
        expect(gameManager.getState().players[0].name).toBe('Bob');
      });

      it('should transfer host when host is removed', () => {
        const alice = gameManager.addPlayer({ name: 'Alice' }); // Host
        const bob = gameManager.addPlayer({ name: 'Bob' });
        
        gameManager.removePlayer(alice!.id);
        
        const state = gameManager.getState();
        expect(state.players).toHaveLength(1);
        expect(state.players[0].isHost).toBe(true);
      });
    });

    describe('Game Flow', () => {
      beforeEach(() => {
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
      });

      it('should start game with valid setup', () => {
        const result = gameManager.startGame();
        
        expect(result).toBe(true);
        
        const state = gameManager.getState();
        expect(state.phase).toBe('playing');
        expect(state.players[0].status).toBe('active');
        expect(state.players[1].status).toBe('waiting');
        expect(state.players.every(p => p.rack.length === 7)).toBe(true);
      });

      it('should not start game without enough players', () => {
        const singlePlayerGame = new GameStateManager();
        singlePlayerGame.addPlayer({ name: 'Alice' });
        
        const result = singlePlayerGame.startGame();
        expect(result).toBe(false);
        expect(singlePlayerGame.getState().phase).toBe('setup');
      });

      it('should not start already started game', () => {
        gameManager.startGame();
        const result = gameManager.startGame();
        
        expect(result).toBe(false);
      });

      it('should advance to next turn', () => {
        gameManager.startGame();
        const initialPlayer = gameManager.getCurrentPlayer();
        
        const result = gameManager.nextTurn();
        expect(result).toBe(true);
        
        const newPlayer = gameManager.getCurrentPlayer();
        expect(newPlayer?.id).not.toBe(initialPlayer?.id);
        expect(newPlayer?.status).toBe('active');
        expect(initialPlayer?.status).toBe('waiting');
      });

      it('should handle player pass', () => {
        gameManager.startGame();
        const currentPlayer = gameManager.getCurrentPlayer();
        
        const result = gameManager.passMove(currentPlayer!.id);
        expect(result).toBe(true);
        
        const state = gameManager.getState();
        expect(state.moveHistory).toHaveLength(1);
        expect(state.moveHistory[0].type).toBe('pass');
        expect(state.moveHistory[0].playerId).toBe(currentPlayer!.id);
      });

      it('should end game when all players pass twice', () => {
        gameManager.startGame();
        
        // Each player passes twice
        for (let i = 0; i < 4; i++) {
          const currentPlayer = gameManager.getCurrentPlayer();
          gameManager.passMove(currentPlayer!.id);
        }
        
        const state = gameManager.getState();
        expect(state.phase).toBe('finished');
        expect(state.players.every(p => p.status === 'finished')).toBe(true);
      });
    });

    describe('Tile Exchange', () => {
      beforeEach(() => {
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.startGame();
      });

      it('should exchange tiles successfully', () => {
        const currentPlayer = gameManager.getCurrentPlayer();
        const initialRack = [...currentPlayer!.rack];
        const tilesToExchange = initialRack.slice(0, 3).map(t => t.id);
        
        const result = gameManager.exchangeTiles(currentPlayer!.id, tilesToExchange);
        expect(result).toBe(true);
        
        const state = gameManager.getState();
        const updatedPlayer = state.players.find(p => p.id === currentPlayer!.id);
        expect(updatedPlayer!.rack).toHaveLength(7);
        expect(updatedPlayer!.rack.every(tile => !tilesToExchange.includes(tile.id))).toBe(true);
        
        expect(state.moveHistory).toHaveLength(1);
        expect(state.moveHistory[0].type).toBe('exchange');
      });

      it('should not exchange when not allowed', () => {
        const config: GameConfig = {
          mode: 'local',
          settings: { allowExchanges: false }
        };
        
        const restrictedGame = new GameStateManager(config);
        restrictedGame.addPlayer({ name: 'Alice' });
        restrictedGame.addPlayer({ name: 'Bob' });
        restrictedGame.startGame();
        
        const currentPlayer = restrictedGame.getCurrentPlayer();
        const tilesToExchange = [currentPlayer!.rack[0].id];
        
        const result = restrictedGame.exchangeTiles(currentPlayer!.id, tilesToExchange);
        expect(result).toBe(false);
      });

      it('should not exchange more tiles than available in bag', () => {
        const currentPlayer = gameManager.getCurrentPlayer();
        
        // Try to exchange more tiles than possible
        const state = gameManager.getState();
        const tilesInBag = state.tileBag.remaining;
        const excessiveTileIds = Array(tilesInBag + 1).fill(0).map((_, i) => `tile-${i}`);
        
        const result = gameManager.exchangeTiles(currentPlayer!.id, excessiveTileIds);
        expect(result).toBe(false);
      });
    });

    describe('Move Validation and Submission', () => {
      beforeEach(() => {
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.startGame();
      });

      it('should validate tile placements', () => {
        const currentPlayer = gameManager.getCurrentPlayer();
        const placements: TilePlacement[] = [
          {
            tile: currentPlayer!.rack[0],
            position: { row: 7, col: 7 }
          }
        ];
        
        const validation = gameManager.placeTiles(currentPlayer!.id, placements);
        
        expect(validation.isValid).toBe(true);
        expect(validation.score).toBeGreaterThan(0);
        expect(validation.errors).toHaveLength(0);
      });

      it('should reject empty placements', () => {
        const currentPlayer = gameManager.getCurrentPlayer();
        const validation = gameManager.placeTiles(currentPlayer!.id, []);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('No tiles placed');
      });

      it('should submit valid move', () => {
        const currentPlayer = gameManager.getCurrentPlayer();
        const placements: TilePlacement[] = [
          {
            tile: currentPlayer!.rack[0],
            position: { row: 7, col: 7 }
          }
        ];
        
        const validation = gameManager.placeTiles(currentPlayer!.id, placements);
        const result = gameManager.submitMove(currentPlayer!.id, placements, validation);
        
        expect(result).toBe(true);
        
        const state = gameManager.getState();
        expect(state.moveHistory).toHaveLength(1);
        expect(state.moveHistory[0].type).toBe('place');
        expect(state.board[7][7].tile).toBeDefined();
      });
    });

    describe('Game End Conditions', () => {
      beforeEach(() => {
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.startGame();
      });

      it('should end game manually', () => {
        const result = gameManager.endGame();
        
        expect(result).toBe(true);
        
        const state = gameManager.getState();
        expect(state.phase).toBe('finished');
        expect(state.players.every(p => p.status === 'finished')).toBe(true);
      });

      it('should not end already finished game', () => {
        gameManager.endGame();
        const result = gameManager.endGame();
        
        expect(result).toBe(false);
      });
    });

    describe('Game Statistics', () => {
      beforeEach(() => {
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.startGame();
      });

      it('should provide game statistics', () => {
        const stats = gameManager.getGameStats();
        
        expect(stats.gameId).toBeDefined();
        expect(stats.duration).toBeGreaterThan(0);
        expect(stats.totalMoves).toBe(0);
        expect(stats.averageScore).toBe(0);
        expect(stats.highestScore).toBe(0);
        expect(stats.winners).toHaveLength(2); // Tied at 0
        expect(stats.phase).toBe('playing');
      });

      it('should calculate stats after moves', () => {
        const currentPlayer = gameManager.getCurrentPlayer();
        gameManager.passMove(currentPlayer!.id);
        
        const stats = gameManager.getGameStats();
        expect(stats.totalMoves).toBe(1);
      });
    });

    describe('State Export/Import', () => {
      let originalState: any;

      beforeEach(() => {
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.startGame();
        originalState = gameManager.exportState();
      });

      it('should export game state', () => {
        expect(originalState).toBeDefined();
        expect(originalState.players).toHaveLength(2);
        expect(originalState.phase).toBe('playing');
      });

      it('should import game state', () => {
        const newGame = new GameStateManager();
        const result = newGame.importState(originalState);
        
        expect(result).toBe(true);
        
        const importedState = newGame.getState();
        expect(importedState.id).toBe(originalState.id);
        expect(importedState.players).toHaveLength(2);
        expect(importedState.phase).toBe('playing');
      });

      it('should maintain state immutability on export', () => {
        const state1 = gameManager.getState();
        const state2 = gameManager.getState();
        
        expect(state1).not.toBe(state2); // Different objects
        expect(state1.players).not.toBe(state2.players); // Different arrays
        expect(state1.players[0].rack).not.toBe(state2.players[0].rack); // Different rack arrays
      });
    });

    describe('Event System', () => {
      let events: GameEvent[] = [];
      let listener: GameEventListener;

      beforeEach(() => {
        events = [];
        listener = (event: GameEvent) => {
          events.push(event);
        };
      });

      afterEach(() => {
        gameManager.removeEventListener('player-added', listener);
        gameManager.removeEventListener('game-started', listener);
        gameManager.removeEventListener('turn-changed', listener);
      });

      it('should emit player-added event', () => {
        gameManager.addEventListener('player-added', listener);
        
        const player = gameManager.addPlayer({ name: 'Alice' });
        
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe('player-added');
        expect(events[0].playerId).toBe(player!.id);
      });

      it('should emit game-started event', () => {
        gameManager.addEventListener('game-started', listener);
        
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.startGame();
        
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe('game-started');
      });

      it('should emit turn-changed event', () => {
        gameManager.addEventListener('turn-changed', listener);
        
        gameManager.addPlayer({ name: 'Alice' });
        gameManager.addPlayer({ name: 'Bob' });
        gameManager.startGame();
        gameManager.nextTurn();
        
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe('turn-changed');
      });

      it('should remove event listeners', () => {
        gameManager.addEventListener('player-added', listener);
        gameManager.removeEventListener('player-added', listener);
        
        gameManager.addPlayer({ name: 'Alice' });
        
        expect(events).toHaveLength(0);
      });
    });
  });

  describe('Factory Functions', () => {
    describe('createGameState', () => {
      it('should create game with default config', () => {
        const game = createGameState();
        const state = game.getState();
        
        expect(state.mode).toBe('local');
        expect(state.phase).toBe('setup');
      });

      it('should create game with custom config', () => {
        const config: GameConfig = {
          mode: 'lan',
          settings: { maxPlayers: 3 }
        };
        
        const game = createGameState(config);
        const state = game.getState();
        
        expect(state.mode).toBe('lan');
        expect(state.gameSettings.maxPlayers).toBe(3);
      });
    });

    describe('createLocalGame', () => {
      it('should create local game with players', () => {
        const game = createLocalGame(['Alice', 'Bob', 'Charlie']);
        const state = game.getState();
        
        expect(state.mode).toBe('local');
        expect(state.players).toHaveLength(3);
        expect(state.players.map(p => p.name)).toEqual(['Alice', 'Bob', 'Charlie']);
        expect(state.phase).toBe('setup');
      });
    });

    describe('createQuickGame', () => {
      it('should create and start game immediately', () => {
        const game = createQuickGame(['Alice', 'Bob']);
        const state = game.getState();
        
        expect(state.phase).toBe('playing');
        expect(state.players).toHaveLength(2);
        expect(state.players[0].status).toBe('active');
        expect(state.players.every(p => p.rack.length === 7)).toBe(true);
      });
    });
  });

  describe('Game Reset', () => {
    beforeEach(() => {
      gameManager.addPlayer({ name: 'Alice' });
      gameManager.addPlayer({ name: 'Bob' });
      gameManager.startGame();
    });

    it('should reset game to setup phase', () => {
      // Make some moves first
      const currentPlayer = gameManager.getCurrentPlayer();
      gameManager.passMove(currentPlayer!.id);
      
      gameManager.resetGame();
      
      const state = gameManager.getState();
      expect(state.phase).toBe('setup');
      expect(state.moveHistory).toHaveLength(0);
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.players.every(p => p.score === 0)).toBe(true);
      expect(state.players.every(p => p.rack.length === 0)).toBe(true);
      expect(state.players.every(p => p.status === 'waiting')).toBe(true);
      expect(state.players.every(p => p.consecutivePasses === 0)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      gameManager.addPlayer({ name: 'Alice' });
      gameManager.addPlayer({ name: 'Bob' });
    });

    it('should handle invalid player operations', () => {
      const result = gameManager.passMove('invalid-player-id');
      expect(result).toBe(false);
    });

    it('should handle operations on wrong turn', () => {
      gameManager.startGame();
      const nonActivePlayer = gameManager.getState().players.find(p => p.status !== 'active');
      
      const result = gameManager.passMove(nonActivePlayer!.id);
      expect(result).toBe(false);
    });

    it('should handle operations during wrong phase', () => {
      const result = gameManager.passMove(gameManager.getState().players[0].id);
      expect(result).toBe(false); // Game not started
    });
  });
}); 