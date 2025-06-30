import React, { useState, useCallback } from 'react';
import type { GamePhase, GameMode } from '../types/game';

// ================================
// Modal Component
// ================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium' 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`
          relative bg-white rounded-lg shadow-xl max-h-full overflow-hidden
          ${sizeClasses[size]} w-full
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-96">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================
// Settings Modal Content
// ================================

interface GameSettingsProps {
  onClose: () => void;
  onSettingsChange?: (settings: any) => void;
}

const GameSettingsModal: React.FC<GameSettingsProps> = ({ onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState({
    timePerTurn: 120,
    allowExchanges: true,
    dictionary: 'standard',
    soundEffects: true,
    animations: true,
    theme: 'light',
  });

  const handleSave = () => {
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Game Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Game Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time per Turn (seconds)
            </label>
            <input
              type="number"
              min="30"
              max="600"
              value={settings.timePerTurn}
              onChange={(e) => setSettings({ ...settings, timePerTurn: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dictionary
            </label>
            <select
              value={settings.dictionary}
              onChange={(e) => setSettings({ ...settings, dictionary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="tournament">Tournament</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowExchanges"
              checked={settings.allowExchanges}
              onChange={(e) => setSettings({ ...settings, allowExchanges: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowExchanges" className="ml-2 block text-sm text-gray-700">
              Allow tile exchanges
            </label>
          </div>
        </div>
      </div>

      {/* UI Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Interface Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="soundEffects"
              checked={settings.soundEffects}
              onChange={(e) => setSettings({ ...settings, soundEffects: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="soundEffects" className="ml-2 block text-sm text-gray-700">
              Sound effects
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="animations"
              checked={settings.animations}
              onChange={(e) => setSettings({ ...settings, animations: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="animations" className="ml-2 block text-sm text-gray-700">
              Animations
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

// ================================
// Help Modal Content
// ================================

const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="space-y-6">
      {/* Game Rules */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">How to Play</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Objective:</strong> Score the most points by forming words on the board using letter tiles.
          </p>
          <p>
            <strong>Gameplay:</strong> Players take turns placing tiles to form words. Words must connect to existing words on the board.
          </p>
          <p>
            <strong>Scoring:</strong> Each letter has a point value. Premium squares multiply letter or word scores.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Game Controls</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Enter:</strong> Submit move</div>
            <div><strong>P:</strong> Pass turn</div>
            <div><strong>E:</strong> Exchange tiles</div>
            <div><strong>C:</strong> Clear board</div>
            <div><strong>Ctrl+Z:</strong> Undo</div>
            <div><strong>H:</strong> Get hint</div>
          </div>
        </div>
      </div>

      {/* Scoring */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Scoring System</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <strong>Letter Values:</strong>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              <div>A, E, I, O, U, L, N, S, T, R: 1 point</div>
              <div>D, G: 2 points</div>
              <div>B, C, M, P: 3 points</div>
              <div>F, H, V, W, Y: 4 points</div>
              <div>K: 5 points</div>
              <div>J, X: 8 points</div>
              <div>Q, Z: 10 points</div>
            </div>
          </div>
          <div>
            <strong>Premium Squares:</strong>
            <ul className="mt-2 space-y-1">
              <li>🟨 Double Letter Score (DL)</li>
              <li>🟦 Triple Letter Score (TL)</li>
              <li>🟪 Double Word Score (DW)</li>
              <li>🟥 Triple Word Score (TW)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

// ================================
// Header Component Props
// ================================

export interface HeaderProps {
  gameName?: string;
  gamePhase: GamePhase;
  gameMode: GameMode;
  currentPlayer?: string;
  gameId?: string;
  onNewGame?: () => void;
  onSaveGame?: () => void;
  onLoadGame?: () => void;
  onExitGame?: () => void;
  onSettingsChange?: (settings: any) => void;
  showGameInfo?: boolean;
  compact?: boolean;
  className?: string;
}

// ================================
// Main Header Component
// ================================

export const Header: React.FC<HeaderProps> = ({
  gameName = 'Scrabble Game',
  gamePhase,
  gameMode,
  currentPlayer,
  gameId,
  onNewGame,
  onSaveGame,
  onLoadGame,
  onExitGame,
  onSettingsChange,
  showGameInfo = true,
  compact = false,
  className = '',
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // ================================
  // Event Handlers
  // ================================

  const handleMenuToggle = useCallback(() => {
    setShowMenu(!showMenu);
  }, [showMenu]);

  const handleCloseModals = useCallback(() => {
    setShowSettingsModal(false);
    setShowHelpModal(false);
    setShowMenu(false);
  }, []);

  // ================================
  // Game Status Display
  // ================================

  const gameStatusText = {
    setup: 'Setting up game...',
    playing: currentPlayer ? `${currentPlayer}'s turn` : 'Game in progress',
    finished: 'Game finished',
  };

  const gameStatusColor = {
    setup: 'text-yellow-600',
    playing: 'text-green-600',
    finished: 'text-blue-600',
  };

  // ================================
  // Render
  // ================================

  return (
    <>
      <header className={`
        bg-white border-b border-gray-200 shadow-sm
        ${compact ? 'px-3 py-2' : 'px-4 py-3'}
        ${className}
      `}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Side - Logo & Game Info */}
          <div className="flex items-center space-x-4">
            {/* Logo/Title */}
            <div className="flex items-center space-x-2">
              <span className={`${compact ? 'text-xl' : 'text-2xl'}`}>🎯</span>
              <h1 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
                {gameName}
              </h1>
            </div>

            {/* Game Info */}
            {showGameInfo && (
              <div className={`hidden md:flex items-center space-x-4 ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
                {gameId && (
                  <div className="flex items-center space-x-1">
                    <span>ID:</span>
                    <span className="font-mono font-medium">{gameId}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <span>Mode:</span>
                  <span className="font-medium capitalize">{gameMode}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <span>Status:</span>
                  <span className={`font-medium ${gameStatusColor[gamePhase]}`}>
                    {gameStatusText[gamePhase]}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <div className={`hidden sm:flex items-center space-x-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              <button
                onClick={() => setShowHelpModal(true)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Help & Rules"
              >
                Help
              </button>
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Game Settings"
              >
                Settings
              </button>
            </div>

            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={handleMenuToggle}
                className={`
                  p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors
                  ${compact ? 'text-sm' : 'text-base'}
                `}
                title="Game Menu"
                aria-expanded={showMenu}
              >
                <span className="sr-only">Open menu</span>
                <span>☰</span>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                  <div className="py-1">
                    {onNewGame && (
                      <button
                        onClick={() => { onNewGame(); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        New Game
                      </button>
                    )}
                    
                    {onSaveGame && gamePhase === 'playing' && (
                      <button
                        onClick={() => { onSaveGame(); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Save Game
                      </button>
                    )}
                    
                    {onLoadGame && (
                      <button
                        onClick={() => { onLoadGame(); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Load Game
                      </button>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => { setShowSettingsModal(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hidden"
                    >
                      Settings
                    </button>
                    
                    <button
                      onClick={() => { setShowHelpModal(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hidden"
                    >
                      Help & Rules
                    </button>

                    {onExitGame && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => { onExitGame(); setShowMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Exit Game
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Game Info */}
        {showGameInfo && (
          <div className="md:hidden mt-2 pt-2 border-t border-gray-100">
            <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
              <div className="flex items-center space-x-4">
                {gameId && (
                  <span className="font-mono">ID: {gameId.slice(0, 8)}...</span>
                )}
                <span className="capitalize">{gameMode}</span>
              </div>
              <span className={`${gameStatusColor[gamePhase]}`}>
                {gameStatusText[gamePhase]}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Click overlay to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Modals */}
      <Modal
        isOpen={showSettingsModal}
        onClose={handleCloseModals}
        title="Game Settings"
        size="medium"
      >
        <GameSettingsModal 
          onClose={handleCloseModals}
          onSettingsChange={onSettingsChange}
        />
      </Modal>

      <Modal
        isOpen={showHelpModal}
        onClose={handleCloseModals}
        title="How to Play Scrabble"
        size="large"
      >
        <HelpModal onClose={handleCloseModals} />
      </Modal>
    </>
  );
};

export default Header;