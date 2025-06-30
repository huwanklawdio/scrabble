// ================================
// UI Components Export Index
// ================================

// This file will export all UI components once they are implemented
// Currently empty - components will be added in subsequent tasks

// Export component types that are already defined
export type {
  BoardCellProps,
  TileProps,
  TileRackProps,
  ScoreBoardProps,
  PlayerCardProps,
  GameControlsProps,
  GameStatsProps,
  ModalProps,
  GameSetupModalProps,
  GameEndModalProps,
} from '../types';

// Board Components
export { Board } from './Board';
export type { BoardProps } from './Board';
export { BoardCell } from './BoardCell';
export type { BoardCellProps } from './BoardCell';
export { Tile, TileGroup } from './Tile';
export type { TileProps, TileGroupProps } from './Tile';
export { TileRack } from './TileRack';
export type { TileRackProps } from './TileRack';
export { ScoreBoard } from './ScoreBoard';
export type { ScoreBoardProps } from './ScoreBoard';
export { GameControls } from './GameControls';
export type { GameControlsProps } from './GameControls';
export { GameLayout, LayoutProvider, useLayoutContext } from './GameLayout';
export type { GameLayoutProps, LayoutContextValue, LayoutProviderProps } from './GameLayout';
export { Header } from './Header';
export type { HeaderProps } from './Header';

// TODO: Add component exports as they are implemented: 