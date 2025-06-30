import type { ReactNode } from 'react';
import type { BoardPosition, Tile, Player, GameState, Move } from './game';

// ================================
// Component Props Types
// ================================

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// ================================
// Game Board Component Types
// ================================

export interface BoardProps extends BaseComponentProps {
  board: GameState['board'];
  onCellClick?: (position: BoardPosition) => void;
  onTileDrop?: (tile: Tile, position: BoardPosition) => void;
  highlightedPositions?: BoardPosition[];
  previewTiles?: { tile: Tile; position: BoardPosition }[];
  disabled?: boolean;
}

export interface BoardCellProps extends BaseComponentProps {
  position: BoardPosition;
  tile?: Tile;
  premiumType: 'normal' | 'DL' | 'TL' | 'DW' | 'TW' | 'center';
  isCenter: boolean;
  isEmpty: boolean;
  isHighlighted?: boolean;
  isPreview?: boolean;
  onClick?: () => void;
  onTileDrop?: (tile: Tile) => void;
  disabled?: boolean;
}

export interface TileProps extends BaseComponentProps {
  tile: Tile;
  isDragging?: boolean;
  isPreview?: boolean;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  onDragStart?: (tile: Tile) => void;
  onDragEnd?: () => void;
  disabled?: boolean;
}

// ================================
// Player Interface Component Types
// ================================

export interface TileRackProps extends BaseComponentProps {
  tiles: Tile[];
  playerId: string;
  isCurrentPlayer: boolean;
  onTileSelect?: (tile: Tile) => void;
  onTileDrag?: (tile: Tile) => void;
  selectedTiles?: string[];
  disabled?: boolean;
}

export interface ScoreBoardProps extends BaseComponentProps {
  players: Player[];
  currentPlayerIndex: number;
  showDetailedScore?: boolean;
}

export interface PlayerCardProps extends BaseComponentProps {
  player: Player;
  isCurrentPlayer: boolean;
  isConnected?: boolean;
  showRack?: boolean;
  compact?: boolean;
}

// ================================
// Game Controls Component Types
// ================================

export interface GameControlsProps extends BaseComponentProps {
  onSubmitMove?: () => void;
  onPassTurn?: () => void;
  onExchangeTiles?: (tiles: Tile[]) => void;
  onUndo?: () => void;
  canSubmit: boolean;
  canPass: boolean;
  canExchange: boolean;
  canUndo: boolean;
  selectedTiles: Tile[];
  disabled?: boolean;
}

export interface GameStatsProps extends BaseComponentProps {
  moveHistory: Move[];
  currentScore: number;
  bestMove?: Move;
  wordsPlayed: number;
}

// ================================
// Modal and Dialog Types
// ================================

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

export interface GameSetupModalProps extends ModalProps {
  onStartGame: (settings: GameSetupData) => void;
  defaultSettings?: Partial<GameSetupData>;
}

export interface GameEndModalProps extends ModalProps {
  winner: Player;
  finalScores: Player[];
  gameStats: any;
  onNewGame: () => void;
  onReturnToMenu: () => void;
}

// ================================
// Form and Input Types
// ================================

export interface GameSetupData {
  playerNames: string[];
  gameMode: 'local' | 'lan';
  timeLimit?: number;
  allowExchanges: boolean;
  dictionary: 'standard' | 'tournament';
}

export interface LobbyData {
  roomName: string;
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
}

// ================================
// Drag and Drop Types
// ================================

export interface DragState {
  isDragging: boolean;
  draggedTile?: Tile;
  dragPreview?: {
    tile: Tile;
    position: BoardPosition;
  };
  dropTarget?: BoardPosition;
}

export interface DropZoneProps {
  onDrop: (tile: Tile) => void;
  onDragOver?: (position: BoardPosition) => void;
  onDragLeave?: () => void;
  isValidDrop: boolean;
  position: BoardPosition;
}

// ================================
// Animation and Transition Types
// ================================

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface TileAnimation {
  type: 'place' | 'move' | 'remove' | 'flip' | 'shake';
  config: AnimationConfig;
  tile: Tile;
  from?: BoardPosition;
  to?: BoardPosition;
}

// ================================
// Toast and Notification Types
// ================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ================================
// Layout and Navigation Types
// ================================

export interface LayoutProps extends BaseComponentProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  isFullscreen?: boolean;
}

export interface HeaderProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

// ================================
// Event Handler Types
// ================================

export interface GameEventHandlers {
  onTilePlace: (tile: Tile, position: BoardPosition) => void;
  onTileSelect: (tile: Tile) => void;
  onMoveSubmit: () => void;
  onTurnPass: () => void;
  onTileExchange: (tiles: Tile[]) => void;
  onGameEnd: () => void;
  onPlayerJoin: (player: Player) => void;
  onPlayerLeave: (playerId: string) => void;
}

// ================================
// State Management Types
// ================================

export interface UIState {
  selectedTiles: string[];
  dragState: DragState;
  activeModal?: string;
  notifications: NotificationProps[];
  isLoading: boolean;
  errors: string[];
}

export interface ViewState {
  boardZoom: number;
  showGridLines: boolean;
  highlightValidMoves: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
} 