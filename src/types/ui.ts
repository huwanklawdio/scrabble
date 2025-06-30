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

// ================================
// Keyboard and Accessibility Types
// ================================

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
}

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-pressed'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  role?: string;
  tabIndex?: number;
}

export interface FocusManagement {
  focusableElements: HTMLElement[];
  currentFocus: number;
  trapFocus: boolean;
  restoreFocus?: HTMLElement;
}

// ================================
// Enhanced Component State Types
// ================================

export interface InteractionState {
  isHovered: boolean;
  isFocused: boolean;
  isPressed: boolean;
  isActive: boolean;
  isDisabled: boolean;
}

export interface SelectionState {
  selectedItems: string[];
  lastSelected?: string;
  selectionMode: 'single' | 'multiple' | 'range';
  allowDeselect: boolean;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

// ================================
// Form Validation Types for Game Setup
// ================================

export interface PlayerNameValidation {
  value: string;
  isValid: boolean;
  errors: string[];
  minLength: number;
  maxLength: number;
  allowSpecialChars: boolean;
}

export interface GameSettingsValidation {
  playerNames: PlayerNameValidation[];
  timeLimit: {
    value: number;
    isValid: boolean;
    min: number;
    max: number;
  };
  isFormValid: boolean;
  submitAttempted: boolean;
}

// ================================
// Responsive Design Types
// ================================

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
  screenWidth: number;
  screenHeight: number;
}

export interface ResponsiveLayout {
  columns: number;
  tileSize: 'small' | 'medium' | 'large';
  showSidebar: boolean;
  stackVertically: boolean;
}

// ================================
// Performance and Optimization Types
// ================================

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize: number;
  renderRange: {
    start: number;
    end: number;
  };
}

export interface LazyLoadConfig {
  threshold: number;
  rootMargin: string;
  triggerOnce: boolean;
}

// ================================
// Audio and Visual Feedback Types
// ================================

export interface SoundEffect {
  name: string;
  src: string;
  volume: number;
  loop: boolean;
  preload: boolean;
}

export interface HapticFeedback {
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface VisualFeedback {
  type: 'pulse' | 'glow' | 'shake' | 'bounce' | 'flash';
  color?: string;
  duration: number;
  intensity: number;
}

// ================================
// Theme and Customization Types
// ================================

export interface BoardTheme {
  name: string;
  cellColors: {
    normal: string;
    doubleWord: string;
    tripleWord: string;
    doubleLetter: string;
    tripleLetter: string;
    center: string;
  };
  gridLines: {
    color: string;
    width: number;
    opacity: number;
  };
  shadows: boolean;
  roundedCorners: boolean;
}

export interface TileTheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  font: {
    family: string;
    weight: string;
    letterSpacing: string;
  };
}

// ================================
// Error Boundary and Recovery Types
// ================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  retryCount: number;
  maxRetries: number;
}

export interface RecoveryAction {
  label: string;
  action: () => void;
  type: 'retry' | 'reset' | 'reload' | 'report';
}

// ================================
// Component Lifecycle Types
// ================================

export interface ComponentLifecycle {
  isMounted: boolean;
  isInitialized: boolean;
  isDestroyed: boolean;
  initializationError?: string;
}

export interface AsyncComponentState<T = any> {
  data?: T;
  loading: boolean;
  error?: string;
  lastFetch?: Date;
  retryCount: number;
}

// ================================
// Extended Event Handler Types
// ================================

export interface ExtendedGameEventHandlers extends GameEventHandlers {
  onKeyboardShortcut: (shortcut: KeyboardShortcut) => void;
  onFocusChange: (element: HTMLElement | null) => void;
  onAccessibilityAction: (action: string, target: HTMLElement) => void;
  onThemeChange: (theme: BoardTheme | TileTheme) => void;
  onPerformanceIssue: (metric: string, value: number) => void;
  onErrorRecovery: (action: RecoveryAction) => void;
}

// ================================
// Advanced UI State Types
// ================================

export interface AdvancedUIState extends UIState {
  keyboardShortcuts: KeyboardShortcut[];
  accessibility: {
    screenReaderEnabled: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
    focusVisible: boolean;
  };
  responsive: BreakpointState;
  performance: {
    renderTime: number;
    frameRate: number;
    memoryUsage: number;
  };
  customization: {
    boardTheme: BoardTheme;
    tileTheme: TileTheme;
    layout: ResponsiveLayout;
  };
} 