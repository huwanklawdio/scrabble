import React from 'react';
import type { Player, GamePhase } from '../types/game';

// ================================
// ScoreBoard Component Props
// ================================

export interface ScoreBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  gamePhase: GamePhase;
  remainingTiles: number;
  totalTiles?: number;
  showTurnTimer?: boolean;
  turnTimeRemaining?: number;
  showPlayerDetails?: boolean;
  showGameInfo?: boolean;
  compact?: boolean;
  className?: string;
}

// ================================
// Player Card Sub-component
// ================================

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isHost?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer,
  isHost = false,
  showDetails = true,
  compact = false,
}) => {
  const cardClasses = `
    ${compact ? 'p-2' : 'p-3 sm:p-4'}
    bg-white
    border-2
    ${isCurrentPlayer 
      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
      : 'border-gray-200 hover:border-gray-300'
    }
    rounded-lg
    transition-all duration-200
    ${isCurrentPlayer ? 'transform scale-105' : ''}
  `;

  const statusClasses = `
    text-xs font-medium px-2 py-1 rounded-full
    ${player.status === 'active' 
      ? 'bg-green-100 text-green-800'
      : player.status === 'waiting'
      ? 'bg-yellow-100 text-yellow-800'
      : player.status === 'passed'
      ? 'bg-gray-100 text-gray-800'
      : 'bg-red-100 text-red-800'
    }
  `;

  return (
    <div className={cardClasses}>
      {/* Player Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-800`}>
            {player.name}
          </span>
          {isHost && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
              HOST
            </span>
          )}
          {isCurrentPlayer && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium animate-pulse">
              TURN
            </span>
          )}
        </div>
        
        {showDetails && (
          <span className={statusClasses}>
            {player.status.toUpperCase()}
          </span>
        )}
      </div>

      {/* Score Display */}
      <div className="text-center">
        <div className={`${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold text-gray-900`}>
          {player.score.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">points</div>
      </div>

      {/* Player Details */}
      {showDetails && !compact && (
        <div className="mt-3 space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Tiles:</span>
            <span className="font-medium">{player.rack.length}/7</span>
          </div>
          {player.consecutivePasses > 0 && (
            <div className="flex justify-between">
              <span>Passes:</span>
              <span className="font-medium text-orange-600">{player.consecutivePasses}</span>
            </div>
          )}
          {player.timeRemaining !== undefined && (
            <div className="flex justify-between">
              <span>Time:</span>
              <span className={`font-medium ${player.timeRemaining < 30 ? 'text-red-600' : ''}`}>
                {Math.floor(player.timeRemaining / 60)}:{(player.timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ================================
// Turn Timer Sub-component
// ================================

interface TurnTimerProps {
  timeRemaining: number;
  isActive: boolean;
}

const TurnTimer: React.FC<TurnTimerProps> = ({ timeRemaining, isActive }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLowTime = timeRemaining < 30;
  
  if (!isActive) return null;

  return (
    <div className={`
      text-center p-2 rounded-lg border-2
      ${isLowTime 
        ? 'bg-red-50 border-red-300 text-red-800' 
        : 'bg-blue-50 border-blue-300 text-blue-800'
      }
    `}>
      <div className="text-xs font-medium mb-1">Time Remaining</div>
      <div className={`text-lg font-bold ${isLowTime ? 'animate-pulse' : ''}`}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
};

// ================================
// Game Info Sub-component
// ================================

interface GameInfoProps {
  gamePhase: GamePhase;
  remainingTiles: number;
  totalTiles: number;
  compact?: boolean;
}

const GameInfo: React.FC<GameInfoProps> = ({ 
  gamePhase, 
  remainingTiles, 
  totalTiles,
  compact = false 
}) => {
  const tilePercentage = (remainingTiles / totalTiles) * 100;
  
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg ${compact ? 'p-2' : 'p-3'}`}>
      <div className={`text-center ${compact ? 'space-y-1' : 'space-y-2'}`}>
        {/* Game Phase */}
        <div>
          <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>Game Phase:</span>
          <span className={`ml-2 ${compact ? 'text-xs' : 'text-sm'} font-semibold capitalize
            ${gamePhase === 'setup' ? 'text-yellow-600' : 
              gamePhase === 'playing' ? 'text-green-600' : 'text-blue-600'}
          `}>
            {gamePhase}
          </span>
        </div>

        {/* Tiles Remaining */}
        <div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>
            Tiles Remaining: <span className="font-semibold">{remainingTiles}/{totalTiles}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 
                ${tilePercentage > 50 ? 'bg-green-500' : 
                  tilePercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'}
              `}
              style={{ width: `${tilePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================
// Main ScoreBoard Component
// ================================

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  currentPlayerIndex,
  gamePhase,
  remainingTiles,
  totalTiles = 100,
  showTurnTimer = false,
  turnTimeRemaining,
  showPlayerDetails = true,
  showGameInfo = true,
  compact = false,
  className = '',
}) => {
  const currentPlayer = players[currentPlayerIndex];
  const isGameActive = gamePhase === 'playing';

  // Sort players: current player first, then by score descending
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === currentPlayer?.id) return -1;
    if (b.id === currentPlayer?.id) return 1;
    return b.score - a.score;
  });

  const containerClasses = `
    bg-white
    border border-gray-300
    rounded-lg
    shadow-md
    ${compact ? 'p-3' : 'p-4'}
    ${className}
  `;

  const headerClasses = `
    text-center
    mb-4
    ${compact ? 'pb-2' : 'pb-3'}
    border-b border-gray-200
  `;

  const playersGridClasses = `
    grid gap-3
    ${players.length <= 2 
      ? 'grid-cols-1 sm:grid-cols-2' 
      : players.length <= 4 
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }
    mb-4
  `;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={headerClasses}>
        <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-gray-800 flex items-center justify-center gap-2`}>
          <span>🏆</span>
          <span>Score Board</span>
        </h2>
        {isGameActive && currentPlayer && (
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
            {currentPlayer.name}'s turn
          </p>
        )}
      </div>

      {/* Turn Timer */}
      {showTurnTimer && turnTimeRemaining !== undefined && isGameActive && (
        <div className="mb-4">
          <TurnTimer 
            timeRemaining={turnTimeRemaining} 
            isActive={isGameActive}
          />
        </div>
      )}

      {/* Players */}
      <div className={playersGridClasses}>
        {sortedPlayers.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayer?.id && isGameActive}
            isHost={player.isHost}
            showDetails={showPlayerDetails}
            compact={compact}
          />
        ))}
      </div>

      {/* Game Info */}
      {showGameInfo && (
        <GameInfo
          gamePhase={gamePhase}
          remainingTiles={remainingTiles}
          totalTiles={totalTiles}
          compact={compact}
        />
      )}
    </div>
  );
};

export default ScoreBoard;