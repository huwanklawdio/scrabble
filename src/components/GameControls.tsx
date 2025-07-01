import React, { useEffect, useCallback } from 'react';
import type { GamePhase } from '../types/game';

// ================================
// GameControls Component Props
// ================================

export interface GameControlsProps {
  gamePhase: GamePhase;
  isCurrentPlayer: boolean;
  canSubmit: boolean;
  canPass: boolean;
  canExchange: boolean;
  hasSelectedTiles: boolean;
  placedTilesCount: number;
  onSubmit: () => void;
  onPass: () => void;
  onExchange: () => void;
  onClear?: () => void;
  onUndo?: () => void;
  onHint?: () => void;
  onShuffle?: () => void;
  isSubmitting?: boolean;
  showAdvancedControls?: boolean;
  enableKeyboardShortcuts?: boolean;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

// ================================
// Button Component
// ================================

interface GameButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  shortcut?: string;
  children: React.ReactNode;
  className?: string;
}

const GameButton: React.FC<GameButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  variant = 'secondary',
  size = 'medium',
  icon,
  shortcut,
  children,
  className = '',
}) => {
  const baseClasses = `
    relative
    inline-flex items-center justify-center
    font-semibold
    rounded-lg
    border-2
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${loading ? 'cursor-wait' : ''}
  `;

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 active:bg-blue-800
      border-blue-600 hover:border-blue-700
      text-white
      focus:ring-blue-500
      shadow-md hover:shadow-lg
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 active:bg-gray-300
      border-gray-300 hover:border-gray-400
      text-gray-700
      focus:ring-gray-500
    `,
    danger: `
      bg-red-600 hover:bg-red-700 active:bg-red-800
      border-red-600 hover:border-red-700
      text-white
      focus:ring-red-500
      shadow-md hover:shadow-lg
    `,
    success: `
      bg-green-600 hover:bg-green-700 active:bg-green-800
      border-green-600 hover:border-green-700
      text-white
      focus:ring-green-500
      shadow-md hover:shadow-lg
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      title={shortcut ? `Keyboard shortcut: ${shortcut}` : undefined}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
        </div>
      )}
      
      <div className={`flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {icon && <span>{icon}</span>}
        <span>{children}</span>
        {shortcut && (
          <span className="text-xs opacity-75 bg-black bg-opacity-20 px-1.5 py-0.5 rounded">
            {shortcut}
          </span>
        )}
      </div>
    </button>
  );
};

// ================================
// Main GameControls Component
// ================================

export const GameControls: React.FC<GameControlsProps> = ({
  gamePhase,
  isCurrentPlayer,
  canSubmit,
  canPass,
  canExchange,
  hasSelectedTiles: _, // eslint-disable-line @typescript-eslint/no-unused-vars
  placedTilesCount,
  onSubmit,
  onPass,
  onExchange,
  onClear,
  onUndo,
  onHint,
  onShuffle,
  isSubmitting = false,
  showAdvancedControls = true,
  enableKeyboardShortcuts = true,
  compact = false,
  orientation = 'horizontal',
  className = '',
}) => {
  // ================================
  // Keyboard Shortcuts
  // ================================

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardShortcuts || !isCurrentPlayer || gamePhase !== 'playing') {
      return;
    }

    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'enter':
        if (canSubmit && !isSubmitting) {
          event.preventDefault();
          onSubmit();
        }
        break;
      case 'p':
        if (canPass && !isSubmitting) {
          event.preventDefault();
          onPass();
        }
        break;
      case 'e':
        if (canExchange && !isSubmitting) {
          event.preventDefault();
          onExchange();
        }
        break;
      case 'c':
        if (onClear && placedTilesCount > 0) {
          event.preventDefault();
          onClear();
        }
        break;
      case 'z':
        if (event.ctrlKey || event.metaKey) {
          if (onUndo) {
            event.preventDefault();
            onUndo();
          }
        }
        break;
      case 'h':
        if (onHint) {
          event.preventDefault();
          onHint();
        }
        break;
      case 's':
        if (onShuffle) {
          event.preventDefault();
          onShuffle();
        }
        break;
    }
  }, [
    enableKeyboardShortcuts,
    isCurrentPlayer,
    gamePhase,
    canSubmit,
    canPass,
    canExchange,
    placedTilesCount,
    isSubmitting,
    onSubmit,
    onPass,
    onExchange,
    onClear,
    onUndo,
    onHint,
    onShuffle,
  ]);

  useEffect(() => {
    if (enableKeyboardShortcuts) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, enableKeyboardShortcuts]);

  // ================================
  // Render Logic
  // ================================

  const isGameActive = gamePhase === 'playing';
  const showControls = isGameActive && isCurrentPlayer;

  const containerClasses = `
    bg-white
    border border-gray-300
    rounded-lg
    shadow-md
    ${compact ? 'p-3' : 'p-4'}
    ${className}
  `;

  const buttonsContainerClasses = `
    flex
    ${orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'}
    gap-3
    ${orientation === 'horizontal' ? 'justify-center items-center' : 'items-stretch'}
  `;

  const primaryButtonsClasses = `
    flex
    ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
    gap-2
    ${orientation === 'horizontal' ? 'items-center' : 'items-stretch'}
  `;

  const advancedButtonsClasses = `
    flex
    ${orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'}
    gap-2
    ${orientation === 'horizontal' ? 'justify-center items-center' : 'items-stretch'}
  `;

  if (!showControls) {
    return (
      <div className={containerClasses}>
        <div className="text-center text-gray-500">
          {gamePhase === 'setup' && 'Game is being set up...'}
          {gamePhase === 'finished' && 'Game has finished'}
          {gamePhase === 'playing' && !isCurrentPlayer && 'Waiting for your turn...'}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-800 flex items-center justify-center gap-2`}>
          <span>🎮</span>
          <span>Game Controls</span>
        </h3>
        {placedTilesCount > 0 && (
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
            {placedTilesCount} tile{placedTilesCount === 1 ? '' : 's'} placed on board
          </p>
        )}
      </div>

      <div className={buttonsContainerClasses}>
        {/* Primary Actions */}
        <div className={primaryButtonsClasses}>
          <GameButton
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            variant="success"
            size={compact ? 'small' : 'medium'}
            icon="✓"
            shortcut={enableKeyboardShortcuts ? 'Enter' : undefined}
          >
            Submit Move
          </GameButton>

          <GameButton
            onClick={onPass}
            disabled={!canPass || isSubmitting}
            variant="secondary"
            size={compact ? 'small' : 'medium'}
            icon="⏭"
            shortcut={enableKeyboardShortcuts ? 'P' : undefined}
          >
            Pass Turn
          </GameButton>

          <GameButton
            onClick={onExchange}
            disabled={!canExchange || isSubmitting}
            variant="secondary"
            size={compact ? 'small' : 'medium'}
            icon="🔄"
            shortcut={enableKeyboardShortcuts ? 'E' : undefined}
          >
            Exchange Tiles
          </GameButton>
        </div>

        {/* Advanced Controls */}
        {showAdvancedControls && (
          <div className={advancedButtonsClasses}>
            {onClear && (
              <GameButton
                onClick={onClear}
                disabled={placedTilesCount === 0}
                variant="danger"
                size={compact ? 'small' : 'medium'}
                icon="🗑"
                shortcut={enableKeyboardShortcuts ? 'C' : undefined}
              >
                Clear Board
              </GameButton>
            )}

            {onUndo && (
              <GameButton
                onClick={onUndo}
                variant="secondary"
                size={compact ? 'small' : 'medium'}
                icon="↶"
                shortcut={enableKeyboardShortcuts ? 'Ctrl+Z' : undefined}
              >
                Undo
              </GameButton>
            )}

            {onHint && (
              <GameButton
                onClick={onHint}
                variant="secondary"
                size={compact ? 'small' : 'medium'}
                icon="💡"
                shortcut={enableKeyboardShortcuts ? 'H' : undefined}
              >
                Hint
              </GameButton>
            )}

            {onShuffle && (
              <GameButton
                onClick={onShuffle}
                variant="secondary"
                size={compact ? 'small' : 'medium'}
                icon="🎲"
                shortcut={enableKeyboardShortcuts ? 'S' : undefined}
              >
                Shuffle
              </GameButton>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      {enableKeyboardShortcuts && !compact && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700 select-none">
              Keyboard Shortcuts
            </summary>
            <div className="mt-2 space-y-1">
              <div>Enter: Submit Move</div>
              <div>P: Pass Turn</div>
              <div>E: Exchange Tiles</div>
              {onClear && <div>C: Clear Board</div>}
              {onUndo && <div>Ctrl+Z: Undo</div>}
              {onHint && <div>H: Get Hint</div>}
              {onShuffle && <div>S: Shuffle Rack</div>}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default GameControls;